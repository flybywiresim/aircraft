// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { A380AircraftConfig } from '@fmgc/flightplanning/A380AircraftConfig';
import {
  ArraySubject,
  ConsumerSubject,
  EventBus,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { A380AltitudeUtils } from '@shared/OperatingAltitudes';
import { maxBlockFuel, maxCertifiedAlt, maxZfw } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmcAircraftInterface } from 'instruments/src/MFD/FMC/FmcAircraftInterface';
import { FmgcDataService } from 'instruments/src/MFD/FMC/fmgc';
import { FmcInterface, FmcOperatingModes } from 'instruments/src/MFD/FMC/FmcInterface';
import {
  DatabaseItem,
  EfisSide,
  Fix,
  NXDataStore,
  Units,
  UpdateThrottler,
  Waypoint,
  a380EfisRangeSettings,
} from '@flybywiresim/fbw-sdk';
import {
  McduMessage,
  NXFictionalMessages,
  NXSystemMessages,
  TypeIIMessage,
  TypeIMessage,
} from 'instruments/src/MFD/shared/NXSystemMessages';
import { DataManager, LatLonFormatType, PilotWaypoint } from '@fmgc/flightplanning/DataManager';
import { distanceTo, Coordinates } from 'msfs-geo';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmcIndex } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { FmsErrorType } from '@fmgc/FmsError';
import { A380Failure } from '@failures';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';
import { FlightPhaseManager, FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { MfdUIData } from 'instruments/src/MFD/shared/MfdUIData';
import { ActiveUriInformation } from 'instruments/src/MFD/pages/common/MfdUiService';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { Navigation } from '@fmgc/navigation/Navigation';
import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

export interface FmsErrorMessage {
  message: McduMessage;
  messageText: string;
  backgroundColor: 'white' | 'amber' | 'cyan'; // Whether the message should be colored.
  cleared: boolean; // If message has been cleared from footer
  isResolvedOverride: () => boolean;
  onClearOverride: () => void;
}

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class FlightManagementComputer implements FmcInterface {
  protected readonly subs = [] as Subscription[];

  #mfdReference: (FmsDisplayInterface & MfdDisplayInterface) | null;

  get mfdReference() {
    return this.#mfdReference;
  }

  set mfdReference(value: (FmsDisplayInterface & MfdDisplayInterface) | null) {
    this.#mfdReference = value;

    if (value) {
      this.dataManager = new DataManager(value, { latLonFormat: LatLonFormatType.ExtendedFormat });
    }
  }

  #operatingMode: FmcOperatingModes;

  get operatingMode(): FmcOperatingModes {
    // TODO amend once
    return this.#operatingMode;
  }

  set operatingMode(value: FmcOperatingModes) {
    this.#operatingMode = value;
  }

  // FIXME A320 data
  #flightPlanService = new FlightPlanService(this.bus, new A320FlightPlanPerformanceData(), FpmConfigs.A380);

  get flightPlanService() {
    return this.#flightPlanService;
  }

  private lastFlightPlanVersion: number | null = null;

  #fmgc = new FmgcDataService(this.flightPlanService);

  get fmgc() {
    return this.#fmgc;
  }

  private fmsUpdateThrottler = new UpdateThrottler(250);

  private efisInterfaces = {
    L: new EfisInterface('L', this.flightPlanService),
    R: new EfisInterface('R', this.flightPlanService),
  };

  #guidanceController!: GuidanceController;

  get guidanceController() {
    return this.#guidanceController;
  }

  #navigation = new Navigation(this.bus, this.flightPlanService);

  get navigation() {
    if (this.instance !== FmcIndex.FmcA) {
      throw new Error('Multiple navigation instances not supported!');
    }
    return this.#navigation;
  }

  get navaidTuner() {
    if (this.instance !== FmcIndex.FmcA) {
      throw new Error('Multiple navaid tuners not supported!');
    }
    return this.#navigation.getNavaidTuner();
  }

  private efisSymbols!: EfisSymbols<number>;

  private readonly flightPhaseManager = new FlightPhaseManager(this.bus);

  // TODO remove this cyclic dependency, isWaypointInUse should be moved to DataInterface
  private dataManager: DataManager | null = null;

  private readonly sub = this.bus.getSubscriber<FlightPhaseManagerEvents & MfdUIData>();

  private readonly flightPhase = ConsumerSubject.create<FmgcFlightPhase>(
    this.sub.on('fmgc_flight_phase'),
    this.flightPhaseManager.phase,
  );
  private readonly activePage = ConsumerSubject.create<ActiveUriInformation | null>(
    this.sub.on('mfd_active_uri'),
    null,
  );

  private readonly isReset = Subject.create(true);

  private readonly shouldBePreflightPhase = MappedSubject.create(
    ([phase, page, isReset]) => {
      const isPreflight =
        phase === FmgcFlightPhase.Done &&
        isReset &&
        (page?.uri === 'fms/active/init' || page?.uri === 'fms/active/fuel-load' || page?.uri === 'fms/active/perf');
      return isPreflight;
    },
    this.flightPhase,
    this.activePage,
    this.isReset,
  );

  public getDataManager() {
    return this.dataManager;
  }

  #fmsErrors = ArraySubject.create<FmsErrorMessage>();

  get fmsErrors() {
    return this.#fmsErrors;
  }

  // TODO make private, and access methods through FmcInterface
  public acInterface!: FmcAircraftInterface;

  public revisedLegIndex = Subject.create<number | null>(null);

  public revisedLegPlanIndex = Subject.create<FlightPlanIndex | null>(null);

  public revisedLegIsAltn = Subject.create<boolean | null>(null);

  public enginesWereStarted = Subject.create<boolean>(false);

  private readonly failureKey =
    this.instance === FmcIndex.FmcA
      ? A380Failure.FmcA
      : this.instance === FmcIndex.FmcB
        ? A380Failure.FmcB
        : A380Failure.FmcC;

  private readonly legacyFmsIsHealthy = Subject.create(false);

  private wasReset = false;

  private readonly ZfwOrZfwCgUndefined = MappedSubject.create(
    ([zfw, zfwCg]) => zfw == null || zfwCg == null,
    this.fmgc.data.zeroFuelWeight,
    this.fmgc.data.zeroFuelWeightCenterOfGravity,
  );

  constructor(
    private instance: FmcIndex,
    operatingMode: FmcOperatingModes,
    private readonly bus: EventBus,
    private readonly fmcInop: Subscribable<boolean>,
    mfdReference: (FmsDisplayInterface & MfdDisplayInterface) | null,
  ) {
    this.#operatingMode = operatingMode;
    this.#mfdReference = mfdReference;

    const db = new NavigationDatabase(NavigationDatabaseBackend.Msfs);
    NavigationDatabaseService.activeDatabase = db;

    this.flightPlanService.createFlightPlans();

    // FIXME implement sync between FMCs and also let FMC-B and FMC-C compute
    if (this.instance === FmcIndex.FmcA) {
      this.acInterface = new FmcAircraftInterface(this.bus, this, this.fmgc, this.flightPlanService);

      this.#guidanceController = new GuidanceController(
        this.bus,
        this.fmgc,
        this.flightPlanService,
        this.efisInterfaces,
        a380EfisRangeSettings,
        A380AircraftConfig,
      );
      this.efisSymbols = new EfisSymbols(
        this.bus,
        this.#guidanceController,
        this.flightPlanService,
        this.navaidTuner,
        this.efisInterfaces,
        a380EfisRangeSettings,
      );

      this.#navigation.init();
      this.efisSymbols.init();
      this.flightPhaseManager.init();
      this.#guidanceController.init();
      this.fmgc.guidanceController = this.#guidanceController;

      this.initSimVars();

      this.flightPhaseManager.addOnPhaseChanged((prev, next) => this.onFlightPhaseChanged(prev, next));

      this.subs.push(
        this.shouldBePreflightPhase.sub((shouldBePreflight) => {
          if (shouldBePreflight) {
            this.flightPhaseManager.changePhase(FmgcFlightPhase.Preflight);
          }
        }, true),
        this.enginesWereStarted.sub((val) => {
          if (
            val &&
            this.flightPlanService.hasActive &&
            !Number.isFinite(this.flightPlanService.active.performanceData.costIndex)
          ) {
            this.flightPlanService.active.setPerformanceData('costIndex', 0);
            this.addMessageToQueue(NXSystemMessages.costIndexInUse.getModifiedMessage('0'));
          }
        }),
        this.legacyFmsIsHealthy.sub((v) => {
          // FIXME some of the systems require the A320 FMS health bits, need to refactor/split FMS stuff
          SimVar.SetSimVarValue('L:A32NX_FM1_HEALTHY_DISCRETE', 'boolean', v);
          SimVar.SetSimVarValue('L:A32NX_FM2_HEALTHY_DISCRETE', 'boolean', v);
        }, true),

        this.ZfwOrZfwCgUndefined,
        this.ZfwOrZfwCgUndefined.sub((v) => {
          if (!v) {
            this.removeMessageFromQueue(NXSystemMessages.initializeZfwOrZfwCg.text);
          }
        }),

        this.fmgc.data.cpnyFplnAvailable.sub((v) => {
          if (v) {
            this.addMessageToQueue(NXSystemMessages.comFplnRecievedPendingInsertion);
          } else {
            this.removeMessageFromQueue(NXSystemMessages.comFplnRecievedPendingInsertion.text);
          }
        }),
      );

      this.subs.push(this.shouldBePreflightPhase, this.flightPhase, this.activePage);
    }

    let lastUpdateTime = Date.now();
    setInterval(() => {
      const now = Date.now();
      const dt = now - lastUpdateTime;

      this.onUpdate(dt);

      lastUpdateTime = now;
    }, 100);

    console.log(`${FmcIndex[this.instance]} initialized.`);
  }

  destroy() {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  public revisedWaypoint(): Fix | undefined {
    const revWptIdx = this.revisedLegIndex.get();
    const revPlanIdx = this.revisedLegPlanIndex.get();
    if (revWptIdx !== null && revPlanIdx !== null && this.flightPlanService.has(revPlanIdx)) {
      const flightPlan = this.revisedLegIsAltn.get()
        ? this.flightPlanService.get(revPlanIdx).alternateFlightPlan
        : this.flightPlanService.get(revPlanIdx);
      if (flightPlan.hasElement(revWptIdx) && flightPlan.elementAt(revWptIdx)?.isDiscontinuity === false) {
        return flightPlan.legElementAt(revWptIdx)?.definition?.waypoint;
      }
    }
    return undefined;
  }

  public setRevisedWaypoint(index: number, planIndex: number, isAltn: boolean) {
    this.revisedLegPlanIndex.set(planIndex);
    this.revisedLegIsAltn.set(isAltn);
    this.revisedLegIndex.set(index);
  }

  public resetRevisedWaypoint(): void {
    this.revisedLegIndex.set(null);
    this.revisedLegIsAltn.set(null);
    this.revisedLegPlanIndex.set(null);
  }

  public latLongStoredWaypoints: Waypoint[] = [];

  public pbdStoredWaypoints: Waypoint[] = [];

  public pbxStoredWaypoints: Waypoint[] = [];

  public deleteAllStoredWaypoints() {
    this.latLongStoredWaypoints = [];
    this.pbdStoredWaypoints = [];
    this.pbxStoredWaypoints = [];
  }

  /**
   * Checks whether a waypoint is currently in use
   * @param waypoint the waypoint to look for
   */
  async isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
    // Check in all flight plans
    if (this.flightPlanService.hasActive) {
      return this.flightPlanService.isWaypointInUse(waypoint);
    }

    return false;
  }

  /** in kg */
  public getLandingWeight(): number | null {
    const tow = this.getTakeoffWeight();
    const gw = this.fmgc.getGrossWeightKg();
    const tf = this.getTripFuel();

    if (!this.enginesWereStarted.get()) {
      // On ground, engines off
      // LW = TOW - TRIP
      return tow && tf ? tow - tf : null;
    }
    if (gw && tf && this.fmgc.getFlightPhase() >= FmgcFlightPhase.Takeoff) {
      // In flight
      // LW = GW - TRIP
      return gw - tf;
    }
    if (gw) {
      // Preflight, engines on
      // LW = GW - TRIP - TAXI
      return gw - (tf ?? 0) - (this.fmgc.data.taxiFuel.get() ?? 0);
    }
    return null;
  }

  public getTakeoffWeight(): number | null {
    if (!this.enginesWereStarted.get()) {
      // On ground, engines off
      // TOW before engine start: TOW = ZFW + BLOCK - TAXI
      const zfw = this.fmgc.data.zeroFuelWeight.get() ?? maxZfw;
      if (this.fmgc.data.zeroFuelWeight.get() && this.fmgc.data.blockFuel.get() && this.fmgc.data.taxiFuel.get()) {
        return zfw + (this.fmgc.data.blockFuel.get() ?? maxBlockFuel) - (this.fmgc.data.taxiFuel.get() ?? 0);
      }
      return null;
    }
    if (this.fmgc.getFlightPhase() >= FmgcFlightPhase.Takeoff) {
      // In flight
      // TOW: TOW = GW
      return SimVar.GetSimVarValue('TOTAL WEIGHT', 'kilogram');
    }
    // Preflight, engines on
    // LW = GW - TRIP - TAXI
    // TOW after engine start: TOW = GW - TAXI
    return SimVar.GetSimVarValue('TOTAL WEIGHT', 'kilogram') - (this.fmgc.data.taxiFuel.get() ?? 0);
  }

  public getTripFuel(): number | null {
    const destPred = this.guidanceController.vnavDriver.getDestinationPrediction();
    if (destPred) {
      const fob = this.fmgc.getFOB() * 1_000;
      const destFuelKg = Units.poundToKilogram(destPred.estimatedFuelOnBoard);
      return fob - destFuelKg;
    }
    return null;
  }

  public getExtraFuel(): number | null {
    const destPred = this.guidanceController.vnavDriver.getDestinationPrediction();
    if (destPred) {
      if (this.flightPhase.get() === FmgcFlightPhase.Preflight) {
        // EXTRA = BLOCK - TAXI - TRIP - MIN FUEL DEST - RTE RSV
        return (
          (this.enginesWereStarted.get() ? this.fmgc.getFOB() * 1_000 : this.fmgc.data.blockFuel.get() ?? 0) -
          (this.fmgc.data.taxiFuel.get() ?? 0) -
          (this.getTripFuel() ?? 0) -
          (this.fmgc.data.minimumFuelAtDestination.get() ?? 0) -
          (this.fmgc.data.routeReserveFuelWeight.get() ?? 0)
        );
      } else {
        return (
          Units.poundToKilogram(destPred.estimatedFuelOnBoard) - (this.fmgc.data.minimumFuelAtDestination.get() ?? 0)
        );
      }
    }

    return null;
  }

  public getRecMaxFlightLevel(): number | null {
    const gw = this.fmgc.getGrossWeightKg();
    if (!gw) {
      return null;
    }

    const isaTempDeviation = A380AltitudeUtils.getIsaTempDeviation();
    return Math.min(A380AltitudeUtils.calculateRecommendedMaxAltitude(gw, isaTempDeviation), maxCertifiedAlt) / 100;
  }

  public getOptFlightLevel(): number | null {
    return Math.floor((0.96 * (this.getRecMaxFlightLevel() ?? maxCertifiedAlt / 100)) / 5) * 5; // TODO remove magic
  }

  private initSimVars() {
    // Reset SimVars
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', 0);

    SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
    SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);

    SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', -1);
    SimVar.SetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', 0);

    SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', 0);
    SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'Bool', 0);
    SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);
    SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', 0);

    if (SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_DISABLED', 'number') === 1) {
      SimVar.SetSimVarValue('K:A32NX.ATHR_RESET_DISABLE', 'number', 1);
    }

    SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);

    // Reset SimVars
    SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', NaN);
    SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', NaN);
    SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', NaN);

    const gpsDriven = SimVar.GetSimVarValue('GPS DRIVES NAV1', 'Bool');
    if (!gpsDriven) {
      SimVar.SetSimVarValue('K:TOGGLE_GPS_DRIVES_NAV1', 'Bool', 0);
    }
    SimVar.SetSimVarValue('K:VS_SLOT_INDEX_SET', 'number', 1);

    // Start the check routine for system health and status
    setInterval(() => {
      if (
        this.flightPhaseManager.phase === FmgcFlightPhase.Cruise &&
        !this.destDataChecked &&
        this.navigation.getPpos()
      ) {
        const dest = this.flightPlanService.active.destinationAirport;
        const ppos = this.navigation.getPpos();
        if (dest?.location && ppos) {
          const distanceFromPpos = distanceTo(ppos, dest.location);
          if (dest && distanceFromPpos < 180) {
            this.destDataChecked = true;
            this.checkDestData();
          }
        }
      }
    }, 15000);
  }

  public clearLatestFmsErrorMessage() {
    const arr = this.fmsErrors.getArray();
    const index = arr.findIndex((val) => !val.cleared);

    if (index > -1) {
      if (arr[index].message.isTypeTwo) {
        const old = arr[index];
        old.cleared = true;

        this.fmsErrors.set(arr);
      } else {
        this.fmsErrors.removeAt(index);
      }
    }
  }

  /**
   * Called when a flight plan uplink is in progress
   */
  onUplinkInProgress() {
    this.fmgc.data.cpnyFplnUplinkInProgress.set(true);
  }

  /**
   * Called when a flight plan uplink is done
   */
  onUplinkDone() {
    this.fmgc.data.cpnyFplnUplinkInProgress.set(false);
    this.fmgc.data.cpnyFplnAvailable.set(true);
  }

  /**
   * Calling this function with a message should display the message in the FMS' message area,
   * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
   * into the appropriate message for the UI
   *
   * @param errorType the message to show
   */
  showFmsErrorMessage(errorType: FmsErrorType) {
    switch (errorType) {
      case FmsErrorType.EntryOutOfRange:
        this.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
        break;
      case FmsErrorType.FormatError:
        this.addMessageToQueue(NXSystemMessages.formatError, undefined, undefined);
        break;
      case FmsErrorType.FplnElementRetained:
        this.addMessageToQueue(NXSystemMessages.fplnElementRetained, undefined, undefined);
        break;
      case FmsErrorType.NotInDatabase:
        this.addMessageToQueue(NXSystemMessages.notInDatabase, undefined, undefined);
        break;
      case FmsErrorType.NotYetImplemented:
        this.addMessageToQueue(NXFictionalMessages.notYetImplemented, undefined, undefined);
        break;
      default:
        break;
    }
  }

  /**
   * Duplicate implementation, because WaypointEntryUtils needs one parameter with both DataInterface and DisplayInterface
   */
  async deduplicateFacilities<T extends DatabaseItem<any>>(items: T[]): Promise<T | undefined> {
    return this.mfdReference?.deduplicateFacilities(items);
  }

  /**
   * Duplicate implementation, because WaypointEntryUtils needs one parameter with both DataInterface and DisplayInterface
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createNewWaypoint(ident: string): Promise<Waypoint | undefined> {
    // TODO navigate to DATA/NAVAID --> PILOT STORED NAVAIDS --> NEW NAVAID
    return undefined;
  }

  /**
   * Add message to fmgc message queue
   * @param _message MessageObject
   * @param _isResolvedOverride Function that determines if the error is resolved at this moment (type II only).
   * @param _onClearOverride Function that executes when the error is actively cleared by the pilot (type II only).
   */
  public addMessageToQueue(
    _message: TypeIMessage | TypeIIMessage,
    _isResolvedOverride: (() => boolean) | undefined = undefined,
    _onClearOverride: (() => void) | undefined = undefined,
  ) {
    const message =
      _isResolvedOverride === undefined && _onClearOverride === undefined
        ? _message
        : _message.getModifiedMessage('', _isResolvedOverride, _onClearOverride);

    const msg: FmsErrorMessage = {
      message: _message,
      messageText: message.text,
      backgroundColor: message.isAmber ? 'amber' : 'white',
      cleared: false,
      onClearOverride: _message instanceof TypeIIMessage ? _message.onClear : () => {},
      isResolvedOverride: _message instanceof TypeIIMessage ? _message.isResolved : () => false,
    };

    const exists = this.fmsErrors.getArray().findIndex((el) => el.messageText === msg.messageText && el.cleared);
    if (exists !== -1) {
      this.fmsErrors.removeAt(exists);
    }
    this.fmsErrors.insert(msg, 0);
  }

  /**
   * Removes a message from the queue
   * @param value {String}
   */
  removeMessageFromQueue(value: string) {
    const exists = this.fmsErrors.getArray().findIndex((el) => el.messageText === value);
    if (exists !== -1) {
      this.fmsErrors.removeAt(exists);
    }
  }

  private updateMessageQueue() {
    this.fmsErrors.getArray().forEach((it, idx) => {
      if (it.message.isTypeTwo && it.isResolvedOverride()) {
        console.warn(`message "${it.messageText}" is resolved.`);
        this.fmsErrors.removeAt(idx);
      }
    });
  }

  openMessageList() {
    this.mfdReference?.openMessageList();
  }

  createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): PilotWaypoint | null {
    return this.dataManager?.createLatLonWaypoint(coordinates, stored, ident) ?? null;
  }

  createPlaceBearingPlaceBearingWaypoint(
    place1: Fix,
    bearing1: DegreesTrue,
    place2: Fix,
    bearing2: DegreesTrue,
    stored?: boolean,
    ident?: string,
  ): PilotWaypoint | null {
    return (
      this.dataManager?.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident) ??
      null
    );
  }

  createPlaceBearingDistWaypoint(
    place: Fix,
    bearing: DegreesTrue,
    distance: NauticalMiles,
    stored?: boolean,
    ident?: string,
  ): PilotWaypoint | null {
    return this.dataManager?.createPlaceBearingDistWaypoint(place, bearing, distance, stored, ident) ?? null;
  }

  getStoredWaypointsByIdent(ident: string): PilotWaypoint[] {
    return this.dataManager?.getStoredWaypointsByIdent(ident) ?? [];
  }

  private destDataChecked = false;

  /**
   * This method is called by the FlightPhaseManager after a flight phase change
   * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
   * @param prevPhase Previous FmgcFlightPhase
   * @param nextPhase New FmgcFlightPhase
   */
  onFlightPhaseChanged(prevPhase: FmgcFlightPhase, nextPhase: FmgcFlightPhase) {
    this.acInterface.updateConstraints();
    this.acInterface.updateManagedSpeed();

    SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);
    this.isReset.set(false);

    switch (nextPhase) {
      case FmgcFlightPhase.Takeoff: {
        this.destDataChecked = false;

        const plan = this.flightPlanService.active;
        const pd = this.fmgc.data;

        if (!plan.performanceData.accelerationAltitude) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          plan.setPerformanceData(
            'pilotAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
          );
          this.acInterface.updateThrustReductionAcceleration();
        }
        if (!plan.performanceData.engineOutAccelerationAltitude) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          plan.setPerformanceData(
            'pilotEngineOutAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
          );
          this.acInterface.updateThrustReductionAcceleration();
        }

        pd.taxiFuelPilotEntry.set(null);
        pd.defaultTaxiFuel.set(null);
        pd.routeReserveFuelWeightPilotEntry.set(null);
        pd.routeReserveFuelPercentagePilotEntry.set(0);
        pd.routeReserveFuelWeightCalculated.set(0);

        this.fmgc.data.climbPredictionsReferenceAutomatic.set(
          this.guidanceController.verticalProfileComputationParametersObserver.get().fcuAltitude,
        );

        /** Arm preselected speed/mach for next flight phase */
        const climbPreSel = this.fmgc.data.climbPreSelSpeed.get();
        if (climbPreSel) {
          this.acInterface.updatePreSelSpeedMach(climbPreSel);
        }

        break;
      }

      case FmgcFlightPhase.Climb: {
        this.destDataChecked = false;

        /** Activate pre selected speed/mach */
        if (prevPhase === FmgcFlightPhase.Takeoff) {
          const climbPreSel = this.fmgc.data.climbPreSelSpeed.get();
          if (climbPreSel) {
            this.acInterface.activatePreSelSpeedMach(climbPreSel);
          }
        }

        /** Arm preselected speed/mach for next flight phase */
        const cruisePreSel = this.fmgc.data.cruisePreSelMach.get() ?? 280;
        const cruisePreSelMach = this.fmgc.data.cruisePreSelMach.get();
        this.acInterface.updatePreSelSpeedMach(cruisePreSelMach ?? cruisePreSel);

        if (!this.flightPlanService.active.performanceData.cruiseFlightLevel) {
          this.flightPlanService.active.setPerformanceData(
            'cruiseFlightLevel',
            (Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0) / 100,
          );
          SimVar.SetSimVarValue(
            'L:A32NX_AIRLINER_CRUISE_ALTITUDE',
            'number',
            Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0,
          );
        }

        break;
      }

      case FmgcFlightPhase.Cruise: {
        SimVar.SetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool', 0);
        Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO)
          .catch(console.error)
          .catch(console.error);

        const cruisePreSel = this.fmgc.data.cruisePreSelSpeed.get();
        const cruisePreSelMach = this.fmgc.data.cruisePreSelMach.get();
        const preSelToActivate = cruisePreSelMach ?? cruisePreSel;

        /** Activate pre selected speed/mach */
        if (prevPhase === FmgcFlightPhase.Climb && preSelToActivate) {
          this.triggerCheckSpeedModeMessage(preSelToActivate);
          this.acInterface.activatePreSelSpeedMach(preSelToActivate);
        }

        /** Arm preselected speed/mach for next flight phase */
        const desPreSel = this.fmgc.data.descentPreSelSpeed.get();
        if (desPreSel) {
          this.acInterface.updatePreSelSpeedMach(desPreSel);
        }

        break;
      }

      case FmgcFlightPhase.Descent: {
        this.checkDestData();

        Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO)
          .catch(console.error)
          .catch(console.error);

        /** Activate pre selected speed/mach */
        const desPreSel = this.fmgc.data.descentPreSelSpeed.get();
        if (prevPhase === FmgcFlightPhase.Cruise && desPreSel) {
          this.acInterface.activatePreSelSpeedMach(desPreSel);
        }

        this.triggerCheckSpeedModeMessage(null);

        /** Clear pre selected speed/mach */
        this.acInterface.updatePreSelSpeedMach(null);
        this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', null);

        break;
      }

      case FmgcFlightPhase.Approach: {
        Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO).catch(console.error);
        SimVar.SetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool', 0);

        this.checkDestData();

        break;
      }

      case FmgcFlightPhase.GoAround: {
        SimVar.SetSimVarValue('L:A32NX_GOAROUND_INIT_SPEED', 'number', Simplane.getIndicatedSpeed());

        this.flightPlanService.stringMissedApproach(
          /** @type {FlightPlanLeg} */ (map) => {
            this.addMessageToQueue(NXSystemMessages.cstrDelUpToWpt.getModifiedMessage(map.ident));
          },
        );

        const activePlan = this.flightPlanService.active;
        if (!activePlan.performanceData.missedAccelerationAltitude) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          activePlan.setPerformanceData(
            'pilotMissedAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') +
              parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
          );
          this.acInterface.updateThrustReductionAcceleration();
        }
        if (!activePlan.performanceData.missedEngineOutAccelerationAltitude) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          activePlan.setPerformanceData(
            'pilotMissedEngineOutAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') +
              parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
          );
          this.acInterface.updateThrustReductionAcceleration();
        }

        break;
      }

      case FmgcFlightPhase.Done:
        this.flightPlanService
          .reset()
          .then(() => {
            this.fmgc.data.reset();
            this.initSimVars();
            this.deleteAllStoredWaypoints();
            this.clearLatestFmsErrorMessage();
            SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', true).then(() => {
              this.mfdReference?.uiService.navigateTo('fms/data/status');
              this.isReset.set(true);
            });
          })
          .catch(console.error);
        break;

      default:
        break;
    }
  }

  triggerCheckSpeedModeMessage(preselectedSpeed: number | null) {
    const isSpeedSelected = !Simplane.getAutoPilotAirspeedManaged();
    const hasPreselectedSpeed = !!preselectedSpeed;

    const checkSpeedModeMessageActive =
      this.fmsErrors.getArray().filter((it) => it.message === NXSystemMessages.checkSpeedMode).length > 0;
    if (!checkSpeedModeMessageActive && isSpeedSelected && !hasPreselectedSpeed) {
      this.addMessageToQueue(
        NXSystemMessages.checkSpeedMode,
        () => !checkSpeedModeMessageActive,
        () => {
          SimVar.SetSimVarValue('L:A32NX_PFD_MSG_CHECK_SPEED_MODE', 'bool', false);
        },
      );
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_CHECK_SPEED_MODE', 'bool', true);
    }
  }

  clearCheckSpeedModeMessage() {
    const checkSpeedModeMessageActive =
      this.fmsErrors.getArray().filter((it) => it.message === NXSystemMessages.checkSpeedMode).length > 0;
    if (checkSpeedModeMessageActive && Simplane.getAutoPilotAirspeedManaged()) {
      this.removeMessageFromQueue(NXSystemMessages.checkSpeedMode.text);
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_CHECK_SPEED_MODE', 'bool', false);
    }
  }

  private checkDestData(): void {
    const destPred = this.guidanceController.vnavDriver.getDestinationPrediction();
    if (
      this.flightPhaseManager.phase >= FmgcFlightPhase.Descent ||
      (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && destPred && destPred.distanceFromAircraft < 180)
    ) {
      if (
        !Number.isFinite(this.fmgc.data.approachQnh.get()) ||
        !Number.isFinite(this.fmgc.data.approachTemperature.get()) ||
        !Number.isFinite(this.fmgc.data.approachWind.get()?.direction) ||
        !Number.isFinite(this.fmgc.data.approachWind.get()?.speed)
      ) {
        this.addMessageToQueue(
          NXSystemMessages.enterDestData,
          () =>
            Number.isFinite(this.fmgc.data.approachQnh.get()) &&
            Number.isFinite(this.fmgc.data.approachTemperature.get()) &&
            Number.isFinite(this.fmgc.data.approachWind.get()?.direction) &&
            Number.isFinite(this.fmgc.data.approachWind.get()?.speed),
          () => {},
        );
      }
    }
  }

  private zfwInitDisplayed = 0;

  private initMessageSettable = false;

  private checkZfwParams(): void {
    const eng2state = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'Number');
    const eng3state = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:3', 'Number');

    if (eng2state === 2 || eng3state === 2) {
      if (this.zfwInitDisplayed < 1 && this.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
        this.initMessageSettable = true;
      }
    }
    // INITIALIZE ZFW/ZFW CG
    if (this.fmgc.isAnEngineOn() && this.ZfwOrZfwCgUndefined.get() && this.initMessageSettable) {
      this.addMessageToQueue(NXSystemMessages.initializeZfwOrZfwCg);
      this.zfwInitDisplayed++;
      this.initMessageSettable = false;
    }
  }

  private onUpdate(dt: number) {
    const isHealthy = !this.fmcInop.get();

    SimVar.SetSimVarValue(
      `L:A32NX_FMC_${this.instance === FmcIndex.FmcA ? 'A' : this.instance === FmcIndex.FmcB ? 'B' : 'C'}_IS_HEALTHY`,
      SimVarValueType.Bool,
      isHealthy,
    );

    // Stop early, if not FmcA or if all FMCs failed
    const allFmcResetsPulled =
      SimVar.GetSimVarValue('L:A32NX_RESET_PANEL_FMC_A', SimVarValueType.Bool) &&
      SimVar.GetSimVarValue('L:A32NX_RESET_PANEL_FMC_B', SimVarValueType.Bool) &&
      SimVar.GetSimVarValue('L:A32NX_RESET_PANEL_FMC_B', SimVarValueType.Bool);
    const allFmcInop =
      !SimVar.GetSimVarValue('L:A32NX_FMC_A_IS_HEALTHY', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_FMC_B_IS_HEALTHY', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_FMC_C_IS_HEALTHY', SimVarValueType.Bool);

    this.legacyFmsIsHealthy.set(!allFmcInop);
    if (this.instance !== FmcIndex.FmcA || (this.instance === FmcIndex.FmcA && allFmcInop)) {
      if (this.instance === FmcIndex.FmcA && (allFmcResetsPulled || allFmcInop) && this.wasReset === false) {
        this.reset();
      }
      return;
    }

    this.wasReset = false;

    this.flightPhaseManager.shouldActivateNextPhase(dt);

    const throttledDt = this.fmsUpdateThrottler.canUpdate(dt);

    if (throttledDt !== -1) {
      this.navigation.update(throttledDt);
      if (this.flightPlanService.hasActive) {
        const flightPhase = this.flightPhase.get();
        this.enginesWereStarted.set(
          flightPhase >= FmgcFlightPhase.Takeoff ||
            (flightPhase == FmgcFlightPhase.Preflight && SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:1', 'number') > 20) ||
            SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:2', 'number') > 20 ||
            SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:3', 'number') > 20 ||
            SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:4', 'number') > 20,
        );

        this.acInterface.updateThrustReductionAcceleration();
        this.acInterface.updateTransitionAltitudeLevel();
        this.acInterface.updatePerformanceData();
        this.acInterface.updatePerfSpeeds();
        this.acInterface.updateWeights();
        this.acInterface.toSpeedsChecks();
        this.acInterface.checkForStepClimb();
        this.acInterface.checkTooSteepPath();

        const toFlaps = this.fmgc.getTakeoffFlapsSetting();
        if (toFlaps) {
          this.acInterface.setTakeoffFlaps(toFlaps);
        }

        const thsFor = this.fmgc.data.takeoffThsFor.get();
        if (thsFor) {
          this.acInterface.setTakeoffTrim(thsFor);
        }

        const destPred = this.guidanceController.vnavDriver.getDestinationPrediction();
        if (destPred) {
          this.acInterface.updateMinimums(destPred.distanceFromAircraft);
        }
        this.acInterface.updateIlsCourse(this.navigation.getNavaidTuner().getMmrRadioTuningStatus(1));
      }
      this.checkZfwParams();
      this.updateMessageQueue();

      this.acInterface.checkSpeedLimit();
      this.acInterface.thrustReductionAccelerationChecks();
      // TODO port over from legacy code
      // this.updatePerfPageAltPredictions();
    }

    const flightPlanChanged = this.flightPlanService.activeOrTemporary.version !== this.lastFlightPlanVersion;

    if (flightPlanChanged) {
      this.acInterface.updateManagedProfile();
      this.acInterface.updateDestinationData();

      // Update ND plan center, but only if not on F-PLN page. There has to be a better solution though.
      if (this.mfdReference?.uiService.activeUri.get().page !== 'f-pln') {
        this.updateEfisPlanCentre(
          this.mfdReference?.uiService.captOrFo === 'FO' ? 'R' : 'L',
          FlightPlanIndex.Active,
          this.#flightPlanService.active.activeLegIndex,
          this.#flightPlanService.active.activeLegIndex >= this.#flightPlanService.active.allLegs.length,
        );
      }

      this.lastFlightPlanVersion = this.flightPlanService.activeOrTemporary.version;
    }

    this.acInterface.updateAutopilot(dt);

    this.guidanceController.update(dt);

    this.efisSymbols.update(dt);

    this.acInterface.arincBusOutputs.forEach((word) => word.writeToSimVarIfDirty());
  }

  updateEfisPlanCentre(
    side: EfisSide,
    planDisplayForPlan: number,
    planDisplayLegIndex: number,
    planDisplayInAltn: boolean,
  ) {
    this.efisInterfaces[side].setNumLegsOnFplnPage(this.flightPlanService.hasTemporary ? 7 : 8);
    this.efisInterfaces[side].setPlanCentre(planDisplayForPlan, planDisplayLegIndex, planDisplayInAltn);
    this.efisInterfaces[side].setSecRelatedPageOpen(planDisplayForPlan >= FlightPlanIndex.FirstSecondary);
  }

  handleFcuAltKnobPushPull(distanceToDestination: number): void {
    this.flightPhaseManager.handleFcuAltKnobPushPull(distanceToDestination);
  }

  handleFcuAltKnobTurn(distanceToDestination: number): void {
    this.flightPhaseManager.handleFcuAltKnobTurn(distanceToDestination);
  }

  handleFcuVSKnob(distanceToDestination: number, onStepClimbDescent: () => void): void {
    this.flightPhaseManager.handleFcuVSKnob(distanceToDestination, onStepClimbDescent);
  }

  handleNewCruiseAltitudeEntered(newCruiseFlightLevel: number): void {
    this.flightPhaseManager.handleNewCruiseAltitudeEntered(newCruiseFlightLevel);
  }

  tryGoInApproachPhase(): void {
    this.flightPhaseManager.tryGoInApproachPhase();
  }

  async swapNavDatabase(): Promise<void> {
    await this.reset();
  }

  async reset(): Promise<void> {
    if (this.instance === FmcIndex.FmcA) {
      // FIXME reset ATSU when it is added to A380X
      // this.atsu.resetAtisAutoUpdate();
      this.wasReset = true;
      await this.flightPlanService.reset();
      this.fmgc.data.reset();
      this.initSimVars();
      this.deleteAllStoredWaypoints();
      this.clearLatestFmsErrorMessage();
      this.mfdReference?.uiService.navigateTo('fms/data/status');
      this.navigation.resetState();
    }
  }
}
