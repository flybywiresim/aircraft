// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import { Position } from '@turf/turf';
import { Coordinates, bearingTo, clampAngle, distanceTo } from 'msfs-geo';

export function fractionalPointAlongLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fraction: number,
): [number, number] {
  return [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction];
}

export function midPoint(x1: number, y1: number, x2: number, y2: number): [number, number] {
  return fractionalPointAlongLine(x1, y1, x2, y2, 0.5);
}

export function pointDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function pointAngle(x1: number, y1: number, x2: number, y2: number): number {
  return clampAngle(Math.atan2(y2 - y1, x2 - x1) * MathUtils.RADIANS_TO_DEGREES);
}

// Code adapted from https://www.jeffreythompson.org/collision-detection/line-rect.php

export function intersectLineWithRectangle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): [number, number][] {
  // check if the line has hit any of the rectangle's sides
  // uses the Line/Line function below
  const left = lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
  const right = lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
  const top = lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
  const bottom = lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

  const ret = [];

  if (left) {
    ret.push(left);
  }
  if (right) {
    ret.push(right);
  }
  if (top) {
    ret.push(top);
  }
  if (bottom) {
    ret.push(bottom);
  }

  return ret;
}

export function isPointInRectangle(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && ry <= ry + rh;
}

function lineLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): [number, number] | undefined {
  // calculate the direction of the lines
  const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

  // if uA and uB are between 0-1, lines are colliding
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    // optionally, draw a circle where the lines meet
    const intersectionX = x1 + uA * (x2 - x1);
    const intersectionY = y1 + uA * (y2 - y1);

    return [intersectionX, intersectionY];
  }

  return undefined;
}

export function pointToLineDistance(point: Position, lineStart: Position, lineEnd: Position) {
  return (
    Math.abs(
      (lineEnd[1] - lineStart[1]) * point[0] -
        (lineEnd[0] - lineStart[0]) * point[1] +
        lineEnd[0] * lineStart[1] -
        lineEnd[1] * lineStart[0],
    ) /
    ((lineEnd[1] - lineStart[1]) ** 2 + (lineEnd[0] - lineStart[0]) ** 2) ** 0.5
  );
}

/**
 *
 * @param airportPos airport coordinates, (0, 0) of local coordinate system
 * @param coordinates coordinates to be transformed
 * @param out Output argument: Write airport coordinates here
 */
export function globalToAirportCoordinates(airportPos: Coordinates, coordinates: Coordinates, out: Position): Position {
  const bearing = bearingTo(airportPos, coordinates);
  const distance = distanceTo(airportPos, coordinates);

  const xNm = distance * Math.cos(bearing * MathUtils.DEGREES_TO_RADIANS);
  const yNm = distance * Math.sin(bearing * MathUtils.DEGREES_TO_RADIANS);

  const nmToMeters = 1_000 / 0.539957;

  out[0] = yNm * nmToMeters;
  out[1] = xNm * nmToMeters;

  return out;
}
