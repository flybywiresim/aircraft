// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { McduMessage } from '../messages/NXSystemMessages';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FmsDataInterface } from '@fmgc/flightplanning/interface/FmsDataInterface';
import {
  DatabaseIdent,
  EfisSide,
  EnrouteNdbNavaid,
  Fix,
  IlsNavaid,
  NdbNavaid,
  TerminalNdbNavaid,
  VhfNavaid,
} from '@flybywiresim/fbw-sdk';
import { FuelPlanningPhases } from './A32NX_Core/A32NX_FuelPred';
import { ScratchpadDataLink } from './A320_Neo_CDU_Scratchpad';
import { AdfRadioTuningStatus, MmrRadioTuningStatus, VorRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';
import { NXSpeedsApp } from './NXSpeeds';
import { Navigation, SelectedNavaid } from '@fmgc/navigation/Navigation';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { NavigationDatabase } from '@fmgc/NavigationDatabase';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { DataManager } from '@fmgc/flightplanning/DataManager';
import { EfisInterface } from '@fmgc/efis/EfisInterface';

export type LskCallback = (
  /** The scratchpad content when the LSK was pressed. */
  value: string,
  /** Pushes the value back into the scratchpad. */
  scratchpadCallback: () => void,
) => void;

export type LskDelayFunction = () => number;

// TODO should this be here?
export enum SimbriefOfpState {
  NotLoaded = 0,
  Requested = 1,
  Loaded = 2,
}

export type FuelPredComputations = {
  tripFuel: number | null;
  tripTime: number | null;
  routeReserveFuel: number | null;
  routeReserveFuelPercentage: number | null;
  alternateFuel: number | null;
  alternateTime: number | null;
  finalHoldingFuel: number | null;
  finalHoldingTime: number | null;
  minimumDestinationFuel: number | null;
  takeoffWeight: number | null;
  landingWeight: number | null;
  destinationFuelOnBoard: number | null;
  alternateDestinationFuelOnBoard: number | null;
  extraFuel: number | null;
  extraTime: number | null;
};

interface LegacyFmsPageDrawingInterface {
  clearDisplay(webSocketDraw?: boolean): void;
  setTemplate(template: any[][], large?: boolean): void;
  setTitle(title: string): void;
  setArrows(up: boolean, down: boolean, left: boolean, right: boolean): void;
  getDelaySwitchPage(): number;
  getDelayBasic(): number;
  getDelayMedium(): number;
  getDelayHigh(): number;
  getDelayFuelPred(): number;
  getDelayWindLoad(): number;
  setScratchpadText(value: string): void;
  setScratchpadUserData(value: string): void;
  removeMessageFromQueue(value: string): void;
  activateMcduScratchpad(): void;
  isSubsystemRequesting(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'): boolean;
  requestUpdate(): void;

  pageRedrawCallback?: () => void;
  pageUpdate?: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onUp: () => void;
  onDown: () => void;
  onUnload: () => void;
  onAirport: typeof EmptyCallback.Void;
  page: Record<string, number>;
  SelfPtr: ReturnType<typeof setTimeout> | false;
  onLeftInput: LskCallback[];
  onRightInput: LskCallback[];
  leftInputDelay: LskDelayFunction[];
  rightInputDelay: LskDelayFunction[];
  activeSystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC';
  readonly PageTimeout: {
    Fast: number;
    Medium: number;
    Dyn: number;
    Default: number;
    Slow: number;
  };
  returnPageCallback: typeof EmptyCallback.Void | null;
  mcduScratchpad: ScratchpadDataLink;
}

interface LegacyFmsPageFmsInterface extends FmsDataInterface, FmsDisplayInterface {
  getFlightPlan(index: FlightPlanIndex): ReturnType<FlightPlanInterface['get']>;
  getAlternateFlightPlan(index: FlightPlanIndex): ReturnType<FlightPlanInterface['get']>['alternateFlightPlan'];
  eraseTemporaryFlightPlan(callback?: typeof EmptyCallback.Void): void;
  insertTemporaryFlightPlan(callback?: typeof EmptyCallback.Void): void;
  updateConstraints(): void;
  setScratchpadMessage(message: McduMessage): void;
  logTroubleshootingError(msg: any): void;
  updateTowerHeadwind(): void;
  onToRwyChanged(): void;
  setGroundTempFromOrigin(forPlan: FlightPlanIndex): void;
  directToWaypoint(waypoint: Fix): Promise<void>;
  directToLeg(legIndex: number): Promise<void>;
  toggleWaypointOverfly(index, fpIndex, forAlternate, callback?: typeof EmptyCallback.Void): void;
  insertWaypoint(
    newWaypointTo,
    fpIndex,
    forAlternate,
    index,
    before?: boolean,
    callback?: typeof EmptyCallback.Boolean,
    bypassTmpy?: boolean,
  ): void;
  navModeEngaged(): boolean;
  isFlying(): boolean;
  trySetZeroFuelWeightZFWCG(s: string, forPlan: FlightPlanIndex): boolean;
  /** @deprecated use getGrossWeight */
  getGW(): number;
  getCG(): number;
  getFOB(): number | undefined;
  trySetRouteFinalFuel(s: string, forPlan: FlightPlanIndex): boolean;
  trySetRouteAlternateFuel(altFuel: string, forPlan: FlightPlanIndex): Promise<boolean>;
  getDestEFOB(): number | null;
  trySetRouteReservedFuel(s: string, forPlan: FlightPlanIndex): boolean;
  trySetMinDestFob(fuel: string, forPlan: FlightPlanIndex): Promise<boolean>;
  checkEFOBBelowMin(): void;
  getNavDatabaseIdent(): DatabaseIdent | null;
  switchNavDatabase(): Promise<void>;
  /** This one is a mess.. */
  updateCoRoute(coRouteNum, callback?: typeof EmptyCallback.Boolean): Promise<void>;
  updateFlightNo(flightNo: string, forPlan: FlightPlanIndex, callback?: typeof EmptyCallback.Boolean): Promise<void>;
  setCruiseFlightLevelAndTemperature(input: string, forPlan: FlightPlanIndex): boolean;
  getCoRouteList(): Promise<void>;
  tryUpdateAltDestination(altDestIdent: string, forPlan: FlightPlanIndex): Promise<boolean>;
  tryUpdateTropo(tropo: string, forPlan: FlightPlanIndex): boolean;
  tryUpdateFromTo(fromTo: string, forPlan: FlightPlanIndex, callback?: typeof EmptyCallback.Boolean): void;
  trySetGroundTemp(scratchpadValue: string, forPlan: FlightPlanIndex): void;
  goToFuelPredPage(forPlan: FlightPlanIndex): void;
  trySetBlockFuel(s: string, forPlan: FlightPlanIndex): boolean;
  tryFuelPlanning(): boolean;
  trySetTaxiFuelWeight(s: string, forPlan: FlightPlanIndex): boolean;
  trySetRouteReservedPercent(s: string, forPlan: FlightPlanIndex): boolean;
  trySetRouteFinalTime(s: string, forPlan: FlightPlanIndex): boolean;
  trySetAverageWind(s: string, forPlan: FlightPlanIndex): boolean;
  getOrSelectNavaidsByIdent(
    ident: string,
    callback: (navaid: EnrouteNdbNavaid | TerminalNdbNavaid | VhfNavaid) => void,
  ): void;

  isFmTuningActive(): boolean;
  isMmrTuningLocked(): boolean;
  deselectedNavaids: string[];
  getVorTuningData(index: 1 | 2): VorRadioTuningStatus;
  setManualVor(index: 1 | 2, facilityOrFrequency: number | VhfNavaid | null): void;
  setVorCourse(index: 1 | 2, course: number): void;
  getMmrTuningData(index: 1 | 2): MmrRadioTuningStatus;
  setManualIls(facilityOrFrequency: number | IlsNavaid | null): Promise<void>;
  setIlsCourse(course: number | null, backcourse?: boolean): void;
  getAdfTuningData(index: 1 | 2): AdfRadioTuningStatus;
  setManualAdf(index: 1 | 2, facilityOrFrequency: number | NdbNavaid | null): void;
  getOrSelectILSsByIdent(ident: string, callback: (navaid: IlsNavaid) => void): void;
  getOrSelectVORsByIdent(ident: string, callback: (navaid: VhfNavaid) => void): void;
  getOrSelectNDBsByIdent(ident: string, callback: (navaid: NdbNavaid) => void): void;
  trySetV1Speed(s: string): boolean;
  trySetVRSpeed(s: string): boolean;
  trySetV2Speed(s: string): boolean;
  trySetTakeOffTransAltitude(s: string): boolean;
  trySetThrustReductionAccelerationAltitude(s: string): Promise<boolean>;
  trySetEngineOutAcceleration(s: string): Promise<boolean>;
  trySetThrustReductionAccelerationAltitudeGoaround(s: string): Promise<boolean>;
  trySetEngineOutAccelerationAltitudeGoaround(s: string): Promise<boolean>;
  trySetFlapsTHS(s: string): boolean;
  setPerfTOFlexTemp(s: string): boolean;
  getOriginTransitionAltitude(): number | undefined;
  getDestinationTransitionLevel(): number | undefined;
  getNavModeSpeedConstraint(): number;
  trySetPreSelectedClimbSpeed(s: string): boolean;
  tryUpdateCostIndex(costIndex: string, forPlan: FlightPlanIndex): boolean;
  computeTakeoffWeight(forPlan: FlightPlanIndex): number;
  trySetPerfClbPredToAltitude(value: string): boolean;
  trySetPreSelectedCruiseSpeed(s: string): boolean;
  trySetPerfDesPredToAltitude(value: string): boolean;
  trySetManagedDescentSpeed(value: string): boolean;
  getDistanceToDestination(): number | undefined;
  setPerfApprQNH(s: string): boolean;
  setPerfApprTemp(s: string): boolean;
  setPerfApprWind(s: string): boolean;
  updatePerfSpeeds(): void;
  setPerfApprTransAlt(s: string): boolean;
  setPerfApprVApp(s: string): boolean;
  setPerfApprFlaps3(v: boolean): void;
  setPerfApprMDA(s: string): boolean;
  setPerfApprDH(s: string): boolean;
  computeManualCrossoverAltitude(mach: number): number;
  getMaxFlCorrected(fl?: number): number;
  isAllEngineOn(): boolean;
  trySetCruiseFlCheckInput(input: string, forPlan: FlightPlanIndex): boolean;
  trySetProgWaypoint(s: string, callback?: typeof EmptyCallback.Boolean): void;
  isOnGround(): boolean;
  getSelectedNavaids(): SelectedNavaid[];
  deselectNavaid(icao: string): void;
  reselectNavaid(icao: string): void;
  getOrSelectWaypointByIdent(ident: string, callback: (fix: Fix) => void): void;
  getIsaTemp(alt: number): number;
  runFuelComputations(forPlan: FlightPlanIndex, computations: FuelPredComputations): FuelPredComputations;

  flightPlanService: FlightPlanService;
  navigationDatabase: NavigationDatabase;
  /** This one is a mess.. */
  coRoute: any;
  flightPhaseManager: FlightPhaseManager;
  guidanceController?: GuidanceController;
  dataManager?: DataManager;
  navigation?: Navigation;
  v1Speed: number | null;
  vRSpeed: number | null;
  v2Speed: number | null;
  holdDecelReached: boolean;
  holdIndex: number;
  holdSpeedTarget?: number;
  fmgcMesssagesListener: ViewListener.ViewListener;
  efisInterfaces?: Record<EfisSide, EfisInterface>;
  _fuelPredDone: boolean;
  _checkWeightSettable: boolean;
  /** @deprecated */
  zeroFuelWeight?: number;
  _isBelowMinDestFob: boolean;
  // TODO add types
  simbriefOfp: any;
  simbriefOfpState: SimbriefOfpState;
  /** another mess */
  simbrief: any;
  /** @deprecated */
  costIndex: number | undefined;
  cruiseLevel: number | undefined;
  tempCurve: any; // we don't have the MSFS SDK typings for these curves
  casToMachManualCrossoverCurve: any;
  machToCasManualCrossoverCurve: any;
  tropo: number | undefined;
  isTropoPilotEntered: boolean;
  /** @deprecated get value from flight plan performance data */
  blockFuel?: number;
  get takeOffWeight(): number;
  _fuelPlanningPhase: FuelPlanningPhases;
  _deltaTime: number;
  unconfirmedV1Speed?: number;
  unconfirmedVRSpeed?: number;
  unconfirmedV2Speed?: number;
  computedVgd?: number;
  computedVfs?: number;
  computedVss?: number;
  computedVls?: number;
  flaps?: 0 | 1 | 2 | 3 | null;
  ths?: number | null;
  perfTOTemp: number;
  _toFlexChecked: boolean;
  preSelectedClbSpeed?: number;
  preSelectedCrzSpeed?: number;
  perfClbPredToAltitudePilot?: number;
  perfDesPredToAltitudePilot?: number;
  managedSpeedTarget: number;
  managedSpeedTargetIsMach: boolean;
  managedSpeedClimb: number;
  managedSpeedClimbMach: number;
  climbSpeedLimit: number;
  climbSpeedLimitAlt: number;
  managedSpeedCruise: number;
  managedSpeedCruiseMach: number;
  managedSpeedDescendPilot?: number;
  managedSpeedDescend: number;
  managedSpeedDescendMachPilot?: number;
  managedSpeedDescendMach: number;
  perfApprQNH: number;
  perfApprTemp: number;
  perfApprWindHeading: number;
  perfApprWindSpeed: number;
  approachSpeeds?: NXSpeedsApp;
  vApp: number;
  perfApprFlaps3: boolean;
  perfApprMDA: number | null;
  perfApprDH: 'NO DH' | number | null;
  constraintAlt: number;
  _activeCruiseFlightLevelDefaulToFcu: boolean;
  progBearing: number;
  progDistance: number;
  progWaypointIdent: string | undefined;
  /** Mess.. replace with wind manager. */
  winds: {
    climb: any[];
    cruise: any[];
    des: any[];
    alternate: any | null;
  };
  isTrueRefMode: boolean;
}

/** This breaks some circular refs, and tells us what we need a shim for to wrap legacy pages in future. */
export type LegacyFmsPageInterface = LegacyFmsPageDrawingInterface & LegacyFmsPageFmsInterface;
