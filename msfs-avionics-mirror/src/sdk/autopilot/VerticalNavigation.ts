
/**
 * The current vertical navigation state.
 */
export enum VNavState {
  /** VNAV Disabled. */
  Disabled,

  /** VNAV Enabled and Inactive. */
  Enabled_Inactive,

  /** VNAV Enabled and Active. */
  Enabled_Active
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
 * The current Approach Guidance Mode.
 */
export enum ApproachGuidanceMode {
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
 * The current Vertical Flight Phase.
 */
export enum VerticalFlightPhase {
  /** The current vertical phase is Climb. */
  Climb,

  /** The current vertical phase is Descent. */
  Descent
}

/**
 * A Vertical Flight Plan cooresponding to a lateral flight plan.
 */
export interface VerticalFlightPlan {

  /** The Flight Plan Index */
  planIndex: number;

  /** The Flight Plan Segments in the VerticalFlightPlan (should always be the same as the lateral plan) */
  segments: VNavPlanSegment[];

  /** The VNav Constraints in this Vertical Flight Plan */
  constraints: VNavConstraint[];

  /** The global leg index of the destination leg, or undefined */
  destLegIndex: number | undefined;

  /** The global leg index of the FAF leg, or undefined */
  fafLegIndex: number | undefined;

  /** The global leg index of the first descent constraint, or undefined */
  firstDescentConstraintLegIndex: number | undefined;

  /** The global leg index of the last descent constraint, or undefined */
  lastDescentConstraintLegIndex: number | undefined;

  /** The global leg index of the first missed approach leg, or undefined */
  missedApproachStartIndex: number | undefined;

  /** The global leg index of the currently active vertical direct leg, or undefined */
  verticalDirectIndex: number | undefined;

  /** The current along leg distance for the active lateral leg in this flight plan */
  currentAlongLegDistance: number | undefined;

  /** Whether the cooresponding lateral flight plan has changed */
  planChanged: boolean;
}

/**
 * Details about the next TOD and BOD.
 */
export interface TodBodDetails {
  /**
   * The global index of the leg that contains the next BOD, or -1 if there is no BOD. The next BOD is defined as the
   * next point in the flight path including or after the active leg where the VNAV profile transitions from a descent
   * to a level-off, discontinuity, or the end of the flight path.
   */
  bodLegIndex: number;

  /**
   * The global index of the leg that contains the TOD associated with the next BOD, or -1 if there is no such TOD. The
   * TOD is defined as the point along the flight path at which the aircraft will intercept the VNAV profile continuing
   * to the next BOD if it continues to fly level at its current altitude.
   */
  todLegIndex: number;

  /** The distance from the TOD to the end of its containing leg, in meters. */
  todLegDistance: number;

  /** The distance along the flight path from the airplane's present position to the TOD, in meters. */
  distanceFromTod: number;

  /** The distance along the flight path from the airplane's present position to the BOD, in meters. */
  distanceFromBod: number;

  /** The global index of the leg that contains the current VNAV constraint. */
  currentConstraintLegIndex: number;
}

/**
 * A leg in the calculated Vertical Flight Plan.
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

  /** Whether the leg is eligible for VNAV. */
  isEligible: boolean;

  /** If the leg is a bottom of descent. */
  isBod: boolean,

  /** Whether or not the altitude provided is advisory. */
  isAdvisory: boolean,

  /** The altitude that the leg ends at. */
  altitude: number,

  /** Whether or not the constraint at this leg is user defined. */
  isUserDefined: boolean,

  /** Whether or not the leg is a direct to target. */
  isDirectToTarget: boolean,

  /** The constrant altitude assigned to this leg that is invalid, if one exists. */
  invalidConstraintAltitude?: number
}

/**
 * A Vertical Flight Plan Constraint.
 */
export interface VNavConstraint {
  /** The global leg index for the constraint. */
  index: number,

  /** The min altitude of the constraint. */
  minAltitude: number,

  /** The max altitude of the constraint. */
  maxAltitude: number,

  /** The target altitude of the constraint. */
  targetAltitude: number,

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

  /** The flight path angle to take through the legs in this constraint. */
  fpa: number,

  /** The legs contained in this constraint segment. */
  legs: VNavLeg[],

  /** The type of constraint segment. */
  type: 'normal' | 'dest' | 'cruise' | 'dep' | 'direct' | 'missed' | 'manual' | 'climb' | 'descent',

  /** Whether or not this constraint is beyond the FAF. */
  isBeyondFaf: boolean
}

/**
 * A segment in the Vertical Flight Plan.
 */
export interface VNavPlanSegment {
  /** The index offset that the segment begins at. */
  offset: number,

  /** The VNAV legs contained in the segment. */
  legs: VNavLeg[]
}

/**
 * The current state of VNAV availability from the director.
 */
export enum VNavAvailability {
  Available = 'Available',
  InvalidLegs = 'InvalidLegs'
}