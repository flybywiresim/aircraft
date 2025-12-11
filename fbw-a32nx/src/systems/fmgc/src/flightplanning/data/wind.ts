import { MathUtils } from '@flybywiresim/fbw-sdk';
import { Vec2Math } from '@microsoft/msfs-sdk';

export interface WindEntry {
  vector: WindVector;
  altitude: number;
}

export type WindVector = Float64Array;
export type TailwindComponent = number;

export enum PropagationType {
  Forward,
  Entry,
  Backward,
}

export type PropagatedWindEntry = WindEntry & {
  type: PropagationType;
  sourceLegIndex: number;
};

export const formatWindVector = (vector: WindVector) =>
  `${formatWindTrueDegrees(vector)}/${formatWindMagnitude(vector)}`;

export const formatWindEntry = (entry: WindEntry) => `${formatWindVector(entry.vector)}/${formatWindAltitude(entry)}`;

export const formatWindTrueDegrees = (vector: WindVector) =>
  `${MathUtils.normalise360(Vec2Math.theta(vector) * MathUtils.RADIANS_TO_DEGREES)
    .toFixed(0)
    .padStart(3, '0')}°`;
export const formatWindPredictionDirection = (prediction: WindVector | TailwindComponent) =>
  typeof prediction === 'number' ? (prediction > 0 ? 'TAIL' : 'HEAD') : formatWindTrueDegrees(prediction);

export const formatWindMagnitude = (vector: WindVector) => Math.round(Vec2Math.abs(vector)).toFixed(0).padStart(3, '0');
export const formatWindPredictionMagnitude = (prediction: WindVector | TailwindComponent) =>
  Math.round(typeof prediction === 'number' ? Math.abs(prediction) : Vec2Math.abs(prediction))
    .toFixed(0)
    .padStart(3, '0');

// TODO winds TA/TL
export const formatWindAltitude = (entry: WindEntry) =>
  `FL${Math.round(entry.altitude / 100)
    .toFixed(0)
    .padStart(3, '0')}`;
