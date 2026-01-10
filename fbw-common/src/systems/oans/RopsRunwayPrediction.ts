// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';
import { MathUtils } from '../shared/src';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { NearbyFacilityMonitor, NearbyFacilityType } from '../navdata';

export class RopsRunwayPrediction {
  /**
   *
   * @param nearbyAirportMonitor nearbyAirportMonitor set up with 5nm radius and max 5 results
   * @param radioAltitude radio altitude
   * @param trueHeading true heading in degrees
   * @param ppos present position
   * @returns predicted landing runway info, or null if none found
   */
  public static async detectLandingRunway(
    nearbyAirportMonitor: NearbyFacilityMonitor,
    radioAltitude: number,
    trueHeading: number | null,
    ppos: Coordinates | null,
  ): Promise<{ airport: string; runway: string } | null> {
    if (ppos === null || trueHeading === null) {
      return null;
    }

    const distToTouchdown =
      radioAltitude / MathUtils.FEET_TO_NAUTICAL_MILES / Math.tan(3.0 * MathUtils.DEGREES_TO_RADIANS); // assuming 3 degree glide slope
    const touchdownPoint = placeBearingDistance(ppos, trueHeading, distToTouchdown);

    // Fetch all runways of all airports in vicinity
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;
    nearbyAirportMonitor.setLocation(ppos.lat, ppos.long);
    // Question to reviewers: How resource intensive is getCurrentFacilities()?
    const nearbyAirports = nearbyAirportMonitor
      .getCurrentFacilities()
      .filter((airport) => airport.type === NearbyFacilityType.Airport);
    let nearbyAirportIdent: string | null = null;
    let nearbyRunwayIdent: string | null = null;
    let nearbyRunwayDistance = 10; // nm

    for (const airport of nearbyAirports) {
      const runways = await db.getRunways(airport.ident);

      for (const runway of runways) {
        const dist = distanceTo(touchdownPoint, runway.thresholdLocation);
        // Additional conditions: within 2nm of predicted touchdown point and aligned within 30 degrees
        if (dist < nearbyRunwayDistance && dist < 2 && Math.abs(runway.bearing - trueHeading) < 30) {
          nearbyAirportIdent = airport.ident;
          nearbyRunwayIdent = runway.ident;
          nearbyRunwayDistance = dist;
        }
      }
    }

    if (nearbyAirportIdent === null || nearbyRunwayIdent === null) {
      return null;
    }

    return {
      airport: nearbyAirportIdent,
      runway: nearbyRunwayIdent,
    };
  }
}
