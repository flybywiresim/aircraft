// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { ControlLaw, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { MathUtils, Constants } from '@flybywiresim/fbw-sdk';
import { bearingTo, distanceTo, placeBearingDistance } from 'msfs-geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';

/**
 * Compute the remaining distance around an arc
 * This is only valid once past the itp
 * @param ppos       current aircraft position
 * @param itp        current aircraft track
 * @param centreFix  centre of the arc
 * @param sweepAngle angle swept around the arc, +ve for clockwise
 * @returns
 */
export function arcDistanceToGo(ppos: Coordinates, itp: Coordinates, centreFix: Coordinates, sweepAngle: Degrees) {
  const itpBearing = bearingTo(centreFix, itp);
  const pposBearing = bearingTo(centreFix, ppos);
  const radius = distanceTo(centreFix, itp);

  const refFrameOffset = MathUtils.diffAngle(0, itpBearing);
  const pposAngle =
    sweepAngle < 0
      ? MathUtils.normalise360(refFrameOffset - pposBearing)
      : MathUtils.normalise360(pposBearing - refFrameOffset);

  // before the arc... this implies max sweep angle is <340, arinc allows less than that anyway
  if (pposAngle >= 340) {
    return (radius * Math.PI * Math.abs(sweepAngle)) / 180;
  }

  if (pposAngle >= Math.abs(sweepAngle)) {
    return 0;
  }

  return (radius * Math.PI * (Math.abs(sweepAngle) - pposAngle)) / 180;
}

/**
 * Compute guidance parameters for an arc path
 *
 * @param ppos       current aircraft position
 * @param trueTrack  current aircraft track
 * @param itp        initial turning point for the arc
 * @param centreFix  centre of the arc
 * @param sweepAngle angle swept around the arc, +ve for clockwise
 *
 * @returns lateral path law params
 */
export function arcGuidance(
  ppos: Coordinates,
  trueTrack: Degrees,
  itp: Coordinates,
  centreFix: Coordinates,
  sweepAngle: Degrees,
): LateralPathGuidance {
  const bearingPpos = bearingTo(centreFix, ppos);

  const desiredTrack =
    sweepAngle > 0 ? MathUtils.normalise360(bearingPpos + 90) : MathUtils.normalise360(bearingPpos - 90);
  const trackAngleError = MathUtils.diffAngle(trueTrack, desiredTrack);

  const radius = distanceTo(centreFix, itp);
  const distanceFromCenter = distanceTo(centreFix, ppos);

  const crossTrackError = sweepAngle > 0 ? distanceFromCenter - radius : radius - distanceFromCenter;

  const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'meters per second');
  const radiusInMetre = radius * 1852;
  const phiCommand =
    (sweepAngle > 0 ? 1 : -1) * Math.atan((groundSpeed * groundSpeed) / (radiusInMetre * 9.81)) * (180 / Math.PI);

  return {
    law: ControlLaw.LATERAL_PATH,
    trackAngleError,
    crossTrackError,
    phiCommand,
  };
}

/**
 * Computes a point along a course to a fix
 *
 * @param distanceFromEnd distance before end of line
 * @param course          course of the line to the fix
 * @param fix             self-explanatory
 */
export function pointOnCourseToFix(distanceFromEnd: NauticalMiles, course: DegreesTrue, fix: Coordinates): Coordinates {
  return placeBearingDistance(fix, reciprocal(course), distanceFromEnd);
}

/**
 * Computes a point along an arc at a distance before its termination
 *
 * @param distanceFromFtp distance before end of arc
 * @param ftp             arc exit point
 * @param centreFix       arc centre fix
 * @param sweepAngle      angle swept around the arc, +ve for clockwise
 */
export function pointOnArc(
  distanceFromFtp: NauticalMiles,
  ftp: Coordinates,
  centreFix: Coordinates,
  sweepAngle: Degrees,
): Coordinates {
  const radius = distanceTo(centreFix, ftp);
  const distanceRatio = distanceFromFtp / arcLength(radius, sweepAngle);
  const angleFromFtp = -distanceRatio * sweepAngle;

  const centerToTerminationBearing = bearingTo(centreFix, ftp);

  return placeBearingDistance(centreFix, MathUtils.normalise360(centerToTerminationBearing + angleFromFtp), radius);
}

export function minBank(segment: SegmentType): Degrees {
  return segment === SegmentType.Enroute ? 5 : 10;
}

/**
 *
 * @param tas
 * @param pathCapture true when the turn is to capture a path or heading, or for curved legs
 * @returns
 */
export function maxBank(tas: Knots, pathCapture: boolean): Degrees {
  /*
    TODO
    if (engineOut) {
        return 15;
    }
    */

  if (pathCapture) {
    // roll limit 2 from honeywell doc
    if (tas < 100) {
      return 15 + tas / 10;
    }
    if (tas > 350) {
      return 19 + Math.max(0, ((450 - tas) * 6) / 100);
    }
    return 25;
  }
  // roll limit 1
  if (tas < 150) {
    return 15 + tas / 10;
  }
  if (tas > 300) {
    return 19 + Math.max(0, ((450 - tas) * 11) / 150);
  }
  return 30;
}

/**
 * Returns the largest acceptable turn anticipation distance for a given true air speed
 *
 * @param tas the current or predicted true airspeed
 */
export function maxTad(tas: Knots | undefined): NauticalMiles {
  if (tas === undefined) {
    return 10;
  }

  if (tas <= 100) {
    return 4;
  }
  if (tas >= 100 && tas <= 400) {
    return (tas / 100) * 4;
  }
  return 16;
}

export function courseToFixDistanceToGo(ppos: Coordinates, course: Degrees, fix: Coordinates): NauticalMiles {
  const pposToFixBearing = bearingTo(ppos, fix);
  const pposToFixDist = distanceTo(ppos, fix);

  const pposToFixAngle = MathUtils.diffAngle(pposToFixBearing, course);

  return Math.max(0, pposToFixDist * Math.cos((pposToFixAngle * Math.PI) / 180));
}

export function courseToFixGuidance(
  ppos: Coordinates,
  trueTrack: Degrees,
  course: Degrees,
  fix: Coordinates,
): LateralPathGuidance {
  const pposToFixBearing = bearingTo(ppos, fix);
  const pposToFixDist = distanceTo(ppos, fix);

  const pposToFixAngle = MathUtils.diffAngle(course, pposToFixBearing);

  const crossTrackError = pposToFixDist * Math.sin((pposToFixAngle * Math.PI) / 180);

  const trackAngleError = MathUtils.diffAngle(trueTrack, course);

  return {
    law: ControlLaw.LATERAL_PATH,
    trackAngleError,
    crossTrackError,
    phiCommand: 0,
  };
}

export enum PointSide {
  Before,
  After,
}

/**
 * Returns the side of a fix (considering a course inbound to that fix) a point is lying on, assuming they lie on the same
 * great circle.
 *
 * @param fix    destination fix
 * @param course course to the fix
 * @param point  point to compare with
 *
 * @returns `-1` if the point is before the fix, `1` if the point is after the fix
 */
export function sideOfPointOnCourseToFix(fix: Coordinates, course: DegreesTrue, point: Coordinates): PointSide {
  const bearingFixPoint = bearingTo(fix, point);

  const onOtherSide = Math.abs(MathUtils.diffAngle(bearingFixPoint, course)) < 3;

  if (onOtherSide) {
    return PointSide.After;
  }

  return PointSide.Before;
}

export function getAlongTrackDistanceTo(start: Coordinates, end: Coordinates, ppos: Coordinates): number {
  const R = Constants.EARTH_RADIUS_NM;

  const d13 = distanceTo(start, ppos) / R;
  const Theta13 = MathUtils.DEGREES_TO_RADIANS * bearingTo(start, ppos);
  const Theta12 = MathUtils.DEGREES_TO_RADIANS * bearingTo(start, end);

  const deltaXt = Math.asin(Math.sin(d13) * Math.sin(Theta13 - Theta12));

  const deltaAt = Math.acos(Math.cos(d13) / Math.abs(Math.cos(deltaXt)));

  return deltaAt * Math.sign(Math.cos(Theta12 - Theta13)) * R;
}

export function getIntermediatePoint(start: Coordinates, end: Coordinates, fraction: number): Coordinates {
  const Phi1 = start.lat * MathUtils.DEGREES_TO_RADIANS;
  const Gamma1 = start.long * MathUtils.DEGREES_TO_RADIANS;
  const Phi2 = end.lat * MathUtils.DEGREES_TO_RADIANS;
  const Gamma2 = end.long * MathUtils.DEGREES_TO_RADIANS;

  const deltaPhi = Phi2 - Phi1;
  const deltaGamma = Gamma2 - Gamma1;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(Phi1) * Math.cos(Phi2) * Math.sin(deltaGamma / 2) * Math.sin(deltaGamma / 2);
  const delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const A = Math.sin((1 - fraction) * delta) / Math.sin(delta);
  const B = Math.sin(fraction * delta) / Math.sin(delta);

  const x = A * Math.cos(Phi1) * Math.cos(Gamma1) + B * Math.cos(Phi2) * Math.cos(Gamma2);
  const y = A * Math.cos(Phi1) * Math.sin(Gamma1) + B * Math.cos(Phi2) * Math.sin(Gamma2);
  const z = A * Math.sin(Phi1) + B * Math.sin(Phi2);

  const Phi3 = Math.atan2(z, Math.sqrt(x * x + y * y));
  const Gamma3 = Math.atan2(y, x);

  return {
    lat: Phi3 * MathUtils.RADIANS_TO_DEGREES,
    long: Gamma3 * MathUtils.RADIANS_TO_DEGREES,
  };
}

export function fixToFixGuidance(
  ppos: Coordinates,
  trueTrack: DegreesTrue,
  from: Coordinates,
  to: Coordinates,
): LateralPathGuidance {
  // Track angle error
  const totalTrackDistance = distanceTo(from, to);
  const alongTrackDistance = getAlongTrackDistanceTo(from, to, ppos);

  const intermediatePoint = getIntermediatePoint(
    from,
    to,
    Math.min(Math.max(alongTrackDistance / totalTrackDistance, 0.05), 0.95),
  );

  const desiredTrack = bearingTo(intermediatePoint, to);
  const trackAngleError = MathUtils.mod(desiredTrack - trueTrack + 180, 360) - 180;

  // Cross track error
  const bearingAC = bearingTo(from, ppos);
  const bearingAB = bearingTo(from, to);
  const distanceAC = distanceTo(from, ppos);

  const desiredOffset = 0;
  const actualOffset =
    Math.asin(
      Math.sin(MathUtils.DEGREES_TO_RADIANS * (distanceAC / Constants.EARTH_RADIUS_NM)) *
        Math.sin(MathUtils.DEGREES_TO_RADIANS * (bearingAC - bearingAB)),
    ) *
    MathUtils.RADIANS_TO_DEGREES *
    Constants.EARTH_RADIUS_NM;
  const crossTrackError = desiredOffset - actualOffset;

  return {
    law: ControlLaw.LATERAL_PATH,
    trackAngleError,
    crossTrackError,
    phiCommand: 0,
  };
}

export function arcLength(radius: NauticalMiles, sweepAngle: Degrees): NauticalMiles {
  const circumference = 2 * Math.PI * radius;

  return (circumference / 360) * Math.abs(sweepAngle);
}

export function reciprocal(course: Degrees): Degrees {
  return MathUtils.normalise360(course + 180);
}

export function getRollAnticipationDistance(gs: Knots, bankA: Degrees, bankB: Degrees): NauticalMiles {
  // calculate delta phi
  const deltaPhi = Math.abs(bankA - bankB);

  // calculate RAD
  const maxRollRate = 5; // deg / s, picked off the wind
  const k2 = 0.0038;
  const rad = ((gs / 3600) * (Math.sqrt(1 + (2 * k2 * 9.81 * deltaPhi) / maxRollRate) - 1)) / (k2 * 9.81);

  return rad;
}
