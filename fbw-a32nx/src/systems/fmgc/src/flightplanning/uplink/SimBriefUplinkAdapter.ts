// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { Airway, Fix } from '@flybywiresim/fbw-sdk';
import { Coordinates, distanceTo } from 'msfs-geo';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FmsErrorType } from '@fmgc/FmsError';
// FIXME rogue import from EFB
import {
  ISimbriefData,
  simbriefDataParser,
} from '../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';
import { FmsDataInterface } from '../interface/FmsDataInterface';

const SIMBRIEF_API_URL = 'https://www.simbrief.com/api/xml.fetcher.php?json=1';

export interface OfpRoute {
  from: { ident: string; rwy: string; transAlt: number };
  to: { ident: string; rwy: string; transLevel: number };
  altn: string;
  costIndex: number;
  chunks: OfpRouteChunk[];
  callsign: string;
}

export interface BaseOfpRouteChunk {
  instruction: string;
}

export interface ImportedPerformanceData {
  departureTransitionAltitude: number;
  destinationTransitionLevel: number;
  costIndex: number;
  cruiseFlightLevel: number;
  pilotTropopause: number;
}

interface AirwayOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'airway';
  ident: string;
  locationHint: {
    lat: number;
    long: number;
  };
}

interface AirwayTerminationOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'airwayTermination';
  locationHint: {
    lat: number;
    long: number;
  };
  ident: string;
}

interface WaypointOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'waypoint';
  ident: string;
  locationHint: {
    lat: number;
    long: number;
  };
}

interface LatLongOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'latlong';
  lat: number;
  long: number;
}

interface DctOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'dct';
}

interface ProcedureOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'procedure';
  ident: string;
}

interface SidEnrouteTransitionOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'sidEnrouteTransition';
  ident: string;
  locationHint: {
    lat: number;
    long: number;
  };
}

interface StarEnrouteTransitionOfpRouteChunk extends BaseOfpRouteChunk {
  instruction: 'starEnrouteTransition';
  ident: string;
}

type OfpRouteChunk =
  | AirwayOfpRouteChunk
  | AirwayTerminationOfpRouteChunk
  | WaypointOfpRouteChunk
  | LatLongOfpRouteChunk
  | DctOfpRouteChunk
  | ProcedureOfpRouteChunk
  | SidEnrouteTransitionOfpRouteChunk
  | StarEnrouteTransitionOfpRouteChunk;

export interface SimBriefUplinkOptions {
  doUplinkProcedures?: boolean;
}

export class SimBriefUplinkAdapter {
  static async uplinkFlightPlanFromSimbrief<P extends FlightPlanPerformanceData>(
    fms: FmsDataInterface & FmsDisplayInterface,
    flightPlanService: FlightPlanService<P>,
    intoPlan: number,
    ofp: ISimbriefData,
    options: SimBriefUplinkOptions,
  ) {
    const doUplinkProcedures = options.doUplinkProcedures ?? false;

    const route = this.getRouteFromOfp(ofp);

    fms.onUplinkInProgress();

    await flightPlanService.newCityPair(route.from.ident, route.to.ident, undefined, FlightPlanIndex.Uplink);

    // Set alternate  airport separately, so the active flight plan uplink still works even if the alternate fails
    try {
      await flightPlanService.setAlternate(route.altn, FlightPlanIndex.Uplink);
    } catch (e) {
      console.error(`[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Failed to set alternate: ${e}`);
    }

    if (doUplinkProcedures) {
      await flightPlanService.setOriginRunway(`${route.from.ident}${route.from.rwy}`, FlightPlanIndex.Uplink);
      await flightPlanService.setDestinationRunway(`${route.to.ident}${route.to.rwy}`, FlightPlanIndex.Uplink);
    }

    const plan = flightPlanService.uplink;

    // FIXME more validation?
    const tropopause = Number.parseInt(ofp.averageTropopause);

    plan.setImportedPerformanceData({
      departureTransitionAltitude: route.from.transAlt,
      destinationTransitionLevel: route.to.transLevel / 100,
      costIndex: route.costIndex,
      cruiseFlightLevel: ofp.cruiseAltitude / 100,
      pilotTropopause: Number.isFinite(tropopause) ? tropopause : undefined,
    });

    // used by FlightPhaseManager
    SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', Number(ofp.cruiseAltitude));

    plan.setFlightNumber(route.callsign);

    let insertHead = -1;

    const setInsertHeadToEndOfEnroute = () => {
      insertHead =
        flightPlanService.uplink.originSegment.legCount +
        flightPlanService.uplink.departureRunwayTransitionSegment.legCount +
        flightPlanService.uplink.departureSegment.legCount +
        flightPlanService.uplink.departureEnrouteTransitionSegment.legCount +
        flightPlanService.uplink.enrouteSegment.legCount -
        1;

      if (flightPlanService.uplink.enrouteSegment.legCount > 1) {
        const lastElement = flightPlanService.uplink.allLegs[insertHead];

        if (lastElement?.isDiscontinuity === true) {
          insertHead--;
        }
      }
    };

    setInsertHeadToEndOfEnroute();

    const ensureAirwaysFinalized = () => {
      if (flightPlanService.uplink.pendingAirways) {
        flightPlanService.uplink.pendingAirways.finalize();
        flightPlanService.uplink.pendingAirways = undefined;

        setInsertHeadToEndOfEnroute();
      }
    };

    const pickFix = (fixes: Fix[], locationHint: Coordinates): Fix => {
      let minDistance = Number.MAX_SAFE_INTEGER;
      let minDistanceIndex = -1;

      for (let i = 0; i < fixes.length; i++) {
        const fix = fixes[i];

        const distance = distanceTo(fix.location, locationHint);

        if (distance < minDistance) {
          minDistance = distance;
          minDistanceIndex = i;
        }
      }

      return fixes[minDistanceIndex];
    };

    const pickAirway = (airways: Airway[], locationHint: Coordinates): Airway => {
      let minDistance = Number.MAX_SAFE_INTEGER;
      let minDistanceIndex = -1;

      for (let i = 0; i < airways.length; i++) {
        const airway = airways[i];

        const distance = distanceTo(airway.fixes[0].location, locationHint);

        if (distance < minDistance) {
          minDistance = distance;
          minDistanceIndex = i;
        }
      }

      return airways[minDistanceIndex];
    };

    const pickAirwayFix = (airway: Airway, fixes: Fix[]): Fix =>
      fixes.find((it) => airway.fixes.some((fix) => fix.ident === it.ident && fix.icaoCode === it.icaoCode));

    for (let i = 0; i < route.chunks.length; i++) {
      const chunk = route.chunks[i];

      switch (chunk.instruction) {
        case 'procedure': {
          if (!doUplinkProcedures) {
            continue;
          }

          if (i !== 0 && i !== route.chunks.length - 1) {
            throw new Error(
              '[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Cannot handle "procedure" instruction not located at the start or end of the route',
            );
          }

          const isDeparture = i === 0;

          if (isDeparture) {
            const departures = await NavigationDatabaseService.activeDatabase.backendDatabase.getDepartures(
              route.from.ident,
              route.from.rwy,
            );
            const departureCandidates = departures.filter((it) => it.ident === chunk.ident);

            // Don't set departure if more than one with the same ident is found
            if (departureCandidates.length === 1) {
              await flightPlanService.setDepartureProcedure(departureCandidates[0].databaseId, FlightPlanIndex.Uplink);

              setInsertHeadToEndOfEnroute();
            }
          } else {
            const arrivals = await NavigationDatabaseService.activeDatabase.backendDatabase.getArrivals(route.to.ident);
            const arrivalCandidates = arrivals.filter((it) => it.ident === chunk.ident);

            // Don't set arrival if more than one with the same ident is found
            if (arrivalCandidates.length === 1) {
              await flightPlanService.setArrival(arrivalCandidates[0].databaseId, FlightPlanIndex.Uplink);

              setInsertHeadToEndOfEnroute();
            }
          }

          break;
        }
        case 'sidEnrouteTransition': {
          if (!doUplinkProcedures) {
            const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(chunk.ident);

            if (fixes.length > 0) {
              await flightPlanService.nextWaypoint(
                insertHead,
                fixes.length > 1 ? pickFix(fixes, chunk.locationHint) : fixes[0],
                FlightPlanIndex.Uplink,
              );
              insertHead++;
            } else {
              console.warn(
                `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Found no fixes for "sidEnrouteTransition" chunk: ${chunk.ident}`,
              );

              if (plan.elementAt(insertHead).isDiscontinuity === false) {
                await flightPlanService.insertDiscontinuityAfter(insertHead, FlightPlanIndex.Uplink);
                insertHead++;
              }
            }

            continue;
          }

          const candidateTransitions = plan.originDeparture.enrouteTransitions.filter((it) => it.ident === chunk.ident);
          if (candidateTransitions.length === 1) {
            await flightPlanService.setDepartureEnrouteTransition(
              candidateTransitions[0].databaseId,
              FlightPlanIndex.Uplink,
            );

            setInsertHeadToEndOfEnroute();
          }

          break;
        }
        case 'waypoint': {
          if (insertHead === -1) {
            setInsertHeadToEndOfEnroute();
          }

          const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(chunk.ident);

          if (fixes.length > 0) {
            await flightPlanService.nextWaypoint(
              insertHead,
              fixes.length > 1 ? pickFix(fixes, chunk.locationHint) : fixes[0],
              FlightPlanIndex.Uplink,
            );
            insertHead++;
          } else {
            console.warn(
              `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Found no fixes for "waypoint" chunk: ${chunk.ident}`,
            );

            if (plan.elementAt(insertHead).isDiscontinuity === false) {
              await flightPlanService.insertDiscontinuityAfter(insertHead, FlightPlanIndex.Uplink);
              insertHead++;
            }
          }

          break;
        }
        case 'latlong': {
          if (insertHead === -1) {
            setInsertHeadToEndOfEnroute();
          }

          const storedWaypoint = fms.createLatLonWaypoint({ lat: chunk.lat, long: chunk.long }, true);

          await flightPlanService.nextWaypoint(insertHead, storedWaypoint.waypoint, FlightPlanIndex.Uplink);
          insertHead++;
          break;
        }
        case 'airway': {
          const plan = flightPlanService.uplink;

          let airwaySearchFix: Fix;
          if (!plan.pendingAirways) {
            const legAtInsertHead = plan.elementAt(insertHead);

            if (legAtInsertHead.isDiscontinuity === false) {
              airwaySearchFix = legAtInsertHead.terminationWaypoint();
            } else {
              // In this case, the waypoint that the airway started at was probably not found in that database,
              // so we don't care about the airway
              continue;
            }

            plan.startAirwayEntry(insertHead);
          } else {
            const tailElement = plan.pendingAirways.elements[plan.pendingAirways.elements.length - 1];

            airwaySearchFix = tailElement.to ?? tailElement.airway?.fixes[tailElement.airway.fixes.length - 1];
          }

          if (airwaySearchFix) {
            const airways = await NavigationDatabaseService.activeDatabase.searchAirway(chunk.ident, airwaySearchFix);

            if (airways.length > 0) {
              plan.pendingAirways.thenAirway(pickAirway(airways, chunk.locationHint));
            } else {
              console.warn(
                `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Found no airways at fix "${airwaySearchFix.ident}" for airway: "${chunk.ident}"`,
              );
              fms.showFmsErrorMessage(FmsErrorType.AwyWptMismatch);
              // Cancel airway entry
              plan.pendingAirways = undefined;
            }
          } else {
            throw new Error(
              `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Found no search fix for "airway" chunk: ${chunk.ident}`,
            );
          }

          break;
        }
        case 'airwayTermination': {
          const plan = flightPlanService.uplink;

          const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(chunk.ident);

          if (fixes.length > 0) {
            if (!plan.pendingAirways) {
              // If we have a termination but never started an airway entry (for example if we could not find the airway in the database),
              // we add the termination fix with a disco in between
              console.warn(
                `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Found no pending airways for "airwayTermination" chunk. Inserting discontinuity before ${chunk.ident}`,
              );

              await flightPlanService.nextWaypoint(
                insertHead,
                fixes.length > 1 ? pickFix(fixes, chunk.locationHint) : fixes[0],
                FlightPlanIndex.Uplink,
              );

              if (plan.elementAt(insertHead).isDiscontinuity === false) {
                // It's possible we already have a disco here, if the start of the airway was not found
                await flightPlanService.insertDiscontinuityAfter(insertHead, FlightPlanIndex.Uplink);
                insertHead++;
              }

              insertHead++;
              break;
            }

            const tailAirway = plan.pendingAirways.elements[plan.pendingAirways.elements.length - 1].airway;

            const airwayFix = pickAirwayFix(tailAirway, fixes);
            if (airwayFix) {
              plan.pendingAirways.thenTo(airwayFix);

              ensureAirwaysFinalized();
            } else {
              // Fixes with the name of the airway termination are found but they're not on that airway
              console.warn(
                `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Airway termination ${chunk.ident} not found on airway ${tailAirway.ident}.`,
              );

              // We cancel the airway entry and add the termination as a fix
              plan.pendingAirways = undefined;

              await flightPlanService.nextWaypoint(
                insertHead,
                fixes.length > 1 ? pickFix(fixes, chunk.locationHint) : fixes[0],
                FlightPlanIndex.Uplink,
              );

              if (plan.elementAt(insertHead).isDiscontinuity === false) {
                // It's possible we already have a disco here, if the start of the airway was not found
                await flightPlanService.insertDiscontinuityAfter(insertHead, FlightPlanIndex.Uplink);
                insertHead++;
              }

              insertHead++;
              break;
            }
          } else {
            console.warn(
              `[SimBriefUplinkAdapter](uplinkFlightPlanFromSimbrief) Found no fixes for "airwayTermination" chunk: ${chunk.ident}. Cancelling airway entry...`,
            );

            plan.pendingAirways = undefined;

            if (plan.elementAt(insertHead).isDiscontinuity === false) {
              // It's possible we already have a disco here, if the start of the airway was not found
              await flightPlanService.insertDiscontinuityAfter(insertHead, FlightPlanIndex.Uplink);
              insertHead++;
            }
          }

          break;
        }
        default:
          console.error(`Unknown route instruction: ${chunk.instruction}`);
      }
    }

    fms.onUplinkDone(intoPlan);
  }

  static async downloadOfpForUserID(username: string, userID?: string): Promise<ISimbriefData> {
    let url = `${SIMBRIEF_API_URL}`;
    if (userID) {
      url += `&userid=${userID}`;
    } else {
      url += `&username=${username}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }
      const body = await response.json();
      // SimBrief can return an error with an ok HTTP status code.
      // In that case, the fetch.status starts with "Error:"
      if (typeof body.fetch?.status === 'string' && body.fetch.status.startsWith('Error:')) {
        throw new Error(`SimBrief: ${body.fetch.status}`);
      }
      return simbriefDataParser(body);
    } catch (e) {
      console.error('SimBrief OFP download failed');
      throw e;
    }
  }

  static getRouteFromOfp(ofp: ISimbriefData): OfpRoute {
    return {
      from: { ident: ofp.origin.icao, rwy: ofp.origin.runway, transAlt: ofp.origin.transAlt },
      to: { ident: ofp.destination.icao, rwy: ofp.destination.runway, transLevel: ofp.destination.transLevel },
      altn: ofp.alternate.icao,
      chunks: this.generateRouteInstructionsFromNavlog(ofp),
      costIndex: Number(ofp.costIndex),
      callsign: ofp.callsign,
    };
  }

  static generateRouteInstructionsFromNavlog(ofp: ISimbriefData): OfpRouteChunk[] {
    const instructions: OfpRouteChunk[] = [];

    // `navlog` is undefined when the route is DCT
    for (let i = 0; i < ofp.navlog?.length ?? 0; i++) {
      const lastFix = ofp.navlog[i - 1];
      const fix = ofp.navlog[i];

      if (fix.ident === 'TOC' || fix.ident === 'TOD' || fix.type === 'apt') {
        continue;
      }

      const lastInstruction = instructions[instructions.length - 1];

      if (fix.is_sid_star === '1') {
        // SID/STAR

        if (!lastInstruction) {
          instructions.push({ instruction: 'procedure', ident: fix.via_airway });
        } else if (lastInstruction.instruction !== 'procedure') {
          instructions.push({ instruction: 'procedure', ident: fix.via_airway });
        }
      } else if (lastInstruction?.instruction === 'procedure' && lastInstruction.ident === fix.via_airway) {
        // SID TRANS
        instructions.push({
          instruction: 'sidEnrouteTransition',
          ident: fix.ident,
          locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) },
        });
      } else if (
        fix.via_airway === 'DCT' ||
        fix.via_airway === 'DCT*' ||
        fix.via_airway.match(/^NAT[A-Z]$/) ||
        instructions.length === 0
      ) {
        // Last SID fix - if this is the very first fix in the route (to deal with procedures
        // that only have an exit fix, which won't be caught when filtering)
        if (fix.type === 'ltlg') {
          // LAT/LONG Waypoint
          instructions.push({ instruction: 'latlong', lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) });
        } else {
          // DCT Waypoint
          instructions.push({
            instruction: 'waypoint',
            ident: fix.ident,
            locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) },
          });
        }
      } else if (
        !(lastInstruction && lastInstruction.instruction === 'airway' && lastInstruction.ident === fix.via_airway)
      ) {
        if (
          lastFix &&
          lastInstruction &&
          lastInstruction.instruction === 'airway' &&
          fix.via_airway !== lastFix.via_airway
        ) {
          instructions.push({
            instruction: 'airwayTermination',
            ident: lastFix.ident,
            locationHint: { lat: parseFloat(lastFix.pos_lat), long: parseFloat(lastFix.pos_long) },
          });
        }

        // Airway
        instructions.push({
          instruction: 'airway',
          ident: fix.via_airway,
          locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) },
        });
      }

      if (
        instructions[instructions.length - 1]?.instruction === 'airway' &&
        ofp.navlog[i + 1]?.via_airway !== fix.via_airway
      ) {
        // End of airway
        instructions.push({
          instruction: 'airwayTermination',
          ident: fix.ident,
          locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) },
        });
      }
    }

    return instructions;
  }
}
