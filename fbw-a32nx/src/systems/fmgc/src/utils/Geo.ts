// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { computeDestinationPoint as geolibDestPoint } from 'geolib';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { distanceTo, smallCircleGreatCircleIntersection, placeBearingIntersection } from 'msfs-geo';
import { AFLeg } from '@fmgc/guidance/lnav/legs/AF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { FXLeg } from '@fmgc/guidance/lnav/legs/FX';

export class Geo {
  static computeDestinationPoint(
    start: Coordinates,
    distance: NauticalMiles,
    bearing: DegreesTrue,
    radius: Metres = 6371000,
  ): Coordinates {
    // FIXME rm -f geolib ?
    const a = geolibDestPoint({ ...start, lon: start.long }, distance * 1852, bearing, radius);
    return {
      lat: a.latitude,
      long: a.longitude,
    };
  }

  static distanceToLeg(from: Coordinates, leg: Leg): NauticalMiles {
    const intersections1 = placeBearingIntersection(
      from,
      MathUtils.normalise360(leg.outboundCourse - 90),
      leg.initialLegTermPoint,
      MathUtils.normalise360(leg.outboundCourse - 180),
    );

    const d1 = distanceTo(from, intersections1[0]);
    const d2 = distanceTo(from, intersections1[1]);

    let legStartReference;

    if (leg instanceof TFLeg) {
      legStartReference = leg.from.location;
    } else {
      legStartReference = leg.getPathStartPoint();
    }

    // We might call this on legs that do not have a defined start point yet, as it depends on their inbound transition, which is what is passing
    // them in to this function.
    // In that case, do not consider the second intersection set.
    if (!legStartReference) {
      return Math.min(d1, d2);
    }

    const intersections2 = placeBearingIntersection(
      from,
      MathUtils.normalise360(leg.outboundCourse - 90),
      legStartReference,
      MathUtils.normalise360(leg.outboundCourse - 180),
    );

    const d3 = distanceTo(from, intersections2[0]);
    const d4 = distanceTo(from, intersections2[1]);

    return Math.min(d1, d2, d3, d4);
  }

  static legIntercept(from: Coordinates, bearing: DegreesTrue, leg: Leg): Coordinates {
    if (leg instanceof AFLeg) {
      const intersections = smallCircleGreatCircleIntersection(leg.centre, leg.radius, from, bearing);

      const d1 = distanceTo(from, intersections[0]);
      const d2 = distanceTo(from, intersections[1]);

      return d1 > d2 ? intersections[1] : intersections[0];
    }

    if (leg.getPathEndPoint() === undefined || leg.outboundCourse === undefined) {
      throw new Error('[FMS/LNAV] Cannot compute leg intercept if leg end point or outbound course are undefined');
    }

    const intersections1 = placeBearingIntersection(
      from,
      MathUtils.normalise360(bearing),
      leg instanceof XFLeg || leg instanceof FXLeg ? (leg as XFLeg).fix.location : leg.getPathEndPoint(),
      leg instanceof FXLeg
        ? MathUtils.normalise360(leg.outboundCourse)
        : MathUtils.normalise360(leg.outboundCourse - 180),
    );

    const d1 = distanceTo(from, intersections1[0]);
    const d2 = distanceTo(from, intersections1[1]);

    // We might call this on legs that do not have a defined start point yet, as it depends on their inbound transition, which is what is passing
    // them in to this function.
    // In that case, do not consider the second intersection set.
    if (!leg.getPathStartPoint()) {
      return d1 > d2 ? intersections1[1] : intersections1[0];
    }

    const intersections2 = placeBearingIntersection(
      from,
      MathUtils.normalise360(bearing),
      leg.getPathStartPoint(),
      MathUtils.normalise360(leg.outboundCourse - 180),
    );

    const d3 = distanceTo(from, intersections2[0]);
    const d4 = distanceTo(from, intersections2[1]);

    const smallest = Math.min(d1, d2, d3, d4);

    if (smallest === d1) {
      return intersections1[0];
    }

    if (smallest === d2) {
      return intersections1[1];
    }

    if (smallest === d3) {
      return intersections2[0];
    }

    return intersections2[1];
  }
}
