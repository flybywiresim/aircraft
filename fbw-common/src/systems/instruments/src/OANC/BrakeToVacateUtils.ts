// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, MathUtils, Subject } from '@microsoft/msfs-sdk';
import { AmdbProperties } from '@shared/amdb';
import { Feature, FeatureCollection, Geometry, Position, featureCollection } from '@turf/turf';
import { Arinc429SignStatusMatrix, Arinc429Word } from 'index-no-react';
import { FmsOansData } from 'instruments/src/OANC/FmsOansPublisher';
import { pointDistance } from 'instruments/src/OANC/OancMapUtils';

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */
export class BrakeToVacateUtils {
    constructor(private readonly bus: EventBus) {
        this.remaininingDistToExit.sub((v) => {
            if (v < 0) {
                Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT', 0, Arinc429SignStatusMatrix.NoComputedData);
            } else {
                Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT', v, Arinc429SignStatusMatrix.NormalOperation);
            }
        });

        this.remaininingDistToRwyEnd.sub((v) => {
            if (v < 0) {
                Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END', 0, Arinc429SignStatusMatrix.NoComputedData);
            } else {
                Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END', v, Arinc429SignStatusMatrix.NormalOperation);
            }
        });

        this.clearSelection();
    }

    private readonly remaininingDistToExit = Subject.create<number>(0);

    private readonly remaininingDistToRwyEnd = Subject.create<number>(0);

    readonly btvRunway = Subject.create<string | null>(null);

    /** Landing distance available, in meters. Null if not set. */
    readonly btvRunwayLda = Subject.create<number | null>(null);

    /** Runway heading, in degrees. Null if not set. */
    readonly btvRunwayHeading = Subject.create<number | null>(null);

    /** Selected threshold, used for exit distance calculation */
    private btvThresholdFeature: Feature<Geometry, AmdbProperties>;

    /** Threshold, used for runway end distance calculation */
    private btvThresholdPosition: Position;

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

        // Select opposite threshold location
        const thrLoc = thresholdFeature.geometry.coordinates as Position;
        this.btvThresholdPosition = thrLoc;
        const firstEl = centerlineFeature.geometry.coordinates[0] as Position;
        const dist1 = pointDistance(thrLoc[0], thrLoc[1], firstEl[0], firstEl[1]);
        const lastEl = centerlineFeature.geometry.coordinates[centerlineFeature.geometry.coordinates.length - 1] as Position;
        const dist2 = pointDistance(thrLoc[0], thrLoc[1], lastEl[0], lastEl[1]);
        if (dist1 > dist2) {
            this.btvOppositeThresholdPosition = centerlineFeature.geometry.coordinates[0] as Position;
        } else {
            this.btvOppositeThresholdPosition = lastEl;
        }

        // Derive LDA from geometry (as long as we don't have a proper database)
        let lda: number = 0;
        if (thresholdFeature.properties?.lda > 0) {
            lda = thresholdFeature.properties?.lda;
        } else {
            lda = (dist1 > dist2 ? dist1 : dist2);
        }

        const heading = thresholdFeature.properties?.brngmag ?? 0;

        this.btvThresholdFeature = thresholdFeature;
        this.btvRunwayLda.set(lda);
        this.btvRunwayHeading.set(heading);
        this.btvRunway.set(runway);

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', runway, true);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_LENGTH', lda, Arinc429SignStatusMatrix.NormalOperation);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_BEARING', heading, Arinc429SignStatusMatrix.NormalOperation);
    }

    selectExitFromOans(exit: string, feature: Feature<Geometry, AmdbProperties>) {
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
        Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', exitDistance, Arinc429SignStatusMatrix.NormalOperation);

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

    selectRunwayFromNavdata(runway: string, lda: number, heading: number, btvThresholdPosition: Position, btvOppositeThresholdPosition: Position) {
        this.clearSelection();

        this.btvThresholdPosition = btvThresholdPosition;
        this.btvOppositeThresholdPosition = btvOppositeThresholdPosition;
        this.btvRunwayLda.set(lda);
        this.btvRunwayHeading.set(heading);
        this.btvRunway.set(runway);

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', runway, true);

        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_LENGTH', lda, Arinc429SignStatusMatrix.NormalOperation);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_BEARING', heading, Arinc429SignStatusMatrix.NormalOperation);
    }

    selectExitFromManualEntry(reqStoppingDistance: number, btvExitPosition: Position) {
        this.btvExitPosition = btvExitPosition;

        this.bus.getPublisher<FmsOansData>().pub('oansSelectedExit', 'N/A');
        Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', reqStoppingDistance, Arinc429SignStatusMatrix.NormalOperation);

        this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `BTV ${this.btvRunway.get().substring(2)}/MANUAL`, true);

        this.btvExitDistance.set(reqStoppingDistance);
        this.btvExit.set('N/A');
    }

    clearSelection() {
        this.btvThresholdFeature = undefined;
        this.btvThresholdPosition = [];
        this.btvOppositeThresholdPosition = [];
        this.btvRunwayLda.set(null);
        this.btvRunwayHeading.set(null);
        this.btvRunway.set(null);

        this.btvExitPosition = [];
        this.btvExitDistance.set(null);
        this.btvExit.set(null);
        this.btvPath.features.length = 0;

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', null, true);
        pub.pub('oansSelectedExit', null, true);
        pub.pub('ndBtvMessage', '', true);

        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_LENGTH', 0, Arinc429SignStatusMatrix.NoComputedData);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_BEARING', 0, Arinc429SignStatusMatrix.NoComputedData);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', 0, Arinc429SignStatusMatrix.NoComputedData);
        this.remaininingDistToExit.set(-1);
        this.remaininingDistToRwyEnd.set(-1);

        Arinc429Word.toSimVarValue('L:A32NX_BTV_ROT', 0, Arinc429SignStatusMatrix.NoComputedData);
        Arinc429Word.toSimVarValue('L:A32NX_BTV_TURNAROUND_IDLE_REV', 0, Arinc429SignStatusMatrix.NoComputedData);
        Arinc429Word.toSimVarValue('L:A32NX_BTV_TURNAROUND_MAX_REV', 0, Arinc429SignStatusMatrix.NoComputedData);
    }

    updateRemainingDistances(pos: Position) {
        if (this.btvThresholdPosition && this.btvThresholdPosition.length > 0) {
            if (this.btvOppositeThresholdPosition && this.btvOppositeThresholdPosition.length > 0) {
                const rwyEndDistanceFromThreshold = pointDistance(
                    this.btvThresholdPosition[0],
                    this.btvThresholdPosition[1],
                    this.btvOppositeThresholdPosition[0],
                    this.btvOppositeThresholdPosition[1],
                );

                const rwyEndDistance = pointDistance(
                    pos[0],
                    pos[1],
                    this.btvOppositeThresholdPosition[0],
                    this.btvOppositeThresholdPosition[1],
                );

                this.remaininingDistToRwyEnd.set(MathUtils.round(Math.min(rwyEndDistanceFromThreshold, rwyEndDistance), 0.1));
            }

            if (this.btvExitPosition && this.btvExitPosition.length > 0) {
                const exitDistanceFromThreshold = pointDistance(
                    this.btvThresholdPosition[0],
                    this.btvThresholdPosition[1],
                    this.btvExitPosition[0],
                    this.btvExitPosition[1],
                );

                const exitDistance = pointDistance(
                    pos[0],
                    pos[1],
                    this.btvExitPosition[0],
                    this.btvExitPosition[1],
                );

                this.remaininingDistToExit.set(MathUtils.round(Math.min(exitDistanceFromThreshold, exitDistance), 0.1));
            }
        }
    }
}
