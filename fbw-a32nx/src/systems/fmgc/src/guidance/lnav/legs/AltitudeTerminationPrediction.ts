// @ts-strict-ignore
// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { bearingTo, Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';
import { AirportSubsectionCode, Runway, SectionCode } from '@flybywiresim/fbw-sdk';
import { isOnGround } from '@shared/flightphase';

/** Altitude window (ft) below the target at which a CA/FA leg is considered terminated. */
export const ALTITUDE_REACHED_TOLERANCE = 100;

/**
 * An instantaneous VS below this fraction of the default climb rate is treated as noise
 * (level-off, early rotation, turbulence) and the default climb rate is used instead.
 */
const MIN_USABLE_VS_RATIO = 0.5;

export interface AltitudeTerminationPredictionOptions {
  defaultClimbRate: number;
  defaultSpeed: number;
  useDefaultClimbRate?: boolean;
  ignoreInstantaneousVS?: boolean;
}

// TODO(pr2): defaultClimbRate/defaultSpeed are still fixed fpm/kt constants passed in by each leg
// (CA: 2000 fpm; FA: 500 fpm; both 175 kt). Plan: use V2+10 from FlightPlanPerformanceData.v2 as
// defaultSpeed when the pilot has inserted it (falling back to this constant when v2 is null),
// and a single climb gradient (ft/NM) shared by CA/FA instead of two different fpm values. Needs
// V2 (and later the VNAV profile) threaded from GuidanceController down to Leg.recomputeWithParameters.

// TODO: MIN_USABLE_VS_RATIO is a fixed threshold, not derived from anything about the aircraft.
// Consider a low-pass filter on VS (state kept per leg) instead of a hard accept/reject cutoff,
// so a real transient spike doesn't get treated the same as noise.

/** Where a departure climb effectively begins: the end of the runway, at the runway's elevation. */
export interface DepartureReference {
  /** Departure end of the runway (DER), on the runway centreline. */
  end: Coordinates;
  /** Threshold elevation in feet MSL, if the navdata provides it. */
  elevation: number | undefined;
}

export function isRunwayFix(fix: unknown): fix is Runway {
  const candidate = fix as Runway | undefined;

  return (
    !!candidate &&
    typeof candidate === 'object' &&
    candidate.sectionCode === SectionCode.Airport &&
    candidate.subSectionCode === AirportSubsectionCode.Runways
  );
}

/**
 * Computes the runway end and elevation from the runway navdata object.
 * The runway is the `fix` of the runway IF leg (and of an FA leg that starts at the runway),
 * so no extra lookup through the flight plan is needed.
 *
 * @param course course of the departure leg, so the returned point lies exactly on that leg's line
 */
export function getRunwayDepartureReference(runway: Runway, course: number = runway.bearing): DepartureReference {
  const runwayStart = runway.startLocation ?? runway.thresholdLocation ?? runway.location;
  const lengthNm = Number.isFinite(runway.length) && runway.length > 0 ? runway.length / 1852 : 0;

  const alt = runway.thresholdLocation?.alt;

  return {
    end: lengthNm > 0 ? placeBearingDistance(runwayStart, course, lengthNm) : runwayStart,
    elevation: Number.isFinite(alt) ? alt : undefined,
  };
}

/** Signed distance (NM) of `point` along the line leaving `lineStart` on `course`. Negative means before the start. */
export function alongTrackDistance(lineStart: Coordinates, course: number, point: Coordinates): number {
  const distance = distanceTo(lineStart, point);

  if (distance < 1e-6) {
    return 0;
  }

  return distance * Math.cos(((bearingTo(lineStart, point) - course) * Math.PI) / 180);
}

// TODO: INDICATED ALTITUDE only matches an MSL constraint while the altimeter is on QNH.
// Above the transition altitude (STD), this comparison is wrong. Rare for a CA/FA on a SID,
// but relevant for FA legs used on STARs/missed approaches. Not handled in this PR.
export function getIndicatedAltitude(): number | undefined {
  const altitude = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');

  return Number.isFinite(altitude) ? altitude : undefined;
}

export function hasReachedAltitude(targetAltitude: number): boolean {
  const altitude = getIndicatedAltitude();

  return altitude !== undefined && altitude >= targetAltitude - ALTITUDE_REACHED_TOLERANCE;
}

export function predictAltitudeTermination(
  startingPoint: Coordinates,
  startingAltitude: number,
  targetAltitude: number,
  course: number,
  speed: number,
  options: AltitudeTerminationPredictionOptions,
): Coordinates | undefined {
  if (isOnGround() && !options.useDefaultClimbRate) {
    return undefined;
  }

  const altitudeDifference = Math.max(0, targetAltitude - startingAltitude);

  const instantaneousVs = options.ignoreInstantaneousVS
    ? undefined
    : getPositiveSimVar('VERTICAL SPEED', 'feet per minute');

  // Only trust the live VS when it is a sensible fraction of the default rate,
  // otherwise a very low VS puts the predicted point absurdly far away.
  const vsIsUsable =
    instantaneousVs !== undefined &&
    (!options.useDefaultClimbRate || instantaneousVs >= options.defaultClimbRate * MIN_USABLE_VS_RATIO);

  const climbRate = vsIsUsable ? instantaneousVs : options.useDefaultClimbRate ? options.defaultClimbRate : undefined;

  if (!climbRate) {
    return undefined;
  }

  const predictionSpeed =
    isOnGround() && options.useDefaultClimbRate
      ? options.defaultSpeed
      : speed > 0
        ? speed
        : (getPositiveSimVar('AIRSPEED TRUE', 'knots') ??
          getPositiveSimVar('AIRSPEED INDICATED', 'knots') ??
          options.defaultSpeed);

  const timeToAltitude = altitudeDifference / climbRate;
  const distanceToAltitude = Math.max(0.1, (timeToAltitude / 60) * predictionSpeed);

  return placeBearingDistance(startingPoint, course, distanceToAltitude);
}

function getPositiveSimVar(name: string, unit: string): number | undefined {
  const value = SimVar.GetSimVarValue(name, unit);

  return Number.isFinite(value) && value > 0 ? value : undefined;
}
