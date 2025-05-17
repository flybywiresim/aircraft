export interface WindEntry extends WindVector {
  altitude: number;
}

export interface WindVector {
  trueDegrees: number;
  magnitude: number;
}

export enum PropagationType {
  Forward,
  Entry,
  Backward,
}

export type PropagatedWindEntry = WindEntry & {
  type: PropagationType;
};
