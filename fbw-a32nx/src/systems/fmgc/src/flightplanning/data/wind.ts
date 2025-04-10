export interface WindEntry extends WindVector {
  altitude: number;
}

export interface WindVector {
  trueDegrees: number;
  magnitude: number;
}
