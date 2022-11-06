import { AltitudeRestrictionType, FlightPlanLeg, OneWayRunway } from '../navigation';

/**
 * A flight path vector turn direction.
 */
export type VectorTurnDirection = 'left' | 'right';

/**
 * The transition type to which a flight path vector belongs.
 */
export enum FlightPathVectorFlags {
  None,

  /** A turn to a specific course. */
  TurnToCourse = 1 << 0,

  /** An arcing turn to a specific point. */
  Arc = 1 << 1,

  /** A direct course to a specific point. */
  Direct = 1 << 2,

  /** A path to intercept a specific course. */
  InterceptCourse = 1 << 3,

  /** Inbound leg of a hold. */
  HoldInboundLeg = 1 << 4,

  /** Outbound leg of a hold. */
  HoldOutboundLeg = 1 << 5,

  /** A direct hold entry. */
  HoldDirectEntry = 1 << 6,

  /** A teardrop hold entry. */
  HoldTeardropEntry = 1 << 7,

  /** A parallel hold entry. */
  HoldParallelEntry = 1 << 8,

  /** A course reversal. */
  CourseReversal = 1 << 9,

  /** A turn from one leg to another. */
  LegToLegTurn = 1 << 10,

  /** An anticipated turn from one leg to another. */
  AnticipatedTurn = 1 << 11,

  /** A fallback path. */
  Fallback = 1 << 12
}

/**
 * A basic flight path vector.
 */
export interface BaseFlightPathVector {
  /** The type of vector. */
  vectorType: string;

  /** Bit flags describing the vector. */
  flags: number;

  /** The latitude of the start of the vector. */
  startLat: number;

  /** The longitude of the start of the vector. */
  startLon: number;

  /** The latitude of the end of the vector. */
  endLat: number;

  /** The longitude of the end of the vector. */
  endLon: number;

  /** The total distance of the vector, in meters. */
  distance: number;
}

/**
 * A flight path vector whose path is defined by a geo circle.
 */
export interface CircleVector extends BaseFlightPathVector {
  /** The type of vector. */
  vectorType: 'circle';

  /** The radius of the circle, in great-arc radians. */
  radius: number;

  /** The x-coordinate of the center of the circle. */
  centerX: number;

  /** The y-coordinate of the center of the circle. */
  centerY: number;

  /** The z-coordinate of the center of the circle. */
  centerZ: number;
}

/**
 * A flight path vector within a leg flight path calculation.
 */
export type FlightPathVector = CircleVector;

/**
 * The details of procedures selected in the flight plan.
 */
export class ProcedureDetails {
  /** The origin runway object, consisting of the index of the origin runway
   * in the origin runway information and the direction */
  public originRunway: OneWayRunway | undefined = undefined;

  /** The ICAO for the facility associated with the departure procedure. */
  public departureFacilityIcao: string | undefined;

  /** The index of the departure in the origin airport information. */
  public departureIndex = -1;

  /** The index of the departure transition in the origin airport departure information. */
  public departureTransitionIndex = -1;

  /** The index of the selected runway in the original airport departure information. */
  public departureRunwayIndex = -1;

  /** The ICAO for the facility associated with the arrival procedure. */
  public arrivalFacilityIcao: string | undefined;

  /** The index of the arrival in the destination airport information. */
  public arrivalIndex = -1;

  /** The index of the arrival transition in the destination airport arrival information. */
  public arrivalTransitionIndex = -1;

  /** The index of the selected runway transition at the destination airport arrival information. */
  public arrivalRunwayTransitionIndex = -1;

  /** The ICAO for the facility associated with the approach procedure. */
  public approachFacilityIcao: string | undefined;

  /** The index of the apporach in the destination airport information.*/
  public approachIndex = -1;

  /** The index of the approach transition in the destination airport approach information.*/
  public approachTransitionIndex = -1;

  /**
   * The destination runway object, consisting of the index of the destination runway
   * in the destination runway information and the direction
   */
  public destinationRunway: OneWayRunway | undefined = undefined;
}

/**
 * A prototype for signalling application-specific type metadata for plan segments.
 */
export enum FlightPlanSegmentType {
  Origin = 'Origin',
  Departure = 'Departure',
  Enroute = 'Enroute',
  Arrival = 'Arrival',
  Approach = 'Approach',
  Destination = 'Destination',
  MissedApproach = 'MissedApproach',
  RandomDirectTo = 'RandomDirectTo'
}


/**
 * A segment of a flight plan.
 */
export class FlightPlanSegment {

  /**
   * Creates a new FlightPlanSegment.
   * @param segmentIndex The index of the segment within the flight plan.
   * @param offset The leg offset within the original flight plan that
   * the segment starts at.
   * @param legs The legs in the flight plan segment.
   * @param segmentType The type of segment this is.
   * @param airway The airway associated with this segment, if any.
   */
  constructor(public segmentIndex: number, public offset: number, public legs: LegDefinition[],
    public segmentType: FlightPlanSegmentType = FlightPlanSegmentType.Enroute, public airway?: string) {
  }

  /** An empty flight plan segment. */
  public static Empty: FlightPlanSegment = new FlightPlanSegment(-1, -1, []);
}

/**
 * Metadata about a particular flight plan leg.
 */
export interface LegCalculations {

  /** The initial DTK of the leg. */
  initialDtk: number | undefined;

  /** The leg's total distance in meters, not cut short by ingress/egress turn radii. */
  distance: number;

  /** The cumulative distance in meters up to this point in the flight plan. */
  cumulativeDistance: number;

  /** The leg's total distance in meters, with leg transition turns take into account. */
  distanceWithTransitions: number;

  /** The cumulative distance in meters up to this point, with leg transition turns taken into account. */
  cumulativeDistanceWithTransitions: number;

  /** The latitude of the start of the leg. */
  startLat: number | undefined;

  /** The longitude of the start of the leg. */
  startLon: number | undefined;

  /** The latitude of the end of the leg. */
  endLat: number | undefined;

  /** The longitude of the end of the leg. */
  endLon: number | undefined;

  /** The calculated flight path for the leg. */
  flightPath: FlightPathVector[];

  /** The leg's flight path ingress transition. */
  ingress: FlightPathVector[];

  /** The index of the flight path vector in `flightPath` to which the ingress transition is joined. */
  ingressJoinIndex: number;

  /** The leg's flight path between the ingress and egress transitions. */
  ingressToEgress: FlightPathVector[];

  /** The index of the flight path vector in `flightPath` to which the egress transition is joined. */
  egressJoinIndex: number;

  /** The leg's flight path egress transition. */
  egress: FlightPathVector[];

  /** Whether the leg's flight path ends in a fallback state. */
  endsInFallback: boolean;
}

/**
 * Bitflags describing a leg definition.
 */
export enum LegDefinitionFlags {
  None = 0,
  DirectTo = 1 << 0,
  MissedApproach = 1 << 1,
  Obs = 1 << 2,
  VectorsToFinal = 1 << 3
}

/**
 * Vertical metadata about a flight plan leg.
 */
export interface VerticalData {
  /** The type of altitude restriction for the leg. */
  altDesc: AltitudeRestrictionType;

  /** The first altitude field for restrictions. */
  altitude1: number;

  /** The second altitude field for restrictions. */
  altitude2: number;

  /** The optional speed restriction for this leg. */
  speed?: number;

  /** The speed type/unit. */
  speedDesc?: SpeedType;

  /** The FPA for this constraint, optional. */
  fpa?: number;
}

export enum SpeedType {
  IAS,
  MACH,
}

/**
 * A definition of a leg in a flight plan.
 */
export interface LegDefinition {

  /** The display name of the leg. */
  readonly name?: string;

  /** The calculated leg data. */
  calculated?: LegCalculations;

  /** The leg of the flight plan. */
  leg: Readonly<FlightPlanLeg>;

  /** Leg definition flags. */
  readonly flags: number;

  /** Vertical Leg Data. All the fields should be readonly except for calculated fields like `fpa`. */
  readonly verticalData: Readonly<VerticalData> & Pick<VerticalData, 'fpa'>;
}