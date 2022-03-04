/**
 * The current vertical navigation state.
 */
export enum VNavMode {
  /** VNAV Disabled. */
  Disabled,

  /** VNAV Enabled. */
  Enabled
}

/**
 * The current VNAV path mode.
 */
export enum VNavPathMode {
  /** VNAV path is not active. */
  None,

  /** VNAV path is armed for capture. */
  PathArmed,

  /** VNAV path is actively navigating. */
  PathActive,

  /** The current VNAV path is not valid. */
  PathInvalid
}

/**
 * The current VNAV approach guidance mode.
 */
export enum VNavApproachGuidanceMode {
  /** VNAV is not currently following approach guidance. */
  None,

  /** VNAV has armed ILS glideslope guidance for capture. */
  GSArmed,

  /** VNAV is actively following ILS glideslope guidance. */
  GSActive,

  /** VNAV RNAV glidepath guidance is armed for capture. */
  GPArmed,

  /** VNAV is actively follow RNAV glidepath guidance. */
  GPActive
}

/**
 * The current VNAV altitude capture type.
 */
export enum VNavAltCaptureType {
  /** Altitude capture is not armed. */
  None,

  /** Altitude will capture the selected altitude. */
  Selected,

  /** Altitude will capture the VANV target altitude. */
  VNAV
}

/**
 * A leg in the calculated VNAV plan.
 */
export interface VNavLeg {
  /** The index of the flight plan segment. */
  segmentIndex: number,

  /** The index of the leg within the plan segment. */
  legIndex: number,

  /** The name of the leg. */
  name: string,

  /** The fpa of the leg. */
  fpa: number,

  /** The distance of the leg. */
  distance: number,

  /** The distance from the end of the leg to the TOD, if any. */
  todDistance?: number,

  /** If the leg is a bottom of descent. */
  isBod: boolean,

  /** Whether or not the altitude provided is advisory. */
  isAdvisory: boolean,

  /** The altitude that the leg ends at. */
  altitude: number,

  /** Whether or not the constraint is user defined. */
  isUserDefined: boolean,

  /** The constrant altitude assigned to this leg that is invalid, if one exists. */
  invalidConstraintAltitude?: number
}

/**
 * A located VNAV constraint.
 */
export interface VNavConstraint {
  /** The global leg index for the constraint. */
  index: number,

  /** The altitude of the constraint. */
  altitude: number,

  /**
   * Whether or not this constraint is a target that will be held at
   * during a level-off or whether it will instead be passed through
   * with no level off.
   */
  isTarget: boolean,

  /** Whether or not this constraint is the last constraint prior to a MANSEQ or other VNAV ineligible leg type. */
  isPathEnd: boolean,

  /** If this constraint isPathEnd, what is the leg index of the next vnav eligible leg. */
  nextVnavEligibleLegIndex?: number,

  /** The name of the leg at this constraint. */
  name: string,

  /** The total distance of the legs that make up this constriant segment. */
  distance: number,

  /** The total distance from the end along the legs in the constraint that the TOD lies. */
  todDistance: number,

  /** The flight path angle to take through the legs in this constraint. */
  fpa: number,

  /** The legs contained in this constraint segment. */
  legs: VNavLeg[],

  /** The type of constraint segment. */
  type: 'normal' | 'dest' | 'cruise' | 'dep' | 'direct' | 'missed' | 'manual',

  /** Whether or not this constraint is beyond the FAF. */
  isBeyondFaf: boolean
}

/**
 * A segment in the VNAV flight plan.
 */
export interface VNavPlanSegment {
  /** The index offset that the segment begins at. */
  offset: number,

  /** The VNAV legs contained in the segment. */
  legs: VNavLeg[]
}

/**
 * Events published by the VNAV system on the bus.
 */
export interface VNavSimVarEvents {
  /** The vertical deviation. */
  vnavVDev: number,

  /** The VNAV target altitude. */
  vnavTargetAlt: number,

  /** The VNAV path mode. */
  vnavPathMode: VNavPathMode,

  /** The VNAV mode. */
  vnavMode: VNavMode,

  /** The VNAV approach guidance mode. */
  vnavApproachMode: VNavApproachGuidanceMode,

  /** The VNAV distance to the next TOD. */
  vnavTodDistance: number,

  /** The VNAV current alt capture type. */
  vnavAltCaptureType: VNavAltCaptureType,

  /** The VNAV next TOD leg index. */
  vnavTodLegIndex: number,

  /** The VNAV next BOD leg index. */
  vnavBodLegIndex: number,

  /** The VNAV current constraint leg index. */
  vnavConstraintLegIndex: number,

  /** The VNAV current constraint altitude in feet (used in PFD Altimeter). */
  vnavConstraintAltitude: number,

  /** The VNAV next constraint altitude in feet (used in MFD FPL Page). */
  vnavNextConstraintAltitude: number,

  /** The VNAV distance to the next BOD. */
  vnavBodDistance: number,

  /** The VNAV next TOD distance from the end of the leg. */
  vnavTodLegDistance: number,

  /** The VNAV current required FPA. */
  vnavFpa: number,

  /** The current LPV vertical deviation. */
  vnavLpvVDev: number,

  /** The current remaining LPV distance. */
  vnavLpvDistance: number,

  /** The required VS to the current constraint. */
  vnavRequiredVs: number
}