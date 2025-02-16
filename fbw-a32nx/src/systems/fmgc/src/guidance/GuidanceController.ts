// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide, EfisNdMode, ApproachUtils, SimVarString, ApproachType, LegType } from '@flybywiresim/fbw-sdk';

import { Geometry } from '@fmgc/guidance/Geometry';
import { PseudoWaypoint } from '@fmgc/guidance/PseudoWaypoint';
import { PseudoWaypoints } from '@fmgc/guidance/lnav/PseudoWaypoints';
import { EfisVectors } from '@fmgc/efis/EfisVectors';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { EfisState } from '@fmgc/guidance/FmsState';
import { TaskCategory, TaskQueue } from '@fmgc/guidance/TaskQueue';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { GeometryFactory } from '@fmgc/guidance/geometry/GeometryFactory';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { HMLeg } from '@fmgc/guidance/lnav/legs/HX';

import { FmgcFlightPhase } from '@shared/flightphase';

import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { WindProfileFactory } from '@fmgc/guidance/vnav/wind/WindProfileFactory';
import { FmcWinds, FmcWindVector } from '@fmgc/guidance/vnav/wind/types';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { AircraftConfig, FMSymbolsConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { LnavDriver } from './lnav/LnavDriver';
import { VnavDriver } from './vnav/VnavDriver';
import { XFLeg } from './lnav/legs/XF';
import { VMLeg } from './lnav/legs/VM';
import { ConsumerValue, EventBus } from '@microsoft/msfs-sdk';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { A32NX_Util } from '../../../shared/src/A32NX_Util';

// How often the (milliseconds)
const GEOMETRY_RECOMPUTATION_TIMER = 5_000;

export interface Fmgc {
  getZeroFuelWeight(): number;
  getFOB(): number;
  getGrossWeight(): number | null;
  getV2Speed(): Knots;
  getTropoPause(): Feet;
  getManagedClimbSpeed(): Knots;
  getManagedClimbSpeedMach(): Mach;
  getAccelerationAltitude(): Feet;
  getThrustReductionAltitude(): Feet;
  getOriginTransitionAltitude(): Feet | undefined;
  getCruiseAltitude(): Feet;
  getFlightPhase(): FmgcFlightPhase;
  getManagedCruiseSpeed(): Knots;
  getManagedCruiseSpeedMach(): Mach;
  getClimbSpeedLimit(): SpeedLimit | null;
  getDescentSpeedLimit(): SpeedLimit | null;
  getPreSelectedClbSpeed(): Knots;
  getPreSelectedCruiseSpeed(): Knots;
  getTakeoffFlapsSetting(): FlapConf | undefined;
  getManagedDescentSpeed(): Knots;
  getManagedDescentSpeedMach(): Mach;
  getApproachSpeed(): Knots;
  getFlapRetractionSpeed(): Knots;
  getSlatRetractionSpeed(): Knots;
  getCleanSpeed(): Knots;
  getTripWind(): number;
  getWinds(): FmcWinds;
  getApproachWind(): FmcWindVector;
  getApproachQnh(): number;
  getApproachTemperature(): number;
  getDestEFOB(useFob: boolean): number; // Metric tons
  getDepartureElevation(): Feet | null;
  getDestinationElevation(): Feet;
}

export class GuidanceController {
  lnavDriver: LnavDriver;

  vnavDriver: VnavDriver;

  pseudoWaypoints: PseudoWaypoints;

  efisVectors: EfisVectors;

  symbolConfig: FMSymbolsConfig;

  get activeGeometry(): Geometry | null {
    return this.getGeometryForFlightPlan(FlightPlanIndex.Active);
  }

  get temporaryGeometry(): Geometry | null {
    return this.getGeometryForFlightPlan(FlightPlanIndex.Temporary);
  }

  get secondaryGeometry(): Geometry | null {
    return this.getGeometryForFlightPlan(FlightPlanIndex.FirstSecondary);
  }

  hasGeometryForFlightPlan(index: number, alternate = false) {
    const finalIndex = (alternate ? 100 : 0) + index;

    return this.flightPlanGeometries.has(finalIndex);
  }

  getGeometryForFlightPlan(index: number, alternate = false) {
    const finalIndex = (alternate ? 100 : 0) + index;

    if (!this.hasGeometryForFlightPlan(finalIndex)) {
      // throw new Error(`[GuidanceController] No geometry present for flight plan #${index}`);
    }

    return this.flightPlanGeometries.get(finalIndex);
  }

  get activeLegIndex(): number {
    return this.flightPlanService.active.activeLegIndex;
  }

  temporaryLegIndex: number = -1;

  activeTransIndex: number;

  activeLegDtg: NauticalMiles;

  /** Used for lateral guidance */
  activeLegCompleteLegPathDtg: NauticalMiles;

  displayActiveLegCompleteLegPathDtg: NauticalMiles;

  /**
   * Used for display in the MCDU and vertical guidance.
   * This is distinctly different from {@link activeLegCompleteLegPathDtg}. For example, path capture transitions use dtg = 1 for lateral guidance,
   * but vertical guidance and predictions need an accurate distance.
   */
  activeLegAlongTrackCompletePathDtg: NauticalMiles;

  /**
   * Along track distance to destination in nautical miles.
   * Used for vertical guidance and other FMS tasks, such as triggering ENTER DEST DATA
   */
  alongTrackDistanceToDestination?: number;

  focusedWaypointCoordinates: Coordinates = { lat: 0, long: 0 };

  currentPseudoWaypoints: PseudoWaypoint[] = [];

  automaticSequencing: boolean = true;

  leftEfisState: EfisState<number>;

  rightEfisState: EfisState<number>;

  efisStateForSide: { L: EfisState<number>; R: EfisState<number> };

  private approachMessage: string = '';

  taskQueue = new TaskQueue();

  verticalProfileComputationParametersObserver: VerticalProfileComputationParametersObserver;

  viewListener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

  private windProfileFactory: WindProfileFactory;

  public atmosphericConditions: AtmosphericConditions;

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private updateEfisState(side: EfisSide, state: EfisState<number>): void {
    const ndMode = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_MODE`, 'Enum') as EfisNdMode;
    const ndRange = this.efisNDRangeValues[SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_RANGE`, 'Enum')];

    if (state?.mode !== ndMode || state?.range !== ndRange) {
      this.taskQueue.cancelAllInCategory(TaskCategory.EfisVectors);
      this.efisVectors.forceUpdate();
    }

    state.mode = ndMode;
    state.range = ndRange;

    this.updateEfisApproachMessage();
  }

  private updateMapPartlyDisplayed() {
    if (this.efisStateForSide.L.dataLimitReached || this.efisStateForSide.L.legsCulled) {
      SimVar.SetSimVarValue('L:A32NX_EFIS_L_MAP_PARTLY_DISPLAYED', 'boolean', true);
    } else {
      SimVar.SetSimVarValue('L:A32NX_EFIS_L_MAP_PARTLY_DISPLAYED', 'boolean', false);
    }

    if (this.efisStateForSide.R.dataLimitReached || this.efisStateForSide.R.legsCulled) {
      SimVar.SetSimVarValue('L:A32NX_EFIS_R_MAP_PARTLY_DISPLAYED', 'boolean', true);
    } else {
      SimVar.SetSimVarValue('L:A32NX_EFIS_R_MAP_PARTLY_DISPLAYED', 'boolean', false);
    }
  }

  private updateEfisIdent() {
    // Update EFIS ident
    const activeLeg = this.flightPlanService.active?.activeLeg;
    const efisIdent = activeLeg?.isDiscontinuity === false ? activeLeg.ident : 'PPOS';

    const efisVars = SimVarString.pack(efisIdent, 9);
    // setting the simvar as a number greater than about 16 million causes precision error > 1... but this works..
    SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_IDENT_0', 'string', efisVars[0].toString());
    SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_IDENT_1', 'string', efisVars[1].toString());
    SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_IDENT_0', 'string', efisVars[0].toString());
    SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_IDENT_1', 'string', efisVars[1].toString());
  }

  private updateEfisApproachMessage() {
    let apprMsg = '';

    const phase = this.flightPhase.get();

    if (this.symbolConfig.publishDepartureIdent && phase < FmgcFlightPhase.Cruise) {
      if (this.flightPlanService.active.isDepartureProcedureActive) {
        apprMsg = this.flightPlanService.active.originDeparture.ident;
      }
    } else {
      const runway = this.flightPlanService.active.destinationRunway;
      if (runway) {
        const distanceToDestination = this.alongTrackDistanceToDestination ?? -1;

        if (phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && distanceToDestination < 250)) {
          const appr = this.flightPlanService.active.approach;
          // Nothing is shown on the ND for runway-by-itself approaches
          apprMsg = appr && appr.type !== ApproachType.Unknown ? ApproachUtils.longApproachName(appr) : '';
        }
      }
    }

    if (apprMsg !== this.approachMessage) {
      this.approachMessage = apprMsg;
      const apprMsgVars = SimVarString.pack(apprMsg, 9);
      // setting the simvar as a number greater than about 16 million causes precision error > 1... but this works..
      SimVar.SetSimVarValue('L:A32NX_EFIS_L_APPR_MSG_0', 'string', apprMsgVars[0].toString());
      SimVar.SetSimVarValue('L:A32NX_EFIS_L_APPR_MSG_1', 'string', apprMsgVars[1].toString());
      SimVar.SetSimVarValue('L:A32NX_EFIS_R_APPR_MSG_0', 'string', apprMsgVars[0].toString());
      SimVar.SetSimVarValue('L:A32NX_EFIS_R_APPR_MSG_1', 'string', apprMsgVars[1].toString());
    }
  }

  private updateEfisData() {
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');
    const flightPhase = this.flightPhase.get();
    const etaComputable = flightPhase >= FmgcFlightPhase.Takeoff && gs > 100;
    const activeLeg = this.activeGeometry?.legs.get(this.activeLegIndex);
    if (activeLeg) {
      const isXMLeg = activeLeg instanceof FMLeg || activeLeg instanceof VMLeg;
      // Don't transmit bearing for manual legs
      const termination = isXMLeg
        ? null
        : activeLeg instanceof XFLeg
          ? activeLeg.terminationWaypoint.location
          : activeLeg.getPathEndPoint();
      const ppos = this.lnavDriver.ppos;
      const efisTrueBearing = termination ? Avionics.Utils.computeGreatCircleHeading(ppos, termination) : -1;
      const efisBearing = termination
        ? A32NX_Util.trueToMagnetic(efisTrueBearing, Facilities.getMagVar(ppos.lat, ppos.long))
        : -1;

      // Don't compute distance and ETA for XM legs
      const efisDistance = isXMLeg ? -1 : Avionics.Utils.computeGreatCircleDistance(ppos, termination);
      const efisEta = isXMLeg || !etaComputable ? -1 : this.lnavDriver.legEta(gs, termination);

      // FIXME should be NCD if no FM position
      this.updateEfisVars(efisBearing, efisTrueBearing, efisDistance, efisEta, 'L');
      this.updateEfisVars(efisBearing, efisTrueBearing, efisDistance, efisEta, 'R');
    } else {
      this.updateEfisVars(-1, -1, -1, -1, 'L');
      this.updateEfisVars(-1, -1, -1, -1, 'R');
    }
  }

  private updateEfisVars(bearing: number, trueBearing: number, distance: number, eta: number, side: string): void {
    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_TO_WPT_BEARING`, 'Degrees', bearing);
    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_TO_WPT_TRUE_BEARING`, 'Degrees', trueBearing);
    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_TO_WPT_DISTANCE`, 'Number', distance);
    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_TO_WPT_ETA`, 'Seconds', eta);
  }

  constructor(
    private readonly bus: EventBus,
    fmgc: Fmgc,
    private readonly flightPlanService: FlightPlanService,
    private efisInterfaces: Record<EfisSide, EfisInterface>,
    private readonly efisNDRangeValues: number[],
    private readonly acConfig: AircraftConfig,
  ) {
    this.verticalProfileComputationParametersObserver = new VerticalProfileComputationParametersObserver(
      fmgc,
      flightPlanService,
    );
    this.windProfileFactory = new WindProfileFactory(fmgc, 1);

    this.atmosphericConditions = new AtmosphericConditions(this.verticalProfileComputationParametersObserver);

    this.lnavDriver = new LnavDriver(flightPlanService, this, this.acConfig);
    this.vnavDriver = new VnavDriver(
      flightPlanService,
      this,
      this.verticalProfileComputationParametersObserver,
      this.atmosphericConditions,
      this.windProfileFactory,
      this.acConfig,
    );
    this.pseudoWaypoints = new PseudoWaypoints(flightPlanService, this, this.atmosphericConditions, this.acConfig);
    this.efisVectors = new EfisVectors(this.bus, this.flightPlanService, this, efisInterfaces);
    this.symbolConfig = acConfig.fmSymbolConfig;
  }

  init() {
    console.log('[FMGC/Guidance] GuidanceController initialized!');

    this.lnavDriver.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
    this.lnavDriver.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

    this.leftEfisState = { mode: EfisNdMode.ARC, range: 10, dataLimitReached: false, legsCulled: false };
    this.rightEfisState = { mode: EfisNdMode.ARC, range: 10, dataLimitReached: false, legsCulled: false };
    this.efisStateForSide = {
      L: this.leftEfisState,
      R: this.rightEfisState,
    };

    this.updateEfisState('L', this.leftEfisState);
    this.updateEfisState('R', this.rightEfisState);

    this.efisStateForSide.L = this.leftEfisState;
    this.efisStateForSide.R = this.leftEfisState;

    this.lnavDriver.init();
    this.vnavDriver.init();
    this.pseudoWaypoints.init();

    Coherent.on(
      'A32NX_IMM_EXIT',
      (fpIndex, immExit) => {
        const fpLeg = this.flightPlanService.active.maybeElementAt(fpIndex);
        const geometryLeg = this.activeGeometry.legs.get(fpIndex);

        const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');

        if (fpLeg.isDiscontinuity === false && fpLeg.type === LegType.HM) {
          fpLeg.holdImmExit = immExit;

          this.flightPlanService.active.incrementVersion();
        }

        if (geometryLeg instanceof HMLeg) {
          geometryLeg.setImmediateExit(immExit, this.lnavDriver.ppos, tas);

          this.automaticSequencing = true;
        }
      },
      undefined,
    );
  }

  private geometryRecomputationTimer = GEOMETRY_RECOMPUTATION_TIMER + 1;

  private lastFlightPlanVersions = new Map<number, number>();

  private flightPlanGeometries = new Map<number, Geometry>();

  update(deltaTime: number) {
    this.geometryRecomputationTimer += deltaTime;

    this.updateEfisState('L', this.leftEfisState);
    this.updateEfisState('R', this.rightEfisState);

    try {
      this.verticalProfileComputationParametersObserver.update();
      this.windProfileFactory.updateFmgcInputs();
      this.atmosphericConditions.update();
    } catch (e) {
      console.error('[FMS] Error during update of VNAV input parameters. See exception below.');
      console.error(e);
    }

    try {
      this.tryUpdateFlightPlanGeometry(FlightPlanIndex.Active, false);
      this.tryUpdateFlightPlanGeometry(FlightPlanIndex.Active, true);
      this.tryUpdateFlightPlanGeometry(FlightPlanIndex.Temporary, false);
      this.tryUpdateFlightPlanGeometry(FlightPlanIndex.FirstSecondary, false);
      this.tryUpdateFlightPlanGeometry(FlightPlanIndex.FirstSecondary, true);

      if (this.geometryRecomputationTimer > GEOMETRY_RECOMPUTATION_TIMER) {
        this.geometryRecomputationTimer = 0;

        this.tryUpdateFlightPlanGeometry(FlightPlanIndex.Active, false, true);
        this.tryUpdateFlightPlanGeometry(FlightPlanIndex.Active, true, true);
        this.tryUpdateFlightPlanGeometry(FlightPlanIndex.Temporary, false, true);
        this.tryUpdateFlightPlanGeometry(FlightPlanIndex.FirstSecondary, false, true);
        this.tryUpdateFlightPlanGeometry(FlightPlanIndex.FirstSecondary, true, true);

        if (this.activeGeometry) {
          try {
            this.vnavDriver.acceptMultipleLegGeometry(this.activeGeometry);
            this.pseudoWaypoints.acceptMultipleLegGeometry(this.activeGeometry);
          } catch (e) {
            console.error('[FMS] Error during active geometry profile recomputation. See exception below.');
            console.error(e);
          }
        }
      }

      this.updateEfisIdent();
    } catch (e) {
      console.error('[FMS] Error during LNAV update. See exception below.');
      console.error(e);
    }

    try {
      this.updateMapPartlyDisplayed();
    } catch (e) {
      console.error('[FMS] Error during map partly displayed computation. See exception below.');
      console.error(e);
    }

    try {
      this.lnavDriver.update(deltaTime);
    } catch (e) {
      console.error('[FMS] Error during LNAV driver update. See exception below.');
      console.error(e);
    }

    this.updateEfisData();

    try {
      this.vnavDriver.update(deltaTime);
    } catch (e) {
      console.error('[FMS] Error during VNAV driver update. See exception below.');
      console.error(e);
    }

    try {
      this.pseudoWaypoints.update(deltaTime);
    } catch (e) {
      console.error('[FMS] Error during pseudo waypoints update. See exception below.');
      console.error(e);
    }

    try {
      this.efisVectors.update(deltaTime);
    } catch (e) {
      console.error('[FMS] Error during EFIS vectors update. See exception below.');
      console.error(e);
    }

    try {
      this.taskQueue.update(deltaTime);
    } catch (e) {
      console.error('[FMS] Error during task queue update. See exception below.');
      console.error(e);
    }
  }

  tryUpdateFlightPlanGeometry(flightPlanIndex: number, alternate = false, force = false) {
    const geometryPIndex = (alternate ? 100 : 0) + flightPlanIndex;

    // Use geometry index here because main and alternate flight plans have the same indices
    // but different versions. Otherwise, we keep recomputing the geometry because their versions will not be the same
    const lastVersion = this.lastFlightPlanVersions.get(geometryPIndex);

    if (!this.flightPlanService.has(flightPlanIndex)) {
      this.flightPlanGeometries.delete(geometryPIndex);
      return;
    }

    const plan = alternate
      ? this.flightPlanService.get(flightPlanIndex).alternateFlightPlan
      : this.flightPlanService.get(flightPlanIndex);

    const currentVersion = plan.version;

    if (!force && lastVersion === currentVersion) {
      return;
    }

    this.lastFlightPlanVersions.set(geometryPIndex, currentVersion);

    const geometry = this.flightPlanGeometries.get(geometryPIndex);

    if (geometry) {
      GeometryFactory.updateFromFlightPlan(
        geometry,
        plan,
        !alternate && flightPlanIndex < FlightPlanIndex.FirstSecondary,
      );

      this.recomputeGeometry(geometry, plan);
    } else {
      const newGeometry = GeometryFactory.createFromFlightPlan(
        plan,
        !alternate && flightPlanIndex < FlightPlanIndex.FirstSecondary,
      );

      this.recomputeGeometry(newGeometry, plan);

      this.flightPlanGeometries.set(geometryPIndex, newGeometry);
    }
  }

  recomputeGeometry(geometry: Geometry, plan: BaseFlightPlan) {
    const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');
    const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

    geometry.recomputeWithParameters(
      tas,
      gs,
      this.lnavDriver.ppos,
      trueTrack,
      plan.activeLegIndex,
      plan.activeLegIndex, // TODO active transition index for temporary plan...?
    );

    // Update distance to destination
    geometry.updateDistances(plan, Math.max(0, plan.activeLegIndex - 1), plan.firstMissedApproachLegIndex);
    // Update distances in missed approach segment
    geometry.updateDistances(plan, Math.max(plan.firstMissedApproachLegIndex), plan.legCount);
  }

  /**
   * Notifies the FMS that a pseudo waypoint must be sequenced.
   *
   * This is to be sued by {@link LnavDriver} only.
   *
   * @param pseudoWaypoint the {@link PseudoWaypoint} to sequence.
   */
  sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
    this.pseudoWaypoints.sequencePseudoWaypoint(pseudoWaypoint);
  }

  isManualHoldActive(): boolean {
    if (this.activeGeometry) {
      const activeLeg = this.activeGeometry.legs.get(this.activeLegIndex);
      return activeLeg instanceof HMLeg;
    }
    return false;
  }

  isManualHoldNext(): boolean {
    if (this.activeGeometry) {
      const nextLeg = this.activeGeometry.legs.get(this.activeLegIndex + 1);
      return nextLeg instanceof HMLeg;
    }
    return false;
  }

  setHoldSpeed(tas: Knots) {
    let holdLeg: HMLeg;
    if (this.isManualHoldActive()) {
      holdLeg = this.activeGeometry.legs.get(this.activeLegIndex) as unknown as HMLeg;
    } else if (this.isManualHoldNext()) {
      holdLeg = this.activeGeometry.legs.get(this.activeLegIndex + 1) as unknown as HMLeg;
    }

    if (holdLeg) {
      holdLeg.setPredictedTas(tas);
    }
  }

  get lastCrosstrackError(): NauticalMiles {
    return this.lnavDriver.lastXTE;
  }
}
