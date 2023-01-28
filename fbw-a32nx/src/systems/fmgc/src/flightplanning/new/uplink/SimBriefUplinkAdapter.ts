// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { Airway, Waypoint } from 'msfs-navdata';
import { Coordinates, distanceTo } from 'msfs-geo';
import { ISimbriefData, simbriefDataParser } from '../../../../../instruments/src/EFB/SimbriefApi';

const SIMBRIEF_API_URL = 'https://www.simbrief.com/api/xml.fetcher.php?json=1';

export interface OfpRoute {
    from: { ident: string, rwy: string },
    to: { ident: string, rwy: string },
    altn: string,
    chunks: OfpRouteChunk[],
}

export interface BaseOfpRouteChunk {
    instruction: string,
}

interface AirwayOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'airway',
    ident: string,
    locationHint: {
        lat: number,
        long: number,
    },
}

interface AirwayTerminationOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'airwayTermination',
    ident: string,
}

interface WaypointOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'waypoint',
    ident: string,
    locationHint: {
        lat: number,
        long: number,
    },
}

interface LatLongOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'latlong',
    lat: number,
    long: number,
}

interface DctOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'dct',
}

interface ProcedureOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'procedure',
    ident: string,
}

interface SidEnrouteTransitionOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'sidEnrouteTransition',
    ident: string,
    locationHint: {
        lat: number,
        long: number,
    },
}

interface StarEnrouteTransitionOfpRouteChunk extends BaseOfpRouteChunk {
    instruction: 'starEnrouteTransition',
    ident: string,
}

type OfpRouteChunk =
    | AirwayOfpRouteChunk
    | AirwayTerminationOfpRouteChunk
    | WaypointOfpRouteChunk
    | LatLongOfpRouteChunk
    | DctOfpRouteChunk
    | ProcedureOfpRouteChunk
    | SidEnrouteTransitionOfpRouteChunk
    | StarEnrouteTransitionOfpRouteChunk

export interface SimBriefUplinkOptions {
    doUplinkProcedures?: boolean,
}

export class SimBriefUplinkAdapter {
    static async uplinkFlightPlanFromSimbrief(ofp: ISimbriefData, options: SimBriefUplinkOptions) {
        const doUplinkProcedures = options.doUplinkProcedures ?? false;

        const route = await this.getRouteFromOfp(ofp);

        await FlightPlanService.newCityPair(route.from.ident, route.to.ident, route.altn, FlightPlanIndex.Uplink);

        if (doUplinkProcedures) {
            await FlightPlanService.setOriginRunway(`RW${route.from.rwy}`, FlightPlanIndex.Uplink);
            await FlightPlanService.setDestinationRunway(`RW${route.to.rwy}`, FlightPlanIndex.Uplink);
        }

        let insertHead = -1;

        const setInsertHeadToEndOfEnroute = () => {
            insertHead = FlightPlanService.uplink.originSegment.legCount
                + FlightPlanService.uplink.departureRunwayTransitionSegment.legCount
                + FlightPlanService.uplink.departureSegment.legCount
                + FlightPlanService.uplink.departureEnrouteTransitionSegment.legCount
                + FlightPlanService.uplink.enrouteSegment.legCount
                - 1;

            if (FlightPlanService.uplink.enrouteSegment.legCount > 0) {
                const lastElement = FlightPlanService.uplink.allLegs[insertHead];

                if (lastElement?.isDiscontinuity === true) {
                    insertHead--;
                }
            }
        };

        setInsertHeadToEndOfEnroute();

        const ensureAirwaysFinalized = () => {
            if (FlightPlanService.uplink.pendingAirways) {
                FlightPlanService.uplink.pendingAirways.finalize();
                FlightPlanService.uplink.pendingAirways = undefined;

                debugger;

                setInsertHeadToEndOfEnroute();
            }
        };

        const pickFix = (fixes: Waypoint[], locationHint: Coordinates): Waypoint => {
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

        const pickAirwayFix = (airway: Airway, fixes: Waypoint[]): Waypoint => fixes.find((it) => airway.fixes.some((fix) => fix.ident === it.ident && fix.icaoCode === it.icaoCode));

        for (let i = 0; i < route.chunks.length; i++) {
            const chunk = route.chunks[i];

            debugger;

            switch (chunk.instruction) {
            case 'procedure': {
                if (!doUplinkProcedures) {
                    continue;
                }

                if (i !== 0 && i !== route.chunks.length - 1) {
                    throw new Error('Cannot handle \'procedure\' instruction not located at the start or end of the route');
                }

                const isDeparture = i === 0;

                if (isDeparture) {
                    await FlightPlanService.setDepartureProcedure(chunk.ident, FlightPlanIndex.Uplink);

                    setInsertHeadToEndOfEnroute();
                } else {
                    ensureAirwaysFinalized();

                    await FlightPlanService.setArrival(chunk.ident, FlightPlanIndex.Uplink);
                }

                break;
            }
            case 'sidEnrouteTransition': {
                if (!doUplinkProcedures) {
                    const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(chunk.ident);

                    if (fixes.length > 0) {
                        await FlightPlanService.nextWaypoint(insertHead, fixes.length > 1 ? pickFix(fixes, chunk.locationHint) : fixes[0], FlightPlanIndex.Uplink);
                        insertHead++;
                    }

                    continue;
                }

                await FlightPlanService.setDepartureEnrouteTransition(chunk.ident, FlightPlanIndex.Uplink);

                setInsertHeadToEndOfEnroute();

                break;
            }
            case 'waypoint': {
                if (insertHead === -1) {
                    setInsertHeadToEndOfEnroute();
                }

                ensureAirwaysFinalized();

                const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(chunk.ident);

                if (fixes.length > 0) {
                    await FlightPlanService.nextWaypoint(insertHead, fixes.length > 1 ? pickFix(fixes, chunk.locationHint) : fixes[0], FlightPlanIndex.Uplink);
                    insertHead++;
                }

                break;
            }
            case 'airway': {
                const plan = FlightPlanService.uplink;

                if (!plan.pendingAirways) {
                    plan.startAirwayEntry(insertHead);
                }

                const airways = await NavigationDatabaseService.activeDatabase.searchAirway(chunk.ident);

                if (airways.length > 0) {
                    plan.pendingAirways.thenAirway(pickAirway(airways, chunk.locationHint));
                }

                break;
            }
            case 'airwayTermination': {
                const plan = FlightPlanService.uplink;

                if (!plan.pendingAirways) {
                    plan.startAirwayEntry(insertHead);
                }

                const tailAirway = plan.pendingAirways.elements[plan.pendingAirways.elements.length - 1].airway;

                const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(chunk.ident);

                if (fixes.length > 0) {
                    plan.pendingAirways.thenTo(pickAirwayFix(tailAirway, fixes));
                }

                break;
            }
            default:
                console.error(`Unknown route instruction: ${chunk.instruction}`);
            }
        }
    }

    static async downloadOfpForUserID(userID: string): Promise<ISimbriefData> {
        const url = `${SIMBRIEF_API_URL}&userid=${userID}`;

        let ofp: ISimbriefData;
        try {
            ofp = await fetch(url).then((result) => result.json()).then((json) => simbriefDataParser(json));
        } catch (e) {
            console.error('SimBrief OFP download failed');
            throw e;
        }

        return ofp;
    }

    static getRouteFromOfp(ofp: ISimbriefData): OfpRoute {
        return {
            from: { ident: ofp.origin.icao, rwy: ofp.origin.runway },
            to: { ident: ofp.destination.icao, rwy: ofp.destination.runway },
            altn: ofp.alternate.icao,
            chunks: this.generateRouteInstructionsFromNavlog(ofp),
        };
    }

    static generateRouteInstructionsFromNavlog(ofp: ISimbriefData): OfpRouteChunk[] {
        const instructions: OfpRouteChunk[] = [];

        for (let i = 0; i < ofp.navlog.length; i++) {
            const fix = ofp.navlog[i];

            if (fix.ident === 'TOC' || fix.ident === 'TOD') {
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
                instructions.push({ instruction: 'sidEnrouteTransition', ident: fix.ident, locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) } });
            } else if (fix.via_airway === 'DCT') {
                // DCT Waypoint
                instructions.push({ instruction: 'waypoint', ident: fix.ident, locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) } });
            } else if (!(lastInstruction && lastInstruction.instruction === 'airway' && lastInstruction.ident === fix.via_airway)) {
                // Airway
                instructions.push({ instruction: 'airway', ident: fix.via_airway, locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) } });
            } else if (ofp.navlog[i + 1] && ofp.navlog[i + 1].via_airway !== fix.via_airway) {
                // End of airway
                instructions.push({ instruction: 'airwayTermination', ident: fix.ident });
            }
        }

        return instructions;
    }

    // static parseRouteChunks(routeString: string): OfpRouteChunk[] {
    //     const segments = routeString.split(' ');
    //
    //     const chunks: OfpRouteChunk[] = [];
    //     for (let i = 0; i < segments.length; i++) {
    //         const segment = segments[i];
    //
    //         const lastChunk = chunks[chunks.length - 1];
    //
    //         if ((i === 0 || i === segments.length - 1) && segment !== 'DCT') {
    //             chunks.push({ instruction: 'procedure', ident: segment });
    //         } else if (segment.length > 5 && (lastChunk && segment[0].match(/\d/))) {
    //             const parsed = segment.match(/(\d+)[NS](\d+)[EW]/);
    //
    //             const lat = parseInt(parsed[1]);
    //             const long = parseInt(parsed[2]);
    //
    //             chunks.push({ instruction: 'latlong', lat, long });
    //         } else if (lastChunk && lastChunk.instruction === 'dct') {
    //             chunks.push({ instruction: 'waypoint', ident: segment });
    //         } else if (segment === 'DCT') {
    //             chunks.push({ instruction: 'dct' });
    //         } else if (lastChunk && lastChunk.instruction === 'procedure') {
    //             chunks.push({ instruction: 'waypoint', ident: segment });
    //         } else if (lastChunk && lastChunk.instruction !== 'airway') {
    //             chunks.push({ instruction: 'airway', ident: segment });
    //         } else {
    //             chunks.push({ instruction: 'waypoint', ident: segment });
    //         }
    //     }
    //
    //     return chunks;
    // }
}
