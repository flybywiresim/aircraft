/** Types of flight plan segments. */
export enum SegmentType {

  /** The origin airfield segment. */
  Origin,

  /** The departure segment. */
  Departure,

  /** The enroute segment. */
  Enroute,

  /** The arrival segment. */
  Arrival,

  /** The approach segment. */
  Approach,

  /** The missed approach segment. */
  Missed,

  /** The destination airfield segment. */
  Destination,

  /** An empty segment */
  Empty = -1,
}
