// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  a320EfisRangeSettings,
  Arinc429OutputWord,
  Arinc429SignStatusMatrix,
  Arinc429Word,
  DatabaseIdent,
  DatabaseItem,
  EfisSide,
  EnrouteNdbNavaid,
  Fix,
  IlsNavaid,
  MathUtils,
  NdbNavaid,
  NXDataStore,
  NXUnits,
  TerminalNdbNavaid,
  UpdateThrottler,
  VhfNavaid,
  Waypoint,
} from '@flybywiresim/fbw-sdk';
import { A32NX_Util } from '../../../../shared/src/A32NX_Util';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { A320AircraftConfig } from '@fmgc/flightplanning/A320AircraftConfig';
import { DataManager } from '@fmgc/flightplanning/DataManager';
import { FlightPlanRpcServer } from '@fmgc/flightplanning/rpc/FlightPlanRpcServer';
import { Fmgc, GuidanceController } from '@fmgc/guidance/GuidanceController';
import { A32NX_Core } from './A32NX_Core/A32NX_Core';
import { A32NX_FuelPred, FuelPlanningPhases } from './A32NX_Core/A32NX_FuelPred';
import { ADIRS } from './A32NX_Core/Adirs';
import { A32NX_MessageQueue } from './A32NX_MessageQueue';
import { NXSpeedsApp, NXSpeedsUtils } from './NXSpeeds';
import { CDUIdentPage } from '../legacy_pages/A320_Neo_CDU_IdentPage';
import { CDUNewWaypoint } from '../legacy_pages/A320_Neo_CDU_NewWaypoint';
import { CDUPerformancePage } from '../legacy_pages/A320_Neo_CDU_PerformancePage';
import { CDUProgressPage } from '../legacy_pages/A320_Neo_CDU_ProgressPage';
import { A320_Neo_CDU_SelectWptPage } from '../legacy_pages/A320_Neo_CDU_SelectWptPage';
import { McduMessage, NXFictionalMessages, NXSystemMessages, TypeIIMessage } from '../messages/NXSystemMessages';
import { Navigation, SelectedNavaid } from '@fmgc/navigation/Navigation';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CompanyRoute } from '@simbridge/index';
import { Keypad } from './A320_Neo_CDU_Keypad';
import { FmsClient } from '@atsu/fmsclient';
import { AtsuStatusCodes } from '@datalink/common';
import { A320_Neo_CDU_MainDisplay } from './A320_Neo_CDU_MainDisplay';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FmsErrorType } from '@fmgc/FmsError';
import { FmsDataInterface } from '@fmgc/flightplanning/interface/FmsDataInterface';
import { EventBus } from '@microsoft/msfs-sdk';
import { AdfRadioTuningStatus, MmrRadioTuningStatus, VorRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { FmsFormatters } from './FmsFormatters';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import {
  A320FlightPlanPerformanceData,
  DefaultPerformanceData,
} from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { initComponents, updateComponents } from '@fmgc/components';
import { CoRouteUplinkAdapter } from '@fmgc/flightplanning/uplink/CoRouteUplinkAdapter';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { ISimbriefData } from '../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';
import { FuelPredComputations, SimbriefOfpState } from './LegacyFmsPageInterface';

export abstract class FMCMainDisplay implements FmsDataInterface, FmsDisplayInterface, Fmgc {
  private static DEBUG_INSTANCE: FMCMainDisplay;

  /** Naughty hack. We assume that we're always subclassed by A320_Neo_CDU_MainDisplay. */
  private readonly mcdu = this as unknown as A320_Neo_CDU_MainDisplay;

  public readonly navDatabaseBackend = NavigationDatabaseBackend.Msfs;
  public readonly currFlightPhaseManager = new FlightPhaseManager(this.bus);
  public readonly currFlightPlanService = new FlightPlanService(this.bus, new A320FlightPlanPerformanceData());
  public readonly rpcServer = new FlightPlanRpcServer(this.bus, this.currFlightPlanService);
  public readonly currNavigationDatabaseService = NavigationDatabaseService;
  public readonly navigationDatabase = new NavigationDatabase(NavigationDatabaseBackend.Msfs);

  private readonly flightPhaseUpdateThrottler = new UpdateThrottler(800);
  private readonly fmsUpdateThrottler = new UpdateThrottler(250);
  private readonly _progBrgDistUpdateThrottler = new UpdateThrottler(2000);
  private readonly _apCooldown = 500;
  private lastFlightPlanVersion = 0;
  private readonly _messageQueue = new A32NX_MessageQueue(this.mcdu);

  public _deltaTime = 0;

  /** Declaration of every variable used (NOT initialization) */
  private maxCruiseFL = 390;
  private recMaxCruiseFL = 398;
  public coRoute = { routeNumber: undefined, routes: undefined };
  public perfTOTemp = NaN;

  /**
   * To compute:
   *  - trip fuel / time (from vnav)
   *  - route reserve / route reserve pct (one is entered, the other is calculated from it)
   *  - alternate fuel / time (from vnav)
   *  - final fuel / time (one is entered, the other is calculated from it)
   *  - min dest fob (just alternate + final)
   *  - tow / lw (computed from other values on the page)
   *  - extra / time (weight is computed from other values, time from weight)
   */

  private static fuelComputationsCache: FuelPredComputations = {
    tripFuel: null,
    tripTime: null,
    routeReserveFuel: null,
    routeReserveFuelPercentage: null,
    alternateFuel: null,
    alternateTime: null,
    finalHoldingFuel: null,
    finalHoldingTime: null,
    minimumDestinationFuel: null,
    takeoffWeight: null,
    landingWeight: null,
    destinationFuelOnBoard: null,
    alternateDestinationFuelOnBoard: null,
    extraFuel: null,
    extraTime: null,
  };

  public perfApprQNH = NaN;
  public perfApprTemp = NaN;
  public perfApprWindHeading = NaN;
  public perfApprWindSpeed = NaN;
  public unconfirmedV1Speed = undefined;
  public unconfirmedVRSpeed = undefined;
  public unconfirmedV2Speed = undefined;
  public _toFlexChecked = true;
  private toRunway = undefined;
  public vApp = NaN;
  public perfApprMDA: number | null = null;
  public perfApprDH: 'NO DH' | number | null = null;
  public perfApprFlaps3 = false;
  private _debug = undefined;
  public _isBelowMinDestFob = false;
  public _fuelPredDone = false;
  public _fuelPlanningPhase = undefined;
  private _initMessageSettable = undefined;
  public _checkWeightSettable = true;
  private _gwInitDisplayed = undefined;
  /* CPDLC Fields */
  private _destDataChecked = undefined;
  private _towerHeadwind = undefined;
  private _EfobBelowMinClr = undefined;
  public simbriefOfp: ISimbriefData | undefined = undefined;
  public simbriefOfpState: SimbriefOfpState = SimbriefOfpState.NotLoaded;
  public simbrief = undefined;
  public aocTimes = {
    doors: 0,
    off: 0,
    out: 0,
    on: 0,
    in: 0,
  };
  public winds = {
    climb: [],
    cruise: [],
    des: [],
    alternate: null,
  };
  public computedVgd?: number;
  public computedVfs?: number;
  public computedVss?: number;
  public computedVls?: number;
  public approachSpeeds?: NXSpeedsApp; // based on selected config, not current config
  public constraintAlt = 0;
  private _forceNextAltitudeUpdate = undefined;
  private _lastUpdateAPTime = undefined;
  private updateAutopilotCooldown = undefined;
  private _apMasterStatus = undefined;
  private _lastRequestedFLCModeWaypointIndex = undefined;

  private _progBrgDist?: {
    icao: string;
    ident: string;
    coordinates: Coordinates;
    bearing: number;
    distance: number;
  };
  public preSelectedClbSpeed?: number;
  public preSelectedCrzSpeed?: number;
  public managedSpeedTarget = NaN;
  public managedSpeedTargetIsMach = false;
  public managedSpeedClimb = 290;
  private managedSpeedClimbIsPilotEntered = false;
  public managedSpeedClimbMach = 0.78;
  // private managedSpeedClimbMachIsPilotEntered = undefined;
  public managedSpeedCruise = 290;
  public managedSpeedCruiseIsPilotEntered = false;
  public managedSpeedCruiseMach = 0.78;
  // private managedSpeedCruiseMachIsPilotEntered = undefined;
  public managedSpeedDescend = 290;
  public managedSpeedDescendPilot?: number;
  public managedSpeedDescendMach = 0.78;
  public managedSpeedDescendMachPilot?: number;
  // private managedSpeedDescendMachIsPilotEntered = undefined;
  private cruiseFlightLevelTimeOut?: ReturnType<typeof setTimeout>;
  /** Takeoff config entered on PERF TO */
  public flaps?: 0 | 1 | 2 | 3 | null = undefined;
  public ths?: number | null;
  private activeWpIdx = undefined;
  private efisSymbols = undefined;
  /**
   * Landing elevation in feet MSL.
   * This is the destination runway threshold elevation, or airport elevation if runway is not selected.
   */
  private landingElevation = undefined;
  /*
   * Latitude part of the touch down coordinate.
   * This is the destination runway coordinate, or airport coordinate if runway is not selected
   */
  private destinationLatitude = undefined;
  /*
   * Latitude part of the touch down coordinate.
   * This is the destination runway coordinate, or airport coordinate if runway is not selected
   */
  private destinationLongitude = undefined;
  /** Speed in KCAS when the first engine failed during takeoff */
  private takeoffEngineOutSpeed = undefined;
  private checkSpeedModeMessageActive = undefined;
  public perfClbPredToAltitudePilot = undefined;
  public perfDesPredToAltitudePilot = undefined;

  // ATSU data
  public atsu?: FmsClient;
  public holdSpeedTarget = undefined;
  public holdIndex = 0;
  public holdDecelReached = false;
  private setHoldSpeedMessageActive = undefined;
  private managedProfile = new Map<
    number,
    {
      descentSpeed: number;
      previousDescentSpeed: number;
      climbSpeed: number;
      previousClimbSpeed: number;
      climbAltitude: number;
      descentAltitude: number;
    }
  >();
  private speedLimitExceeded = undefined;
  private toSpeedsNotInserted = false;
  private toSpeedsTooLow = false;
  private vSpeedDisagree = false;
  public isTrueRefMode = false;

  public onAirport = () => {};
  // FIXME always false!
  public _activeCruiseFlightLevelDefaulToFcu = false;

  // arinc bus output words
  private readonly arincDiscreteWord2 = new FmArinc429OutputWord('DISCRETE_WORD_2');
  private readonly arincDiscreteWord3 = new FmArinc429OutputWord('DISCRETE_WORD_3');
  private readonly arincTakeoffPitchTrim = new FmArinc429OutputWord('TO_PITCH_TRIM');
  private readonly arincLandingElevation = new FmArinc429OutputWord('LANDING_ELEVATION');
  private readonly arincDestinationLatitude = new FmArinc429OutputWord('DEST_LAT');
  private readonly arincDestinationLongitude = new FmArinc429OutputWord('DEST_LONG');
  private readonly arincMDA = new FmArinc429OutputWord('MINIMUM_DESCENT_ALTITUDE');
  private readonly arincDH = new FmArinc429OutputWord('DECISION_HEIGHT');
  private readonly arincThrustReductionAltitude = new FmArinc429OutputWord('THR_RED_ALT');
  private readonly arincAccelerationAltitude = new FmArinc429OutputWord('ACC_ALT');
  private readonly arincEoAccelerationAltitude = new FmArinc429OutputWord('EO_ACC_ALT');
  private readonly arincMissedThrustReductionAltitude = new FmArinc429OutputWord('MISSED_THR_RED_ALT');
  private readonly arincMissedAccelerationAltitude = new FmArinc429OutputWord('MISSED_ACC_ALT');
  private readonly arincMissedEoAccelerationAltitude = new FmArinc429OutputWord('MISSED_EO_ACC_ALT');
  private readonly arincTransitionAltitude = new FmArinc429OutputWord('TRANS_ALT');
  private readonly arincTransitionLevel = new FmArinc429OutputWord('TRANS_LVL');
  /** contains fm messages (not yet implemented) and nodh bit */
  private readonly arincEisWord2 = new FmArinc429OutputWord('EIS_DISCRETE_WORD_2');

  /** These arinc words will be automatically written to the bus, and automatically set to 0/NCD when the FMS resets */
  private readonly arincBusOutputs = [
    this.arincDiscreteWord2,
    this.arincDiscreteWord3,
    this.arincTakeoffPitchTrim,
    this.arincLandingElevation,
    this.arincDestinationLatitude,
    this.arincDestinationLongitude,
    this.arincMDA,
    this.arincDH,
    this.arincThrustReductionAltitude,
    this.arincAccelerationAltitude,
    this.arincEoAccelerationAltitude,
    this.arincMissedThrustReductionAltitude,
    this.arincMissedAccelerationAltitude,
    this.arincMissedEoAccelerationAltitude,
    this.arincTransitionAltitude,
    this.arincTransitionLevel,
    this.arincEisWord2,
  ];

  private navDbIdent: DatabaseIdent | null = null;

  private A32NXCore?: A32NX_Core;
  public dataManager?: DataManager;
  public efisInterfaces?: Record<EfisSide, EfisInterface>;
  public guidanceController?: GuidanceController;
  public navigation?: Navigation;

  public tempCurve;
  public casToMachManualCrossoverCurve;
  public machToCasManualCrossoverCurve;

  constructor(public readonly bus: EventBus) {
    FMCMainDisplay.DEBUG_INSTANCE = this;

    this.currFlightPlanService.createFlightPlans();
    this.currNavigationDatabaseService.activeDatabase = this.navigationDatabase;
  }

  public get flightPhaseManager() {
    return this.currFlightPhaseManager;
  }

  get flightPlanService() {
    return this.currFlightPlanService;
  }

  public getFlightPlan(index: FlightPlanIndex) {
    return index === FlightPlanIndex.Active
      ? this.flightPlanService.activeOrTemporary
      : this.flightPlanService.get(index);
  }

  public getAlternateFlightPlan(index: FlightPlanIndex) {
    return this.getFlightPlan(index).alternateFlightPlan;
  }

  public get navigationDatabaseService() {
    return this.currNavigationDatabaseService;
  }

  protected Init() {
    this.initVariables();

    this.A32NXCore = new A32NX_Core();
    this.A32NXCore.init();

    this.dataManager = new DataManager(this);

    this.efisInterfaces = {
      L: new EfisInterface('L', this.currFlightPlanService),
      R: new EfisInterface('R', this.currFlightPlanService),
    };
    this.guidanceController = new GuidanceController(
      this.bus,
      this,
      this.currFlightPlanService,
      this.efisInterfaces,
      a320EfisRangeSettings,
      A320AircraftConfig,
    );
    this.navigation = new Navigation(this.bus, this.currFlightPlanService);
    this.efisSymbols = new EfisSymbols(
      this.bus,
      this.guidanceController,
      this.currFlightPlanService,
      this.navigation.getNavaidTuner(),
      this.efisInterfaces,
      a320EfisRangeSettings,
    );

    initComponents(this.navigation, this.guidanceController, this.flightPlanService);

    this.guidanceController.init();
    this.efisSymbols.init();
    this.navigation.init();

    this.tempCurve = new Avionics.Curve();
    this.tempCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
    this.tempCurve.add(-10 * 3.28084, 21.5);
    this.tempCurve.add(0, 15.0);
    this.tempCurve.add(10 * 3.28084, 8.5);
    this.tempCurve.add(20 * 3.28084, 2.0);
    this.tempCurve.add(30 * 3.28084, -4.49);
    this.tempCurve.add(40 * 3.28084, -10.98);
    this.tempCurve.add(50 * 3.28084, -17.47);
    this.tempCurve.add(60 * 3.28084, -23.96);
    this.tempCurve.add(70 * 3.28084, -30.45);
    this.tempCurve.add(80 * 3.28084, -36.94);
    this.tempCurve.add(90 * 3.28084, -43.42);
    this.tempCurve.add(100 * 3.28084, -49.9);
    this.tempCurve.add(150 * 3.28084, -56.5);
    this.tempCurve.add(200 * 3.28084, -56.5);
    this.tempCurve.add(250 * 3.28084, -51.6);
    this.tempCurve.add(300 * 3.28084, -46.64);
    this.tempCurve.add(400 * 3.28084, -22.8);
    this.tempCurve.add(500 * 3.28084, -2.5);
    this.tempCurve.add(600 * 3.28084, -26.13);
    this.tempCurve.add(700 * 3.28084, -53.57);
    this.tempCurve.add(800 * 3.28084, -74.51);

    // This is used to determine the Mach number corresponding to a CAS at the manual crossover altitude
    // The curve was calculated numerically and approximated using a few interpolated values
    this.casToMachManualCrossoverCurve = new Avionics.Curve();
    this.casToMachManualCrossoverCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
    this.casToMachManualCrossoverCurve.add(0, 0);
    this.casToMachManualCrossoverCurve.add(100, 0.27928);
    this.casToMachManualCrossoverCurve.add(150, 0.41551);
    this.casToMachManualCrossoverCurve.add(200, 0.54806);
    this.casToMachManualCrossoverCurve.add(250, 0.67633);
    this.casToMachManualCrossoverCurve.add(300, 0.8);
    this.casToMachManualCrossoverCurve.add(350, 0.82);

    // This is used to determine the CAS corresponding to a Mach number at the manual crossover altitude
    // Effectively, the manual crossover altitude is FL305 up to M.80, then decreases linearly to the crossover altitude of (VMO, MMO)
    this.machToCasManualCrossoverCurve = new Avionics.Curve();
    this.machToCasManualCrossoverCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
    this.machToCasManualCrossoverCurve.add(0, 0);
    this.machToCasManualCrossoverCurve.add(0.27928, 100);
    this.machToCasManualCrossoverCurve.add(0.41551, 150);
    this.machToCasManualCrossoverCurve.add(0.54806, 200);
    this.machToCasManualCrossoverCurve.add(0.67633, 250);
    this.machToCasManualCrossoverCurve.add(0.8, 300);
    this.machToCasManualCrossoverCurve.add(0.82, 350);

    this.updatePerfSpeeds();

    this.flightPhaseManager.init();
    this.flightPhaseManager.addOnPhaseChanged(this.onFlightPhaseChanged.bind(this));

    // Start the check routine for system health and status
    setInterval(() => {
      if (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && !this._destDataChecked) {
        const distanceToDestination = this.getDistanceToDestination();
        if (Number.isFinite(distanceToDestination) && distanceToDestination !== -1 && distanceToDestination < 180) {
          this._destDataChecked = true;
          this.checkDestData();
        }
      }
    }, 15000);

    SimVar.SetSimVarValue('L:A32NX_FM_LS_COURSE', 'number', -1);

    this.navigationDatabaseService.activeDatabase.getDatabaseIdent().then((dbIdent) => (this.navDbIdent = dbIdent));
  }

  protected initVariables(resetTakeoffData = true) {
    this.costIndex = undefined;
    this.maxCruiseFL = 390;
    this.recMaxCruiseFL = 398;
    this.resetCoroute();
    // +ve for tailwind, -ve for headwind
    this.perfApprQNH = NaN;
    this.perfApprTemp = NaN;
    this.perfApprWindHeading = NaN;
    this.perfApprWindSpeed = NaN;
    this.unconfirmedV1Speed = undefined;
    this.unconfirmedVRSpeed = undefined;
    this.unconfirmedV2Speed = undefined;
    this._toFlexChecked = true;
    this.toRunway = '';
    this.vApp = NaN;
    this.perfApprMDA = null;
    this.perfApprDH = null;
    this.perfApprFlaps3 = false;
    this._debug = 0;
    this._isBelowMinDestFob = false;
    this._fuelPredDone = false;
    this._fuelPlanningPhase = FuelPlanningPhases.PLANNING;
    this._initMessageSettable = false;
    this._checkWeightSettable = true;
    this._gwInitDisplayed = 0;
    /* CPDLC Fields */
    this.tropo = undefined;
    this._destDataChecked = false;
    this._towerHeadwind = 0;
    this._EfobBelowMinClr = false;
    this.simbrief = {
      route: '',
      cruiseAltitude: '',
      originIcao: '',
      destinationIcao: '',
      blockFuel: '',
      paxCount: '',
      cargo: undefined,
      payload: undefined,
      estZfw: '',
      sendStatus: 'READY',
      costIndex: '',
      navlog: [],
      callsign: '',
      alternateIcao: '',
      avgTropopause: '',
      ete: '',
      blockTime: '',
      outTime: '',
      onTime: '',
      inTime: '',
      offTime: '',
      taxiFuel: '',
      tripFuel: '',
    };
    this.aocTimes.doors = 0;
    this.aocTimes.off = 0;
    this.aocTimes.out = 0;
    this.aocTimes.on = 0;
    this.aocTimes.in = 0;
    this.winds.climb.length = 0;
    this.winds.cruise.length = 0;
    this.winds.des.length = 0;
    this.winds.alternate = null;
    this.computedVls = undefined;
    this.approachSpeeds = undefined; // based on selected config, not current config
    this.constraintAlt = 0;
    this._forceNextAltitudeUpdate = false;
    this._lastUpdateAPTime = NaN;
    this.updateAutopilotCooldown = 0;
    this._apMasterStatus = false;
    this._lastRequestedFLCModeWaypointIndex = -1;

    this._activeCruiseFlightLevelDefaulToFcu = false;
    this._progBrgDist = undefined;
    this.preSelectedClbSpeed = undefined;
    this.preSelectedCrzSpeed = undefined;
    this.managedSpeedTarget = NaN;
    this.managedSpeedTargetIsMach = false;
    this.managedSpeedClimb = 290;
    this.managedSpeedClimbIsPilotEntered = false;
    this.managedSpeedClimbMach = 0.78;
    // this.managedSpeedClimbMachIsPilotEntered = false;
    this.managedSpeedCruise = 290;
    this.managedSpeedCruiseIsPilotEntered = false;
    this.managedSpeedCruiseMach = 0.78;
    // this.managedSpeedCruiseMachIsPilotEntered = false;
    this.managedSpeedDescend = 290;
    this.managedSpeedDescendPilot = undefined;
    this.managedSpeedDescendMach = 0.78;
    this.managedSpeedDescendMachPilot = undefined;
    // this.managedSpeedDescendMachIsPilotEntered = false;
    this.cruiseFlightLevelTimeOut = undefined;
    this.blockFuel = null;
    this.holdSpeedTarget = undefined;
    this.holdIndex = 0;
    this.holdDecelReached = false;
    this.setHoldSpeedMessageActive = false;
    this.managedProfile.clear();
    this.speedLimitExceeded = false;
    this.landingElevation = undefined;
    this.destinationLatitude = undefined;
    this.destinationLongitude = undefined;
    this.toSpeedsNotInserted = false;
    this.toSpeedsTooLow = false;
    this.vSpeedDisagree = false;
    this.takeoffEngineOutSpeed = undefined;
    this.checkSpeedModeMessageActive = false;
    this.perfClbPredToAltitudePilot = undefined;
    this.perfDesPredToAltitudePilot = undefined;

    this.onAirport = () => {};

    if (this.navigation) {
      this.navigation.requiredPerformance.clearPilotRnp();
    }

    // FIXME WTF! Why create a whole new instance each time the FMS is cleared!
    // ATSU data
    this.atsu = new FmsClient(this, this.flightPlanService);

    // Reset SimVars
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', 0);

    SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
    SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);

    SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', -1);
    SimVar.SetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', 0);

    SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', this.constraintAlt);
    SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'Bool', 0);
    SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);
    SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', 0);

    if (SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_DISABLED', 'number') === 1) {
      SimVar.SetSimVarValue('K:A32NX.ATHR_RESET_DISABLE', 'number', 1);
    }

    SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);

    if (resetTakeoffData) {
      // FMGC Message Queue
      this._messageQueue.resetQueue();

      this.computedVgd = undefined;
      this.computedVfs = undefined;
      this.computedVss = undefined;
      this.perfTOTemp = NaN;
      this.setTakeoffFlaps(null);
      this.setTakeoffTrim(null);
      this.unconfirmedV1Speed = undefined;
      this.unconfirmedVRSpeed = undefined;
      this.unconfirmedV2Speed = undefined;
      this._toFlexChecked = true;
    }

    this.arincBusOutputs.forEach((word) => {
      word.setRawValue(0);
      word.setSsm(Arinc429SignStatusMatrix.NoComputedData);
    });

    this.toSpeedsChecks();

    this.setRequest('FMGC');
  }

  public onUpdate(_deltaTime) {
    this._deltaTime = _deltaTime;
    // this.flightPlanManager.update(_deltaTime);
    const flightPlanChanged = this.flightPlanService.activeOrTemporary.version !== this.lastFlightPlanVersion;
    if (flightPlanChanged) {
      this.lastFlightPlanVersion = this.flightPlanService.activeOrTemporary.version;
      this.setRequest('FMGC');
    }

    updateComponents(_deltaTime);

    this.isTrueRefMode = SimVar.GetSimVarValue('L:A32NX_FMGC_TRUE_REF', 'boolean');

    if (this._debug++ > 180) {
      this._debug = 0;
    }
    const flightPhaseManagerDelta = this.flightPhaseUpdateThrottler.canUpdate(_deltaTime);
    if (flightPhaseManagerDelta !== -1) {
      this.flightPhaseManager.shouldActivateNextPhase(flightPhaseManagerDelta);
    }

    if (this.fmsUpdateThrottler.canUpdate(_deltaTime) !== -1) {
      this.checkSpeedLimit();
      this.navigation.update(_deltaTime);
      this.getGW();
      this.checkGWParams();
      this.toSpeedsChecks();
      this.thrustReductionAccelerationChecks();
      this.updateThrustReductionAcceleration();
      this.updateTransitionAltitudeLevel();
      this.updateMinimums();
      this.updateIlsCourse();
      this.updatePerfPageAltPredictions();
      this.checkEFOBBelowMin();
    }

    this.A32NXCore.update();

    if (flightPlanChanged) {
      this.updateManagedProfile();
      this.updateDestinationData();
    }

    this.updateAutopilot();

    if (this._progBrgDistUpdateThrottler.canUpdate(_deltaTime) !== -1) {
      this.updateProgDistance();
    }

    if (this.guidanceController) {
      this.guidanceController.update(_deltaTime);
    }

    if (this.efisSymbols) {
      this.efisSymbols.update(_deltaTime);
    }
    this.arincBusOutputs.forEach((word) => word.writeToSimVarIfDirty());
  }

  protected onFmPowerStateChanged(newState) {
    SimVar.SetSimVarValue('L:A32NX_FM1_HEALTHY_DISCRETE', 'boolean', newState);
    SimVar.SetSimVarValue('L:A32NX_FM2_HEALTHY_DISCRETE', 'boolean', newState);
  }

  public async switchNavDatabase() {
    // Only performing a reset of the MCDU for now, no secondary database
    // Speed AP returns to selected
    //const isSelected = Simplane.getAutoPilotAirspeedSelected();
    //if (isSelected == false)
    //    SimVar.SetSimVarValue("H:A320_Neo_FCU_SPEED_PULL", "boolean", 1);
    // flight plan
    this.resetCoroute();
    this.atsu.resetAtisAutoUpdate();
    await this.flightPlanService.reset();
    // stored data
    this.dataManager.deleteAllStoredWaypoints();
    // Reset MCDU apart from TakeOff config
    this.initVariables(false);

    this.navigation.resetState();
  }

  /**
   * This method is called by the FlightPhaseManager after a flight phase change
   * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
   * @param prevPhase Previous FmgcFlightPhase
   * @param nextPhase New FmgcFlightPhase
   */
  private onFlightPhaseChanged(prevPhase: FmgcFlightPhase, nextPhase: FmgcFlightPhase) {
    this.updateConstraints();
    this.updateManagedSpeed();

    this.setRequest('FMGC');

    SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'Bool', 0);

    switch (nextPhase) {
      case FmgcFlightPhase.Takeoff: {
        this._destDataChecked = false;

        const plan = this.flightPlanService.active;

        if (plan.performanceData.accelerationAltitude === null) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          plan.setPerformanceData(
            'pilotAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
          );
          this.updateThrustReductionAcceleration();
        }
        if (plan.performanceData.engineOutAccelerationAltitude === null) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          plan.setPerformanceData(
            'pilotEngineOutAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
          );
          this.updateThrustReductionAcceleration();
        }

        if (this.page.Current === this.page.PerformancePageTakeoff) {
          CDUPerformancePage.ShowTAKEOFFPage(this.mcdu, FlightPlanIndex.Active);
        } else if (this.page.Current === this.page.ProgressPage) {
          CDUProgressPage.ShowPage(this.mcdu);
        }

        /** Arm preselected speed/mach for next flight phase */
        this.updatePreSelSpeedMach(this.preSelectedClbSpeed);

        break;
      }

      case FmgcFlightPhase.Climb: {
        this._destDataChecked = false;

        if (this.page.Current === this.page.ProgressPage) {
          CDUProgressPage.ShowPage(this.mcdu);
        } else {
          this.tryUpdatePerfPage(prevPhase, nextPhase);
        }

        /** Activate pre selected speed/mach */
        if (prevPhase === FmgcFlightPhase.Takeoff) {
          this.activatePreSelSpeedMach(this.preSelectedClbSpeed);
        }

        /** Arm preselected speed/mach for next flight phase */
        this.updatePreSelSpeedMach(this.preSelectedCrzSpeed);

        if (!this.cruiseLevel) {
          this.cruiseLevel = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100;
        }

        break;
      }

      case FmgcFlightPhase.Cruise: {
        if (this.page.Current === this.page.ProgressPage) {
          CDUProgressPage.ShowPage(this.mcdu);
        } else {
          this.tryUpdatePerfPage(prevPhase, nextPhase);
        }

        SimVar.SetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool', 0);
        Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO)
          .catch(console.error)
          .catch(console.error);

        /** Activate pre selected speed/mach */
        if (prevPhase === FmgcFlightPhase.Climb) {
          this.triggerCheckSpeedModeMessage(this.preSelectedCrzSpeed);
          this.activatePreSelSpeedMach(this.preSelectedCrzSpeed);
        }

        /** Arm preselected speed/mach for next flight phase */
        // FIXME implement pre-selected descent speed!
        //this.updatePreSelSpeedMach(this.preSelectedDesSpeed);

        break;
      }

      case FmgcFlightPhase.Descent: {
        if (this.page.Current === this.page.ProgressPage) {
          CDUProgressPage.ShowPage(this.mcdu);
        } else {
          this.tryUpdatePerfPage(prevPhase, nextPhase);
        }

        this.checkDestData();

        Coherent.call('GENERAL_ENG_THROTTLE_MANAGED_MODE_SET', ThrottleMode.AUTO)
          .catch(console.error)
          .catch(console.error);

        this.triggerCheckSpeedModeMessage(undefined);

        this.cruiseLevel = null;

        break;
      }

      case FmgcFlightPhase.Approach: {
        if (this.page.Current === this.page.ProgressPage) {
          CDUProgressPage.ShowPage(this.mcdu);
        } else {
          this.tryUpdatePerfPage(prevPhase, nextPhase);
        }

        // I think this is not necessary to port, as it only calls fs9gps stuff (fms-v2)
        // this.flightPlanManager.activateApproach().catch(console.error);

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
        if (activePlan.performanceData.missedAccelerationAltitude === null) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          activePlan.setPerformanceData(
            'pilotMissedAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') +
              parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
          );
          this.updateThrustReductionAcceleration();
        }
        if (activePlan.performanceData.missedEngineOutAccelerationAltitude === null) {
          // it's important to set this immediately as we don't want to immediately sequence to the climb phase
          activePlan.setPerformanceData(
            'pilotMissedEngineOutAccelerationAltitude',
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') +
              parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
          );
          this.updateThrustReductionAcceleration();
        }

        if (this.page.Current === this.page.ProgressPage) {
          CDUProgressPage.ShowPage(this.mcdu);
        } else {
          this.tryUpdatePerfPage(prevPhase, nextPhase);
        }

        break;
      }

      case FmgcFlightPhase.Done:
        CDUIdentPage.ShowPage(this.mcdu);

        this.flightPlanService
          .reset()
          .then(() => {
            this.initVariables();
            this.dataManager.deleteAllStoredWaypoints();
            this.setScratchpadText('');
            SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', true).then(() => {
              CDUIdentPage.ShowPage(this.mcdu);
            });
          })
          .catch(console.error);
        break;
    }
  }

  private triggerCheckSpeedModeMessage(preselectedSpeed) {
    const isSpeedSelected = !Simplane.getAutoPilotAirspeedManaged();
    const hasPreselectedSpeed = preselectedSpeed !== undefined;

    if (!this.checkSpeedModeMessageActive && isSpeedSelected && !hasPreselectedSpeed) {
      this.checkSpeedModeMessageActive = true;
      this.addMessageToQueue(
        NXSystemMessages.checkSpeedMode,
        () => !this.checkSpeedModeMessageActive,
        () => {
          this.checkSpeedModeMessageActive = false;
          SimVar.SetSimVarValue('L:A32NX_PFD_MSG_CHECK_SPEED_MODE', 'bool', false);
        },
      );
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_CHECK_SPEED_MODE', 'bool', true);
    }
  }

  private clearCheckSpeedModeMessage() {
    if (this.checkSpeedModeMessageActive && Simplane.getAutoPilotAirspeedManaged()) {
      this.checkSpeedModeMessageActive = false;
      this.removeMessageFromQueue(NXSystemMessages.checkSpeedMode.text);
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_CHECK_SPEED_MODE', 'bool', false);
    }
  }

  /** FIXME these functions are in the new VNAV but not in this branch, remove when able */
  /**
   *
   * @param alt geopotential altitude in feet
   * @returns °C
   */
  public getIsaTemp(alt: number): number {
    if (alt > (this.tropo ? this.tropo : 36090)) {
      return -56.5;
    }
    return 15 - 0.0019812 * alt;
  }

  /**
   * @param alt geopotential altitude in feet
   * @param isaDev temperature deviation from ISA conditions in degrees celcius
   * @returns hPa
   */
  private getPressure(alt: number, isaDev: number = 0) {
    if (alt > (this.tropo ? this.tropo : 36090)) {
      return ((216.65 + isaDev) / 288.15) ** 5.25588 * 1013.2;
    }
    return ((288.15 - 0.0019812 * alt + isaDev) / 288.15) ** 5.25588 * 1013.2;
  }

  private getPressureAltAtElevation(elev: number, qnh = 1013.2) {
    const p0 = qnh < 500 ? 29.92 : 1013.2;
    return elev + 145442.15 * (1 - Math.pow(qnh / p0, 0.190263));
  }

  private getPressureAlt() {
    for (let n = 1; n <= 3; n++) {
      const zp = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${n}_ALTITUDE`);
      if (zp.isNormalOperation()) {
        return zp.value;
      }
    }
    return null;
  }

  private getBaroCorrection1() {
    // FIXME hook up to ADIRU or FCU
    return Simplane.getPressureValue('millibar');
  }

  /**
   * @returns temperature deviation from ISA conditions in degrees celsius
   */
  private getIsaDeviation(): number {
    const geoAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    const temperature = SimVar.GetSimVarValue('AMBIENT TEMPERATURE', 'celsius');
    return temperature - this.getIsaTemp(geoAlt);
  }
  /** FIXME ^these functions are in the new VNAV but not in this branch, remove when able */

  // TODO better decel distance calc
  private calculateDecelDist(fromSpeed: number, toSpeed: number): number {
    return Math.min(20, Math.max(3, (fromSpeed - toSpeed) * 0.15));
  }

  /*
        When the aircraft is in the holding, predictions assume that the leg is flown at holding speed
        with a vertical speed equal to - 1000 ft/mn until reaching a restrictive altitude constraint, the
        FCU altitude or the exit fix. If FCU or constraint altitude is reached first, the rest of the
        pattern is assumed to be flown level at that altitude
        */
  private getHoldingSpeed(speedConstraint = undefined, altitude = undefined) {
    const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const alt = Math.max(fcuAltitude, altitude ? altitude : 0);

    let kcas = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
    if (this.flightPhaseManager.phase === FmgcFlightPhase.Approach) {
      kcas = this.getAppManagedSpeed();
    }

    if (speedConstraint > 100) {
      kcas = Math.min(kcas, speedConstraint);
    }

    // apply icao limits
    if (alt < 14000) {
      kcas = Math.min(230, kcas);
    } else if (alt < 20000) {
      kcas = Math.min(240, kcas);
    } else if (alt < 34000) {
      kcas = Math.min(265, kcas);
    } else {
      const isaDeviation = this.getIsaDeviation();
      const pressure = this.getPressure(alt, isaDeviation);
      kcas = Math.min(MathUtils.convertMachToKCas(0.83, pressure), kcas);
    }

    // apply speed limit/alt
    if (this.flightPhaseManager.phase <= FmgcFlightPhase.Cruise) {
      if (this.climbSpeedLimit !== null && alt <= this.climbSpeedLimitAlt) {
        kcas = Math.min(this.climbSpeedLimit, kcas);
      }
    } else if (this.flightPhaseManager.phase < FmgcFlightPhase.GoAround) {
      if (this.descentSpeedLimit !== null && alt <= this.descentSpeedLimitAlt) {
        kcas = Math.min(this.descentSpeedLimit, kcas);
      }
    }

    kcas = Math.max(kcas, this.computedVls);

    return Math.ceil(kcas);
  }

  private updateHoldingSpeed() {
    const plan = this.flightPlanService.active;
    const currentLegIndex = plan.activeLegIndex;
    const nextLegIndex = currentLegIndex + 1;
    const currentLegConstraints = this.managedProfile.get(currentLegIndex);
    const nextLegConstraints = this.managedProfile.get(nextLegIndex);

    const currentLeg = plan.maybeElementAt(currentLegIndex);
    const nextLeg = plan.maybeElementAt(nextLegIndex);

    const casWord = ADIRS.getCalibratedAirspeed();
    const cas = casWord.isNormalOperation() ? casWord.value : 0;

    let enableHoldSpeedWarning = false;
    let holdSpeedTarget = 0;
    let holdDecelReached = this.holdDecelReached;
    // FIXME big hack until VNAV can do this
    if (currentLeg && currentLeg.isDiscontinuity === false && currentLeg.type === 'HM') {
      holdSpeedTarget = this.getHoldingSpeed(
        currentLegConstraints?.descentSpeed,
        currentLegConstraints?.descentAltitude,
      );
      holdDecelReached = true;
      enableHoldSpeedWarning = !Simplane.getAutoPilotAirspeedManaged();
      this.holdIndex = plan.activeLegIndex;
    } else if (nextLeg && nextLeg.isDiscontinuity === false && nextLeg.type === 'HM') {
      const adirLat = ADIRS.getLatitude();
      const adirLong = ADIRS.getLongitude();

      if (adirLat.isNormalOperation() && adirLong.isNormalOperation()) {
        holdSpeedTarget = this.getHoldingSpeed(nextLegConstraints?.descentSpeed, nextLegConstraints?.descentAltitude);

        const dtg = this.guidanceController.activeLegDtg;
        // decel range limits are [3, 20] NM
        const decelDist = this.calculateDecelDist(cas, holdSpeedTarget);
        if (dtg < decelDist) {
          holdDecelReached = true;
        }

        const gsWord = ADIRS.getGroundSpeed();
        const gs = gsWord.isNormalOperation() ? gsWord.value : 0;
        const warningDist = decelDist + gs / 120;
        if (!Simplane.getAutoPilotAirspeedManaged() && dtg <= warningDist) {
          enableHoldSpeedWarning = true;
        }
      }
      this.holdIndex = plan.activeLegIndex + 1;
    } else {
      this.holdIndex = 0;
      holdDecelReached = false;
    }

    if (holdDecelReached !== this.holdDecelReached) {
      this.holdDecelReached = holdDecelReached;
      SimVar.SetSimVarValue('L:A32NX_FM_HOLD_DECEL', 'bool', this.holdDecelReached);
    }

    if (holdSpeedTarget !== this.holdSpeedTarget) {
      this.holdSpeedTarget = holdSpeedTarget;
      SimVar.SetSimVarValue('L:A32NX_FM_HOLD_SPEED', 'number', this.holdSpeedTarget);
    }

    if (enableHoldSpeedWarning && cas - this.holdSpeedTarget > 5) {
      if (!this.setHoldSpeedMessageActive) {
        this.setHoldSpeedMessageActive = true;
        this.addMessageToQueue(
          NXSystemMessages.setHoldSpeed,
          () => !this.setHoldSpeedMessageActive,
          () => SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false),
        );
        SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', true);
      }
    } else if (this.setHoldSpeedMessageActive) {
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);
      this.setHoldSpeedMessageActive = false;
    }
  }

  private getManagedTargets(v, m) {
    //const vM = _convertMachToKCas(m, _convertCtoK(Simplane.getAmbientTemperature()), SimVar.GetSimVarValue("AMBIENT PRESSURE", "millibar"));
    const vM = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', m);
    return v > vM ? [vM, true] : [v, false];
  }

  private updateManagedSpeeds() {
    if (!this.managedSpeedClimbIsPilotEntered) {
      this.managedSpeedClimb = this.getClbManagedSpeedFromCostIndex();
    }
    if (!this.managedSpeedCruiseIsPilotEntered) {
      this.managedSpeedCruise = this.getCrzManagedSpeedFromCostIndex();
    }

    this.managedSpeedDescend = this.getDesManagedSpeedFromCostIndex();
  }

  private updateManagedSpeed() {
    let vPfd = 0;
    let isMach = false;

    this.updateHoldingSpeed();
    this.clearCheckSpeedModeMessage();

    if (SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1) {
      const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number');
      if (verticalMode === 12) {
        switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
          case 0: {
            this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
            break;
          }
          case 1: {
            this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
            break;
          }
          default: {
            this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
          }
        }
      } else if (verticalMode === 13) {
        this.managedSpeedTarget =
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 0
            ? Math.min(340, SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', 0.8))
            : SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number') - 10;
      }
      vPfd = this.managedSpeedTarget;
    } else if (this.holdDecelReached) {
      vPfd = this.holdSpeedTarget;
      this.managedSpeedTarget = this.holdSpeedTarget;
    } else {
      if (this.setHoldSpeedMessageActive) {
        this.setHoldSpeedMessageActive = false;
        SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);
        this.removeMessageFromQueue(NXSystemMessages.setHoldSpeed.text);
      }

      const engineOut = !this.isAllEngineOn();

      switch (this.flightPhaseManager.phase) {
        case FmgcFlightPhase.Preflight: {
          if (this.v2Speed) {
            vPfd = this.v2Speed;
            this.managedSpeedTarget = this.v2Speed + 10;
          }
          break;
        }
        case FmgcFlightPhase.Takeoff: {
          if (this.v2Speed) {
            vPfd = this.v2Speed;
            this.managedSpeedTarget = engineOut
              ? Math.min(
                  this.v2Speed + 15,
                  Math.max(this.v2Speed, this.takeoffEngineOutSpeed ? this.takeoffEngineOutSpeed : 0),
                )
              : this.v2Speed + 10;
          }
          break;
        }
        case FmgcFlightPhase.Climb: {
          let speed = this.managedSpeedClimb;

          if (
            this.climbSpeedLimit !== undefined &&
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < this.climbSpeedLimitAlt
          ) {
            speed = Math.min(speed, this.climbSpeedLimit);
          }

          speed = Math.min(speed, this.getSpeedConstraint());

          [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedClimbMach);
          vPfd = this.managedSpeedTarget;
          break;
        }
        case FmgcFlightPhase.Cruise: {
          let speed = this.managedSpeedCruise;

          if (
            this.climbSpeedLimit !== undefined &&
            SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < this.climbSpeedLimitAlt
          ) {
            speed = Math.min(speed, this.climbSpeedLimit);
          }

          [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedCruiseMach);
          vPfd = this.managedSpeedTarget;
          break;
        }
        case FmgcFlightPhase.Descent: {
          // We fetch this data from VNAV
          vPfd = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots');
          this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots');

          // Whether to use Mach or not should be based on the original managed speed, not whatever VNAV uses under the hood to vary it.
          // Also, VNAV already does the conversion from Mach if necessary
          isMach = this.getManagedTargets(this.getManagedDescentSpeed(), this.getManagedDescentSpeedMach())[1];
          break;
        }
        case FmgcFlightPhase.Approach: {
          // the displayed target is Vapp (with GSmini)
          // the guidance target is lower limited by FAC manouvering speeds (O, S, F) unless in landing config
          // constraints are not considered
          const speed = this.getAppManagedSpeed();
          vPfd = this.getVAppGsMini();

          this.managedSpeedTarget = Math.max(speed, vPfd);
          break;
        }
        case FmgcFlightPhase.GoAround: {
          if (SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number') === 41 /* SRS GA */) {
            const speed = Math.min(
              this.computedVls + (engineOut ? 15 : 25),
              Math.max(SimVar.GetSimVarValue('L:A32NX_GOAROUND_INIT_SPEED', 'number'), this.getVApp()),
              SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number') - 5,
            );

            vPfd = speed;
            this.managedSpeedTarget = speed;
          } else {
            const speedConstraint = this.getSpeedConstraint();
            const speed = Math.min(this.computedVgd, speedConstraint);

            vPfd = speed;
            this.managedSpeedTarget = speed;
          }
          break;
        }
      }
    }

    // Automatically change fcu mach/speed mode
    if (this.managedSpeedTargetIsMach !== isMach) {
      if (isMach) {
        SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 1);
      } else {
        SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 1);
      }
      this.managedSpeedTargetIsMach = isMach;
    }

    // Overspeed protection
    const Vtap = Math.min(this.managedSpeedTarget, SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number'));

    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', vPfd);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', Vtap);

    if (this.isAirspeedManaged()) {
      Coherent.call('AP_SPD_VAR_SET', 0, Vtap).catch(console.error);
    }

    // Reset V1/R/2 speed after the TAKEOFF phase
    if (this.flightPhaseManager.phase > FmgcFlightPhase.Takeoff) {
      this.v1Speed = null;
      this.vRSpeed = null;
      this.v2Speed = null;
    }
  }

  private activatePreSelSpeedMach(preSel) {
    if (preSel) {
      SimVar.SetSimVarValue('K:A32NX.FMS_PRESET_SPD_ACTIVATE', 'number', 1);
    }
  }

  private updatePreSelSpeedMach(preSel) {
    // The timeout is required to create a delay for the current value to be read and the new one to be set
    setTimeout(() => {
      if (preSel) {
        if (preSel > 1) {
          SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', preSel);
          SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
        } else {
          SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);
          SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', preSel);
        }
      } else {
        SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);
        SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
      }
    }, 200);
  }

  private checkSpeedLimit() {
    let speedLimit;
    let speedLimitAlt;
    switch (this.flightPhaseManager.phase) {
      case FmgcFlightPhase.Climb:
      case FmgcFlightPhase.Cruise:
        speedLimit = this.climbSpeedLimit;
        speedLimitAlt = this.climbSpeedLimitAlt;
        break;
      case FmgcFlightPhase.Descent:
        speedLimit = this.descentSpeedLimit;
        speedLimitAlt = this.descentSpeedLimitAlt;
        break;
      default:
        // no speed limit in other phases
        this.speedLimitExceeded = false;
        return;
    }

    if (speedLimit === undefined) {
      this.speedLimitExceeded = false;
      return;
    }

    const cas = ADIRS.getCalibratedAirspeed();
    const alt = ADIRS.getBaroCorrectedAltitude();

    if (this.speedLimitExceeded) {
      const resetLimitExceeded =
        !cas.isNormalOperation() ||
        !alt.isNormalOperation() ||
        alt.value > speedLimitAlt ||
        cas.value <= speedLimit + 5;
      if (resetLimitExceeded) {
        this.speedLimitExceeded = false;
        this.removeMessageFromQueue(NXSystemMessages.spdLimExceeded.text);
      }
    } else if (cas.isNormalOperation() && alt.isNormalOperation()) {
      const setLimitExceeded = alt.value < speedLimitAlt - 150 && cas.value > speedLimit + 10;
      if (setLimitExceeded) {
        this.speedLimitExceeded = true;
        this.addMessageToQueue(NXSystemMessages.spdLimExceeded, () => !this.speedLimitExceeded);
      }
    }
  }

  private updateAutopilot() {
    const now = performance.now();
    const dt = now - this._lastUpdateAPTime;
    let apLogicOn = this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1);
    this._lastUpdateAPTime = now;
    if (isFinite(dt)) {
      this.updateAutopilotCooldown -= dt;
    }
    if (SimVar.GetSimVarValue('L:AIRLINER_FMC_FORCE_NEXT_UPDATE', 'number') === 1) {
      SimVar.SetSimVarValue('L:AIRLINER_FMC_FORCE_NEXT_UPDATE', 'number', 0);
      this.updateAutopilotCooldown = -1;
    }

    if (
      this.flightPhaseManager.phase === FmgcFlightPhase.Takeoff &&
      !this.isAllEngineOn() &&
      this.takeoffEngineOutSpeed === undefined
    ) {
      const casWord = ADIRS.getCalibratedAirspeed();
      this.takeoffEngineOutSpeed = casWord.isNormalOperation() ? casWord.value : undefined;
    }

    if (this.updateAutopilotCooldown < 0) {
      this.updatePerfSpeeds();
      this.updateConstraints();
      this.updateManagedSpeed();
      const currentApMasterStatus = SimVar.GetSimVarValue('AUTOPILOT MASTER', 'boolean');
      if (currentApMasterStatus !== this._apMasterStatus) {
        this._apMasterStatus = currentApMasterStatus;
        apLogicOn = this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1);
        this._forceNextAltitudeUpdate = true;
        console.log('Enforce AP in Altitude Lock mode. Cause : AP Master Status has changed.');
        SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
        if (this._apMasterStatus) {
          if (this.flightPlanService.hasActive && this.flightPlanService.active.legCount === 0) {
            this._onModeSelectedAltitude();
            this._onModeSelectedHeading();
          }
        }
      }
      if (apLogicOn) {
        if (!Simplane.getAutoPilotFLCActive() && !SimVar.GetSimVarValue('AUTOPILOT AIRSPEED HOLD', 'Boolean')) {
          SimVar.SetSimVarValue('K:AP_PANEL_SPEED_HOLD', 'Number', 1);
        }
        if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
          if (!SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'Boolean')) {
            SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
          }
        }
      }

      if (this.isAltitudeManaged()) {
        const plan = this.flightPlanService.active;

        const prevWaypoint = plan.hasElement(plan.activeLegIndex - 1);
        const nextWaypoint = plan.hasElement(plan.activeLegIndex + 1);

        if (prevWaypoint && nextWaypoint) {
          const activeWpIdx = plan.activeLegIndex;

          if (activeWpIdx !== this.activeWpIdx) {
            this.activeWpIdx = activeWpIdx;
            this.updateConstraints();
          }
          if (this.constraintAlt) {
            Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, this.constraintAlt, this._forceNextAltitudeUpdate).catch(
              console.error,
            );
            this._forceNextAltitudeUpdate = false;
          } else {
            const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue('feet');
            if (isFinite(altitude)) {
              Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, altitude, this._forceNextAltitudeUpdate).catch(console.error);
              this._forceNextAltitudeUpdate = false;
            }
          }
        } else {
          const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue('feet');
          if (isFinite(altitude)) {
            SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', 0);
            Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, altitude, this._forceNextAltitudeUpdate).catch(console.error);
            this._forceNextAltitudeUpdate = false;
          }
        }
      }

      if (
        Simplane.getAutoPilotAltitudeManaged() &&
        this.flightPlanService.hasActive &&
        SimVar.GetSimVarValue('L:A320_NEO_FCU_STATE', 'number') !== 1
      ) {
        const currentWaypointIndex = this.flightPlanService.active.activeLegIndex;
        if (currentWaypointIndex !== this._lastRequestedFLCModeWaypointIndex) {
          this._lastRequestedFLCModeWaypointIndex = currentWaypointIndex;
          setTimeout(() => {
            if (Simplane.getAutoPilotAltitudeManaged()) {
              this._onModeManagedAltitude();
            }
          }, 1000);
        }
      }

      if (this.flightPhaseManager.phase === FmgcFlightPhase.GoAround && apLogicOn) {
        //depending if on HDR/TRK or NAV mode, select appropriate Alt Mode (WIP)
        //this._onModeManagedAltitude();
        this._onModeSelectedAltitude();
      }
      this.updateAutopilotCooldown = this._apCooldown;
    }
  }

  /**
   * Updates performance speeds such as GD, F, S, Vls and approach speeds
   */
  public updatePerfSpeeds() {
    this.computedVgd = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
    this.computedVfs = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
    this.computedVss = SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
    this.computedVls = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');

    const plan = this.getFlightPlan(FlightPlanIndex.Active);
    const prediction = this.runFuelComputations(FlightPlanIndex.Active, FMCMainDisplay.fuelComputationsCache);

    let weight = prediction.landingWeight;
    const vnavPrediction = this.guidanceController.vnavDriver.getDestinationPrediction();
    // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
    // Fallback gross weight set to 64.3T (MZFW), which is replaced by FMGW once input in FMS to avoid function returning undefined results.
    if (this.flightPhaseManager.phase >= FmgcFlightPhase.Approach || !Number.isFinite(weight)) {
      weight = this.getGrossWeight() ?? 64.3;
    } else if (vnavPrediction && Number.isFinite(vnavPrediction.estimatedFuelOnBoard)) {
      weight =
        plan.performanceData.zeroFuelWeight + Math.max(0, (vnavPrediction.estimatedFuelOnBoard * 0.4535934) / 1000);
    }
    // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
    if (Number.isFinite(this.perfApprWindSpeed) && Number.isFinite(this.perfApprWindHeading)) {
      this.approachSpeeds = new NXSpeedsApp(weight, this.perfApprFlaps3, this._towerHeadwind);
    } else {
      this.approachSpeeds = new NXSpeedsApp(weight, this.perfApprFlaps3);
    }
    this.approachSpeeds.valid = this.flightPhaseManager.phase >= FmgcFlightPhase.Approach || Number.isFinite(weight);
  }

  public updateConstraints() {
    const activeFpIndex = this.flightPlanService.activeLegIndex;
    const constraints = this.managedProfile.get(activeFpIndex);
    const fcuSelAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet');

    let constraintAlt = 0;
    if (constraints) {
      // Altitude constraints are not sent in GA phase. While we cannot engage CLB anyways, ALT counts as a managed mode, so we don't want to show
      // a magenta altitude in ALT due to a constraint
      if (
        this.flightPhaseManager.phase < FmgcFlightPhase.Cruise &&
        isFinite(constraints.climbAltitude) &&
        constraints.climbAltitude < fcuSelAlt
      ) {
        constraintAlt = constraints.climbAltitude;
      }

      if (
        this.flightPhaseManager.phase > FmgcFlightPhase.Cruise &&
        this.flightPhaseManager.phase < FmgcFlightPhase.GoAround &&
        isFinite(constraints.descentAltitude) &&
        constraints.descentAltitude > fcuSelAlt
      ) {
        constraintAlt = constraints.descentAltitude;
      }
    }

    if (constraintAlt !== this.constraintAlt) {
      this.constraintAlt = constraintAlt;
      SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', this.constraintAlt);
    }
  }

  // TODO/VNAV: Speed constraint
  private getSpeedConstraint() {
    if (!this.navModeEngaged()) {
      return Infinity;
    }

    return this.getNavModeSpeedConstraint();
  }

  public getNavModeSpeedConstraint(): number {
    const activeLegIndex =
      this.guidanceController.activeTransIndex >= 0
        ? this.guidanceController.activeTransIndex
        : this.guidanceController.activeLegIndex;
    const constraints = this.managedProfile.get(activeLegIndex);
    if (constraints) {
      if (
        this.flightPhaseManager.phase < FmgcFlightPhase.Cruise ||
        this.flightPhaseManager.phase === FmgcFlightPhase.GoAround
      ) {
        return constraints.climbSpeed;
      }

      if (
        this.flightPhaseManager.phase > FmgcFlightPhase.Cruise &&
        this.flightPhaseManager.phase < FmgcFlightPhase.GoAround
      ) {
        // FIXME proper decel calc
        if (
          this.guidanceController.activeLegDtg <
          this.calculateDecelDist(
            Math.min(constraints.previousDescentSpeed, this.getManagedDescentSpeed()),
            constraints.descentSpeed,
          )
        ) {
          return constraints.descentSpeed;
        } else {
          return constraints.previousDescentSpeed;
        }
      }
    }

    return Infinity;
  }

  private updateManagedProfile() {
    this.managedProfile.clear();

    const plan = this.flightPlanService.active;

    const destination = plan.destinationAirport;
    const destinationElevation = destination ? destination.location.alt : 0;

    // TODO should we save a constraint already propagated to the current leg?

    // propagate descent speed constraints forward
    let currentSpeedConstraint = Infinity;
    let previousSpeedConstraint = Infinity;
    for (let index = 0; index < Math.min(plan.firstMissedApproachLegIndex, plan.legCount); index++) {
      const leg = plan.elementAt(index);

      if (leg.isDiscontinuity === true) {
        continue;
      }

      if (leg.constraintType === 2 /** DES */) {
        if (leg.speedConstraint) {
          currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(leg.speedConstraint.speed));
        }
      }

      this.managedProfile.set(index, {
        descentSpeed: currentSpeedConstraint,
        previousDescentSpeed: previousSpeedConstraint,
        climbSpeed: Infinity,
        previousClimbSpeed: Infinity,
        climbAltitude: Infinity,
        descentAltitude: -Infinity,
      });

      previousSpeedConstraint = currentSpeedConstraint;
    }

    // propagate climb speed constraints backward
    // propagate alt constraints backward
    currentSpeedConstraint = Infinity;
    previousSpeedConstraint = Infinity;
    let currentDesConstraint = -Infinity;
    let currentClbConstraint = Infinity;

    for (let index = Math.min(plan.firstMissedApproachLegIndex, plan.legCount) - 1; index >= 0; index--) {
      const leg = plan.elementAt(index);

      if (leg.isDiscontinuity === true) {
        continue;
      }

      const altConstraint = leg.altitudeConstraint;
      const speedConstraint = leg.speedConstraint;

      if (leg.constraintType === 1 /** CLB */) {
        if (speedConstraint) {
          currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(speedConstraint.speed));
        }

        if (altConstraint) {
          switch (altConstraint.altitudeDescriptor) {
            case '@': // at alt 1
            case '-': // at or below alt 1
            case 'B': // between alt 1 and alt 2
              currentClbConstraint = Math.min(currentClbConstraint, Math.round(altConstraint.altitude1));
              break;
            default:
            // not constraining
          }
        }
      } else if (leg.constraintType === 2 /** DES */) {
        if (altConstraint) {
          switch (altConstraint.altitudeDescriptor) {
            case '@': // at alt 1
            case '+': // at or above alt 1
            case 'I': // alt1 is at for FACF, Alt2 is glidelope intercept
            case 'J': // alt1 is at or above for FACF, Alt2 is glideslope intercept
            case 'V': // alt1 is procedure alt for step-down, Alt2 is at alt for vertical path angle
            case 'X': // alt 1 is at, Alt 2 is on the vertical angle
              currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude1));
              break;
            case 'B': // between alt 1 and alt 2
              currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude2));
              break;
            default:
            // not constraining
          }
        }
      }

      const profilePoint = this.managedProfile.get(index);
      profilePoint.climbSpeed = currentSpeedConstraint;
      profilePoint.previousClimbSpeed = previousSpeedConstraint;
      profilePoint.climbAltitude = currentClbConstraint;
      profilePoint.descentAltitude = Math.max(destinationElevation, currentDesConstraint);
      previousSpeedConstraint = currentSpeedConstraint;
    }
  }

  private async updateDestinationData() {
    let landingElevation;
    let latitude;
    let longitude;

    const runway = this.flightPlanService.active.destinationRunway;

    if (runway) {
      landingElevation = runway.thresholdLocation.alt;
      latitude = runway.thresholdLocation.lat;
      longitude = runway.thresholdLocation.long;
    } else {
      const airport = this.flightPlanService.active.destinationAirport;

      if (airport) {
        const ele = airport.location.alt;

        landingElevation = isFinite(ele) ? ele : undefined;
        latitude = airport.location.lat;
        longitude = airport.location.long;
      }
    }

    if (this.landingElevation !== landingElevation) {
      this.landingElevation = landingElevation;

      const ssm =
        landingElevation !== undefined
          ? Arinc429SignStatusMatrix.NormalOperation
          : Arinc429SignStatusMatrix.NoComputedData;

      this.arincLandingElevation.setBnrValue(landingElevation ? landingElevation : 0, ssm, 14, 16384, -2048);
    }

    if (this.destinationLatitude !== latitude) {
      this.destinationLatitude = latitude;

      const ssm =
        latitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

      this.arincDestinationLatitude.setBnrValue(latitude ? latitude : 0, ssm, 18, 180, -180);
    }

    if (this.destinationLongitude !== longitude) {
      this.destinationLongitude = longitude;

      const ssm =
        longitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

      this.arincDestinationLongitude.setBnrValue(longitude ? longitude : 0, ssm, 18, 180, -180);
    }
  }

  private updateMinimums() {
    const inRange = this.shouldTransmitMinimums();

    const mdaValid = inRange && this.perfApprMDA !== null;
    const dhValid = !mdaValid && inRange && typeof this.perfApprDH === 'number';

    const mdaSsm = mdaValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;
    const dhSsm = dhValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

    this.arincMDA.setBnrValue(mdaValid ? this.perfApprMDA : 0, mdaSsm, 17, 131072, 0);
    this.arincDH.setBnrValue(dhValid && typeof this.perfApprDH === 'number' ? this.perfApprDH : 0, dhSsm, 16, 8192, 0);
    this.arincEisWord2.setBitValue(29, inRange && this.perfApprDH === 'NO DH');
    // FIXME we need to handle these better
    this.arincEisWord2.setSsm(Arinc429SignStatusMatrix.NormalOperation);
  }

  private shouldTransmitMinimums() {
    const phase = this.flightPhaseManager.phase;
    const distanceToDestination = this.getDistanceToDestination();
    const isCloseToDestination = Number.isFinite(distanceToDestination) ? distanceToDestination < 250 : true;

    return phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && isCloseToDestination);
  }

  private getClbManagedSpeedFromCostIndex() {
    const dCI = ((this.costIndex ? this.costIndex : 0) / 999) ** 2;
    return 290 * (1 - dCI) + 330 * dCI;
  }

  private getCrzManagedSpeedFromCostIndex() {
    const dCI = ((this.costIndex ? this.costIndex : 0) / 999) ** 2;
    return 290 * (1 - dCI) + 310 * dCI;
  }

  private getDesManagedSpeedFromCostIndex() {
    const dCI = (this.costIndex ? this.costIndex : 0) / 999;
    return 288 * (1 - dCI) + 300 * dCI;
  }

  private getAppManagedSpeed() {
    switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
      case 0:
        return this.computedVgd;
      case 1:
        return this.computedVss;
      case 3:
        return this.perfApprFlaps3 ? this.getVApp() : this.computedVfs;
      case 4:
        return this.getVApp();
      default:
        return this.computedVfs;
    }
  }

  /* FMS EVENTS */

  public onPowerOn() {
    const gpsDriven = SimVar.GetSimVarValue('GPS DRIVES NAV1', 'Bool');
    if (!gpsDriven) {
      SimVar.SetSimVarValue('K:TOGGLE_GPS_DRIVES_NAV1', 'Bool', 0);
    }

    this._onModeSelectedHeading();
    this._onModeSelectedAltitude();

    SimVar.SetSimVarValue('K:VS_SLOT_INDEX_SET', 'number', 1);
  }

  protected onEvent(_event) {
    if (_event === 'MODE_SELECTED_HEADING') {
      if (Simplane.getAutoPilotHeadingManaged()) {
        if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number') === 0) {
          const currentHeading = Simplane.getHeadingMagnetic();

          Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);
        }
      }
      this._onModeSelectedHeading();
    }
    if (_event === 'MODE_MANAGED_HEADING') {
      if (this.flightPlanService.active.legCount === 0) {
        return;
      }

      this._onModeManagedHeading();
    }
    if (_event === 'MODE_SELECTED_ALTITUDE') {
      const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
      this.flightPhaseManager.handleFcuAltKnobPushPull(dist);
      this._onModeSelectedAltitude();
      this._onStepClimbDescent();
    }
    if (_event === 'MODE_MANAGED_ALTITUDE') {
      const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
      this.flightPhaseManager.handleFcuAltKnobPushPull(dist);
      this._onModeManagedAltitude();
      this._onStepClimbDescent();
    }
    if (_event === 'AP_DEC_ALT' || _event === 'AP_INC_ALT') {
      const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
      this.flightPhaseManager.handleFcuAltKnobTurn(dist);
      this._onTrySetCruiseFlightLevel();
    }
    if (_event === 'AP_DEC_HEADING' || _event === 'AP_INC_HEADING') {
      if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number') === 0) {
        const currentHeading = Simplane.getHeadingMagnetic();
        Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);
      }
      SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', 1);
    }
    if (_event === 'VS') {
      const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
      this.flightPhaseManager.handleFcuVSKnob(dist, this._onStepClimbDescent.bind(this));
    }
  }

  private _onModeSelectedHeading() {
    if (SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean')) {
      return;
    }
    if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
      SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
    }
    SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 1);
  }

  private _onModeManagedHeading() {
    if (SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean')) {
      return;
    }
    if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
      SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
    }
    SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 2);
    SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', 0);
  }

  private _onModeSelectedAltitude() {
    if (!Simplane.getAutoPilotGlideslopeHold()) {
      SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
    }
    SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 1);
    Coherent.call(
      'AP_ALT_VAR_SET_ENGLISH',
      1,
      Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      this._forceNextAltitudeUpdate,
    ).catch(console.error);
  }

  private _onModeManagedAltitude() {
    SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 2);
    Coherent.call(
      'AP_ALT_VAR_SET_ENGLISH',
      1,
      Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      this._forceNextAltitudeUpdate,
    ).catch(console.error);
    Coherent.call(
      'AP_ALT_VAR_SET_ENGLISH',
      2,
      Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      this._forceNextAltitudeUpdate,
    ).catch(console.error);
    if (!Simplane.getAutoPilotGlideslopeHold()) {
      requestAnimationFrame(() => {
        SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
      });
    }
  }

  private _onStepClimbDescent() {
    if (
      !(
        this.flightPhaseManager.phase === FmgcFlightPhase.Climb ||
        this.flightPhaseManager.phase === FmgcFlightPhase.Cruise
      )
    ) {
      return;
    }

    const _targetFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

    if (
      (this.flightPhaseManager.phase === FmgcFlightPhase.Climb && _targetFl > this.cruiseLevel) ||
      (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && _targetFl !== this.cruiseLevel)
    ) {
      this.deleteOutdatedCruiseSteps(this.cruiseLevel, _targetFl);
      this.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage(_targetFl * 100));

      this.cruiseLevel = _targetFl;
    }
  }

  private deleteOutdatedCruiseSteps(oldCruiseLevel, newCruiseLevel) {
    const isClimbVsDescent = newCruiseLevel > oldCruiseLevel;

    const activePlan = this.flightPlanService.active;

    for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
      const element = activePlan.elementAt(i);

      if (!element || element.isDiscontinuity === true || !element.cruiseStep) {
        continue;
      }

      const stepLevel = Math.round(element.cruiseStep.toAltitude / 100);

      if (
        (isClimbVsDescent && stepLevel >= oldCruiseLevel && stepLevel <= newCruiseLevel) ||
        (!isClimbVsDescent && stepLevel <= oldCruiseLevel && stepLevel >= newCruiseLevel)
      ) {
        element.cruiseStep = undefined; // TODO call a method on FPS so that we sync this (fms-v2)
        this.removeMessageFromQueue(NXSystemMessages.stepAhead.text);
      }
    }
  }

  /***
   * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
   * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
   * @private
   */
  private _onTrySetCruiseFlightLevel() {
    if (
      !(
        this.flightPhaseManager.phase === FmgcFlightPhase.Climb ||
        this.flightPhaseManager.phase === FmgcFlightPhase.Cruise
      )
    ) {
      return;
    }

    const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');

    if (
      (activeVerticalMode >= 11 && activeVerticalMode <= 15) ||
      (activeVerticalMode >= 21 && activeVerticalMode <= 23)
    ) {
      const fcuFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

      if (
        (this.flightPhaseManager.phase === FmgcFlightPhase.Climb && fcuFl > this.cruiseLevel) ||
        (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && fcuFl !== this.cruiseLevel)
      ) {
        if (this.cruiseFlightLevelTimeOut) {
          clearTimeout(this.cruiseFlightLevelTimeOut);
          this.cruiseFlightLevelTimeOut = undefined;
        }

        this.cruiseFlightLevelTimeOut = setTimeout(() => {
          if (
            fcuFl === Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100 &&
            ((this.flightPhaseManager.phase === FmgcFlightPhase.Climb && fcuFl > this.cruiseLevel) ||
              (this.flightPhaseManager.phase === FmgcFlightPhase.Cruise && fcuFl !== this.cruiseLevel))
          ) {
            this.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage(fcuFl * 100));
            this.cruiseLevel = fcuFl;

            if (this.page.Current === this.page.ProgressPage) {
              CDUProgressPage.ShowPage(this.mcdu);
            }
          }
        }, 3000);
      }
    }
  }

  /* END OF FMS EVENTS */
  /* FMS CHECK ROUTINE */

  private checkDestData() {
    this.addMessageToQueue(NXSystemMessages.enterDestData, () => {
      return (
        isFinite(this.perfApprQNH) &&
        isFinite(this.perfApprTemp) &&
        isFinite(this.perfApprWindHeading) &&
        isFinite(this.perfApprWindSpeed)
      );
    });
  }

  private checkGWParams() {
    const fmGW = SimVar.GetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number');
    const eng1state = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'Number');
    const eng2state = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'Number');
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const actualGrossWeight = SimVar.GetSimVarValue('TOTAL WEIGHT', 'Kilograms') / 1000; //TO-DO Source to be replaced with FAC-GW
    const gwMismatch = Math.abs(fmGW - actualGrossWeight) > 7 ? true : false;

    if (eng1state == 2 || eng2state == 2) {
      if (this._gwInitDisplayed < 1 && this.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
        this._initMessageSettable = true;
      }
    }
    //INITIALIZE WEIGHT/CG
    if (this.isAnEngineOn() && fmGW === 0 && this._initMessageSettable) {
      this.addMessageToQueue(NXSystemMessages.initializeWeightOrCg);
      this._gwInitDisplayed++;
      this._initMessageSettable = false;
    }

    //CHECK WEIGHT
    //TO-DO Ground Speed used for redundancy and to simulate delay (~10s) for FAC parameters to be calculated, remove once FAC is available.
    if (!this.isOnGround() && gwMismatch && this._checkWeightSettable && gs > 180) {
      this.addMessageToQueue(NXSystemMessages.checkWeight);
      this._checkWeightSettable = false;
    } else if (!gwMismatch) {
      this.removeMessageFromQueue(NXSystemMessages.checkWeight.text);
      this._checkWeightSettable = true;
    }
  }

  /* END OF FMS CHECK ROUTINE */
  /* MCDU GET/SET METHODS */

  public setCruiseFlightLevelAndTemperature(input: string, forPlan: FlightPlanIndex): boolean {
    if (input === Keypad.clrValue) {
      this.setCruiseLevel(null, forPlan);
      this.currFlightPlanService.setPerformanceData('cruiseTemperature', null, forPlan);
      return true;
    }
    const flString = input.split('/')[0].replace('FL', '');
    const tempString = input.split('/')[1];
    const onlyTemp = flString.length === 0;

    if (!!flString && !onlyTemp && this.trySetCruiseFl(parseFloat(flString), forPlan)) {
      if (forPlan === FlightPlanIndex.Active) {
        if (
          SimVar.GetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool') === 1 &&
          SimVar.GetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool') === 1
        ) {
          SimVar.SetSimVarValue('L:A32NX_NEW_CRZ_ALT', 'number', this.cruiseLevel);
        } else {
          SimVar.SetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool', 1);
        }
      }

      if (!tempString) {
        return true;
      }
    }

    if (tempString) {
      let temp = parseInt(tempString);

      if (isFinite(temp) && this.getFlightPlan(forPlan).performanceData.cruiseFlightLevel) {
        if (!tempString.startsWith('+') && !tempString.startsWith('-')) {
          temp = -temp;
        }
        if (temp > -270 && temp < 100) {
          this.currFlightPlanService.setPerformanceData('cruiseTemperature', temp, forPlan);
          return true;
        } else {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
      } else {
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
      }
    }

    this.setScratchpadMessage(NXSystemMessages.formatError);
    return false;
  }

  public tryUpdateCostIndex(costIndex: string, forPlan: FlightPlanIndex): boolean {
    const value = parseInt(costIndex);
    if (isFinite(value)) {
      if (value >= 0) {
        if (value < 1000) {
          this.flightPlanService.setPerformanceData('costIndex', value, forPlan);
          this.updateManagedSpeeds();
          return true;
        } else {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  /**
   * Any tropopause altitude up to 60,000 ft is able to be entered
   * @param {string} tropo Format: NNNN or NNNNN Leading 0’s must be included. Entry is rounded to the nearest 10 ft
   * @param {number} forPlan the flight plan index to set tropopause for
   * @return {boolean} Whether tropopause could be set or not
   */
  public tryUpdateTropo(tropo: string, forPlan: number): boolean {
    const plan = this.getFlightPlan(forPlan);

    if (tropo === Keypad.clrValue) {
      if (plan.performanceData.tropopause) {
        this.currFlightPlanService.setPerformanceData('tropopause', null, forPlan);
        return true;
      }
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    if (!tropo.match(/^(?=(\D*\d){4,5}\D*$)/g)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const value = parseInt(tropo);

    if (isFinite(value) && value >= 0 && value <= 60000) {
      this.currFlightPlanService.setPerformanceData('tropopause', Math.round(value / 10) * 10, forPlan);
      return true;
    }

    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
    return false;
  }

  private resetCoroute() {
    this.coRoute.routeNumber = undefined;
    this.coRoute.routes = [];
  }

  /** MCDU Init page method for FROM/TO, NOT for programmatic use */
  public tryUpdateFromTo(fromTo: string, forPlan: number, callback = EmptyCallback.Boolean) {
    if (fromTo === Keypad.clrValue) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return callback(false);
    }

    const match = fromTo.match(/^([A-Z]{4})\/([A-Z]{4})$/);

    if (match === null) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return callback(false);
    }

    const [, from, to] = match;

    // TODO differentiate for sec
    this.resetCoroute();

    this.setFromTo(from, to, forPlan)
      .then(() => {
        // TODO differentiate for sec
        this.getCoRouteList()
          .then(() => callback(true))
          .catch(console.log);
      })
      .catch((e) => {
        if (e instanceof McduMessage) {
          this.setScratchpadMessage(e);
        } else {
          console.warn(e);
        }
        callback(false);
      });
  }

  /**
   * Programmatic method to set from/to
   * @param {string} from 4-letter icao code for origin airport
   * @param {string} to 4-letter icao code for destination airport
   * @param {number} forPlan the flight plan index to set from/to for
   * @throws NXSystemMessage on error (you are responsible for pushing to the scratchpad if appropriate)
   */
  private async setFromTo(from: string, to: string, forPlan: number) {
    let airportFrom, airportTo;
    try {
      airportFrom = await this.navigationDatabaseService.activeDatabase.searchAirport(from);
      airportTo = await this.navigationDatabaseService.activeDatabase.searchAirport(to);

      if (!airportFrom || !airportTo) {
        throw NXSystemMessages.notInDatabase;
      }
    } catch (e) {
      console.log(e);
      throw NXSystemMessages.notInDatabase;
    }

    this.atsu.resetAtisAutoUpdate();

    return this.flightPlanService.newCityPair(from, to, undefined, forPlan).then(() => {
      this.setGroundTempFromOrigin(forPlan);
    });
  }

  // only used by trySetRouteAlternateFuel
  private isAltFuelInRange(fuel: number) {
    return 0 < fuel && fuel <= 80;
  }

  public async trySetRouteAlternateFuel(altFuel: string, forPlan: FlightPlanIndex): Promise<boolean> {
    const plan = this.getFlightPlan(forPlan);

    if (altFuel === Keypad.clrValue) {
      return true;
    }

    if (!plan?.alternateDestinationAirport) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    const value = NXUnits.userToKg(parseFloat(altFuel));
    if (Number.isFinite(value)) {
      if (this.isAltFuelInRange(value)) {
        this.flightPlanService.setPerformanceData('pilotAlternateFuel', value, forPlan);

        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    }
    this.setScratchpadMessage(NXSystemMessages.formatError);
    return false;
  }

  public async trySetMinDestFob(fuel: string, forPlan: FlightPlanIndex): Promise<boolean> {
    if (fuel === Keypad.clrValue) {
      this.flightPlanService.setPerformanceData('pilotMinimumDestinationFuelOnBoard', null, forPlan);
      return true;
    }
    if (!this.representsDecimalNumber(fuel)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const predictions = this.runFuelComputations(forPlan, FMCMainDisplay.fuelComputationsCache);

    const value = NXUnits.userToKg(parseFloat(fuel));
    if (Number.isFinite(value)) {
      if (this.isMinDestFobInRange(value)) {
        if (value < predictions.finalHoldingFuel + predictions.alternateFuel) {
          this.addMessageToQueue(NXSystemMessages.checkMinDestFob);
        }
        this.flightPlanService.setPerformanceData('pilotMinimumDestinationFuelOnBoard', value, forPlan);
        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    }
    this.setScratchpadMessage(NXSystemMessages.formatError);
    return false;
  }

  public async tryUpdateAltDestination(altDestIdent: string, forPlan: FlightPlanIndex): Promise<boolean> {
    if (!altDestIdent || altDestIdent === 'NONE' || altDestIdent === Keypad.clrValue) {
      this.atsu.resetAtisAutoUpdate();
      this.flightPlanService.setAlternate(undefined, forPlan);

      return true;
    }

    const airportAltDest = await this.navigationDatabaseService.activeDatabase.searchAirport(altDestIdent);
    if (airportAltDest) {
      this.atsu.resetAtisAutoUpdate();
      await this.flightPlanService.setAlternate(altDestIdent, forPlan);

      return true;
    }

    this.setScratchpadMessage(NXSystemMessages.notInDatabase);
    return false;
  }

  public get takeOffWeight(): number | null {
    return this.computeTakeoffWeight(FlightPlanIndex.Active);
  }

  public computeTakeoffWeight(forPlan: FlightPlanIndex): number | null {
    const plan = this.getFlightPlan(forPlan);

    if (
      plan.performanceData.zeroFuelWeight === null ||
      plan.performanceData.blockFuel === null ||
      plan.performanceData.taxiFuel === null
    ) {
      return null;
    }

    return plan.performanceData.zeroFuelWeight + plan.performanceData.blockFuel - plan.performanceData.taxiFuel;
  }

  //-----------------------------------------------------------------------------------
  // TODO:FPM REWRITE: Start of functions to refactor
  //-----------------------------------------------------------------------------------

  // FIXME remove A32NX_FM_LS_COURSE
  private async updateIlsCourse() {
    let course = -1;
    const mmr = this.navigation.getNavaidTuner().getMmrRadioTuningStatus(1);
    if (mmr.course !== null) {
      course = mmr.course;
    } else if (mmr.frequency !== null && SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number') === 1) {
      course = SimVar.GetSimVarValue('NAV LOCALIZER:3', 'degrees');
    }

    return SimVar.SetSimVarValue('L:A32NX_FM_LS_COURSE', 'number', course);
  }

  public async updateFlightNo(
    flightNo: string,
    forPlan: FlightPlanIndex,
    callback = EmptyCallback.Boolean,
  ): Promise<void> {
    if (flightNo.length > 7) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return callback(false);
    }

    await this.flightPlanService.setFlightNumber(flightNo, forPlan);

    if (forPlan === FlightPlanIndex.Active) {
      await SimVar.SetSimVarValue('ATC FLIGHT NUMBER', 'string', flightNo, 'FMC');

      // FIXME move ATSU code to ATSU
      const code = await this.atsu.connectToNetworks(flightNo);
      if (code !== AtsuStatusCodes.Ok) {
        this.addNewAtsuMessage(code);
      }
    }

    return callback(true);
  }

  public async updateCoRoute(coRouteNum, callback = EmptyCallback.Boolean) {
    try {
      if (coRouteNum.length > 2 && coRouteNum !== Keypad.clrValue) {
        if (coRouteNum.length < 10) {
          if (coRouteNum === 'NONE') {
            this.resetCoroute();
          } else {
            const { success, data } = await CompanyRoute.getCoRoute(coRouteNum);
            if (success) {
              this.coRoute['originIcao'] = data.origin.icao_code;
              this.coRoute['destinationIcao'] = data.destination.icao_code;
              this.coRoute['route'] = data.general.route;
              if (data.alternate) {
                this.coRoute['alternateIcao'] = data.alternate.icao_code;
              }
              this.coRoute['navlog'] = data.navlog.fix;

              // FIXME this whole thing is a mess. Create proper functions to create a CoRoute from whatever CompanyRoute.getCoRoute returns
              // and untangle uplinks from route loading (to cater for database routes).
              // TODO sec?
              await CoRouteUplinkAdapter.uplinkFlightPlanFromCoRoute(
                this,
                FlightPlanIndex.Active,
                this.flightPlanService,
                this.coRoute as any,
              );
              await this.flightPlanService.uplinkInsert();
              this.setGroundTempFromOrigin(FlightPlanIndex.Active);

              this.coRoute['routeNumber'] = coRouteNum;
            } else {
              this.setScratchpadMessage(NXSystemMessages.notInDatabase);
            }
          }
          return callback(true);
        }
      }
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return callback(false);
    } catch (error) {
      console.error(`Error retrieving coroute from SimBridge ${error}`);
      this.setScratchpadMessage(NXFictionalMessages.unknownDownlinkErr);
      return callback(false);
    }
  }

  // FIXME bad name for something with no return value!
  public async getCoRouteList(): Promise<void> {
    try {
      const origin = this.flightPlanService.active.originAirport.ident;
      const dest = this.flightPlanService.active.destinationAirport.ident;
      const { success, data } = await CompanyRoute.getRouteList(origin, dest);

      if (success) {
        data.forEach((route) => {
          this.coRoute.routes.push({
            originIcao: route.origin.icao_code,
            destinationIcao: route.destination.icao_code,
            alternateIcao: route.alternate ? route.alternate.icao_code : undefined,
            route: route.general.route,
            navlog: route.navlog.fix,
            routeName: route.name,
          });
        });
      } else {
        this.setScratchpadMessage(NXSystemMessages.notInDatabase);
      }
    } catch (error) {
      console.info(`Error retrieving coroute list ${error}`);
    }
  }

  public onUplinkInProgress() {
    this.setScratchpadMessage(NXSystemMessages.uplinkInsertInProg);
  }

  public onUplinkDone(forPlan: FlightPlanIndex) {
    this.removeMessageFromQueue(NXSystemMessages.uplinkInsertInProg.text);
    this.addMessageToQueue(
      forPlan === FlightPlanIndex.Active ? NXSystemMessages.aocActFplnUplink : NXSystemMessages.aocSecFplnUplink,
    );
  }

  public deduplicateFacilities<T extends DatabaseItem<any>>(items: T[]): Promise<T | undefined> {
    if (items.length === 0) {
      return undefined;
    }
    if (items.length === 1) {
      return Promise.resolve(items[0]);
    }

    return new Promise((resolve) => {
      A320_Neo_CDU_SelectWptPage.ShowPage(this.mcdu, items, resolve);
    });
  }

  /**
   * Shows a scratchpad message based on the FMS error thrown
   * @param type
   */
  public showFmsErrorMessage(type: FmsErrorType) {
    switch (type) {
      case FmsErrorType.NotInDatabase:
        this.setScratchpadMessage(NXSystemMessages.notInDatabase);
        break;
      case FmsErrorType.NotYetImplemented:
        this.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        break;
      case FmsErrorType.FormatError:
        this.setScratchpadMessage(NXSystemMessages.formatError);
        break;
      case FmsErrorType.EntryOutOfRange:
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        break;
      case FmsErrorType.ListOf99InUse:
        this.setScratchpadMessage(NXSystemMessages.listOf99InUse);
        break;
      case FmsErrorType.AwyWptMismatch:
        this.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
        break;
    }
  }

  public createNewWaypoint(ident: string): Promise<Waypoint | undefined> {
    return new Promise<Waypoint>((resolve, reject) => {
      CDUNewWaypoint.ShowPage(
        this.mcdu,
        (waypoint) => {
          if (waypoint) {
            resolve(waypoint.waypoint);
          } else {
            reject();
          }
        },
        { ident },
      );
    });
  }

  public createLatLonWaypoint(coordinates, stored, ident = undefined) {
    return this.dataManager.createLatLonWaypoint(coordinates, stored, ident);
  }

  public createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident = undefined) {
    return this.dataManager.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident);
  }

  public createPlaceBearingDistWaypoint(place, bearing, distance, stored, ident = undefined) {
    return this.dataManager.createPlaceBearingDistWaypoint(place, bearing, distance, stored, ident);
  }

  public getStoredWaypointsByIdent(ident) {
    return this.dataManager.getStoredWaypointsByIdent(ident);
  }

  //-----------------------------------------------------------------------------------
  // TODO:FPM REWRITE: Start of functions to refactor
  //-----------------------------------------------------------------------------------

  private _getOrSelectWaypoints(
    getter: (ident: string) => Promise<(Fix | IlsNavaid)[]>,
    ident: string,
    callback: (fix: Fix | IlsNavaid) => void,
  ) {
    getter(ident).then((waypoints) => {
      if (waypoints.length === 0) {
        return callback(undefined);
      }
      if (waypoints.length === 1) {
        return callback(waypoints[0]);
      }
      A320_Neo_CDU_SelectWptPage.ShowPage(this.mcdu, waypoints, callback);
    });
  }

  public getOrSelectILSsByIdent(ident: string, callback: (navaid: IlsNavaid) => void): void {
    this._getOrSelectWaypoints(this.navigationDatabase.searchIls.bind(this.navigationDatabase), ident, callback);
  }

  public getOrSelectVORsByIdent(ident: string, callback: (navaid: VhfNavaid) => void): void {
    this._getOrSelectWaypoints(this.navigationDatabase.searchVor.bind(this.navigationDatabase), ident, callback);
  }

  public getOrSelectNDBsByIdent(ident: string, callback: (navaid: NdbNavaid) => void): void {
    this._getOrSelectWaypoints(this.navigationDatabase.searchNdb.bind(this.navigationDatabase), ident, callback);
  }

  public getOrSelectNavaidsByIdent(
    ident: string,
    callback: (navaid: EnrouteNdbNavaid | TerminalNdbNavaid | VhfNavaid) => void,
  ): void {
    this._getOrSelectWaypoints(this.navigationDatabase.searchAllNavaid.bind(this.navigationDatabase), ident, callback);
  }

  /**
   * This function only finds waypoints, not navaids. Some fixes may exist as a VOR and a waypoint in the database, this will only return the waypoint.
   * Use @see WaypointEntryUtils.getOrCreateWaypoint instead if you don't want that
   */
  public getOrSelectWaypointByIdent(ident: string, callback: (fix: Fix) => void): void {
    this._getOrSelectWaypoints(this.navigationDatabase.searchWaypoint.bind(this.navigationDatabase), ident, callback);
  }

  public insertWaypoint(
    newWaypointTo,
    fpIndex,
    forAlternate,
    index,
    before = false,
    callback = EmptyCallback.Boolean,
    bypassTmpy = false,
  ) {
    if (newWaypointTo === '' || newWaypointTo === Keypad.clrValue) {
      return callback(false);
    }
    try {
      WaypointEntryUtils.getOrCreateWaypoint(this, newWaypointTo, true)
        .then(
          /**
           * @param {Waypoint} waypoint
           */
          (waypoint) => {
            if (!waypoint) {
              return callback(false);
            }
            if (bypassTmpy) {
              if (fpIndex === FlightPlanIndex.Active && this.flightPlanService.hasTemporary) {
                this.setScratchpadMessage(NXSystemMessages.notAllowed);
                return callback(false);
              }

              if (before) {
                this.flightPlanService
                  .insertWaypointBefore(index, waypoint, fpIndex, forAlternate)
                  .then(() => callback(true));
              } else {
                this.flightPlanService.nextWaypoint(index, waypoint, fpIndex, forAlternate).then(() => callback(true));
              }
            } else {
              if (before) {
                this.flightPlanService
                  .insertWaypointBefore(index, waypoint, fpIndex, forAlternate)
                  .then(() => callback(true));
              } else {
                this.flightPlanService.nextWaypoint(index, waypoint, fpIndex, forAlternate).then(() => callback(true));
              }
            }
          },
        )
        .catch((err) => {
          if (err.type !== undefined) {
            this.showFmsErrorMessage(err.type);
          } else if (err instanceof McduMessage) {
            this.setScratchpadMessage(err);
          } else if (err) {
            console.error(err);
          }
          return callback(false);
        });
    } catch (err) {
      if (err.type !== undefined) {
        this.showFmsErrorMessage(err.type);
      } else if (err instanceof McduMessage) {
        this.setScratchpadMessage(err);
      } else {
        console.error(err);
      }
      return callback(false);
    }
  }

  public toggleWaypointOverfly(index, fpIndex, forAlternate, callback = EmptyCallback.Void) {
    if (this.flightPlanService.hasTemporary) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return callback();
    }

    this.flightPlanService.toggleOverfly(index, fpIndex, forAlternate);
    callback();
  }

  public eraseTemporaryFlightPlan(callback = EmptyCallback.Void) {
    if (this.flightPlanService.hasTemporary) {
      this.flightPlanService.temporaryDelete();

      SimVar.SetSimVarValue('L:FMC_FLIGHT_PLAN_IS_TEMPORARY', 'number', 0);
      SimVar.SetSimVarValue('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'number', 0);
      callback();
    } else {
      callback();
    }
  }

  public insertTemporaryFlightPlan(callback = EmptyCallback.Void) {
    if (this.flightPlanService.hasTemporary) {
      const oldCostIndex = this.costIndex;
      const oldDestination = this.currFlightPlanService.active.destinationAirport
        ? this.currFlightPlanService.active.destinationAirport.ident
        : undefined;
      const oldCruiseLevel = this.cruiseLevel;
      this.flightPlanService.temporaryInsert();
      this.checkCostIndex(oldCostIndex);
      // FIXME I don't know if it is actually possible to insert TMPY with no FROM/TO, but we should not crash here, so check this for now
      if (oldDestination !== undefined) {
        this.checkDestination(oldDestination);
      }
      this.checkCruiseLevel(oldCruiseLevel);

      SimVar.SetSimVarValue('L:FMC_FLIGHT_PLAN_IS_TEMPORARY', 'number', 0);
      SimVar.SetSimVarValue('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'number', 0);

      this.guidanceController.vnavDriver.invalidateFlightPlanProfile();
      callback();
    }
  }

  private checkCostIndex(oldCostIndex) {
    if (this.costIndex !== oldCostIndex) {
      this.setScratchpadMessage(NXSystemMessages.usingCostIndex.getModifiedMessage(this.costIndex.toFixed(0)));
    }
  }

  private checkDestination(oldDestination) {
    const newDestination = this.currFlightPlanService.active.destinationAirport.ident;

    // Enabling alternate or new DEST should sequence out of the GO AROUND phase
    if (newDestination !== oldDestination) {
      this.flightPhaseManager.handleNewDestinationAirportEntered();
    }
  }

  private checkCruiseLevel(oldCruiseLevel) {
    const newLevel = this.cruiseLevel;
    // Keep simvar in sync for the flight phase manager
    if (newLevel !== oldCruiseLevel) {
      SimVar.SetSimVarValue(
        'L:A32NX_AIRLINER_CRUISE_ALTITUDE',
        'number',
        Number.isFinite(newLevel * 100) ? newLevel * 100 : 0,
      );
    }
  }

  //-----------------------------------------------------------------------------------
  // TODO:FPM REWRITE: End of functions to refactor
  //-----------------------------------------------------------------------------------

  private vSpeedsValid() {
    return (
      (!!this.v1Speed && !!this.vRSpeed ? this.v1Speed <= this.vRSpeed : true) &&
      (!!this.vRSpeed && !!this.v2Speed ? this.vRSpeed <= this.v2Speed : true) &&
      (!!this.v1Speed && !!this.v2Speed ? this.v1Speed <= this.v2Speed : true)
    );
  }

  /**
   * Gets the departure runway elevation in feet, if available.
   * @returns departure runway elevation in feet, or null if not available.
   */
  public getDepartureElevation() {
    const activePlan = this.flightPlanService.active;

    let departureElevation = null;
    if (activePlan.originRunway) {
      departureElevation = activePlan.originRunway.thresholdLocation.alt;
    } else if (activePlan.originAirport) {
      departureElevation = activePlan.originAirport.location.alt;
    }

    return departureElevation;
  }

  /**
   * Gets the gross weight, if available.
   * Prior to engine start this is based on ZFW + Fuel entries,
   * after engine start ZFW entry + FQI FoB.
   * @returns {number | null} gross weight in tons or null if not available.
   */
  public getGrossWeight() {
    const fob = this.getFOB();

    if (this.zeroFuelWeight === null || fob === undefined) {
      return null;
    }

    return this.zeroFuelWeight + fob;
  }

  private getToSpeedsTooLow() {
    const grossWeight = this.getGrossWeight();

    if (this.flaps === null || grossWeight === null) {
      return false;
    }

    const departureElevation = this.getDepartureElevation();

    const zp =
      departureElevation !== null
        ? this.getPressureAltAtElevation(departureElevation, this.getBaroCorrection1())
        : this.getPressureAlt();
    if (zp === null) {
      return false;
    }

    const taxiFuel = this.getFlightPlan(FlightPlanIndex.Active)?.performanceData?.taxiFuel ?? undefined;
    const tow = grossWeight - (this.isAnEngineOn() || taxiFuel === undefined ? 0 : taxiFuel);

    return (
      (this.v1Speed == null ? Infinity : this.v1Speed) < Math.trunc(NXSpeedsUtils.getVmcg(zp)) ||
      (this.vRSpeed == null ? Infinity : this.vRSpeed) < Math.trunc(1.05 * NXSpeedsUtils.getVmca(zp)) ||
      (this.v2Speed == null ? Infinity : this.v2Speed) < Math.trunc(1.1 * NXSpeedsUtils.getVmca(zp)) ||
      (isFinite(tow) &&
        (this.v2Speed == null ? Infinity : this.v2Speed) <
          Math.trunc(1.13 * NXSpeedsUtils.getVs1g(tow, this.flaps, true)))
    );
  }

  private toSpeedsChecks() {
    const toSpeedsNotInserted = !this.v1Speed || !this.vRSpeed || !this.v2Speed;
    if (toSpeedsNotInserted !== this.toSpeedsNotInserted) {
      this.toSpeedsNotInserted = toSpeedsNotInserted;
    }

    const toSpeedsTooLow = this.getToSpeedsTooLow();
    if (toSpeedsTooLow !== this.toSpeedsTooLow) {
      this.toSpeedsTooLow = toSpeedsTooLow;
      if (toSpeedsTooLow) {
        this.addMessageToQueue(NXSystemMessages.toSpeedTooLow, () => !this.getToSpeedsTooLow());
      }
    }

    const vSpeedDisagree = !this.vSpeedsValid();
    if (vSpeedDisagree !== this.vSpeedDisagree) {
      this.vSpeedDisagree = vSpeedDisagree;
      if (vSpeedDisagree) {
        this.addMessageToQueue(NXSystemMessages.vToDisagree, this.vSpeedsValid.bind(this));
      }
    }

    this.arincDiscreteWord3.setBitValue(16, vSpeedDisagree);
    this.arincDiscreteWord3.setBitValue(17, toSpeedsTooLow);
    this.arincDiscreteWord3.setBitValue(18, toSpeedsNotInserted);
    this.arincDiscreteWord3.setSsm(Arinc429SignStatusMatrix.NormalOperation);
  }

  public get v1Speed() {
    return this.flightPlanService.active.performanceData.v1;
  }

  public set v1Speed(speed) {
    this.flightPlanService.setPerformanceData('v1', speed);
    SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'knots', speed ? speed : NaN);
  }

  public get vRSpeed() {
    return this.flightPlanService.active.performanceData.vr;
  }

  public set vRSpeed(speed) {
    this.flightPlanService.setPerformanceData('vr', speed);
    SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'knots', speed ? speed : NaN);
  }

  public get v2Speed() {
    return this.flightPlanService.active.performanceData.v2;
  }

  public set v2Speed(speed) {
    this.flightPlanService.setPerformanceData('v2', speed);
    SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'knots', speed ? speed : NaN);
  }

  public trySetV1Speed(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }
    const v = parseInt(s);
    if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    if (v < 90 || v > 350) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.unconfirmedV1Speed = undefined;
    this.v1Speed = v;
    return true;
  }

  public trySetVRSpeed(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }
    const v = parseInt(s);
    if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    if (v < 90 || v > 350) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.unconfirmedVRSpeed = undefined;
    this.vRSpeed = v;
    return true;
  }

  public trySetV2Speed(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }
    const v = parseInt(s);
    if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    if (v < 90 || v > 350) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.unconfirmedV2Speed = undefined;
    this.v2Speed = v;
    return true;
  }

  public trySetTakeOffTransAltitude(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.flightPlanService.setPerformanceData('pilotTransitionAltitude', null);
      this.updateTransitionAltitudeLevel();
      return true;
    }

    let value = parseInt(s);
    if (!isFinite(value) || !/^\d{4,5}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    value = Math.round(value / 10) * 10;
    if (value < 1000 || value > 45000) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.flightPlanService.setPerformanceData('pilotTransitionAltitude', value);
    this.updateTransitionAltitudeLevel();
    return true;
  }

  public async trySetThrustReductionAccelerationAltitude(s: string): Promise<boolean> {
    const plan = this.flightPlanService.active;

    if (this.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff || !plan.originAirport) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    if (s === Keypad.clrValue) {
      const hasDefaultThrRed = plan.performanceData.defaultThrustReductionAltitude !== null;
      const hasDefaultAcc = plan.performanceData.defaultAccelerationAltitude !== null;

      if (hasDefaultThrRed && hasDefaultAcc) {
        plan.setPerformanceData('pilotThrustReductionAltitude', null);
        plan.setPerformanceData('pilotAccelerationAltitude', null);
        return true;
      }

      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    const match = s.match(/^(([0-9]{4,5})\/?)?(\/([0-9]{4,5}))?$/);
    if (match === null || (match[2] === undefined && match[4] === undefined) || s.split('/').length > 2) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const thrRed = match[2] !== undefined ? MathUtils.round(parseInt(match[2]), 10) : null;
    const accAlt = match[4] !== undefined ? MathUtils.round(parseInt(match[4]), 10) : null;

    const origin = this.flightPlanService.active.originAirport;

    let elevation = 0;
    if (origin) {
      elevation = origin.location.alt;
    }

    const minimumAltitude = elevation + 400;

    const newThrRed = thrRed !== null ? thrRed : plan.performanceData.thrustReductionAltitude;
    const newAccAlt = accAlt !== null ? accAlt : plan.performanceData.accelerationAltitude;

    if (
      (thrRed !== null && (thrRed < minimumAltitude || thrRed > 45000)) ||
      (accAlt !== null && (accAlt < minimumAltitude || accAlt > 45000)) ||
      (newThrRed !== null && newAccAlt !== null && thrRed > accAlt)
    ) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    if (thrRed !== null) {
      plan.setPerformanceData('pilotThrustReductionAltitude', thrRed);
    }

    if (accAlt !== null) {
      plan.setPerformanceData('pilotAccelerationAltitude', accAlt);
    }

    return true;
  }

  public async trySetEngineOutAcceleration(s: string): Promise<boolean> {
    const plan = this.flightPlanService.active;

    if (this.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff || !plan.originAirport) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    if (s === Keypad.clrValue) {
      const hasDefaultEngineOutAcc = plan.performanceData.defaultEngineOutAccelerationAltitude !== null;

      if (hasDefaultEngineOutAcc) {
        plan.setPerformanceData('pilotEngineOutAccelerationAltitude', null);
        return true;
      }

      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    const match = s.match(/^([0-9]{4,5})$/);
    if (match === null) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const accAlt = parseInt(match[1]);

    const origin = plan.originAirport;
    const elevation = origin.location.alt !== undefined ? origin.location.alt : 0;
    const minimumAltitude = elevation + 400;

    if (accAlt < minimumAltitude || accAlt > 45000) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    plan.setPerformanceData('pilotEngineOutAccelerationAltitude', accAlt);

    return true;
  }

  public async trySetThrustReductionAccelerationAltitudeGoaround(s: string): Promise<boolean> {
    const plan = this.flightPlanService.active;

    if (this.flightPhaseManager.phase >= FmgcFlightPhase.GoAround || !plan.destinationAirport) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    if (s === Keypad.clrValue) {
      const hasDefaultMissedThrRed = plan.performanceData.defaultMissedThrustReductionAltitude !== null;
      const hasDefaultMissedAcc = plan.performanceData.defaultMissedAccelerationAltitude !== null;

      if (hasDefaultMissedThrRed && hasDefaultMissedAcc) {
        plan.setPerformanceData('pilotMissedThrustReductionAltitude', null);
        plan.setPerformanceData('pilotMissedAccelerationAltitude', null);
        return true;
      }

      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    const match = s.match(/^(([0-9]{4,5})\/?)?(\/([0-9]{4,5}))?$/);
    if (match === null || (match[2] === undefined && match[4] === undefined) || s.split('/').length > 2) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const thrRed = match[2] !== undefined ? MathUtils.round(parseInt(match[2]), 10) : null;
    const accAlt = match[4] !== undefined ? MathUtils.round(parseInt(match[4]), 10) : null;

    const destination = plan.destinationAirport;
    const elevation = destination.location.alt !== undefined ? destination.location.alt : 0;
    const minimumAltitude = elevation + 400;

    const newThrRed = thrRed !== null ? thrRed : plan.performanceData.missedThrustReductionAltitude;
    const newAccAlt = accAlt !== null ? accAlt : plan.performanceData.missedAccelerationAltitude;

    if (
      (thrRed !== null && (thrRed < minimumAltitude || thrRed > 45000)) ||
      (accAlt !== null && (accAlt < minimumAltitude || accAlt > 45000)) ||
      (newThrRed !== null && newAccAlt !== null && thrRed > accAlt)
    ) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    if (thrRed !== null) {
      plan.setPerformanceData('pilotMissedThrustReductionAltitude', thrRed);
    }

    if (accAlt !== null) {
      plan.setPerformanceData('pilotMissedAccelerationAltitude', accAlt);
    }

    return true;
  }

  public async trySetEngineOutAccelerationAltitudeGoaround(s: string): Promise<boolean> {
    const plan = this.flightPlanService.active;

    if (this.flightPhaseManager.phase >= FmgcFlightPhase.GoAround || !plan.destinationAirport) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    if (s === Keypad.clrValue) {
      const hasDefaultMissedEOAcc = plan.performanceData.defaultMissedEngineOutAccelerationAltitude !== null;

      if (hasDefaultMissedEOAcc) {
        plan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', null);
        return true;
      }

      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }

    const match = s.match(/^([0-9]{4,5})$/);
    if (match === null) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const accAlt = parseInt(match[1]);

    const destination = plan.destinationAirport;
    const elevation = destination.location.alt !== undefined ? destination.location.alt : 0;
    const minimumAltitude = elevation + 400;

    if (accAlt < minimumAltitude || accAlt > 45000) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    plan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', accAlt);

    return true;
  }

  public thrustReductionAccelerationChecks() {
    const activePlan = this.flightPlanService.active;

    if (activePlan.reconcileAccelerationWithConstraints()) {
      this.addMessageToQueue(
        NXSystemMessages.newAccAlt.getModifiedMessage(activePlan.performanceData.accelerationAltitude.toFixed(0)),
      );
    }

    if (activePlan.reconcileThrustReductionWithConstraints()) {
      this.addMessageToQueue(
        NXSystemMessages.newThrRedAlt.getModifiedMessage(activePlan.performanceData.thrustReductionAltitude.toFixed(0)),
      );
    }
  }

  private updateThrustReductionAcceleration() {
    const activePerformanceData = this.flightPlanService.active.performanceData;

    this.arincThrustReductionAltitude.setBnrValue(
      activePerformanceData.thrustReductionAltitude !== null ? activePerformanceData.thrustReductionAltitude : 0,
      activePerformanceData.thrustReductionAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincAccelerationAltitude.setBnrValue(
      activePerformanceData.accelerationAltitude !== null ? activePerformanceData.accelerationAltitude : 0,
      activePerformanceData.accelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincEoAccelerationAltitude.setBnrValue(
      activePerformanceData.engineOutAccelerationAltitude !== null
        ? activePerformanceData.engineOutAccelerationAltitude
        : 0,
      activePerformanceData.engineOutAccelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    this.arincMissedThrustReductionAltitude.setBnrValue(
      activePerformanceData.missedThrustReductionAltitude !== null
        ? activePerformanceData.missedThrustReductionAltitude
        : 0,
      activePerformanceData.missedThrustReductionAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincMissedAccelerationAltitude.setBnrValue(
      activePerformanceData.missedAccelerationAltitude !== null ? activePerformanceData.missedAccelerationAltitude : 0,
      activePerformanceData.missedAccelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincMissedEoAccelerationAltitude.setBnrValue(
      activePerformanceData.missedEngineOutAccelerationAltitude !== null
        ? activePerformanceData.missedEngineOutAccelerationAltitude
        : 0,
      activePerformanceData.missedEngineOutAccelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
  }

  private updateTransitionAltitudeLevel() {
    const originTransitionAltitude = this.getOriginTransitionAltitude();
    this.arincTransitionAltitude.setBnrValue(
      originTransitionAltitude !== null ? originTransitionAltitude : 0,
      originTransitionAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    const destinationTansitionLevel = this.getDestinationTransitionLevel();
    this.arincTransitionLevel.setBnrValue(
      destinationTansitionLevel !== null ? destinationTansitionLevel : 0,
      destinationTansitionLevel !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      9,
      512,
      0,
    );
  }

  public setPerfTOFlexTemp(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.perfTOTemp = NaN;
      // In future we probably want a better way of checking this, as 0 is
      // in the valid flex temperature range (-99 to 99).
      SimVar.SetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'Number', 0);
      return true;
    }
    let value = parseInt(s);
    if (!isFinite(value) || !/^[+-]?\d{1,2}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    if (value < -99 || value > 99) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    // As the sim uses 0 as a sentinel value to detect that no flex
    // temperature is set, we'll just use 0.1 as the actual value for flex 0
    // and make sure we never display it with decimals.
    if (value === 0) {
      value = 0.1;
    }
    this.perfTOTemp = value;
    SimVar.SetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'Number', value);
    return true;
  }

  /**
   * Attempts to predict required block fuel for trip
   */
  //TODO: maybe make this part of an update routine?
  public tryFuelPlanning(): boolean {
    if (this._fuelPlanningPhase === FuelPlanningPhases.IN_PROGRESS) {
      this._fuelPlanningPhase = FuelPlanningPhases.COMPLETED;
      return true;
    }

    const plan = this.getFlightPlan(FlightPlanIndex.Active);
    const predictions = this.runFuelComputations(FlightPlanIndex.Active, FMCMainDisplay.fuelComputationsCache);

    this.blockFuel =
      predictions.tripFuel +
      predictions.minimumDestinationFuel +
      plan.performanceData.taxiFuel +
      predictions.routeReserveFuel;

    this._fuelPlanningPhase = FuelPlanningPhases.IN_PROGRESS;
    return true;
  }

  public trySetTaxiFuelWeight(s: string, forPlan: FlightPlanIndex): boolean {
    if (s === Keypad.clrValue) {
      this.currFlightPlanService.setPerformanceData('pilotTaxiFuel', null, forPlan);
      return true;
    }
    if (!this.representsDecimalNumber(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    const value = NXUnits.userToKg(parseFloat(s));
    if (isFinite(value)) {
      if (this.isTaxiFuelInRange(value)) {
        this.currFlightPlanService.setPerformanceData('pilotTaxiFuel', value, forPlan);
        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  /**
   * This method is used to set initial Final Time for when INIT B is making predictions
   * @param {String} s - containing time value
   * @returns {boolean}
   */
  public trySetRouteFinalTime(s: string, forPlan: FlightPlanIndex): boolean {
    if (s) {
      if (s === Keypad.clrValue) {
        this.flightPlanService.setPerformanceData('pilotFinalHoldingTime', null, forPlan);
        this.flightPlanService.setPerformanceData('pilotFinalHoldingFuel', null, forPlan);

        return true;
      }
      // Time entry must start with '/'
      if (s.startsWith('/')) {
        const rteFinalTime = s.slice(1);

        if (!/^\d{1,4}$/.test(rteFinalTime)) {
          this.setScratchpadMessage(NXSystemMessages.formatError);
          return false;
        }

        if (this.isFinalTimeInRange(rteFinalTime)) {
          const routeFinalTimeMinutes = FmsFormatters.hhmmToMinutes(rteFinalTime.padStart(4, '0'));

          this.flightPlanService.setPerformanceData('pilotFinalHoldingTime', routeFinalTimeMinutes, forPlan);
          this.flightPlanService.setPerformanceData('pilotFinalHoldingFuel', null, forPlan);

          return true;
        } else {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  public trySetRouteFinalFuel(s: string, forPlan: FlightPlanIndex): boolean {
    if (s === Keypad.clrValue) {
      this.flightPlanService.setPerformanceData('pilotFinalHoldingTime', null, forPlan);
      this.flightPlanService.setPerformanceData('pilotFinalHoldingFuel', null, forPlan);

      return true;
    }
    if (s) {
      // Time entry must start with '/'
      if (s.startsWith('/')) {
        return this.trySetRouteFinalTime(s, forPlan);
      } else {
        // If not time, try to parse as weight
        // Weight can be entered with optional trailing slash, if so remove it before parsing the value
        const enteredValue = s.endsWith('/') ? s.slice(0, -1) : s;

        if (!this.representsDecimalNumber(enteredValue)) {
          this.setScratchpadMessage(NXSystemMessages.formatError);
          return false;
        }

        const rteFinalWeight = NXUnits.userToKg(parseFloat(enteredValue));

        if (this.isFinalFuelInRange(rteFinalWeight)) {
          this.flightPlanService.setPerformanceData('pilotFinalHoldingFuel', rteFinalWeight, forPlan);
          this.flightPlanService.setPerformanceData('pilotFinalHoldingTime', null, forPlan);

          return true;
        } else {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  public trySetRouteReservedPercent(s: string, forPlan: FlightPlanIndex): boolean {
    if (!this.isFlying()) {
      if (s) {
        if (s === Keypad.clrValue) {
          this.flightPlanService.setPerformanceData('pilotRouteReserveFuel', null, forPlan);
          this.flightPlanService.setPerformanceData('pilotRouteReserveFuelPercentage', null, forPlan);

          return true;
        }
        // Percentage entry must start with '/'
        if (s.startsWith('/')) {
          const enteredValue = s.slice(1);

          if (!this.representsDecimalNumber(enteredValue)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
          }

          const rteRsvPercent = parseFloat(enteredValue);

          if (!this.isRteRsvPercentInRange(rteRsvPercent)) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
          }

          if (isFinite(rteRsvPercent)) {
            this.flightPlanService.setPerformanceData('pilotRouteReserveFuel', null, forPlan);
            this.flightPlanService.setPerformanceData('pilotRouteReserveFuelPercentage', rteRsvPercent, forPlan);

            return true;
          }
        }
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  /**
   * Checks input and passes to trySetCruiseFl()
   * @param input Altitude or FL
   * @returns input passed checks
   */
  public trySetCruiseFlCheckInput(input: string, forPlan: FlightPlanIndex): boolean {
    if (input === Keypad.clrValue) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }
    const flString = input.replace('FL', '');
    if (!flString) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }
    return this.trySetCruiseFl(parseFloat(flString), forPlan);
  }

  /**
   * Sets new Cruise FL if all conditions good
   * @param fl {number} Altitude or FL
   * @param forPlan {number} Flight plan index to set Cruise FL for
   * @returns {boolean} input passed checks
   */
  private trySetCruiseFl(fl: number, forPlan: number): boolean {
    if (!isFinite(fl)) {
      this.setScratchpadMessage(NXSystemMessages.notAllowed);
      return false;
    }
    if (fl >= 1000) {
      fl = Math.floor(fl / 100);
    }
    if (fl > this.maxCruiseFL) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    const phase = this.flightPhaseManager.phase;
    const selFl = Math.floor(Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue('feet')) / 100);

    // TODO check if it's correct to skip this logic for SEC
    if (
      forPlan === FlightPlanIndex.Active &&
      fl < selFl &&
      (phase === FmgcFlightPhase.Climb || phase === FmgcFlightPhase.Approach || phase === FmgcFlightPhase.GoAround)
    ) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    if (fl <= 0 || fl > this.maxCruiseFL) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.setCruiseLevel(fl, forPlan);
    this.onUpdateCruiseLevel(fl, forPlan);

    return true;
  }

  private onUpdateCruiseLevel(newCruiseLevel: number, forPlan: number) {
    this.currFlightPlanService.setPerformanceData('cruiseTemperature', null, forPlan);

    if (forPlan === FlightPlanIndex.Active) {
      this.updateConstraints();

      this.flightPhaseManager.handleNewCruiseAltitudeEntered(newCruiseLevel);
    }
  }

  public getCruiseAltitude(): number {
    return this.cruiseLevel * 100;
  }

  public trySetRouteReservedFuel(s: string, forPlan: FlightPlanIndex): boolean {
    if (!this.isFlying()) {
      if (s) {
        if (s === Keypad.clrValue) {
          this.flightPlanService.setPerformanceData('pilotRouteReserveFuel', null, forPlan);
          this.flightPlanService.setPerformanceData('pilotRouteReserveFuelPercentage', null, forPlan);

          return true;
        }
        // Percentage entry must start with '/'
        if (s.startsWith('/')) {
          return this.trySetRouteReservedPercent(s, forPlan);
        } else {
          // If not percentage, try to parse as weight
          // Weight can be entered with optional trailing slash, if so remove it before parsing the value
          const enteredValue = s.endsWith('/') ? s.slice(0, -1) : s;

          if (!this.representsDecimalNumber(enteredValue)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
          }

          const rteRsvWeight = NXUnits.userToKg(parseFloat(enteredValue));

          if (!this.isRteRsvFuelInRange(rteRsvWeight)) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
          }

          if (isFinite(rteRsvWeight)) {
            this.flightPlanService.setPerformanceData('pilotRouteReserveFuel', rteRsvWeight, forPlan);
            this.flightPlanService.setPerformanceData('pilotRouteReserveFuelPercentage', null, forPlan);

            return true;
          }
        }
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  public trySetZeroFuelWeightZFWCG(s: string, forPlan: FlightPlanIndex): boolean {
    const plan = this.getFlightPlan(forPlan);

    if (s) {
      if (s.includes('/')) {
        const sSplit = s.split('/');
        const zfw = NXUnits.userToKg(parseFloat(sSplit[0]));
        const zfwcg = parseFloat(sSplit[1]);
        if (isFinite(zfw) && isFinite(zfwcg)) {
          if (this.isZFWInRange(zfw) && this.isZFWCGInRange(zfwcg)) {
            this.currFlightPlanService.setPerformanceData('zeroFuelWeight', zfw, forPlan);
            this.currFlightPlanService.setPerformanceData('zeroFuelWeightCenterOfGravity', zfwcg, forPlan);
            return true;
          }
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
        if (plan.performanceData.zeroFuelWeight === null) {
          this.setScratchpadMessage(NXSystemMessages.notAllowed);
          return false;
        }
        if (this.isZFWInRange(zfw)) {
          this.flightPlanService.setPerformanceData('zeroFuelWeight', zfw, forPlan);
          return true;
        }
        if (this.isZFWCGInRange(zfwcg)) {
          this.flightPlanService.setPerformanceData('zeroFuelWeightCenterOfGravity', zfwcg, forPlan);
          return true;
        }
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
      if (plan.performanceData.zeroFuelWeight === null) {
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
      }
      const zfw = NXUnits.userToKg(parseFloat(s));
      if (this.isZFWInRange(zfw)) {
        this.flightPlanService.setPerformanceData('zeroFuelWeight', zfw, forPlan);

        return true;
      }
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    this.setScratchpadMessage(NXSystemMessages.formatError);
    return false;
  }

  /**
   *
   * @returns {number} Returns estimated fuel on board when arriving at the destination
   */
  public getDestEFOB() {
    const predictions = this.runFuelComputations(FlightPlanIndex.Active, FMCMainDisplay.fuelComputationsCache);
    const plan = this.getFlightPlan(FlightPlanIndex.Active);

    return predictions.landingWeight - plan.performanceData.zeroFuelWeight;
  }

  public trySetBlockFuel(s: string, forPlan: FlightPlanIndex): boolean {
    if (s === Keypad.clrValue) {
      this.flightPlanService.setPerformanceData('blockFuel', null, forPlan);

      this._fuelPredDone = false;
      this._fuelPlanningPhase = FuelPlanningPhases.PLANNING;
      return true;
    }
    const value = NXUnits.userToKg(parseFloat(s));
    if (isFinite(value) && this.isBlockFuelInRange(value)) {
      if (this.isBlockFuelInRange(value)) {
        this.flightPlanService.setPerformanceData('blockFuel', value, forPlan);
        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  public trySetAverageWind(s: string, forPlan: FlightPlanIndex): boolean {
    const validDelims = ['TL', 'T', '+', 'HD', 'H', '-'];
    const matchedIndex = validDelims.findIndex((element) => s.startsWith(element));
    const digits = matchedIndex >= 0 ? s.replace(validDelims[matchedIndex], '') : s;
    const isNum = /^\d+$/.test(digits);
    if (!isNum) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    const wind = parseInt(digits);
    if (wind > 250) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.flightPlanService.setPerformanceData('pilotTripWind', matchedIndex <= 2 ? wind : -wind, forPlan);
    return true;
  }

  public trySetPreSelectedClimbSpeed(s: string): boolean {
    const isNextPhase = this.flightPhaseManager.phase === FmgcFlightPhase.Takeoff;
    if (s === Keypad.clrValue) {
      this.preSelectedClbSpeed = undefined;
      if (isNextPhase) {
        this.updatePreSelSpeedMach(undefined);
      }
      return true;
    }

    const SPD_REGEX = /\d{1,3}/;
    if (s.match(SPD_REGEX) === null) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const spd = parseInt(s);
    if (!Number.isFinite(spd)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    if (spd < 100 || spd > 350) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.preSelectedClbSpeed = spd;
    if (isNextPhase) {
      this.updatePreSelSpeedMach(spd);
    }

    return true;
  }

  public trySetPreSelectedCruiseSpeed(s: string): boolean {
    const isNextPhase = this.flightPhaseManager.phase === FmgcFlightPhase.Climb;
    if (s === Keypad.clrValue) {
      this.preSelectedCrzSpeed = undefined;
      if (isNextPhase) {
        this.updatePreSelSpeedMach(undefined);
      }
      return true;
    }

    const MACH_OR_SPD_REGEX = /^(\.\d{1,2}|\d{1,3})$/;
    if (s.match(MACH_OR_SPD_REGEX) === null) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const v = parseFloat(s);
    if (!Number.isFinite(v)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    if (v < 1) {
      const mach = Math.round(v * 100) / 100;
      if (mach < 0.15 || mach > 0.82) {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }

      this.preSelectedCrzSpeed = mach;
    } else {
      const spd = Math.round(v);
      if (spd < 100 || spd > 350) {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }

      this.preSelectedCrzSpeed = spd;
    }

    if (isNextPhase) {
      this.updatePreSelSpeedMach(this.preSelectedCrzSpeed);
    }

    return true;
  }

  public setPerfApprQNH(s: string): boolean {
    if (s === Keypad.clrValue) {
      const dest = this.flightPlanService.active.destinationAirport;
      const distanceToDestination = Number.isFinite(this.getDistanceToDestination())
        ? this.getDistanceToDestination()
        : -1;

      if (dest && distanceToDestination < 180) {
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
      } else {
        this.perfApprQNH = NaN;
        return true;
      }
    }

    const value = parseFloat(s);
    const HPA_REGEX = /^[01]?[0-9]{3}$/;
    const INHG_REGEX = /^([23][0-9]|[0-9]{2}\.)[0-9]{2}$/;

    if (HPA_REGEX.test(s)) {
      if (value >= 745 && value <= 1050) {
        this.perfApprQNH = value;
        SimVar.SetSimVarValue('L:A32NX_DESTINATION_QNH', 'Millibar', this.perfApprQNH);
        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    } else if (INHG_REGEX.test(s)) {
      if (value >= 2200 && value <= 3100) {
        this.perfApprQNH = value / 100;
        SimVar.SetSimVarValue('L:A32NX_DESTINATION_QNH', 'Millibar', this.perfApprQNH * 33.8639);
        return true;
      } else if (value >= 22.0 && value <= 31.0) {
        this.perfApprQNH = value;
        SimVar.SetSimVarValue('L:A32NX_DESTINATION_QNH', 'Millibar', this.perfApprQNH * 33.8639);
        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    }
    this.setScratchpadMessage(NXSystemMessages.formatError);
    return false;
  }

  public setPerfApprTemp(s: string): boolean {
    if (s === Keypad.clrValue) {
      const dest = this.flightPlanService.active.destinationAirport;
      const distanceToDestination = Number.isFinite(this.getDistanceToDestination())
        ? this.getDistanceToDestination()
        : -1;

      if (dest && distanceToDestination < 180) {
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
      } else {
        this.perfApprTemp = NaN;
        return true;
      }
    }

    if (!/^[+-]?\d{1,2}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    this.perfApprTemp = parseInt(s);
    return true;
  }

  public setPerfApprWind(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.perfApprWindHeading = NaN;
      this.perfApprWindSpeed = NaN;
      return true;
    }

    // both must be entered
    if (!/^\d{1,3}\/\d{1,3}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    const [dir, mag] = s.split('/').map((v) => parseInt(v));
    if (dir > 360 || mag > 500) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    this.perfApprWindHeading = dir % 360; // 360 is displayed as 0
    this.perfApprWindSpeed = mag;
    return true;
  }

  public setPerfApprTransAlt(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.flightPlanService.setPerformanceData('pilotTransitionLevel', null);
      this.updateTransitionAltitudeLevel();
      return true;
    }

    if (!/^\d{4,5}$/.test(s)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
    const value = Math.round(parseInt(s) / 10) * 10;
    if (value < 1000 || value > 45000) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.flightPlanService.setPerformanceData('pilotTransitionLevel', Math.round(value / 100));
    this.updateTransitionAltitudeLevel();
    return true;
  }

  /**
   * VApp for _selected_ landing config
   */
  private getVApp() {
    if (isFinite(this.vApp)) {
      return this.vApp;
    }
    return this.approachSpeeds.vapp;
  }

  /**
   * VApp for _selected_ landing config with GSMini correction
   */
  private getVAppGsMini() {
    let vAppTarget = this.getVApp();
    if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
      vAppTarget = NXSpeedsUtils.getVtargetGSMini(vAppTarget, NXSpeedsUtils.getHeadWindDiff(this._towerHeadwind));
    }
    return vAppTarget;
  }

  public setPerfApprVApp(s: string): boolean {
    if (s === Keypad.clrValue) {
      if (isFinite(this.vApp)) {
        this.vApp = NaN;
        return true;
      }
    } else {
      if (s.includes('.')) {
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
      }
      const value = parseInt(s);
      if (isFinite(value) && value >= 90 && value <= 350) {
        this.vApp = value;
        return true;
      }
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }
    this.setScratchpadMessage(NXSystemMessages.notAllowed);
    return false;
  }

  public setPerfApprMDA(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.perfApprMDA = null;
      SimVar.SetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', 0);
      return true;
    } else if (s.match(/^[0-9]{1,5}$/) !== null) {
      const value = parseInt(s);

      const activePlan = this.flightPlanService.active;

      let ldgRwy = activePlan.destinationRunway;

      if (!ldgRwy) {
        if (activePlan.availableDestinationRunways.length > 0) {
          ldgRwy = activePlan.availableDestinationRunways[0];
        }
      }

      const limitLo = ldgRwy ? ldgRwy.thresholdLocation.alt : 0;
      const limitHi = ldgRwy ? ldgRwy.thresholdLocation.alt + 5000 : 39000;

      if (value >= limitLo && value <= limitHi) {
        this.perfApprMDA = value;
        SimVar.SetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', this.perfApprMDA);
        return true;
      }
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    } else {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
  }

  public setPerfApprDH(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.perfApprDH = null;
      return true;
    }

    if (s === 'NO' || s === 'NO DH' || s === 'NODH') {
      this.perfApprDH = 'NO DH';
      SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', -2);
      return true;
    } else if (s.match(/^[0-9]{1,5}$/) !== null) {
      const value = parseInt(s);
      if (value >= 0 && value <= 5000) {
        this.perfApprDH = value;
        SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', this.perfApprDH);
        return true;
      } else {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }
    } else {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }
  }

  public setPerfApprFlaps3(s: boolean) {
    this.perfApprFlaps3 = s;
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'boolean', s);
  }

  /** @param icao ID of the navaid to de-select */
  public deselectNavaid(icao: string): void {
    this.navigation.getNavaidTuner().deselectNavaid(icao);
  }

  public reselectNavaid(icao: string): void {
    this.navigation.getNavaidTuner().reselectNavaid(icao);
  }

  /** @returns icaos of deselected navaids */
  public get deselectedNavaids(): string[] {
    return this.navigation.getNavaidTuner().deselectedNavaids;
  }

  public getVorTuningData(index: 1 | 2): VorRadioTuningStatus {
    return this.navigation.getNavaidTuner().getVorRadioTuningStatus(index);
  }

  /**
   * Set a manually tuned VOR
   * @param index
   * @param facilityOrFrequency null to clear
   */
  public setManualVor(index: 1 | 2, facilityOrFrequency: number | VhfNavaid | null): void {
    return this.navigation.getNavaidTuner().setManualVor(index, facilityOrFrequency);
  }

  /**
   * Set a VOR course
   * @param index
   * @param course null to clear
   */
  public setVorCourse(index: 1 | 2, course: number): void {
    return this.navigation.getNavaidTuner().setVorCourse(index, course);
  }

  public getMmrTuningData(index: 1 | 2): MmrRadioTuningStatus {
    return this.navigation.getNavaidTuner().getMmrRadioTuningStatus(index);
  }

  /**
   * Set a manually tuned ILS
   * @param facilityOrFrequency null to clear
   */
  public async setManualIls(facilityOrFrequency: number | IlsNavaid | null): Promise<void> {
    return await this.navigation.getNavaidTuner().setManualIls(facilityOrFrequency);
  }

  /**
   * Set an ILS course
   * @param course null to clear
   * @param backcourse Whether the course is a backcourse/backbeam.
   */
  public setIlsCourse(course: number | null, backcourse = false): void {
    return this.navigation.getNavaidTuner().setIlsCourse(course, backcourse);
  }

  public getAdfTuningData(index: 1 | 2): AdfRadioTuningStatus {
    return this.navigation.getNavaidTuner().getAdfRadioTuningStatus(index);
  }

  /**
   * Set a manually tuned NDB
   * @param index
   * @param facilityOrFrequency null to clear
   */
  public setManualAdf(index: 1 | 2, facilityOrFrequency: number | NdbNavaid | null): void {
    return this.navigation.getNavaidTuner().setManualAdf(index, facilityOrFrequency);
  }

  public isMmrTuningLocked() {
    return this.navigation.getNavaidTuner().isMmrTuningLocked();
  }

  public isFmTuningActive() {
    return this.navigation.getNavaidTuner().isFmTuningActive();
  }

  /**
   * Get the currently selected navaids
   */
  public getSelectedNavaids(): SelectedNavaid[] {
    // FIXME 2 when serving CDU 2
    return this.navigation.getSelectedNavaids(1);
  }

  /**
   * Set the takeoff flap config
   */
  private setTakeoffFlaps(flaps: 0 | 1 | 2 | 3 | null): void {
    if (flaps !== this.flaps) {
      this.flaps = flaps;
      SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_FLAPS', 'number', this.flaps !== null ? this.flaps : -1);

      this.arincDiscreteWord2.setBitValue(13, this.flaps === 0);
      this.arincDiscreteWord2.setBitValue(14, this.flaps === 1);
      this.arincDiscreteWord2.setBitValue(15, this.flaps === 2);
      this.arincDiscreteWord2.setBitValue(16, this.flaps === 3);
      this.arincDiscreteWord2.setSsm(Arinc429SignStatusMatrix.NormalOperation);
    }
  }

  /**
   * Set the takeoff trim config
   */
  private setTakeoffTrim(ths: number | null): void {
    if (ths !== this.ths) {
      this.ths = ths;
      // legacy vars
      SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_THS', 'degree', this.ths ? this.ths : 0);
      SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_THS_ENTERED', 'bool', this.ths !== null);

      const ssm =
        this.ths !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

      this.arincTakeoffPitchTrim.setBnrValue(this.ths ? -this.ths : 0, ssm, 12, 180, -180);
    }
  }

  public trySetFlapsTHS(s: string): boolean {
    if (s === Keypad.clrValue) {
      this.setTakeoffFlaps(null);
      this.setTakeoffTrim(null);
      this.tryCheckToData();
      return true;
    }

    let newFlaps = null;
    let newThs = null;

    // eslint-disable-next-line prefer-const
    let [flapStr, thsStr] = s.split('/');

    if (flapStr && flapStr.length > 0) {
      if (!/^\d$/.test(flapStr)) {
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
      }

      const flaps = parseInt(flapStr);
      if (flaps < 0 || flaps > 3) {
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
      }

      newFlaps = flaps;
    }

    if (thsStr && thsStr.length > 0) {
      // allow AAN.N and N.NAA, where AA is UP or DN
      if (!/^(UP|DN)(\d|\d?\.\d|\d\.\d?)|(\d|\d?\.\d|\d\.\d?)(UP|DN)$/.test(thsStr)) {
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
      }

      let direction = null;
      thsStr = thsStr.replace(/(UP|DN)/g, (substr) => {
        direction = substr;
        return '';
      });

      if (direction) {
        let ths = parseFloat(thsStr);
        if (direction === 'DN') {
          // Note that 0 *= -1 will result in -0, which is strictly
          // the same as 0 (that is +0 === -0) and doesn't make a
          // difference for the calculation itself. However, in order
          // to differentiate between DN0.0 and UP0.0 we'll do check
          // later when displaying this value using Object.is to
          // determine whether the pilot entered DN0.0 or UP0.0.
          ths *= -1;
        }
        if (!isFinite(ths) || ths < -5 || ths > 7) {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
        newThs = ths;
      }
    }

    if (newFlaps !== null) {
      if (this.flaps !== null) {
        this.tryCheckToData();
      }
      this.setTakeoffFlaps(newFlaps);
    }
    if (newThs !== null) {
      if (this.ths !== null) {
        this.tryCheckToData();
      }
      this.setTakeoffTrim(newThs);
    }
    return true;
  }

  public checkEFOBBelowMin() {
    const predictions = this.runFuelComputations(FlightPlanIndex.Active, FMCMainDisplay.fuelComputationsCache);
    const minDestFob = predictions.minimumDestinationFuel;

    if (this._fuelPredDone) {
      if (minDestFob) {
        // round & only use 100kgs precision since thats how it is displayed in fuel pred
        const destEfob = Math.round(predictions.destinationFuelOnBoard * 10) / 10;
        const roundedMinDestFob = Math.round(minDestFob * 10) / 10;
        if (!this._isBelowMinDestFob) {
          if (destEfob < roundedMinDestFob) {
            this._isBelowMinDestFob = true;
            // TODO should be in flight only and if fuel is below min dest efob for 2 minutes
            if (this.isAnEngineOn()) {
              setTimeout(() => {
                this.addMessageToQueue(
                  NXSystemMessages.destEfobBelowMin,
                  () => {
                    return this._EfobBelowMinClr === true;
                  },
                  () => {
                    this._EfobBelowMinClr = true;
                  },
                );
              }, 120000);
            } else {
              this.addMessageToQueue(
                NXSystemMessages.destEfobBelowMin,
                () => {
                  return this._EfobBelowMinClr === true;
                },
                () => {
                  this._EfobBelowMinClr = true;
                },
              );
            }
          }
        } else {
          // check if we are at least 300kgs above min dest efob to show green again & the ability to trigger the message
          if (roundedMinDestFob) {
            if (destEfob - roundedMinDestFob >= 0.3) {
              this._isBelowMinDestFob = false;
              this.removeMessageFromQueue(NXSystemMessages.destEfobBelowMin.text);
            }
          }
        }
      }
    }
  }

  public updateTowerHeadwind() {
    if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
      const activePlan = this.flightPlanService.active;

      if (activePlan.destinationRunway) {
        this._towerHeadwind = NXSpeedsUtils.getHeadwind(
          this.perfApprWindSpeed,
          this.perfApprWindHeading,
          activePlan.destinationRunway.magneticBearing,
        );
      }
    }
  }

  /**
   * Called after Flaps or THS change
   */
  private tryCheckToData() {
    if (isFinite(this.v1Speed) || isFinite(this.vRSpeed) || isFinite(this.v2Speed)) {
      this.addMessageToQueue(NXSystemMessages.checkToData);
    }
  }

  /**
   * Called after runway change
   * - Sets confirmation prompt state for every entry whether it is defined or not
   * - Adds message when at least one entry needs to be confirmed
   * Additional:
   *   Only prompt the confirmation of FLEX TEMP when the TO runway was changed, not on initial insertion of the runway
   */
  public onToRwyChanged() {
    const activePlan = this.flightPlanService.active;
    const selectedRunway = activePlan.originRunway;

    if (selectedRunway) {
      const toRunway = Avionics.Utils.formatRunway(selectedRunway.ident);
      if (toRunway === this.toRunway) {
        return;
      }
      if (this.toRunway) {
        this.toRunway = toRunway;
        this._toFlexChecked = !isFinite(this.perfTOTemp);
        this.unconfirmedV1Speed = this.v1Speed;
        this.unconfirmedVRSpeed = this.vRSpeed;
        this.unconfirmedV2Speed = this.v2Speed;
        this.v1Speed = undefined;
        this.vRSpeed = undefined;
        this.v2Speed = undefined;

        if (!this.unconfirmedV1Speed && !this.unconfirmedVRSpeed && !this.unconfirmedV2Speed) {
          return;
        }
        this.addMessageToQueue(
          NXSystemMessages.checkToData,
          (mcdu) =>
            !this.unconfirmedV1Speed && !this.unconfirmedVRSpeed && !this.unconfirmedV2Speed && mcdu._toFlexChecked,
        );
      }
      this.toRunway = toRunway;
    }
  }

  /**
   * Switches to the next/new perf page (if new flight phase is in order) or reloads the current page
   */
  private tryUpdatePerfPage(_old: FmgcFlightPhase, _new: FmgcFlightPhase) {
    // Ensure we have a performance page selected...
    if (this.page.Current < this.page.PerformancePageTakeoff || this.page.Current > this.page.PerformancePageGoAround) {
      return;
    }

    const curPerfPagePhase = (() => {
      switch (this.page.Current) {
        case this.page.PerformancePageTakeoff:
          return FmgcFlightPhase.Takeoff;
        case this.page.PerformancePageClb:
          return FmgcFlightPhase.Climb;
        case this.page.PerformancePageCrz:
          return FmgcFlightPhase.Cruise;
        case this.page.PerformancePageDes:
          return FmgcFlightPhase.Descent;
        case this.page.PerformancePageAppr:
          return FmgcFlightPhase.Approach;
        case this.page.PerformancePageGoAround:
          return FmgcFlightPhase.GoAround;
      }
    })();

    if (_new > _old) {
      if (_new >= curPerfPagePhase) {
        CDUPerformancePage.ShowPage(this.mcdu, FlightPlanIndex.Active, _new);
      }
    } else if (_old === curPerfPagePhase) {
      CDUPerformancePage.ShowPage(this.mcdu, FlightPlanIndex.Active, _old);
    }
  }

  /**
   * Set the progress page bearing/dist location
   * @param {string} ident ident of the waypoint or runway, will be replaced by "ENTRY" if brg/dist offset are specified
   * @param {LatLongAlt} coordinates co-ordinates of the waypoint/navaid/runway, without brg/dist offset
   * @param {string?} icao icao database id of the waypoint if applicable
   */
  private _setProgLocation(ident, coordinates, icao) {
    console.log(`progLocation: ${ident} ${coordinates}`);
    this._progBrgDist = {
      icao,
      ident,
      coordinates,
      bearing: -1,
      distance: -1,
    };

    this.updateProgDistance();
  }

  /**
   * Try to set the progress page bearing/dist waypoint/location
   * @param s scratchpad entry
   * @param callback callback taking boolean arg for success/failure
   */
  public trySetProgWaypoint(s: string, callback = EmptyCallback.Boolean) {
    if (s === Keypad.clrValue) {
      this._progBrgDist = undefined;
      return callback(true);
    }

    WaypointEntryUtils.getOrCreateWaypoint(this, s, false, 'ENTRY')
      .then((wp) => {
        this._setProgLocation(wp.ident, wp.location, wp.databaseId);
        return callback(true);
      })
      .catch((err) => {
        // Rethrow if error is not an FMS message to display
        if (err.type === undefined) {
          throw err;
        }

        this.showFmsErrorMessage(err.type);
        return callback(false);
      });
  }

  /**
   * Recalculate the bearing and distance for progress page
   */
  private updateProgDistance() {
    if (!this._progBrgDist) {
      return;
    }

    const latitude = ADIRS.getLatitude();
    const longitude = ADIRS.getLongitude();

    if (!latitude.isNormalOperation() || !longitude.isNormalOperation()) {
      this._progBrgDist.distance = -1;
      this._progBrgDist.bearing = -1;
      return;
    }

    const planeLl = new LatLong(latitude.value, longitude.value);
    this._progBrgDist.distance = Avionics.Utils.computeGreatCircleDistance(planeLl, this._progBrgDist.coordinates);
    this._progBrgDist.bearing = A32NX_Util.trueToMagnetic(
      Avionics.Utils.computeGreatCircleHeading(planeLl, this._progBrgDist.coordinates),
    );
  }

  public get progBearing() {
    return this._progBrgDist ? this._progBrgDist.bearing : -1;
  }

  public get progDistance() {
    return this._progBrgDist ? this._progBrgDist.distance : -1;
  }

  public get progWaypointIdent() {
    return this._progBrgDist ? this._progBrgDist.ident : undefined;
  }

  public isWaypointInUse(wpt: Waypoint): Promise<boolean> {
    return this.flightPlanService
      .isWaypointInUse(wpt)
      .then(
        (inUseByFlightPlan) => inUseByFlightPlan || (this._progBrgDist && this._progBrgDist.icao === wpt.databaseId),
      );
  }

  public setGroundTempFromOrigin(forPlan: number) {
    const origin = this.flightPlanService.get(forPlan).originAirport;

    if (!origin) {
      return;
    }

    this.flightPlanService.setPerformanceData(
      'defaultGroundTemperature',
      A32NX_Util.getIsaTemp(origin.location.alt),
      forPlan,
    );
  }

  public trySetGroundTemp(scratchpadValue: string, forPlan: number) {
    // TODO check if this condition is still applicable in SEC
    if (forPlan === FlightPlanIndex.Active && this.flightPhaseManager.phase !== FmgcFlightPhase.Preflight) {
      throw NXSystemMessages.notAllowed;
    }

    if (scratchpadValue === Keypad.clrValue) {
      this.flightPlanService.setPerformanceData('pilotGroundTemperature', null, forPlan);
      return;
    }

    if (scratchpadValue.match(/^[+-]?[0-9]{1,2}$/) === null) {
      throw NXSystemMessages.formatError;
    }

    this.flightPlanService.setPerformanceData('pilotGroundTemperature', parseInt(scratchpadValue), forPlan);
  }

  public navModeEngaged() {
    const lateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
    switch (lateralMode) {
      case 20: // NAV
      case 30: // LOC*
      case 31: // LOC
      case 32: // LAND
      case 33: // FLARE
      case 34: // ROLL OUT
        return true;
    }
    return false;
  }

  // FIXME check why steps alts page is the only one outside FMS/CDU calling this...
  /**
   * Add type 2 message to fmgc message queue
   * @param _message MessageObject
   * @param _isResolvedOverride Function that determines if the error is resolved at this moment (type II only).
   * @param _onClearOverride Function that executes when the error is actively cleared by the pilot (type II only).
   */
  public addMessageToQueue(
    _message: TypeIIMessage,
    _isResolvedOverride: (arg0: any) => any = undefined,
    _onClearOverride: (arg0: any) => any = undefined,
  ) {
    if (!_message.isTypeTwo) {
      return;
    }
    const message =
      _isResolvedOverride === undefined && _onClearOverride === undefined
        ? _message
        : _message.getModifiedMessage('', _isResolvedOverride, _onClearOverride);
    this._messageQueue.addMessage(message);
  }

  /**
   * Removes a message from the queue
   * @param value {String}
   */
  public removeMessageFromQueue(value: string) {
    this._messageQueue.removeMessage(value);
  }

  public updateMessageQueue() {
    this._messageQueue.updateDisplayedMessage();
  }

  /* END OF MCDU GET/SET METHODS */
  /* UNSORTED CODE BELOW */

  /**
   * Generic function which returns true if engine(index) is ON (N2 > 20)
   */
  private isEngineOn(index: number): boolean {
    return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'number') > 20;
  }
  /**
   * Returns true if any one engine is running (N2 > 20)
   */
  // FIXME can be private when ATSU moved out of FMS
  public isAnEngineOn(): boolean {
    return this.isEngineOn(1) || this.isEngineOn(2);
  }

  /**
   * Returns true only if all engines are running (N2 > 20)
   */
  //TODO: can this be an util? no
  public isAllEngineOn(): boolean {
    return this.isEngineOn(1) && this.isEngineOn(2);
  }

  public isOnGround(): boolean {
    return (
      SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'Number') === 1 ||
      SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'Number') === 1
    );
  }

  public isFlying(): boolean {
    return (
      this.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff && this.flightPhaseManager.phase < FmgcFlightPhase.Done
    );
  }
  /**
   * Returns the maximum cruise FL for ISA temp and GW
   * @param temp {number} ISA in C°
   * @param gw {number} GW in t
   * @returns {number} MAX FL
   */
  //TODO: can this be an util?
  private getMaxFL(temp = A32NX_Util.getIsaTempDeviation(), gw = this.getGW()) {
    return Math.round(temp <= 10 ? -2.778 * gw + 578.667 : (temp * -0.039 - 2.389) * gw + temp * -0.667 + 585.334);
  }

  /**
   * Returns the maximum allowed cruise FL considering max service FL
   * @param fl FL to check
   * @returns maximum allowed cruise FL
   */
  //TODO: can this be an util? no
  public getMaxFlCorrected(fl: number = this.getMaxFL()): number {
    return fl >= this.recMaxCruiseFL ? this.recMaxCruiseFL : fl;
  }

  // only used by trySetMinDestFob
  //TODO: Can this be util?
  private isMinDestFobInRange(fuel: number) {
    return 0 <= fuel && fuel <= 80.0;
  }

  //TODO: Can this be util?
  private isTaxiFuelInRange(taxi: number) {
    return 0 <= taxi && taxi <= 9.9;
  }

  //TODO: Can this be util?
  private isFinalFuelInRange(fuel: number) {
    return 0 <= fuel && fuel <= 100;
  }

  //TODO: Can this be util?
  private isFinalTimeInRange(time: string) {
    const convertedTime = FmsFormatters.hhmmToMinutes(time.padStart(4, '0'));
    return 0 <= convertedTime && convertedTime <= 90;
  }

  //TODO: Can this be util?
  private isRteRsvFuelInRange(fuel: number) {
    return 0 <= fuel && fuel <= 10.0;
  }

  //TODO: Can this be util?
  private isRteRsvPercentInRange(value: number) {
    return value >= 0 && value <= 15.0;
  }

  //TODO: Can this be util?
  private isZFWInRange(zfw: number) {
    return 35.0 <= zfw && zfw <= 80.0;
  }

  //TODO: Can this be util?
  private isZFWCGInRange(zfwcg: number) {
    return 8.0 <= zfwcg && zfwcg <= 50.0;
  }

  //TODO: Can this be util?
  private isBlockFuelInRange(fuel: number) {
    return 0 <= fuel && fuel <= 80;
  }

  /**
   * Retrieves current fuel on boad in tons.
   * @returns current fuel on board in tons, or undefined if fuel readings are not available.
   */
  //TODO: Can this be util?
  public getFOB(): number | undefined {
    const useFqi = this.isAnEngineOn();

    // If an engine is not running, use pilot entered block fuel to calculate fuel predictions
    return useFqi ? (SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'pound') * 0.4535934) / 1000 : this.blockFuel;
  }

  /**
   * retrieves gross weight in tons or 0 if not available
   * @deprecated use getGrossWeight() instead
   */
  //TODO: Can this be util?
  public getGW(): number {
    const fmGwOrNull = this.getGrossWeight();
    const fmGw = fmGwOrNull !== null ? fmGwOrNull : 0;

    SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', fmGw);
    return fmGw;
  }

  //TODO: Can this be util?
  public getCG() {
    return SimVar.GetSimVarValue('CG PERCENT', 'Percent over 100') * 100;
  }

  //TODO: make this util or local var?
  /** @deprecated Sim AP is not used! */
  private isAirspeedManaged() {
    return SimVar.GetSimVarValue('AUTOPILOT SPEED SLOT INDEX', 'number') === 2;
  }

  //TODO: make this util or local var?
  /** @deprecated Sim AP is not used! */
  private isAltitudeManaged() {
    return SimVar.GetSimVarValue('AUTOPILOT ALTITUDE SLOT INDEX', 'number') === 2;
  }

  /**
   * Check if the given string represents a decimal number.
   * This may be a whole number or a number with one or more decimals.
   * If the leading digit is 0 and one or more decimals are given, the leading digit may be omitted.
   * @param str String to check
   * @returns True if str represents a decimal value, otherwise false
   */
  //TODO: Can this be util?
  private representsDecimalNumber(str: string): boolean {
    return /^[+-]?\d*(?:\.\d+)?$/.test(str);
  }

  /**
   * Gets the entered zero fuel weight, or undefined if not entered
   * @returns the zero fuel weight in tonnes or undefined
   */
  public getZeroFuelWeight(): number | undefined {
    return this.zeroFuelWeight;
  }

  public getV2Speed() {
    return this.v2Speed;
  }

  public getTropoPause() {
    return this.tropo;
  }

  public getManagedClimbSpeed() {
    return this.managedSpeedClimb;
  }

  public getManagedClimbSpeedMach() {
    return this.managedSpeedClimbMach;
  }

  public getManagedCruiseSpeed() {
    return this.managedSpeedCruise;
  }

  public getManagedCruiseSpeedMach() {
    return this.managedSpeedCruiseMach;
  }

  public getAccelerationAltitude() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.accelerationAltitude;
    }

    return undefined;
  }

  public getThrustReductionAltitude() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.thrustReductionAltitude;
    }

    return undefined;
  }

  public getOriginTransitionAltitude() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.transitionAltitude;
    }

    return undefined;
  }

  public getDestinationTransitionLevel() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.transitionLevel;
    }

    return undefined;
  }

  setCruiseLevel(level: number, forPlan: FlightPlanIndex) {
    const plan = this.getFlightPlan(forPlan);

    if (plan) {
      this.currFlightPlanService.setPerformanceData('cruiseFlightLevel', level, forPlan);
      // used by FlightPhaseManager - only set for active plan
      if (forPlan === FlightPlanIndex.Active) {
        SimVar.SetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number', Number.isFinite(level * 100) ? level * 100 : 0);
      }
    }
  }

  /** @deprecated */
  public get cruiseLevel() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.cruiseFlightLevel;
    }

    return undefined;
  }

  /** @deprecated */
  public set cruiseLevel(level) {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      this.currFlightPlanService.setPerformanceData('cruiseFlightLevel', level);
      // used by FlightPhaseManager
      SimVar.SetSimVarValue(
        'L:A32NX_AIRLINER_CRUISE_ALTITUDE',
        'number',
        Number.isFinite(level * 100) ? level * 100 : 0,
      );
    }
  }

  public get costIndex() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.costIndex;
    }

    return undefined;
  }

  /** @deprecated */
  public set costIndex(ci) {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      this.currFlightPlanService.setPerformanceData('costIndex', ci);
    }
  }

  public get tropo() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.tropopause;
    }

    return undefined;
  }

  public get isTropoPilotEntered() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return plan.performanceData.tropopauseIsPilotEntered;
    }

    return false;
  }

  /** @deprecated */
  public set tropo(tropo) {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      this.currFlightPlanService.setPerformanceData('pilotTropopause', tropo);
    }
  }

  /** @deprecated */
  public get flightNumber() {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      return this.currFlightPlanService.active.flightNumber;
    }

    return undefined;
  }

  /** @deprecated */
  public set flightNumber(flightNumber) {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      this.currFlightPlanService.setFlightNumber(flightNumber);
    }
  }

  /**
   * The maximum speed imposed by the climb speed limit in the active flight plan or null if it is not set.
   */
  public get climbSpeedLimit(): number | null {
    const plan = this.currFlightPlanService.active;

    // The plane follows 250 below 10'000 even without a flight plan
    return plan ? plan.performanceData.climbSpeedLimitSpeed : DefaultPerformanceData.ClimbSpeedLimitSpeed;
  }

  /**
   * The altitude below which the climb speed limit of the active flight plan applies or null if not set.
   */
  public get climbSpeedLimitAlt(): number | null {
    const plan = this.currFlightPlanService.active;

    // The plane follows 250 below 10'000 even without a flight plan
    return plan ? plan.performanceData.climbSpeedLimitAltitude : DefaultPerformanceData.ClimbSpeedLimitAltitude;
  }

  /**
   * The maximum speed imposed by the descent speed limit in the active flight plan or null if it is not set.
   */
  private get descentSpeedLimit(): number | null {
    const plan = this.currFlightPlanService.active;

    // The plane follows 250 below 10'000 even without a flight plan
    return plan ? plan.performanceData.descentSpeedLimitSpeed : DefaultPerformanceData.DescentSpeedLimitSpeed;
  }

  /**
   * The altitude below which the descent speed limit of the active flight plan applies or null if not set.
   */
  private get descentSpeedLimitAlt(): number | null {
    const plan = this.currFlightPlanService.active;

    // The plane follows 250 below 10'000 even without a flight plan
    return plan ? plan.performanceData.descentSpeedLimitAltitude : DefaultPerformanceData.DescentSpeedLimitAltitude;
  }

  /** @deprecated */
  get zeroFuelWeight() {
    const plan = this.currFlightPlanService.active;

    return plan ? plan.performanceData.zeroFuelWeight : undefined;
  }

  /** @deprecated */
  set blockFuel(blockFuel: number) {
    const plan = this.currFlightPlanService.active;

    if (plan) {
      this.currFlightPlanService.setPerformanceData('blockFuel', blockFuel);
    }
  }

  /** @deprecated */
  get blockFuel() {
    const plan = this.currFlightPlanService.active;

    return plan ? plan.performanceData.blockFuel : undefined;
  }

  public getFlightPhase() {
    return this.flightPhaseManager.phase;
  }

  public getClimbSpeedLimit() {
    return {
      speed: this.climbSpeedLimit,
      underAltitude: this.climbSpeedLimitAlt,
    };
  }

  public getDescentSpeedLimit() {
    return {
      speed: this.descentSpeedLimit,
      underAltitude: this.descentSpeedLimitAlt,
    };
  }

  public getPreSelectedClbSpeed() {
    return this.preSelectedClbSpeed;
  }

  public getPreSelectedCruiseSpeed() {
    return this.preSelectedCrzSpeed;
  }

  public getTakeoffFlapsSetting() {
    return this.flaps;
  }

  public getManagedDescentSpeed() {
    return this.managedSpeedDescendPilot !== undefined ? this.managedSpeedDescendPilot : this.managedSpeedDescend;
  }

  public getManagedDescentSpeedMach() {
    return this.managedSpeedDescendMachPilot !== undefined
      ? this.managedSpeedDescendMachPilot
      : this.managedSpeedDescendMach;
  }

  // FIXME... ambiguous name that doesn't say if it's Vapp, GSmini, or something else
  public getApproachSpeed() {
    return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.vapp : 0;
  }

  public getFlapRetractionSpeed() {
    return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.f : 0;
  }

  public getSlatRetractionSpeed() {
    return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.s : 0;
  }

  public getCleanSpeed() {
    return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.gd : 0;
  }

  public getTripWind() {
    // FIXME convert vnav to use +ve for tailwind, -ve for headwind, it's the other way around at the moment
    return -(this.flightPlanService.active?.performanceData?.pilotTripWind ?? 0);
  }

  /** @deprecated This API is not suitable and needs replaced with a proper wind manager. */
  public getWinds() {
    return this.winds;
  }

  public getApproachWind() {
    const activePlan = this.currFlightPlanService.active;
    const destination = activePlan.destinationAirport;

    if (!destination || !destination.location || !isFinite(this.perfApprWindHeading)) {
      return { direction: 0, speed: 0 };
    }

    const magVar = Facilities.getMagVar(destination.location.lat, destination.location.long);
    const trueHeading = A32NX_Util.magneticToTrue(this.perfApprWindHeading, magVar);

    return { direction: trueHeading, speed: this.perfApprWindSpeed };
  }

  public getApproachQnh() {
    return this.perfApprQNH;
  }

  public getApproachTemperature() {
    return this.perfApprTemp;
  }

  public getDestinationElevation() {
    return Number.isFinite(this.landingElevation) ? this.landingElevation : 0;
  }

  public trySetManagedDescentSpeed(value: string): boolean {
    if (value === Keypad.clrValue) {
      this.managedSpeedDescendPilot = undefined;
      this.managedSpeedDescendMachPilot = undefined;
      return true;
    }

    const MACH_SLASH_SPD_REGEX = /^(\.\d{1,2})?\/(\d{3})?$/;
    const machSlashSpeedMatch = value.match(MACH_SLASH_SPD_REGEX);

    const MACH_REGEX = /^\.\d{1,2}$/;
    const SPD_REGEX = /^\d{1,3}$/;

    if (machSlashSpeedMatch !== null /* ".NN/" or "/NNN" entry */) {
      const speed = parseInt(machSlashSpeedMatch[2]);
      if (Number.isFinite(speed)) {
        if (speed < 100 || speed > 350) {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }

        this.managedSpeedDescendPilot = speed;
      }

      const mach = Math.round(parseFloat(machSlashSpeedMatch[1]) * 1000) / 1000;
      if (Number.isFinite(mach)) {
        if (mach < 0.15 || mach > 0.82) {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }

        this.managedSpeedDescendMachPilot = mach;
      }

      return true;
    } else if (value.match(MACH_REGEX) !== null /* ".NN" */) {
      // Entry of a Mach number only without a slash is allowed
      const mach = Math.round(parseFloat(value) * 1000) / 1000;
      if (Number.isFinite(mach)) {
        if (mach < 0.15 || mach > 0.82) {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }

        this.managedSpeedDescendMachPilot = mach;
      }

      return true;
    } else if (value.match(SPD_REGEX) !== null /* "NNN" */) {
      const speed = parseInt(value);
      if (Number.isFinite(speed)) {
        if (speed < 100 || speed > 350) {
          this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }

        // This is the maximum managed Mach number you can get, even with CI 100.
        // Through direct testing by a pilot, it was also determined that the plane gives Mach 0.80 for all of the tested CAS entries.
        const mach = 0.8;

        this.managedSpeedDescendPilot = speed;
        this.managedSpeedDescendMachPilot = mach;

        return true;
      }
    }

    this.setScratchpadMessage(NXSystemMessages.formatError);
    return false;
  }

  public trySetPerfClbPredToAltitude(value: string): boolean {
    if (value === Keypad.clrValue) {
      this.perfClbPredToAltitudePilot = undefined;
      return true;
    }

    const currentAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    const match = value.match(/^(FL\d{3}|\d{1,5})$/);
    if (match === null || match.length < 1) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const altOrFlString = match[1].replace('FL', '');
    const altitude = altOrFlString.length < 4 ? 100 * parseInt(altOrFlString) : parseInt(altOrFlString);

    if (!Number.isFinite(altitude)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    if (altitude < currentAlt || (this.cruiseLevel && altitude > this.cruiseLevel * 100)) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.perfClbPredToAltitudePilot = altitude;
    return true;
  }

  public trySetPerfDesPredToAltitude(value: string): boolean {
    if (value === Keypad.clrValue) {
      this.perfDesPredToAltitudePilot = undefined;
      return true;
    }

    const currentAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    const match = value.match(/^(FL\d{3}|\d{1,5})$/);
    if (match === null || match.length < 1) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    const altOrFlString = match[1].replace('FL', '');
    const altitude = altOrFlString.length < 4 ? 100 * parseInt(altOrFlString) : parseInt(altOrFlString);

    if (!Number.isFinite(altitude)) {
      this.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    if (altitude > currentAlt) {
      this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return false;
    }

    this.perfDesPredToAltitudePilot = altitude;
    return true;
  }

  private updatePerfPageAltPredictions() {
    const currentAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    if (this.perfClbPredToAltitudePilot !== undefined && currentAlt > this.perfClbPredToAltitudePilot) {
      this.perfClbPredToAltitudePilot = undefined;
    }

    if (this.perfDesPredToAltitudePilot !== undefined && currentAlt < this.perfDesPredToAltitudePilot) {
      this.perfDesPredToAltitudePilot = undefined;
    }
  }

  // FIXME, very sussy function
  public computeManualCrossoverAltitude(mach: number): number {
    const maximumCrossoverAltitude = 30594; // Crossover altitude of (300, 0.8)
    const mmoCrossoverAltitide = 24554; // Crossover altitude of (VMO, MMO)

    if (mach < 0.8) {
      return maximumCrossoverAltitude;
    }

    return maximumCrossoverAltitude + ((mmoCrossoverAltitide - maximumCrossoverAltitude) * (mach - 0.8)) / 0.02;
  }

  protected getActivePlanLegCount() {
    if (!this.flightPlanService.hasActive) {
      return 0;
    }

    return this.flightPlanService.active.legCount;
  }

  public getDistanceToDestination() {
    return this.guidanceController.alongTrackDistanceToDestination;
  }

  /**
   * Modifies the active flight plan to go direct to a specific waypoint, not necessarily in the flight plan
   */
  public async directToWaypoint(waypoint: Fix) {
    // FIXME fm pos
    const adirLat = ADIRS.getLatitude();
    const adirLong = ADIRS.getLongitude();
    const trueTrack = ADIRS.getTrueTrack();

    if (!adirLat.isNormalOperation() || !adirLong.isNormalOperation() || !trueTrack.isNormalOperation()) {
      return;
    }

    const ppos = {
      lat: adirLat.value,
      long: adirLong.value,
    };

    await this.flightPlanService.directToWaypoint(ppos, trueTrack.value, waypoint);
  }

  /**
   * Modifies the active flight plan to go direct to a specific leg
   * @param legIndex index of leg to go direct to
   */
  public async directToLeg(legIndex: number) {
    // FIXME fm pos
    const adirLat = ADIRS.getLatitude();
    const adirLong = ADIRS.getLongitude();
    const trueTrack = ADIRS.getTrueTrack();

    if (!adirLat.isNormalOperation() || !adirLong.isNormalOperation() || !trueTrack.isNormalOperation()) {
      return;
    }

    const ppos = {
      lat: adirLat.value,
      long: adirLong.value,
    };

    await this.flightPlanService.directToLeg(ppos, trueTrack.value, legIndex);
  }

  /**
   * Gets the navigation database ident (including cycle info).
   */
  public getNavDatabaseIdent(): DatabaseIdent | null {
    return this.navDbIdent;
  }

  public runFuelComputations(forPlan: FlightPlanIndex, computations: FuelPredComputations) {
    const plan = this.getFlightPlan(forPlan);

    if (plan.performanceData.zeroFuelWeight === null) {
      computations.tripFuel = null;
      computations.tripTime = null;
      computations.routeReserveFuel = null;
      computations.routeReserveFuelPercentage = plan.performanceData.routeReserveFuelPercentage;
      computations.alternateFuel = null;
      computations.alternateTime = null;
      computations.finalHoldingFuel = null;
      computations.finalHoldingTime = plan.performanceData.finalHoldingTime;
      computations.minimumDestinationFuel = null;
      computations.takeoffWeight = null;
      computations.landingWeight = null;
      computations.destinationFuelOnBoard = null;
      computations.alternateDestinationFuelOnBoard = null;
      computations.extraFuel = null;
      computations.extraTime = null;

      return computations;
    }

    const zfw = plan.performanceData.zeroFuelWeight;

    // Route final
    // TODO get final holding level from AMI
    const finalHoldingFuelFlow = 2 * A32NX_FuelPred.computeHoldingTrackFF(zfw, 120); // kg / h

    if (plan.performanceData.pilotFinalHoldingFuel !== null && plan.performanceData.pilotFinalHoldingTime !== null) {
      console.error('Cannot have both pilot entered final holding fuel and time');
    }

    computations.finalHoldingFuel =
      plan.performanceData.pilotFinalHoldingFuel !== null
        ? plan.performanceData.pilotFinalHoldingFuel
        : (plan.performanceData.finalHoldingTime / 60) * (finalHoldingFuelFlow / 1000);
    computations.finalHoldingTime =
      plan.performanceData.pilotFinalHoldingFuel !== null
        ? (plan.performanceData.pilotFinalHoldingFuel * 1000) / (finalHoldingFuelFlow / 60)
        : plan.performanceData.finalHoldingTime;

    // Route alternate

    if (plan.performanceData.pilotAlternateFuel !== null) {
      computations.alternateFuel = plan.performanceData.pilotAlternateFuel;
      computations.alternateTime = null;
    } else if (plan.destinationAirport && plan.alternateDestinationAirport) {
      const distanceToAlt = Avionics.Utils.computeGreatCircleDistance(
        plan.destinationAirport.location,
        plan.alternateDestinationAirport.location,
      );

      if (distanceToAlt < 20) {
        computations.alternateFuel = 0;
        computations.alternateTime = 0;
      } else {
        // TODO get cruise from alternate plan
        const placeholderFl = 120;
        // TODO get trip wind from alternate plan
        const airDistance = A32NX_FuelPred.computeAirDistance(Math.round(distanceToAlt), 0);

        const deviation =
          (zfw + computations.finalHoldingFuel - A32NX_FuelPred.refWeight) *
          A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.CORRECTIONS, true);
        if (20 < airDistance && airDistance < 200 && 100 < placeholderFl && placeholderFl < 290) {
          computations.alternateFuel =
            (A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.FUEL, true) +
              deviation) /
            1000;
          computations.alternateTime = A32NX_FuelPred.computeNumbers(
            airDistance,
            placeholderFl,
            A32NX_FuelPred.computations.TIME,
            true,
          );
        }
      }
    }

    // Route trip

    const groundDistance = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
    const airDistance = A32NX_FuelPred.computeAirDistance(groundDistance, plan.performanceData.pilotTripWind ?? 0);

    // Use the cruise level for calculations otherwise after cruise use descent altitude down to 10,000 feet.
    const altToUse =
      this.flightPhaseManager.phase >= FmgcFlightPhase.Descent
        ? SimVar.GetSimVarValue('PLANE ALTITUDE', 'Feet') / 100
        : plan.performanceData.cruiseFlightLevel;

    if (20 <= airDistance && airDistance <= 3100 && 100 <= altToUse && altToUse <= 390) {
      const deviation =
        (zfw + (computations.finalHoldingFuel ?? 0) + (computations.alternateFuel ?? 0) - A32NX_FuelPred.refWeight) *
        A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.CORRECTIONS, false);

      computations.tripFuel =
        (A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.FUEL, false) + deviation) /
        1000;
      computations.tripTime = A32NX_FuelPred.computeNumbers(
        airDistance,
        altToUse,
        A32NX_FuelPred.computations.TIME,
        false,
      );
    }

    // Route reserve

    if (this.isFlying()) {
      computations.routeReserveFuel = 0;
      computations.routeReserveFuelPercentage = 0;
    } else {
      if (plan.performanceData.pilotRouteReserveFuel === null) {
        const fivePercentWeight = (plan.performanceData.routeReserveFuelPercentage * computations.tripFuel) / 100;
        const fiveMinuteHoldingWeight = (5 * (finalHoldingFuelFlow / 60)) / 1000;

        computations.routeReserveFuel = Math.max(fivePercentWeight, fiveMinuteHoldingWeight);
        computations.routeReserveFuelPercentage = plan.performanceData.routeReserveFuelPercentage;
      } else {
        computations.routeReserveFuel = plan.performanceData.pilotRouteReserveFuel;
        computations.routeReserveFuelPercentage =
          (plan.performanceData.pilotRouteReserveFuel * 100) / computations.tripFuel;
      }
    }

    // Minimum destination fuel on board
    computations.minimumDestinationFuel =
      plan.performanceData.pilotMinimumDestinationFuelOnBoard ??
      computations.alternateFuel + computations.finalHoldingFuel;

    // TOW / LW
    computations.takeoffWeight = this.computeTakeoffWeight(forPlan);
    computations.landingWeight =
      computations.takeoffWeight !== null ? computations.takeoffWeight - computations.tripFuel : null;

    // EFOB
    computations.destinationFuelOnBoard = computations.landingWeight !== null ? computations.landingWeight - zfw : null;
    computations.destinationFuelOnBoard = computations.landingWeight
      ? computations.landingWeight - computations.alternateFuel - zfw
      : null;

    // Extra fuel
    if (plan.performanceData.blockFuel === null) {
      computations.extraFuel = 0;
      computations.extraTime = 0;
    } else {
      const fuelOnBoard = this.isAnEngineOn() ? this.getFOB() : plan.performanceData.blockFuel;

      computations.extraFuel =
        fuelOnBoard -
        computations.tripFuel -
        computations.minimumDestinationFuel -
        (this.isFlying() ? 0 : plan.performanceData.taxiFuel + computations.routeReserveFuel);
      computations.extraTime = (computations.extraFuel * 1000) / (finalHoldingFuelFlow / 60);
    }

    return computations;
  }

  // ---------------------------
  // CDUMainDisplay Types
  // ---------------------------

  protected abstract page: any;

  /**
   * Set a request from a subsystem to the MCDU
   */
  protected abstract setRequest(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'): void;
  protected abstract setScratchpadText(value: string): void;
  protected abstract setScratchpadMessage(message: McduMessage): void;
  protected abstract addNewAtsuMessage(code: AtsuStatusCodes): void;
}

/** Writes FM output words for both FMS. */
class FmArinc429OutputWord extends Arinc429OutputWord {
  private readonly localVars = [`L:A32NX_FM1_${this.name}`, `L:A32NX_FM2_${this.name}`];

  override async writeToSimVarIfDirty() {
    if (this.isDirty) {
      this.isDirty = false;
      return Promise.all(
        this.localVars.map((localVar) => Arinc429Word.toSimVarValue(localVar, this.word.value, this.word.ssm)),
      );
    }
    return Promise.resolve();
  }
}
