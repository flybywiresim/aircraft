/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { FixTypeFlags, LegType } from '@fmgc/types/fstypes/FSEnums';
import { ApproachUtils } from '@flybywiresim/fbw-sdk';

/**
 * A class for mapping raw facility data to WayPoints.
 */
export class RawDataMapper {
    /**
     * Maps a raw facility record to a WayPoint.
     * @param facility The facility record to map.
     * @param instrument The instrument to attach to the WayPoint.
     * @returns The mapped waypoint.
     */
    public static toWaypoint(facility: any, instrument: BaseInstrument): WayPoint {
        const waypoint = new WayPoint(instrument);

        waypoint.ident = WayPoint.formatIdentFromIcao(facility.icao);
        waypoint.icao = facility.icao;
        waypoint.type = facility.icao[0];

        let alt = 0;

        switch (waypoint.type) {
        case 'A': {
            const info = new AirportInfo(instrument);
            info.CopyBaseInfosFrom(waypoint);
            info.UpdateNamedFrequencies();

            alt = 3.28084 * facility.runways.reduce((sum, r) => sum + r.elevation, 0) / facility.runways.length;

            info.elevation = alt;

            info.approaches = facility.approaches;

            info.approaches.forEach((approach) => {
                approach.name = ApproachUtils.shortApproachName(approach);
                approach.longName = ApproachUtils.longApproachName(approach);
            });

            info.approaches.forEach((approach) => {
                approach.transitions.forEach((trans) => {
                    // if the trans name is empty (in some 3pd navdata), fill it with the IAF name
                    if (trans.name.trim().length === 0) {
                        trans.name = WayPoint.formatIdentFromIcao(trans.legs[0].fixIcao);
                    }

                    // Fix up navigraph approach transitions which hide IAPs inside other transitions rather
                    // than splitting them out as they should be in MSFS data. Unfortunately this means
                    // these transitions cannot be synced to the sim's flight plan system for ATC etc. as
                    // they're not visible without this hack.
                    // Note: it is safe to append to the array inside the forEach by the ECMA spec, and the appended
                    // elements will not be visited.
                    for (let i = 1; i < trans.legs.length; i++) {
                        const leg = trans.legs[i];
                        if ((leg.fixTypeFlags & FixTypeFlags.IAF) > 0 && (leg.type === LegType.TF || leg.type === LegType.IF)) {
                            const iafIdent = WayPoint.formatIdentFromIcao(leg.fixIcao);
                            // this is a transition in itself... check that it doesn't already exist
                            if (approach.transitions.find((t) => t.name === iafIdent) !== undefined) {
                                continue;
                            }

                            RawDataMapper.addApproachTransition(approach, iafIdent, trans.legs.slice(i));
                        }
                    }
                });
                // It may be tempting to think we can sort the transitions in alphabetical order after appending new ones,
                // but this would break MSFS flight plan syncing even for transitions that do exist before; the MSFS
                // flight plan system is based on the indices of the transitions in this array.

                // fake RNPs for AR/SAAR procs
                const isRnpAr = approach.runwayNumber !== 0 && approach.rnavTypeFlags === 0;
                if (isRnpAr) {
                    RawDataMapper.addRnpIfRfPresent(approach.finalLegs, true);
                    approach.transitions.forEach((t) => RawDataMapper.addRnpIfRfPresent(t.legs));
                }
            });
            info.approaches.forEach((approach) => approach.runway = approach.runway.trim());

            info.departures = facility.departures;
            info.departures.forEach((departure) => {
                // patch up transition names
                departure.runwayTransitions.forEach((trans) => trans.name = RawDataMapper.generateRunwayTransitionName(trans));
                departure.enRouteTransitions.forEach(
                    (trans) => trans.name.trim().length === 0 && (trans.name = RawDataMapper.generateDepartureEnRouteTransitionName(trans)),
                );

                // fake RNPs for AR/SAAR procs
                RawDataMapper.addRnpIfRfPresent(departure.commonLegs);
                departure.enRouteTransitions.forEach((t) => RawDataMapper.addRnpIfRfPresent(t.legs));
                departure.runwayTransitions.forEach((t) => RawDataMapper.addRnpIfRfPresent(t.legs));
            });

            info.arrivals = facility.arrivals;
            info.arrivals.forEach((arrival) => arrival.runwayTransitions.forEach((trans) => trans.name = RawDataMapper.generateRunwayTransitionName(trans)));
            info.arrivals.forEach(
                (arrival) => arrival.enRouteTransitions.forEach(
                    (trans) => trans.name.trim().length === 0 && (trans.name = RawDataMapper.generateArrivalTransitionName(trans)),
                ),
            );

            info.runways = facility.runways;

            info.oneWayRunways = [];
            facility.runways.forEach((runway) => info.oneWayRunways.push(...Object.assign(new Runway(), runway).splitIfTwoWays()));

            info.oneWayRunways.sort(RawDataMapper.sortRunways);
            waypoint.infos = info;
        }
            break;
        case 'V':
            const vorInfo = new VORInfo(instrument);
            waypoint.infos = vorInfo;
            vorInfo.frequencyMHz = facility.freqMHz;
            vorInfo.frequencyBcd16 = facility.freqBCD16;
            vorInfo.magneticVariation = facility.magneticVariation;
            vorInfo.type = facility.type;
            vorInfo.vorClass = facility.vorClass;
            break;
        case 'N':
            const ndbInfo = new NDBInfo(instrument);
            waypoint.infos = ndbInfo;
            ndbInfo.type = facility.type;
            ndbInfo.frequencyMHz = facility.freqMHz;
            break;
        case 'W':
            waypoint.infos = new IntersectionInfo(instrument);
            break;
        case 'R':
        default:
            waypoint.infos = new WayPointInfo(instrument);
            break;
        }
        if (waypoint.type !== 'A') {
            waypoint.infos.CopyBaseInfosFrom(waypoint);
            waypoint.infos.routes = facility.routes;
        }

        waypoint.infos.coordinates = new LatLongAlt(facility.lat, facility.lon, alt);
        waypoint.additionalData = { facility };
        return waypoint;
    }

    /**
     * A comparer for sorting runways by number, and then by L, C, and R.
     * @param r1 The first runway to compare.
     * @param r2 The second runway to compare.
     * @returns -1 if the first is before, 0 if equal, 1 if the first is after.
     */
    public static sortRunways(r1: OneWayRunway, r2: OneWayRunway): number {
        if (parseInt(r1.designation) === parseInt(r2.designation)) {
            let v1 = 0;
            if (r1.designation.indexOf('L') !== -1) {
                v1 = 1;
            } else if (r1.designation.indexOf('C') !== -1) {
                v1 = 2;
            } else if (r1.designation.indexOf('R') !== -1) {
                v1 = 3;
            }
            let v2 = 0;
            if (r2.designation.indexOf('L') !== -1) {
                v2 = 1;
            } else if (r2.designation.indexOf('C') !== -1) {
                v2 = 2;
            } else if (r2.designation.indexOf('R') !== -1) {
                v2 = 3;
            }
            return v1 - v2;
        }
        return parseInt(r1.designation) - parseInt(r2.designation);
    }

    /**
     * Generates a runway transition name from the designated runway in the transition data.
     * @param runwayTransition The runway transition to generate the name for.
     * @returns The runway transition name.
     */
    public static generateRunwayTransitionName(runwayTransition: RawRunwayTransition): string {
        let name = `RW${runwayTransition.runwayNumber}`;

        switch (runwayTransition.runwayDesignation) {
        case 1:
            name += 'L';
            break;
        case 2:
            name += 'R';
            break;
        case 3:
            name += 'C';
            break;
        default:
            break;
        }

        return name;
    }

    /**
     * Generates an arrival transition name from a provided arrival enroute transition.
     * @param enrouteTransition The enroute transition to generate a name for.
     * @returns The generated transition name.
     */
    public static generateArrivalTransitionName(enrouteTransition: RawEnRouteTransition): string {
        return WayPoint.formatIdentFromIcao(enrouteTransition.legs[0].fixIcao);
    }

    /**
     * Generates a departure transition name from a provided departure enroute transition.
     * @param enrouteTransition The enroute transition to generate a name for.
     * @returns The generated transition name.
     */
    public static generateDepartureEnRouteTransitionName(enrouteTransition: RawEnRouteTransition): string {
        return WayPoint.formatIdentFromIcao(enrouteTransition.legs[enrouteTransition.legs.length - 1].fixIcao);
    }

    /** Create an approach transition from a list of legs starting with the IAF and add it to the approach */
    private static addApproachTransition(approach: RawApproach, name: string, legs: RawProcedureLeg[]): void {
        // copy the IAF leg before we mutate it!
        legs[0] = { ...legs[0] };
        legs[0].type = LegType.IF;

        approach.transitions.push({
            name,
            legs,
            __Type: 'JS_ApproachTransition',
        });
    }

    /** Add an RNP of 0.3 if the set of legs contains an RF leg */
    private static addRnpIfRfPresent(legs: RawProcedureLeg[], force = false): void {
        const hasAr = legs.findIndex((l) => l.type === LegType.RF) >= 0;
        if (hasAr || force) {
            legs.forEach((l) => l.rnp = 0.3);
        }
    }
}
