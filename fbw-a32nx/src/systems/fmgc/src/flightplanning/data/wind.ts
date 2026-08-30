// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { MathUtils } from '@flybywiresim/fbw-sdk';

export interface WindEntry {
  vector: WindVector;

  altitude: number | undefined;
}

export interface FlightPlanWindEntry extends WindEntry {
  flags: number;
}

export type WindVector = {
  /** The magnitude of the wind in knots */
  magnitude: number | undefined;
  /** The direction of the wind in radians */
  direction: number | undefined;
};

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

export const extractWindSpeedFromVector = (vector: WindVector, zeroIfUndefined = false) =>
  vector.magnitude ?? (zeroIfUndefined ? 0 : undefined);
export const extractWindDirectionFromVector = (vector: WindVector, zeroIfUndefined = false) =>
  vector.direction !== undefined
    ? MathUtils.normalise360(vector.direction * MathUtils.RADIANS_TO_DEGREES)
    : vector.direction ?? (zeroIfUndefined ? 0 : undefined);

export const formatWindVector = (vector: WindVector) =>
  `${vector.direction !== undefined ? formatWindTrueDegrees(vector) : '---'}/${vector.magnitude !== undefined ? formatWindMagnitude(vector) : '---'}`;

export const debugFormatWindEntry = (entry: WindEntry) =>
  `${formatWindVector(entry.vector)}/${formatWindAltitude(entry)}`;
const formatWindAltitude = (entry: WindEntry) =>
  entry.altitude !== undefined
    ? `FL${Math.round(entry.altitude / 100)
        .toFixed(0)
        .padStart(3, '0')}`
    : '---';

export const formatWindTrueDegrees = (vector: WindVector, appendUnit = true) =>
  `${(extractWindDirectionFromVector(vector) ?? 0).toFixed(0).padStart(3, '0')}${appendUnit ? '°' : ''}`;
export const formatWindPredictionDirection = (prediction: WindVector | TailwindComponent, abbreviated = false) =>
  typeof prediction === 'number'
    ? prediction > 0
      ? `${abbreviated ? 'TL' : 'TAIL'}`
      : `${abbreviated ? 'HD' : 'HEAD'}`
    : formatWindTrueDegrees(prediction, true);

export const formatWindMagnitude = (vector: WindVector) =>
  extractWindSpeedFromVector(vector)?.toFixed(0).padStart(3, '0') ?? '---';
export const formatWindPredictionMagnitude = (prediction: WindVector | TailwindComponent) => {
  const predictionValue = typeof prediction === 'number' ? Math.abs(prediction) : prediction.magnitude ?? 0;

  return Math.round(predictionValue ?? 0)
    .toFixed(0)
    .padStart(3, '0');
};

export const areWindEntriesTheSame = (one: WindEntry, two: WindEntry) =>
  MathUtils.isAboutEqual(one.altitude ?? 0, two.altitude ?? 0) && areWindVectorsTheSame(one.vector, two.vector);
export const areWindVectorsTheSame = (one: WindVector, two: WindVector) =>
  one !== undefined &&
  two !== undefined &&
  MathUtils.isAboutEqual(one.direction ?? 0, two.direction ?? 0) &&
  MathUtils.isAboutEqual(one.magnitude ?? 0, two.magnitude ?? 0);

export function cloneWindVector(source: WindVector): WindVector {
  return {
    direction: source.direction,
    magnitude: source.magnitude,
  };
}

export function copyWindVector(source: WindVector, destination: WindVector): WindVector {
  destination.direction = source.direction;
  destination.magnitude = source.magnitude;
  return destination;
}

export function scaleWindVector(vector: WindVector, scale: number, result: WindVector): WindVector {
  result.direction = vector.direction !== undefined ? vector.direction * scale : undefined;
  result.magnitude = vector.magnitude !== undefined ? vector.magnitude * scale : undefined;
  return result;
}

export function createVectorFromMagnitudeAndDirection(
  magnitude: number | undefined,
  direction: number | undefined,
): WindVector {
  return {
    direction: direction !== undefined ? direction * MathUtils.DEGREES_TO_RADIANS : undefined,
    magnitude: magnitude,
  };
}

export function isWindVectorComplete(vector: WindVector) {
  return vector.magnitude !== undefined && vector.direction !== undefined;
}

export function cloneWindEntry(entry: WindEntry): WindEntry {
  return {
    ...entry,
    vector: cloneWindVector(entry.vector),
  };
}

export function isPartlyFilledWindVector(vector: WindVector) {
  return (
    (vector.direction !== undefined && vector.magnitude === undefined) ||
    (vector.direction === undefined && vector.magnitude !== undefined)
  );
}
