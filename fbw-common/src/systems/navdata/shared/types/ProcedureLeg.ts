import { Degrees, DegreesMagnetic, Feet, NauticalMiles } from 'msfs-geo';
import { Knots, Minutes } from './Common';
import { Fix } from './BaseFix';

export interface ProcedureLeg {
  procedureIdent: string;
  /**
   * Leg termination type according to ARICN424
   */
  type: LegType;
  /**
   * Should the termination of this leg be overflown (not flown by in a turn)
   */
  overfly: boolean;
  /**
   * The waypoint assocaited with the termination of this leg
   * For VM legs at the end of a STAR, this shall be the airport reference point
   */
  waypoint?: Fix;
  /**
   * Radio navaid to be used for this leg
   */
  recommendedNavaid?: Fix;
  /**
   * Distance from the recommended navaid, to the waypoint
   */
  rho?: NauticalMiles;
  /**
   * Magnetic bearing from the recommended navaid, to the waypoint
   * For AF legs this is the fix radial
   */
  theta?: DegreesMagnetic;
  /**
   * Defines the arc for RF legs
   */
  arcCentreFix?: Fix;
  /**
   * Defines the radius for RF legs, or Hx legs.
   */
  arcRadius?: NauticalMiles;
  /**
   * length if it is specified in distance
   * exact meaning depends on the leg type
   * mutually exclusive with lengthTime
   * For PI legs, the excursion distance from the waypoint
   */
  length?: NauticalMiles;
  /**
   * length if it is specified in time
   * exact meaning depends on the leg type
   * mutually exclusive with length
   */
  lengthTime?: Minutes;
  /**
   * Required Navigation Performance for this leg
   */
  rnp?: NauticalMiles;
  /**
   * Transition altitude
   * Should be specified on the first leg of each procedure, or default 18000 feet if not specified
   */
  transitionAltitude?: Feet;
  /**
   * Specifies the meaning of the altitude1 and altitude2 properties
   */
  altitudeDescriptor?: AltitudeDescriptor;
  /**
   * altitudeDescriptor property specifies the meaning of this property
   */
  altitude1?: Feet;
  /**
   * altitudeDescriptor property specifies the meaning of this property
   */
  altitude2?: Feet;
  /**
   * On SIDS the speed limit applies backwards from termination of this leg,
   * to either the previous speed limit terminator, or the start of the procedure.
   * On STARs and approaches, the speed limit applies forwards until either
   * the end of the procedure, or the next speed limit
   * The exact meaning is coded in the speedDescriptor property
   */
  speed?: Knots;
  /**
   * Specifies the meaning of the speed property
   */
  speedDescriptor?: SpeedDescriptor;
  /**
   * Specifies the direction of the turn to capture this leg (the start of the leg)
   * Should be specified for any track change > 135°
   * Assume valid if defined as L or R
   */
  turnDirection?: TurnDirection;
  /**
   * Specifies the outbound magnetic course associated with the termination of this leg
   * For AF legs this is the boundary radial
   * For CF legs this is the course to the specified fix
   */
  magneticCourse?: DegreesMagnetic;
  /**
   * Specifies the descent vertical angle (negative) referenced to the terminating fix
   * Should be projected back up to the last coded altitude
   */
  verticalAngle?: Degrees;
  /**
   * Approach-specific waypoint type
   */
  approachWaypointDescriptor?: ApproachWaypointDescriptor;
  /**
   * General waypoint type
   */
  waypointDescriptor?: WaypointDescriptor;
}

export enum AltitudeDescriptor {
  None,
  /**
   * @, At in altitude1
   */
  AtAlt1 = '@',
  /**
   * +, at or above in altitude1
   */
  AtOrAboveAlt1 = '+',
  /**
   * -, at or below in altitude1
   */
  AtOrBelowAlt1 = '-',
  /**
   * B, range between altitude1 (higher) and altitide2 (lower)
   */
  BetweenAlt1Alt2 = 'B',
  /**
   * C, at or above in altitude 2
   * Only permitted for CD, CF, CR, FC, FD, TF, VD, VR in SIDs
   * Indicates conditional altitude termination
   */
  AtOrAboveAlt2 = 'C',
  /**
   * G, altitude1 At for FAF, altitude2 is glideslope MSL
   */
  AtAlt1GsMslAlt2 = 'G',
  /**
   * H, Alt1 is At or above for FAF, Alt2 is glideslope MSL
   */
  AtOrAboveAlt1GsMslAlt2 = 'H',
  /**
   * I, Alt1 is at for FACF, Alt2 is glidelope intercept
   */
  AtAlt1GsIntcptAlt2 = 'I',
  /**
   * J, Alt1 is at or above for FACF, Alt2 is glideslope intercept
   */
  AtOrAboveAlt1GsIntcptAlt2 = 'J',
  /**
   * V, Alt1 is procedure alt for step-down, Alt2 is at alt for vertical path angle
   */
  AtOrAboveAlt1AngleAlt2 = 'V',
  /**
   * X, Alt 1 is at, Alt 2 is on the vertical angle
   */
  AtAlt1AngleAlt2 = 'X',
  /**
   * Y, Alt 1 is at or below, Alt 2 is on the vertical angle
   */
  AtOrBelowAlt1AngleAlt2 = 'Y',
}

export enum SpeedDescriptor {
  Mandatory = '@',
  Minimum = '+',
  Maximum = '-',
}

export enum TurnDirection {
  Left = 'L',
  Right = 'R',
  Either = 'E',
}

export enum LegType {
  /**
   * Arc to a fix (i.e. DME ARC)
   */
  AF = 'AF',
  /**
   * Course to an Altitude
   * Only for climbing
   */
  CA = 'CA',
  /**
   * Course to a DME distance
   */
  CD = 'CD',
  /**
   * Course to a Fix
   */
  CF = 'CF',
  /**
   * Course to an intercept (next leg)
   */
  CI = 'CI',
  /**
   * Course to a VOR radial
   */
  CR = 'CR',
  /**
   * Direct to Fix from PPOS
   */
  DF = 'DF',
  /**
   * Track from Fix to Altitude
   * Only for climbing
   */
  FA = 'FA',
  /**
   * Track from Fix to a Distance
   */
  FC = 'FC',
  /**
   * Track from Fix to a DME distance (not the same fix)
   */
  FD = 'FD',
  /**
   * Track from Fix to a Manual termination
   */
  FM = 'FM',
  /**
   * Hippodrome (hold) with Altitude termination
   * Only for climbing
   */
  HA = 'HA',
  /**
   * Hippodrome (hold), single circuit terminating at the fix
   * Also known as Hold In Lieu of Procedure Turn
   */
  HF = 'HF',
  /**
   * Hippodrome (hold) with manual termination
   */
  HM = 'HM',
  /**
   * Initial Fix
   */
  IF = 'IF',
  /**
   * Procedure turn
   */
  PI = 'PI',
  /**
   * Constant radius arc between two fixes, lines tangent to arc and a centre fix
   */
  RF = 'RF',
  /**
   * Track between fixes
   */
  TF = 'TF',
  /**
   * Heading to an altitude
   */
  VA = 'VA',
  /**
   * Heading to a DME distance
   */
  VD = 'VD',
  /**
   * Heading to an intercept
   */
  VI = 'VI',
  /**
   * Heading to a manual termination
   */
  VM = 'VM',
  /**
   * Heading to a VOR radial
   */
  VR = 'VR',
}

export enum ApproachWaypointDescriptor {
  InitialApproachFix,
  IntermediateApproachFix,
  InitialApproachFixWithHold,
  InitialApproachFixWithFacf,
  FinalEndpointFix,
  FinalApproachFix,
  HoldingFix,
  FinalApproachCourseFix,
  MissedApproachPoint,
}

export enum WaypointDescriptor {
  None,
  Airport,
  Essential,
  OffAirway,
  Runway,
  NdbNavaid,
  Phantom,
  NonEssential,
  TransitionEssential,
  VhfNavaid,
}
