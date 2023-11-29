// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, ApproachType, Fix, LegType, NXDataStore } from '@flybywiresim/fbw-sdk';
import { AlternateFlightPlan } from '@fmgc/flightplanning/new/plans/AlternateFlightPlan';
import { EventBus, MagVar, Subject } from '@microsoft/msfs-sdk';
import { FixInfoEntry, FixInfoData } from '@fmgc/flightplanning/new/plans/FixInfo';
import { loadAllDepartures, loadAllRunways } from '@fmgc/flightplanning/new/DataLoading';
import { Coordinates, Degrees } from 'msfs-geo';
import { FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { FlightArea } from '@fmgc/navigation/FlightArea';

import { CopyOptions } from '@fmgc/flightplanning/new/plans/CloningOptions';
import { ImportedPerformanceData } from '@fmgc/flightplanning/new/uplink/SimBriefUplinkAdapter';
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

    flightNumber = Subject.create<string>(undefined);

    destroy() {
        super.destroy();

        this.alternateFlightPlan.destroy();
    }

    clone(newIndex: number, options: number = CopyOptions.Default): FlightPlan {
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
        newPlan.flightNumber.set(this.flightNumber.get());

        if (options & CopyOptions.IncludeFixInfos) {
            newPlan.fixInfos = this.fixInfos.map((it) => it?.clone());
        }

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

        const magVar = MagVar.get(ppos.lat, ppos.long);
        const magneticCourse = MagVar.trueToMagnetic(trueTrack, magVar);

        const turningPoint = FlightPlanLeg.turningPoint(this.enrouteSegment, ppos, magneticCourse);
        const turnEnd = FlightPlanLeg.directToTurnEnd(this.enrouteSegment, waypoint);

        turningPoint.flags |= FlightPlanLegFlags.DirectToTurningPoint;

        const targetLeg = this.allLegs.find((it) => it.isDiscontinuity === false && it.terminatesWithWaypoint(waypoint)) as FlightPlanLeg;
        if (targetLeg) {
            turnEnd.withDefinitionFrom(targetLeg).withPilotEnteredDataFrom(targetLeg);

            const targetLegIndex = this.allLegs.findIndex((it) => it === targetLeg);
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

            const turnEndLegIndexInPlan = this.allLegs.findIndex((it) => it === turnEnd);

            this.activeLegIndex = turnEndLegIndexInPlan;
        } else {
            let indexInEnrouteSegment = 0;
            // Make sure we have an active leg and that we don't put the origin leg into enroute
            if (this.activeLegIndex >= 1) {
                this.redistributeLegsAt(this.activeLegIndex);
                indexInEnrouteSegment = this.enrouteSegment.allLegs.findIndex((it) => it === this.activeLeg);
            }

            this.enrouteSegment.allLegs.splice(indexInEnrouteSegment, 0, { isDiscontinuity: true });
            this.enrouteSegment.allLegs.splice(indexInEnrouteSegment + 1, 0, turningPoint);
            this.enrouteSegment.allLegs.splice(indexInEnrouteSegment + 2, 0, turnEnd);
            this.enrouteSegment.allLegs.splice(indexInEnrouteSegment + 3, 0, { isDiscontinuity: true });
            this.incrementVersion();

            const turnEndLegIndexInPlan = this.allLegs.findIndex((it) => it === turnEnd);
            // Since we added a discontinuity after the DIR TO leg, we want to make sure that the leg after it
            // is a leg that can be after a disco (not something like a CI) and convert it to IF
            this.cleanUpAfterDiscontinuity(turnEndLegIndexInPlan + 1);

            this.activeLegIndex = turnEndLegIndexInPlan;
        }

        this.incrementVersion();
    }

    /**
     * Find next XF leg after a discontinuity and convert it to IF
     * Remove non-ground-referenced leg after the discontinuity before the XF leg
     * @param discontinuityIndex
     */
    private cleanUpAfterDiscontinuity(discontinuityIndex: number) {
        // Find next XF leg
        const xFLegIndexInPlan = this.allLegs.findIndex((it, index) => index > discontinuityIndex && it.isDiscontinuity === false && it.isXF());

        if (xFLegIndexInPlan !== -1) {
            const [segment, xfLegIndexInSegment] = this.segmentPositionForIndex(xFLegIndexInPlan);
            const xfLegAfterDiscontinuity = segment.allLegs[xfLegIndexInSegment] as FlightPlanLeg;

            // Remove non-ground-referenced leg after the discontinuity before the XF leg
            // and insert new IF leg
            const numberOfLegsToRemove = Math.max(0, xFLegIndexInPlan - discontinuityIndex);
            const iFLegAfterDiscontinuity = FlightPlanLeg.fromEnrouteFix(segment, xfLegAfterDiscontinuity.definition.waypoint, '', LegType.IF)
                .withDefinitionFrom(xfLegAfterDiscontinuity)
                .withPilotEnteredDataFrom(xfLegAfterDiscontinuity);

            segment.allLegs.splice(xfLegIndexInSegment - numberOfLegsToRemove + 1, numberOfLegsToRemove, iFLegAfterDiscontinuity);
        }
    }

    // TODO this is wrong and we need to redo all this
    // we wanna end up with:
    // - revise point
    // - disco
    // - destination airport
    // - complete alternate routing
    async enableAltn(atIndex: number) {
        if (!this.alternateDestinationAirport) {
            throw new Error('[FMS/FPM] Cannot enable alternate with no alternate destination defined');
        }

        this.redistributeLegsAt(atIndex);

        this.removeRange(atIndex + 1, this.legCount);

        await this.setDestinationAirport(this.alternateDestinationAirport.ident);
        await this.setDestinationRunway(this.alternateFlightPlan.destinationRunway?.ident ?? undefined);
        await this.setApproach(this.alternateFlightPlan.approach?.ident ?? undefined);
        await this.setApproachVia(this.alternateFlightPlan.approachVia?.ident ?? undefined);
        await this.setArrival(this.alternateFlightPlan.arrival?.ident ?? undefined);
        await this.setArrivalEnrouteTransition(this.alternateFlightPlan.arrivalEnrouteTransition?.ident ?? undefined);

        const alternateLastEnrouteIndex = this.alternateFlightPlan.originSegment.legCount
            + this.alternateFlightPlan.departureRunwayTransitionSegment.legCount
            + this.alternateFlightPlan.departureSegment.legCount
            + this.alternateFlightPlan.departureEnrouteTransitionSegment.legCount
            + this.alternateFlightPlan.enrouteSegment.legCount + 1;
        const alternateLegsToInsert = this.alternateFlightPlan.allLegs.slice(0, alternateLastEnrouteIndex).map((it) => (it.isDiscontinuity === false ? it.clone(this.enrouteSegment) : it));

        // TODO add the destination again - don't know if the origin leg of the altn is counted here

        if (this.enrouteSegment.allLegs[this.enrouteSegment.legCount - 1]?.isDiscontinuity === false && alternateLegsToInsert[0]?.isDiscontinuity === false) {
            this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
        }

        this.enrouteSegment.allLegs.push(...alternateLegsToInsert);
        this.syncSegmentLegsChange(this.enrouteSegment);
        this.enrouteSegment.strung = false;

        this.deleteAlternateFlightPlan();

        this.enqueueOperation(FlightPlanQueuedOperation.Restring);
        await this.flushOperationQueue();
    }

    setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoData | null, notify = true): void {
        const planFixInfo = this.fixInfos as FixInfoEntry[];

        planFixInfo[index] = fixInfo ? new FixInfoEntry(fixInfo.fix, fixInfo.radii, fixInfo.radials) : undefined;

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

    async setOriginAirport(icao: string): Promise<void> {
        await super.setOriginAirport(icao);

        FlightPlan.setOriginDefaultPerformanceData(this, this.originAirport);
    }

    async setDestinationAirport(icao: string | undefined): Promise<void> {
        await super.setDestinationAirport(icao);

        FlightPlan.setDestinationDefaultPerformanceData(this, this.destinationAirport);
    }

    /**
     * Sets performance data imported from uplinkl
     *
     * @param plan the flight plan
     * @param data performance data available in uplink
     */
    setImportedPerformanceData(data: ImportedPerformanceData) {
        this.performanceData.databaseTransitionAltitude.set(data.departureTransitionAltitude);
        this.performanceData.databaseTransitionLevel.set(data.destinationTransitionLevel);
        this.performanceData.costIndex.set(data.costIndex);
        this.performanceData.cruiseFlightLevel.set(data.cruiseFlightLevel);
    }

    setCruiseFlightLevel(flightLevel: number) {
        this.performanceData.cruiseFlightLevel.set(flightLevel);
    }

    setCostIndex(costIndex: number) {
        this.performanceData.costIndex.set(costIndex);
    }

    setTransitionAltitude(transitionAltitude: number) {
        this.performanceData.pilotTransitionAltitude.set(transitionAltitude);
    }

    setTransitionLevel(transitionLevel: number) {
        this.performanceData.pilotTransitionLevel.set(transitionLevel);
    }

    setFlightNumber(flightNumber: string) {
        this.flightNumber.set(flightNumber);
    }

    /**
     * Sets defaults for performance data parameters related to an origin
     *
     * @param plan the flight plan
     * @param airport the origin airport
     */
    private static setOriginDefaultPerformanceData(plan: FlightPlan, airport: Airport | undefined): void {
        const referenceAltitude = airport?.location.alt;

        if (referenceAltitude !== undefined) {
            plan.performanceData.defaultThrustReductionAltitude.set(referenceAltitude + parseInt(NXDataStore.get('CONFIG_THR_RED_ALT', '1500')));
            plan.performanceData.defaultAccelerationAltitude.set(referenceAltitude + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')));
            plan.performanceData.defaultEngineOutAccelerationAltitude.set(referenceAltitude + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')));
        } else {
            plan.performanceData.defaultThrustReductionAltitude.set(undefined);
            plan.performanceData.defaultAccelerationAltitude.set(undefined);
            plan.performanceData.defaultEngineOutAccelerationAltitude.set(undefined);
        }

        plan.performanceData.pilotThrustReductionAltitude.set(undefined);
        plan.performanceData.pilotAccelerationAltitude.set(undefined);
        plan.performanceData.pilotEngineOutAccelerationAltitude.set(undefined);
    }

    /**
     * Sets defaults for performance data parameters related to a destination
     *
     * @param plan the flight plan
     * @param airport the destination airport
     */
    private static setDestinationDefaultPerformanceData(plan: FlightPlan, airport: Airport): void {
        const referenceAltitude = airport?.location.alt;

        if (referenceAltitude !== undefined) {
            plan.performanceData.defaultMissedThrustReductionAltitude.set(referenceAltitude + parseInt(NXDataStore.get('CONFIG_THR_RED_ALT', '1500')));
            plan.performanceData.defaultMissedAccelerationAltitude.set(referenceAltitude + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')));
            plan.performanceData.defaultMissedEngineOutAccelerationAltitude.set(referenceAltitude + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')));
        } else {
            plan.performanceData.defaultMissedThrustReductionAltitude.set(undefined);
            plan.performanceData.defaultMissedAccelerationAltitude.set(undefined);
            plan.performanceData.defaultMissedEngineOutAccelerationAltitude.set(undefined);
        }

        plan.performanceData.pilotMissedThrustReductionAltitude.set(undefined);
        plan.performanceData.pilotMissedAccelerationAltitude.set(undefined);
        plan.performanceData.pilotMissedEngineOutAccelerationAltitude.set(undefined);
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
        // newPlan.performanceData.cruiseFlightLevel.set(serialized.performanceData.cruiseFlightLevel);

        return newPlan;
    }
}
