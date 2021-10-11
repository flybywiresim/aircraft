//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { TheoreticalDescentPathCharacteristics } from '@fmgc/guidance/vnav/descent/TheoreticalDescentPath';
import { DecelPathBuilder, DecelPathCharacteristics } from '@fmgc/guidance/vnav/descent/DecelPathBuilder';
import { DescentBuilder } from '@fmgc/guidance/vnav/descent/DescentBuilder';
import { PseudoWaypoint } from '@fmgc/guidance/PsuedoWaypoint';
import { VnavConfig, VnavDescentMode } from '@fmgc/guidance/vnav/VnavConfig';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { Geometry } from '../Geometry';
import { GuidanceComponent } from '../GuidanceComponent';
import { GuidanceController } from '../GuidanceController';
import { NauticalMiles } from '../../../../../typings';

const PWP_IDENT_TOD = '(T/D)';
const PWP_IDENT_DECEL = '(DECEL)';
const PWP_IDENT_FLAP1 = '(FLAP1)';
const PWP_IDENT_FLAP2 = '(FLAP2)';

export class VnavDriver implements GuidanceComponent {
    currentDescentProfile: TheoreticalDescentPathCharacteristics

    currentApproachProfile: DecelPathCharacteristics;

    constructor(
        private guidanceController: GuidanceController,
    ) {
    }

    acceptNewMultipleLegGeometry(geometry: Geometry) {
        this.computeVerticalProfile(geometry);

        const newPseudoWaypoints: PseudoWaypoint[] = [];

        if (VnavConfig.VNAV_EMIT_TOD) {
            const tod = VnavDriver.findPointFromEndOfPath(geometry, this.currentDescentProfile.tod);

            if (tod) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_TOD,
                    alongLegIndex: tod[1],
                    distanceFromLegTermination: this.currentDescentProfile.tod,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
                    efisSymbolLla: tod[0],
                    displayedOnMcdu: true,
                    stats: VnavDriver.computePseudoWaypointStats(PWP_IDENT_TOD, geometry.legs.get(tod[1]), this.currentDescentProfile.tod),
                });
            }
        }

        if (VnavConfig.VNAV_EMIT_DECEL) {
            const decel = VnavDriver.findPointFromEndOfPath(geometry, this.currentApproachProfile.decel);

            if (decel) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_DECEL,
                    alongLegIndex: decel[1],
                    distanceFromLegTermination: this.currentApproachProfile.decel,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpDecel,
                    efisSymbolLla: decel[0],
                    displayedOnMcdu: true,
                    stats: VnavDriver.computePseudoWaypointStats(PWP_IDENT_DECEL, geometry.legs.get(decel[1]), this.currentApproachProfile.decel),
                });
            }
        }

        if (VnavConfig.VNAV_DESCENT_MODE === VnavDescentMode.CDA && VnavConfig.VNAV_EMIT_CDA_FLAP_PWP) {
            const flap1 = VnavDriver.findPointFromEndOfPath(geometry, this.currentApproachProfile.flap1);

            if (flap1) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_FLAP1,
                    alongLegIndex: flap1[1],
                    distanceFromLegTermination: this.currentApproachProfile.flap1,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap1,
                    efisSymbolLla: flap1[0],
                    displayedOnMcdu: true,
                    stats: VnavDriver.computePseudoWaypointStats(PWP_IDENT_FLAP1, geometry.legs.get(flap1[1]), this.currentApproachProfile.flap1),
                });
            }

            const flap2 = VnavDriver.findPointFromEndOfPath(geometry, this.currentApproachProfile.flap2);

            if (flap2) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_FLAP2,
                    alongLegIndex: flap2[1],
                    distanceFromLegTermination: this.currentApproachProfile.flap2,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap2,
                    efisSymbolLla: flap2[0],
                    displayedOnMcdu: true,
                    stats: VnavDriver.computePseudoWaypointStats(PWP_IDENT_FLAP2, geometry.legs.get(flap2[1]), this.currentApproachProfile.flap2),
                });
            }
        }

        this.guidanceController.pseudoWaypoints = newPseudoWaypoints;
    }

    /**
     * Computes a {@link WaypointStats} object for a pseudo waypoint
     *
     * @param ident             the text identifier to give to this pseudo waypoint, for display on the MCDU
     * @param leg               the leg along which this pseudo waypoint is situated
     * @param distanceAlongLeg  the distance from the termination of the leg to this pseudo waypoint
     *
     * @private
     */
    private static computePseudoWaypointStats(ident: string, leg: Leg, distanceAlongLeg: number): WaypointStats {
        // TODO use predictions store to find out altitude, speed and time
        return {
            ident,
            bearingInFp: 0,
            distanceInFP: leg.distance - distanceAlongLeg,
            distanceFromPpos: 0,
            timeFromPpos: 0,
            etaFromPpos: 0,
            magneticVariation: 0,
        };
    }

    init(): void {
        console.log('[FMGC/Guidance] VnavDriver initialized!');
    }

    update(_deltaTime: number): void {
        // TODO stuff here ?
    }

    /**
     * Notifies the FMS that a pseudo waypoint must be sequenced.
     *
     * This is to be sued by {@link LnavDriver} only.
     *
     * @param pseudoWaypoint the {@link PseudoWaypoint} to sequence.
     */
    public sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
        if (DEBUG) {
            console.log(`[FMS/VNAV] Pseudo-waypoint '${pseudoWaypoint.ident}' sequenced.`);
        }
    }

    private computeVerticalProfile(geometry: Geometry) {
        if (geometry.legs.size > 0) {
            this.currentApproachProfile = DecelPathBuilder.computeDecelPath(geometry);
            this.currentDescentProfile = DescentBuilder.computeDescentPath(geometry, this.currentApproachProfile);
        } else if (DEBUG) {
            console.warn('[FMS/VNAV] Did not compute vertical profile. Reason: no legs in flight plan.');
        }
    }

    private static findPointFromEndOfPath(path: Geometry, distanceFromEnd: NauticalMiles): [lla: Coordinates, legIndex: number] | undefined {
        let accumulator = 0;

        // FIXME take transitions into account on newer FMSs
        for (const [i, leg] of path.legs) {
            accumulator += leg.distance;

            if (accumulator > distanceFromEnd) {
                const distanceFromEndOfLeg = distanceFromEnd - (accumulator - leg.distance);

                return [leg.getPseudoWaypointLocation(distanceFromEndOfLeg), i];
            }
        }

        if (DEBUG) {
            console.error(`[VNAV/findPointFromEndOfPath] ${distanceFromEnd.toFixed(2)}nm is larger than the total lateral path.`);
        }

        return undefined;
    }
}
