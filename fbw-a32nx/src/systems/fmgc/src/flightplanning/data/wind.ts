import { MathUtils } from '@flybywiresim/fbw-sdk';
import { Vec2Math } from '@microsoft/msfs-sdk';

export interface WindEntry {
  vector: WindVector;
  altitude: number;
}

export interface FlightPlanWindEntry extends WindEntry {
  flags: number;
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

export enum FlightPlanWindEntryFlags {
  InsertedFromHistory = 1 << 0,
}

export const formatWindVector = (vector: WindVector) =>
  `${formatWindTrueDegrees(vector)}/${formatWindMagnitude(vector)}`;

export const debugFormatWindEntry = (entry: WindEntry) =>
  `${formatWindVector(entry.vector)}/${formatWindAltitude(entry)}`;
const formatWindAltitude = (entry: WindEntry) =>
  `FL${Math.round(entry.altitude / 100)
    .toFixed(0)
    .padStart(3, '0')}`;

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

export const areWindEntriesTheSame = (one: WindEntry, two: WindEntry) =>
  MathUtils.isAboutEqual(one.altitude, two.altitude) && areWindVectorsTheSame(one.vector, two.vector);
export const areWindVectorsTheSame = (one: WindVector, two: WindVector) =>
  MathUtils.isAboutEqual(one[0], two[0]) && MathUtils.isAboutEqual(one[1], two[1]);
