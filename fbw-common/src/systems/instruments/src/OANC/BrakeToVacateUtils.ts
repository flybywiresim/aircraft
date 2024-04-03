// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, NodeReference, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { AmdbProperties } from '@shared/amdb';
import { Feature, Geometry, Position } from '@turf/turf';
import { Arinc429SignStatusMatrix, Arinc429Word, MathUtils } from 'index-no-react';
import { Label, LabelStyle } from 'instruments/src/OANC';
import { BtvData } from 'instruments/src/OANC/BtvPublisher';
import { FmsOansData } from 'instruments/src/OANC/FmsOansPublisher';
import { OancLabelManager } from 'instruments/src/OANC/OancLabelManager';
import { fractionalPointAlongLine, pointDistance, pointToLineDistance } from 'instruments/src/OANC/OancMapUtils';

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */
export class BrakeToVacateUtils<T extends number> {
    constructor(
        private readonly bus: EventBus,
        private labelManager: OancLabelManager<T>,
        private canvasRef: NodeReference<HTMLCanvasElement>,
        private canvasCentreX: Subscribable<number>,
        private canvasCentreY: Subscribable<number>,
    ) {
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

        const sub = this.bus.getSubscriber<BtvData>();
        this.dryStoppingDistance.setConsumer(sub.on('dryStoppingDistance').whenChanged());
        this.wetStoppingDistance.setConsumer(sub.on('wetStoppingDistance').whenChanged());

        this.dryStoppingDistance.sub(() => this.drawBtvLayer());
        this.wetStoppingDistance.sub(() => this.drawBtvLayer());

        this.clearSelection();
    }

    private readonly dryStoppingDistance = ConsumerSubject.create(null, 0);

    private readonly wetStoppingDistance = ConsumerSubject.create(null, 0);

    private readonly remaininingDistToExit = Subject.create<number>(0);

    private readonly remaininingDistToRwyEnd = Subject.create<number>(0);

    readonly btvRunway = Subject.create<string | null>(null);

    /** Landing distance available, in meters. Null if not set. */
    readonly btvRunwayLda = Subject.create<number | null>(null);

    /** Runway heading, in degrees. Null if not set. */
    readonly btvRunwayBearingTrue = Subject.create<number | null>(null);

    /** Threshold, used for runway end distance calculation */
    private btvThresholdPosition: Position;

    /** Opposite threshold, used for runway end distance calculation */
    private btvOppositeThresholdPosition: Position;

    /** Selected exit */
    readonly btvExit = Subject.create<string | null>(null);

    /** Distance to exit, in meters. Null if not set. */
    readonly btvExitDistance = Subject.create<number | null>(null);

    private btvExitPosition: Position;

    private btvPathGeometry: Position[];

    /** Stopping distance for dry rwy conditions, in meters. Null if not set. */
    readonly btvDryStoppingDistance = Subject.create<number | null>(null);

    /** Stopping distance for wet rwy conditions, in meters. Null if not set. */
    readonly btvWetStoppingDistance = Subject.create<number | null>(null);

    /** Live remaining stopping distance during deceleration, in meters. Null if not set. */
    readonly btvLiveStoppingDistance = Subject.create<number | null>(null);

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

        const heading = thresholdFeature.properties?.brngtrue ?? 0;

        this.btvRunwayLda.set(lda);
        this.btvRunwayBearingTrue.set(heading);
        this.btvRunway.set(runway);

        const pub = this.bus.getPublisher<FmsOansData>();
        pub.pub('oansSelectedLandingRunway', runway, true);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_LENGTH', lda, Arinc429SignStatusMatrix.NormalOperation);
        Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_BEARING', heading, Arinc429SignStatusMatrix.NormalOperation);

        this.drawBtvLayer();
    }

    selectExitFromOans(exit: string, feature: Feature<Geometry, AmdbProperties>) {
        const thrLoc = this.btvThresholdPosition;
        const exitLoc1 = feature.geometry.coordinates[0] as Position;
        const exitLoc2 = feature.geometry.coordinates[feature.geometry.coordinates.length - 1] as Position;
        const exitDist1 = pointDistance(thrLoc[0], thrLoc[1], exitLoc1[0], exitLoc1[1]);
        const exitDist2 = pointDistance(thrLoc[0], thrLoc[1], exitLoc2[0], exitLoc2[1]);

        if (exitDist1 < exitDist2) {
            // Check whether valid path: Exit start position (i.e. point of exit line closest to threshold) should be inside runway
            if (pointToLineDistance(exitLoc1, this.btvThresholdPosition, this.btvOppositeThresholdPosition) > 20) {
                return;
            }
            this.btvExitPosition = exitLoc1;
        } else {
            // Check whether valid path: Exit start position (i.e. point of exit line closest to threshold) should be inside runway
            if (pointToLineDistance(exitLoc2, this.btvThresholdPosition, this.btvOppositeThresholdPosition) > 20) {
                return;
            }
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

        this.btvPathGeometry = Array.from(feature.geometry.coordinates as Position[]);
        if (exitDist1 < exitDist2) {
            this.btvPathGeometry.unshift(thrLoc);
        } else {
            this.btvPathGeometry.push(thrLoc);
        }

        this.btvExitDistance.set(exitDistance);
        this.btvExit.set(exit);

        this.drawBtvLayer();
    }

    selectRunwayFromNavdata(runway: string, lda: number, heading: number, btvThresholdPosition: Position, btvOppositeThresholdPosition: Position) {
        this.clearSelection();

        this.btvThresholdPosition = btvThresholdPosition;
        this.btvOppositeThresholdPosition = btvOppositeThresholdPosition;
        this.btvRunwayLda.set(lda);
        this.btvRunwayBearingTrue.set(heading);
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
        this.btvThresholdPosition = [];
        this.btvOppositeThresholdPosition = [];
        this.btvRunwayLda.set(null);
        this.btvRunwayBearingTrue.set(null);
        this.btvRunway.set(null);

        this.btvExitPosition = [];
        this.btvExitDistance.set(null);
        this.btvExit.set(null);
        this.btvPathGeometry = [];
        this.drawBtvLayer();

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

    drawBtvPath() {
        if (!this.btvPathGeometry.length || !this.canvasRef?.getOrDefault()) {
            return;
        }

        const ctx = this.canvasRef.instance.getContext('2d');
        ctx.resetTransform();
        ctx.translate(this.canvasCentreX.get(), this.canvasCentreY.get());

        ctx.lineWidth = 5;
        ctx.strokeStyle = '#00ffff';

        const path = new Path2D();
        ctx.beginPath();
        path.moveTo(this.btvPathGeometry[0][0], this.btvPathGeometry[0][1] * -1);
        for (let i = 1; i < this.btvPathGeometry.length; i++) {
            const point = this.btvPathGeometry[i];
            path.lineTo(point[0], point[1] * -1);
        }

        ctx.stroke(path);
    }

    drawStopLines() {
        if (!this.btvThresholdPosition.length || !this.canvasRef?.getOrDefault()) {
            return;
        }

        const ctx = this.canvasRef.instance.getContext('2d');
        ctx.resetTransform();
        ctx.translate(this.canvasCentreX.get(), this.canvasCentreY.get());

        // DRY stop line
        const dryStopLinePoint = fractionalPointAlongLine(this.btvThresholdPosition[0], this.btvThresholdPosition[1],
            this.btvOppositeThresholdPosition[0], this.btvOppositeThresholdPosition[1],
            this.btvRunwayLda.get() / this.dryStoppingDistance.get());

        const point1 = [
            100 * Math.cos((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[0],
            100 * Math.sin((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[1],
        ];
        const point2 = [
            100 * Math.cos((-this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[0],
            100 * Math.sin((-this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[1],
        ];

        ctx.beginPath();
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#000000';
        ctx.moveTo(point1[0], point1[1] * -1);
        ctx.lineTo(dryStopLinePoint[0], dryStopLinePoint[1] * -1);
        ctx.lineTo(point2[0], point2[1] * -1);
        ctx.stroke();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#ff94ff';
        ctx.moveTo(point1[0], point1[1] * -1);
        ctx.lineTo(dryStopLinePoint[0], dryStopLinePoint[1] * -1);
        ctx.lineTo(point2[0], point2[1] * -1);
        ctx.stroke();

        // Label
        const dryLabel: Label = {
            text: 'DRY',
            style: LabelStyle.BtvStopLine,
            position: point1,
            rotation: 0,
            associatedFeature: null,
        };
        this.labelManager.visibleLabels.insert(dryLabel);
        this.labelManager.labels.push(dryLabel);

        // WET stop line
        const wetStopLinePoint = fractionalPointAlongLine(this.btvThresholdPosition[0], this.btvThresholdPosition[1],
            this.btvOppositeThresholdPosition[0], this.btvOppositeThresholdPosition[1],
            this.btvRunwayLda.get() / this.wetStoppingDistance.get());

        const point3 = [
            100 * Math.cos((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[0],
            100 * Math.sin((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[1],
        ];
        const point4 = [
            100 * Math.cos((-this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[0],
            100 * Math.sin((-this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[1],
        ];

        ctx.beginPath();
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#000000';
        ctx.moveTo(point3[0], point3[1] * -1);
        ctx.lineTo(wetStopLinePoint[0], wetStopLinePoint[1] * -1);
        ctx.lineTo(point4[0], point4[1] * -1);
        ctx.stroke();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#ff94ff';
        ctx.moveTo(point3[0], point3[1] * -1);
        ctx.lineTo(wetStopLinePoint[0], wetStopLinePoint[1] * -1);
        ctx.lineTo(point4[0], point4[1] * -1);
        ctx.stroke();

        // Label
        const wetLabel: Label = {
            text: 'WET',
            style: LabelStyle.BtvStopLine,
            position: point3,
            rotation: 0,
            associatedFeature: null,
        };
        this.labelManager.visibleLabels.insert(wetLabel);
        this.labelManager.labels.push(wetLabel);
    }

    drawBtvLayer() {
        if (!this.canvasRef?.getOrDefault()) {
            return;
        }

        this.canvasRef.instance.getContext('2d').clearRect(0, 0, this.canvasRef.instance.width, this.canvasRef.instance.height);
        this.labelManager.visibleLabels.removeAt(this.labelManager.visibleLabels.getArray().findIndex((it) => it.text === 'DRY' && it.style === LabelStyle.BtvStopLine));
        this.labelManager.visibleLabels.removeAt(this.labelManager.visibleLabels.getArray().findIndex((it) => it.text === 'WET' && it.style === LabelStyle.BtvStopLine));
        this.labelManager.labels = this.labelManager.labels.filter((it) => !((it.text === 'DRY' || it.text === 'WET') && it.style === LabelStyle.BtvStopLine));
        this.drawBtvPath();
        this.drawStopLines();
    }
}
