import { FmsErrorType } from '@fmgc/FmsError';
import { DataInterface } from '@fmgc/flightplanning/interface/DataInterface';
import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';
import { DataManager, FlightPlanIndex, FlightPlanService, GuidanceController } from '@fmgc/index';
import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { ArraySubject, Subject } from '@microsoft/msfs-sdk';
import { FmsErrorMessage } from 'instruments/src/MFD/FMC/FlightManagementComputer';
import { FmcAircraftInterface } from 'instruments/src/MFD/FMC/FmcAircraftInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmgcDataService } from 'instruments/src/MFD/FMC/fmgc';
import { TypeIMessage, TypeIIMessage } from 'instruments/src/MFD/shared/NXSystemMessages';
import { EfisSide, Fix, Waypoint } from '@flybywiresim/fbw-sdk';

export enum FmcOperatingModes {
  Master,
  Slave,
  Standby,
}

export interface FlightPhaseManagerProxyInterface {
  handleFcuAltKnobPushPull(distanceToDestination: number): void;

  handleFcuAltKnobTurn(distanceToDestination: number): void;

  handleFcuVSKnob(distanceToDestination: number, onStepClimbDescent: () => void): void;

  handleNewCruiseAltitudeEntered(newCruiseFlightLevel: number): void;

  tryGoInApproachPhase(): void;
}

/*
 * Handles requests inside each FlightManagementComputer (FMC).
 * DisplayInterface shouldn't be here, but WaypointEntryUtils requires on parameter with both DisplayInterface and DataInterface
 */
export interface FmcInterface extends FlightPhaseManagerProxyInterface, DataInterface, DisplayInterface {
  /**
   * Which operation mode is FMC in? Can be master, slave or standby.
   */
  get operatingMode(): FmcOperatingModes;
  set operatingMode(value: FmcOperatingModes);

  /**
   * Mfd reference, used for navigating to pages and opening prompts
   */
  get mfdReference(): (DisplayInterface & MfdDisplayInterface) | null;
  set mfdReference(value: DisplayInterface & MfdDisplayInterface);

  /**
   * FlightPlanService interface
   */
  get flightPlanService(): FlightPlanService;

  /**
   * FMGC data class, handles most data which didn't make it into the flight plan performance data so far
   */
  get fmgc(): FmgcDataService;

  /**
   * Returns guidance controller. Not synced, should move to something else TODO.
   */
  get guidanceController(): GuidanceController;

  /**
   * Returns navigation class, used for e.g. getting the a/c position.
   */
  get navigation(): NavigationProvider;

  /**
   * Navaid tuner
   */
  get navaidTuner(): NavaidTuner;

  /**
   * Returns fms errors
   */
  get fmsErrors(): ArraySubject<FmsErrorMessage>;

  getDataManager(): DataManager | null;

  /**
   * Primary aircraft interface, setting and reading SimVars, converting them to the internal FMS representation.
   * Should be the only place where we interact with SimVars, we're not there yet though.
   */
  get acInterface(): FmcAircraftInterface; // TODO not synced yet

  /**
   * Returns leg index (in the flight plan) of currently revised waypoint
   */
  get revisedWaypointIndex(): Subject<number | null>;

  /**
   * Returns flight plan index of currently revised waypoint
   */
  get revisedWaypointPlanIndex(): Subject<FlightPlanIndex | null>;

  /**
   * Returns, whether currently revised waypoint is part of ALTN flight plan
   */
  get revisedWaypointIsAltn(): Subject<boolean | null>;

  /**
   * Returns, whether number 2&3 engines were started
   */
  get enginesWereStarted(): Subject<boolean>;

  /**
   * Returns currently revised waypoint as Fix
   */
  revisedWaypoint(): Fix | undefined;

  /**
   * Set revised waypoint, i.e. after calling the context menu on the FPLN page
   */
  setRevisedWaypoint(index: number, planIndex: number, isAltn: boolean): void;

  /**
   * Reset revised waypoint, i.e. after completing a revision
   */
  resetRevisedWaypoint(): void;

  /**
   * Pilot-stored lat-long waypoints
   */
  get latLongStoredWaypoints(): Waypoint[];

  /**
   * Pilot-stored place-bearing-distance waypoints
   */
  get pbdStoredWaypoints(): Waypoint[];

  /**
   * Pilot-stored place-bearing waypoints
   */
  get pbxStoredWaypoints(): Waypoint[];

  /**
   * Delete all pilot-stored waypoints
   */
  deleteAllStoredWaypoints(): void;

  swapNavDatabase(): Promise<void>;

  /** in kilograms */
  getLandingWeight(): number | null;

  /** in kilograms */
  getTakeoffWeight(): number | null;

  /** in kilograms */
  getTripFuel(): number | null;

  /** as flight level */
  getRecMaxFlightLevel(): number | null;

  /** as flight level */
  getOptFlightLevel(): number | null;

  /**
   * Add message to fmgc message queue
   * @param _message MessageObject
   * @param _isResolvedOverride Function that determines if the error is resolved at this moment (type II only).
   * @param _onClearOverride Function that executes when the error is actively cleared by the pilot (type II only).
   */
  addMessageToQueue(
    _message: TypeIMessage | TypeIIMessage,
    _isResolvedOverride: (() => boolean) | undefined,
    _onClearOverride: (() => void) | undefined,
  ): void;

  /**
   * Removes a message from the queue
   * @param value {String}
   */
  removeMessageFromQueue(value: string): void;

  /**
   * Checks whether a waypoint is currently in use
   * @param waypoint the waypoint to look for
   */
  isWaypointInUse(waypoint: Waypoint): Promise<boolean>;

  clearLatestFmsErrorMessage(): void;

  /**
   * Calling this function with a message should display the message in the FMS' message area,
   * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
   * into the appropriate message for the UI
   *
   * @param errorType the message to show
   */
  showFmsErrorMessage(errorType: FmsErrorType): void;

  /**
   * Used to update the ND display
   * @param planDisplayForPlan Legs of which FlightPlanIndex should be centered
   * @param planDisplayLegIndex Leg index within flight plan to be centered
   * @param planDisplayInAltn If leg to be centered belongs to alternate flight plan
   */
  updateEfisPlanCentre(
    side: EfisSide,
    planDisplayForPlan: number,
    planDisplayLegIndex: number,
    planDisplayInAltn: boolean,
  ): void;

  clearCheckSpeedModeMessage(): void;
}
