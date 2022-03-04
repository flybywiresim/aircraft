import { Subject } from '..';
import { PlaneDirector } from './PlaneDirector';
import { NavToNavManager } from './NavToNavManager';

export enum APVerticalModes {
  NONE,
  PITCH,
  VS,
  FLC,
  ALT,
  VNAV,
  GP,
  GS,
  CAP
}

export enum APLateralModes {
  NONE,
  ROLL,
  LEVEL,
  GPSS,
  HEADING,
  VOR,
  LOC,
  BC,
  NAV
}

export enum APAltitudeModes {
  NONE,
  ALTS,
  ALTV
}

/** AP Values Object */
export type APValues = {
  /** Selected Altitude */
  readonly selectedAltitude: Subject<number>,
  /** Selected Vertical Speed */
  readonly selectedVerticalSpeed: Subject<number>,
  /** Selected IAS for FLC */
  readonly selectedIas: Subject<number>,
  /** Selected Pitch Ref */
  readonly selectedPitch: Subject<number>,
  /** Selected Heading Ref */
  readonly selectedHeading: Subject<number>,
  /** Captured Altitude */
  readonly capturedAltitude: Subject<number>,
  /** Approach is Activated in Flight Plan */
  readonly approachIsActive: Subject<boolean>,
  /** The activated approach has an LPV GP */
  readonly approachHasGP: Subject<boolean>,
  /** The Nav 1 Radio is tuned to an ILS with a GS signal */
  readonly nav1HasGs: Subject<boolean>,
  /** The Nav 2 Radio is tuned to an ILS with a GS signal */
  readonly nav2HasGs: Subject<boolean>,
  /** The Active Lateral Mode */
  readonly lateralActive: Subject<APLateralModes>,
  /** The Active Vertical Mode */
  readonly verticalActive: Subject<APVerticalModes>,
  /** NavToNav Manager Requested Loc Arm */
  navToNavLocArm: boolean
}

/**
 * An autopilot configuration.
 */
export interface APConfig {
  /**
   * Creates the autopilot's heading mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's heading mode director.
   */
  createHeadingDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's roll mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's heading mode director.
   */
  createRollDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's wings level mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's wings level mode director.
   */
  createWingLevelerDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's GPS LNAV mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's GPS LNAV mode director.
   */
  createGpssDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's VOR mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's VOR mode director.
   */
  createVorDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's LOC mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's LOC mode director.
   */
  createLocDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's back-course mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's back-course mode director.
   */
  createBcDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's pitch mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's pitch mode director.
   */
  createPitchDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's vertical speed mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's vertical speed mode director.
   */
  createVsDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's flight level change mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's flight level change mode director.
   */
  createFlcDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's altitude hold mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's altitude hold mode director.
   */
  createAltHoldDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's altitude capture mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's altitude capture mode director.
   */
  createAltCapDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's VNAV mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's VNAV mode director.
   */
  createVNavDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's GPS glidepath mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's GPS glidepath mode director.
   */
  createGpDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's ILS glideslope mode director.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's ILS glideslope mode director.
   */
  createGsDirector(apValues: APValues): PlaneDirector | undefined;

  /**
   * Creates the autopilot's nav-to-nav manager.
   * @param apValues The autopilot's state values.
   * @returns The autopilot's nav-to-nav manager.
   */
  createNavToNavManager(apValues: APValues): NavToNavManager | undefined;

  /** The autopilot's default lateral mode. */
  defaultLateralMode: APLateralModes;

  /** The autopilot's default vertical mode. */
  defaultVerticalMode: APVerticalModes;
}