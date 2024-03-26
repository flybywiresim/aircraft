// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { AmdbProperties } from '@shared/amdb';
import { Feature, FeatureCollection, Geometry, Position, featureCollection } from '@turf/turf';
import { FmsOansData } from 'instruments/src/OANC/FmsOansPublisher';
import { FmsDataStore } from 'instruments/src/OANC/OancControlPanelUtils';
import { pointDistance } from 'instruments/src/OANC/OancMapUtils';

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */
export class BrakeToVacateUtils {
    constructor(private readonly bus: EventBus, private readonly fmsDataStore: FmsDataStore) {

    }

    readonly btvRunway = Subject.create<string | null>(null);

    /** Landing distance available, in meters. Null if not set. */
    readonly btvRunwayLda = Subject.create<number | null>(null);

    /** Runway heading, in degrees. Null if not set. */
    readonly btvRunwayHeading = Subject.create<number | null>(null);

    /** Selected threshold, used for exit distance calculation */
    private btvThresholdFeature: Feature<Geometry, AmdbProperties>;

    /** Opposite threshold, used for runway end distance calculation */
    private btvOppositeThresholdPosition: Position;

    /** Selected exit */
    readonly btvExit = Subject.create<string | null>(null);

    /** Distance to exit, in meters. Null if not set. */
    readonly btvExitDistance = Subject.create<number | null>(null);

    private btvExitPosition: Position;

    /** Stopping distance for dry rwy conditions, in meters. Null if not set. */
    readonly btvDryStoppingDistance = Subject.create<number | null>(null);

    /** Stopping distance for wet rwy conditions, in meters. Null if not set. */
    readonly btvWetStoppingDistance = Subject.create<number | null>(null);

    /** Live remaining stopping distance during deceleration, in meters. Null if not set. */
    readonly btvLiveStoppingDistance = Subject.create<number | null>(null);

    btvPath: FeatureCollection<Geometry, AmdbProperties> = featureCollection([]);

    selectRunwayFromOans(runway: string, centerlineFeature: Feature<Geometry, AmdbProperties>, thresholdFeature: Feature<Geometry, AmdbProperties>) {
        this.clearSelection();

        // Derive LDA from geometry (as long as we don't have a proper database)
        const lda = thresholdFeature.properties?.lda ?? 0;
        const heading = thresholdFeature.properties?.brngmag ?? 0;

        // Select opposite threshold location
        const thrLoc = thresholdFeature.geometry.coordinates as Position;
        const firstEl = centerlineFeature.geometry.coordinates[0] as Position;
        const dist1 = pointDistance(thrLoc[0], thrLoc[1], firstEl[0], firstEl[1]);
        const lastEl = centerlineFeature.geometry.coordinates[centerlineFeature.geometry.coordinates.length - 1] as Position;
        const dist2 = pointDistance(thrLoc[0], thrLoc[1], lastEl[0], lastEl[1]);
        if (dist1 > dist2) {
            this.btvOppositeThresholdPosition = centerlineFeature.geometry.coordinates[0] as Position;
        } else {
            this.btvOppositeThresholdPosition = lastEl;
        }

        this.btvThresholdFeature = thresholdFeature;
        this.btvRunwayLda.set(lda);
        this.btvRunwayHeading.set(heading);
        this.btvRunway.set(runway);

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', runway, true);
        pub.pub('oansSelectedLandingRunwayBearing', heading, true);
        SimVar.SetSimVarValue('L:A32NX_OANS_RWY_LENGTH', SimVarValueType.Meters, lda);
    }

    selectExitFromOans(exit: string, feature: Feature<Geometry, AmdbProperties>) {
        console.warn(exit, feature);
        const thrLoc = this.btvThresholdFeature.geometry.coordinates as Position;
        const exitLoc1 = feature.geometry.coordinates[0] as Position;
        const exitLoc2 = feature.geometry.coordinates[feature.geometry.coordinates.length - 1] as Position;
        const exitDist1 = pointDistance(thrLoc[0], thrLoc[1], exitLoc1[0], exitLoc1[1]);
        const exitDist2 = pointDistance(thrLoc[0], thrLoc[1], exitLoc2[0], exitLoc2[1]);

        if (exitDist1 < exitDist2) {
            this.btvExitPosition = exitLoc1;
        } else {
            this.btvExitPosition = exitLoc2;
        }

        const exitDistance = pointDistance(
            thrLoc[0],
            thrLoc[1],
            this.btvExitPosition[0],
            this.btvExitPosition[1],
        );

        this.bus.getPublisher<FmsOansData>().pub('oansSelectedExit', exit);
        SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', SimVarValueType.Meters, exitDistance);

        this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `BTV ${this.btvRunway.get().substring(2)}/${exit}`, true);

        // Draw BTV path
        /* this.btvPath = featureCollection([]);
        const props: AmdbProperties = { ...feature.properties, feattype: FeatureType.ArrestingGearLocation, id: 9999, idlin: 'BTV' };
        const geo: Geometry = { type: feature.geometry.type, coordinates: feature.geometry.coordinates };
        (geo.coordinates as Position[]).unshift(thrLoc);
        const exitFeature: Feature<Geometry, AmdbProperties> = { type: 'Feature', geometry: geo, properties: props };
        this.btvPath.features = [exitFeature]; */

        this.btvExitDistance.set(exitDistance);
        this.btvExit.set(exit);
    }

    selectRunwayFromNavdata(runway: string, lda: number, heading: number, btvOppositeThresholdPosition: Position) {
        this.clearSelection();

        this.btvOppositeThresholdPosition = btvOppositeThresholdPosition;
        this.btvRunwayLda.set(lda);
        this.btvRunwayHeading.set(heading);
        this.btvRunway.set(runway);

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', runway, true);
        pub.pub('oansSelectedLandingRunwayBearing', heading, true);
        SimVar.SetSimVarValue('L:A32NX_OANS_RWY_LENGTH', SimVarValueType.Meters, lda);
    }

    selectExitFromManualEntry(reqStoppingDistance: number, btvExitPosition: Position) {
        this.btvExitPosition = btvExitPosition;

        this.bus.getPublisher<FmsOansData>().pub('oansSelectedExit', 'N/A');
        SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', SimVarValueType.Meters, reqStoppingDistance);

        this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `BTV ${this.btvRunway.get().substring(2)}/MANUAL`, true);

        this.btvExitDistance.set(reqStoppingDistance);
        this.btvExit.set('N/A');
    }

    clearSelection() {
        this.btvThresholdFeature = undefined;
        this.btvRunwayLda.set(null);
        this.btvRunwayHeading.set(null);
        this.btvRunway.set(null);

        this.btvExitPosition = [];
        this.btvExitDistance.set(null);
        this.btvExit.set(null);
        this.btvPath.features.length = 0;

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', null, true);
        pub.pub('oansSelectedLandingRunwayBearing', null, true);
        pub.pub('oansSelectedExit', null, true);
        pub.pub('ndBtvMessage', '', true);
        SimVar.SetSimVarValue('L:A32NX_OANS_RWY_LENGTH', SimVarValueType.Meters, 0);
        SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', SimVarValueType.Meters, -1);
        SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT', SimVarValueType.Meters, -1);
        SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END', SimVarValueType.Meters, -1);

        SimVar.SetSimVarValue('L:A32NX_BTV_ROT', SimVarValueType.Number, -1);
        SimVar.SetSimVarValue('L:A32NX_BTV_TURNAROUND_IDLE_REV', SimVarValueType.Number, -1);
        SimVar.SetSimVarValue('L:A32NX_BTV_TURNAROUND_MAX_REV', SimVarValueType.Number, -1);
    }

    updateRemainingDistances(pos: Position) {
        const fwcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', SimVarValueType.Enum);

        if (fwcFlightPhase < 5 || (fwcFlightPhase >= 7 && fwcFlightPhase < 10)) {
            if (this.btvOppositeThresholdPosition && this.btvOppositeThresholdPosition.length > 0) {
                const rwyEndDistance = pointDistance(
                    pos[0],
                    pos[1],
                    this.btvOppositeThresholdPosition[0],
                    this.btvOppositeThresholdPosition[1],
                );

                SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END', SimVarValueType.Meters, rwyEndDistance);
            }

            if (this.btvExitPosition && this.btvExitPosition.length > 0) {
                const exitDistance = pointDistance(
                    pos[0],
                    pos[1],
                    this.btvExitPosition[0],
                    this.btvExitPosition[1],
                );

                SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT', SimVarValueType.Meters, exitDistance);
            }
        }
    }
}
