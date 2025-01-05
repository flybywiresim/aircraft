// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Waypoint } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { EnrouteSegment } from '@fmgc/flightplanning/segments/EnrouteSegment';
import { NavigationDatabaseService } from '../../NavigationDatabaseService';

/**
 * Loads legs from a specified airway, starting and ending at specified waypoints
 *
 * @param inSegment               the enroute segment the legs are being loaded into
 * @param airwayIdent             the identifier of the airway
 * @param databaseId              the database id of the airway to load
 * @param startWaypointDatabaseId the database id of the starting waypoint on the airway to start loading legs at
 * @param viaDatabaseId           the database id of the ending waypoint on the airway to stop loading legs at
 */
export async function loadAirwayLegs(
  inSegment: EnrouteSegment,
  airwayIdent: string,
  databaseId: string,
  startWaypointDatabaseId: string,
  viaDatabaseId: string,
): Promise<FlightPlanLeg[]> {
  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const airways = await db.getAirways([airwayIdent]);

  const matchingAirway = airways.find((airway) => airway.databaseId === databaseId);

  if (!matchingAirway) {
    throw new Error(`[FMS/FPM] Can't find airway with database ID '${databaseId}'`);
  }

  const finalLegs: Waypoint[] = [];

  let startInserting = false;
  for (const leg of matchingAirway.fixes) {
    if (!startInserting && leg.databaseId !== startWaypointDatabaseId) {
      continue;
    } else if (leg.databaseId === startWaypointDatabaseId) {
      startInserting = true;
      continue;
    }

    finalLegs.push(leg);

    if (leg.databaseId === viaDatabaseId) {
      break;
    }
  }

  return finalLegs.map((waypoint) => FlightPlanLeg.fromEnrouteFix(inSegment, waypoint, airwayIdent));
}
