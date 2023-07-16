// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, ApproachType, Fix } from 'msfs-navdata';
import { AlternateFlightPlan } from '@fmgc/flightplanning/new/plans/AlternateFlightPlan';
import { EventBus, MagVar } from '@microsoft/msfs-sdk';
import { FixInfoEntry } from '@fmgc/flightplanning/new/plans/FixInfo';
import { loadAllDepartures, loadAllRunways } from '@fmgc/flightplanning/new/DataLoading';
import { Coordinates, Degrees } from 'msfs-geo';
import { FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { FlightArea } from '@fmgc/navigation/FlightArea';
import { FlightPlanPerformanceData } from './performance/FlightPlanPerformanceData';
import { BaseFlightPlan, FlightPlanQueuedOperation, SerializedFlightPlan } from './BaseFlightPlan';

export class FlightPlan extends BaseFlightPlan {
    static empty(index: number, bus: EventBus): FlightPlan {
        return new FlightPlan(index, bus);
    }

    /**
     * Alternate flight plan associated with this flight plan
     */
    alternateFlightPlan = new AlternateFlightPlan(this.index, this);

    /**
     * Performance data for this flight plan
     */
    performanceData = new FlightPlanPerformanceData();

    /**
     * FIX INFO entries
     */
    fixInfos: readonly FixInfoEntry[] = [];

    clone(newIndex: number): FlightPlan {
        const newPlan = FlightPlan.empty(newIndex, this.bus);

        newPlan.version = this.version;
        newPlan.originSegment = this.originSegment.clone(newPlan);
        newPlan.departureRunwayTransitionSegment = this.departureRunwayTransitionSegment.clone(newPlan);
        newPlan.departureSegment = this.departureSegment.clone(newPlan);
        newPlan.departureEnrouteTransitionSegment = this.departureEnrouteTransitionSegment.clone(newPlan);
        newPlan.enrouteSegment = this.enrouteSegment.clone(newPlan);
        newPlan.arrivalEnrouteTransitionSegment = this.arrivalEnrouteTransitionSegment.clone(newPlan);
        newPlan.arrivalSegment = this.arrivalSegment.clone(newPlan);
        newPlan.arrivalRunwayTransitionSegment = this.arrivalRunwayTransitionSegment.clone(newPlan);
        newPlan.approachViaSegment = this.approachViaSegment.clone(newPlan);
        newPlan.approachSegment = this.approachSegment.clone(newPlan);
        newPlan.destinationSegment = this.destinationSegment.clone(newPlan);
        newPlan.missedApproachSegment = this.missedApproachSegment.clone(newPlan);

        newPlan.alternateFlightPlan = this.alternateFlightPlan.clone(newPlan);

        newPlan.availableOriginRunways = [...this.availableOriginRunways];
        newPlan.availableDepartures = [...this.availableDepartures];
        newPlan.availableDestinationRunways = [...this.availableDestinationRunways];
        newPlan.availableArrivals = [...this.availableArrivals];
        newPlan.availableApproaches = [...this.availableApproaches];
        newPlan.availableApproachVias = [...this.availableApproachVias];

        newPlan.activeLegIndex = this.activeLegIndex;

        newPlan.performanceData = this.performanceData.clone();

        return newPlan;
    }

    get alternateDestinationAirport(): Airport {
        return this.alternateFlightPlan.destinationAirport;
    }

    async setAlternateDestinationAirport(icao: string | undefined) {
        await this.alternateFlightPlan.setDestinationAirport(icao);

        if (this.alternateFlightPlan.originAirport) {
            this.alternateFlightPlan.availableOriginRunways = await loadAllRunways(this.alternateFlightPlan.originAirport);
            this.alternateFlightPlan.availableDepartures = await loadAllDepartures(this.alternateFlightPlan.originAirport);
        }

        await this.alternateFlightPlan.originSegment.refreshOriginLegs();

        await this.alternateFlightPlan.flushOperationQueue();
    }

    deleteAlternateFlightPlan() {
        this.setAlternateDestinationAirport(undefined);

        this.alternateFlightPlan.setOriginRunway(undefined);
        this.alternateFlightPlan.setDeparture(undefined);
        this.alternateFlightPlan.setDepartureEnrouteTransition(undefined);
        this.alternateFlightPlan.setArrivalEnrouteTransition(undefined);
        this.alternateFlightPlan.setArrival(undefined);
        this.alternateFlightPlan.setApproach(undefined);
        this.alternateFlightPlan.setApproachVia(undefined);

        this.alternateFlightPlan.allLegs.length = 0;

        this.alternateFlightPlan.incrementVersion();
    }

    directTo(ppos: Coordinates, trueTrack: Degrees, waypoint: Fix, withAbeam = false) {
        // TODO withAbeam
        // TODO handle direct-to into the alternate (make alternate active...?

        const targetLeg = this.allLegs.find((it) => it.isDiscontinuity === false && it.terminatesWithWaypoint(waypoint));
        const targetLegIndex = this.allLegs.findIndex((it) => it === targetLeg);

        if (targetLeg.isDiscontinuity === true || !targetLeg.isXF()) {
            throw new Error('[FPM] Target leg of a direct to cannot be a discontinuity or non-XF leg');
        }

        const magVar = MagVar.get(ppos.lat, ppos.long);
        const magneticCourse = MagVar.trueToMagnetic(trueTrack, magVar);

        const turningPoint = FlightPlanLeg.turningPoint(this.enrouteSegment, ppos, magneticCourse);
        const turnEnd = FlightPlanLeg.directToTurnEnd(this.enrouteSegment, targetLeg.definition.waypoint);

        turningPoint.flags |= FlightPlanLegFlags.DirectToTurningPoint;

        this.redistributeLegsAt(targetLegIndex);

        const indexInEnrouteSegment = this.enrouteSegment.allLegs.findIndex((it) => it === targetLeg);

        if (indexInEnrouteSegment === -1) {
            throw new Error('[FPM] Target leg of a direct to not found in enroute segment after leg redistribution!');
        }

        this.enrouteSegment.allLegs.splice(indexInEnrouteSegment, 0, { isDiscontinuity: true });
        this.enrouteSegment.allLegs.splice(indexInEnrouteSegment + 1, 0, turningPoint);
        this.enrouteSegment.allLegs.splice(indexInEnrouteSegment + 2, 0, turnEnd);
        this.enrouteSegment.allLegs.splice(indexInEnrouteSegment + 3, 1);
        this.incrementVersion();

        const turnStartLegIndexInPlan = this.allLegs.findIndex((it) => it === turnEnd);

        this.activeLegIndex = turnStartLegIndexInPlan;

        this.incrementVersion();
    }

    // TODO this is wrong and we need to redo all this
    // we wanna end up with:
    // - revise point
    // - disco
    // - destination airport
    // - complete alternate routing
    enableAltn(atIndexInAlternate: number) {
        if (!this.alternateDestinationAirport) {
            throw new Error('[FMS/FPM] Cannot enable alternate with no alternate destination defined');
        }

        this.redistributeLegsAt(this.activeLegIndex);

        this.removeRange(this.activeLegIndex + 1, this.legCount);

        this.enrouteSegment.allLegs.push({ isDiscontinuity: true });

        let indexOfFirstSegmentToReplace = -1;

        let accumulator = 0;
        for (let i = 0; i < this.alternateFlightPlan.orderedSegments.length; i++) {
            const segment = this.alternateFlightPlan.orderedSegments[i];
            accumulator += segment.legCount;

            if (segment.legCount !== 0 && accumulator - segment.legCount === atIndexInAlternate) {
                if (segment.class === SegmentClass.Departure) {
                    throw new Error('[FMS/FPM] Tried to enable alternate ');
                }

                // If atIndexInAlternate ends up ati segment local index 0, we can move the entire segment into the flight plan

                indexOfFirstSegmentToReplace = i;
                break;
            } else if (accumulator > atIndexInAlternate) {
                if (segment.class === SegmentClass.Departure) {
                    throw new Error('[FMS/FPM] Tried to enable alternate ');
                }

                // Otherwise, we only move the next segment onwards, and insert the legs from atIndexInAlternate to the last segment leg into the enroute

                // TODO this is bad, we need to preserve segment topology...
                // for example this breaks if we ENABLE ALTN into the approach, because we put the rest of approach into the
                // enroute, and now the stringing to the missed approach breaks

                indexOfFirstSegmentToReplace = i + 1;

                const [, indexInSegment] = this.alternateFlightPlan.segmentPositionForIndex(atIndexInAlternate);

                const legsToInsertIntoEnroute = segment.allLegs.slice(indexInSegment);

                this.enrouteSegment.allLegs.push(...legsToInsertIntoEnroute);
                break;
            }
        }

        if (indexOfFirstSegmentToReplace !== -1) {
            for (let i = indexOfFirstSegmentToReplace; i < this.alternateFlightPlan.orderedSegments.length; i++) {
                this.replaceSegment(this.alternateFlightPlan.orderedSegments[i].clone(this));
            }
        }

        this.deleteAlternateFlightPlan();

        this.enqueueOperation(FlightPlanQueuedOperation.Restring);
        this.flushOperationQueue();
    }

    setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoEntry | null, notify = true): void {
        const planFixInfo = this.fixInfos as FixInfoEntry[];

        planFixInfo[index] = fixInfo;

        if (notify) {
            this.sendEvent('flightPlan.setFixInfoEntry', { planIndex: this.index, forAlternate: false, index, fixInfo });
        }

        this.incrementVersion();
    }

    editFixInfoEntry(index: 1 | 2 | 3 | 4, callback: (fixInfo: FixInfoEntry) => FixInfoEntry, notify = true): void {
        const planFixInfo = this.fixInfos as FixInfoEntry[];

        const res = callback(planFixInfo[index]);

        if (res) {
            planFixInfo[index] = res;
        }

        if (notify) {
            this.sendEvent('flightPlan.setFixInfoEntry', { planIndex: this.index, forAlternate: false, index, fixInfo: res });
        }

        this.incrementVersion();
    }

    /**
     * Returns the active flight area for this flight plan
     */
    calculateActiveArea(): FlightArea {
        const activeLegIndex = this.activeLegIndex;

        if (activeLegIndex >= this.legCount) {
            return FlightArea.Enroute;
        }

        const [activeSegment] = this.segmentPositionForIndex(activeLegIndex);

        if (activeSegment === this.missedApproachSegment
            || activeSegment === this.destinationSegment
            || activeSegment === this.approachSegment
            || activeSegment === this.approachViaSegment
        ) {
            const approachType = this.approach?.type ?? ApproachType.Unknown;

            switch (approachType) {
            case ApproachType.Ils:
                return FlightArea.PrecisionApproach;
            case ApproachType.Gps:
            case ApproachType.Rnav:
                return FlightArea.GpsApproach;
            case ApproachType.Vor:
            case ApproachType.VorDme:
                return FlightArea.VorApproach;
            default:
                return FlightArea.NonPrecisionApproach;
            }
        }

        if (activeSegment.class === SegmentClass.Arrival || activeSegment.class === SegmentClass.Departure) {
            return FlightArea.Terminal;
        }

        return FlightArea.Enroute;
    }

    static fromSerializedFlightPlan(index: number, serialized: SerializedFlightPlan, bus: EventBus): FlightPlan {
        const newPlan = FlightPlan.empty(index, bus);

        newPlan.activeLegIndex = serialized.activeLegIndex;
        newPlan.fixInfos = serialized.fixInfo;

        newPlan.departureSegment.setFromSerializedSegment(serialized.segments.departureSegment);
        newPlan.departureRunwayTransitionSegment.setFromSerializedSegment(serialized.segments.departureRunwayTransitionSegment);
        newPlan.departureEnrouteTransitionSegment.setFromSerializedSegment(serialized.segments.departureEnrouteTransitionSegment);
        newPlan.enrouteSegment.setFromSerializedSegment(serialized.segments.enrouteSegment);
        newPlan.arrivalSegment.setFromSerializedSegment(serialized.segments.arrivalSegment);
        newPlan.arrivalRunwayTransitionSegment.setFromSerializedSegment(serialized.segments.arrivalRunwayTransitionSegment);
        newPlan.arrivalEnrouteTransitionSegment.setFromSerializedSegment(serialized.segments.arrivalEnrouteTransitionSegment);
        newPlan.approachSegment.setFromSerializedSegment(serialized.segments.approachSegment);
        newPlan.approachViaSegment.setFromSerializedSegment(serialized.segments.approachViaSegment);

        return newPlan;
    }
}
