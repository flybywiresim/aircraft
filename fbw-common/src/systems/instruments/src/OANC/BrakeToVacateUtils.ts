// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, NodeReference, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { AmdbProperties } from '@flybywiresim/fbw-sdk';
import {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Position,
  booleanContains,
  booleanDisjoint,
  lineOffset,
  lineString,
  point,
  polygon,
} from '@turf/turf';
import { Arinc429Register, Arinc429SignStatusMatrix, Arinc429Word, MathUtils } from '@flybywiresim/fbw-sdk';
import { Label, LabelStyle } from './';
import { BtvData } from './BtvPublisher';
import { FmsOansData } from './FmsOansPublisher';
import { OancLabelManager } from './OancLabelManager';
import {
  fractionalPointAlongLine,
  globalToAirportCoordinates,
  pointAngle,
  pointDistance,
  pointToLineDistance,
} from './OancMapUtils';
import { Coordinates, placeBearingDistance } from 'msfs-geo';
import { GenericAdirsEvents } from '../ND/types/GenericAdirsEvents';

const MIN_TOUCHDOWN_ZONE_DISTANCE = 400; // Minimum distance from threshold to touch down zone
const CLAMP_DRY_STOPBAR_DISTANCE = 100; // If stop bar is <> meters behind end of runway, clamp to this distance behind end of runway
const CLAMP_WET_STOPBAR_DISTANCE = 200; // If stop bar is <> meters behind end of runway, clamp to this distance behind end of runway

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */

export class BrakeToVacateUtils<T extends number> {
  constructor(
    private readonly bus: EventBus,
    private readonly labelManager?: OancLabelManager<T>,
    private readonly aircraftOnGround?: Subscribable<boolean>,
    private readonly aircraftPpos?: Position,
    private readonly canvasRef?: NodeReference<HTMLCanvasElement>,
    private readonly canvasCentreX?: Subscribable<number>,
    private readonly canvasCentreY?: Subscribable<number>,
    private readonly zoomLevelIndex?: Subscribable<number>,
    private getZoomLevelInverseScale?: () => number,
  ) {
    this.remaininingDistToExit.sub((v) => {
      if (v < 0) {
        Arinc429Word.toSimVarValue(
          'L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT',
          0,
          Arinc429SignStatusMatrix.NoComputedData,
        );
      } else {
        Arinc429Word.toSimVarValue(
          'L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT',
          v,
          Arinc429SignStatusMatrix.NormalOperation,
        );
      }
    });

    this.remaininingDistToRwyEnd.sub((v) => {
      if (v < 0) {
        Arinc429Word.toSimVarValue(
          'L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END',
          0,
          Arinc429SignStatusMatrix.NoComputedData,
        );
      } else {
        Arinc429Word.toSimVarValue(
          'L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END',
          v,
          Arinc429SignStatusMatrix.NormalOperation,
        );
      }
    });

    const sub = this.bus.getSubscriber<BtvData & GenericAdirsEvents>();
    this.dryStoppingDistance.setConsumer(sub.on('dryStoppingDistance').whenChanged());
    this.wetStoppingDistance.setConsumer(sub.on('wetStoppingDistance').whenChanged());
    this.liveStoppingDistance.setConsumer(sub.on('stopBarDistance').whenChanged());
    this.radioAltitude1.setConsumer(sub.on('radioAltitude_1').whenChanged());
    this.radioAltitude2.setConsumer(sub.on('radioAltitude_2').whenChanged());
    this.fwsFlightPhase.setConsumer(sub.on('fwcFlightPhase').whenChanged());
    sub
      .on('groundSpeed')
      .atFrequency(2)
      .handle((value) => this.groundSpeed.set(value));

    this.dryStoppingDistance.sub(() => this.drawBtvLayer());
    this.wetStoppingDistance.sub(() => this.drawBtvLayer());
    this.liveStoppingDistance.sub(() => this.drawBtvLayer());
    this.remaininingDistToRwyEnd.sub(() => this.drawBtvLayer());
    this.aircraftOnGround?.sub(() => this.drawBtvLayer());
    this.zoomLevelIndex?.sub(() => this.drawBtvLayer());

    this.clearSelection();
  }

  private readonly groundSpeed = Arinc429Register.empty();

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remaininingDistToExit = Subject.create<number>(0);

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
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

  /** Stopping distance for dry rwy conditions, in meters. Null if not set. Counted from touchdown distance (min. 400m).  */
  private readonly dryStoppingDistance = ConsumerSubject.create(null, 0);

  /** Stopping distance for wet rwy conditions, in meters. Null if not set. Counted from touchdown distance (min. 400m).  */
  private readonly wetStoppingDistance = ConsumerSubject.create(null, 0);

  /** Live remaining stopping distance during deceleration, in meters. Null if not set. Counted from actual aircraft position. */
  private readonly liveStoppingDistance = ConsumerSubject.create(null, 0);

  /** "runway ahead" advisory was triggered */
  private rwyAheadTriggered: boolean = false;

  /** QFU of currently active "RWY AHEAD" advisory. */
  private rwyAheadQfu: string = '';

  /** Timestamp at which "runway ahead" advisory was triggered */
  private rwyAheadTriggeredTime: number = 0;

  private readonly rwyAheadArinc = Arinc429Word.empty();

  private readonly radioAltitude1 = ConsumerSubject.create(null, 0);

  private readonly radioAltitude2 = ConsumerSubject.create(null, 0);

  private readonly fwsFlightPhase = ConsumerSubject.create(null, 0);

  selectRunwayFromOans(
    runway: string,
    centerlineFeature: Feature<Geometry, AmdbProperties>,
    thresholdFeature: Feature<Geometry, AmdbProperties>,
  ) {
    this.clearSelection();

    // Select opposite threshold location
    const thrLoc = thresholdFeature.geometry.coordinates as Position;
    this.btvThresholdPosition = thrLoc;
    const firstEl = centerlineFeature.geometry.coordinates[0] as Position;
    const dist1 = pointDistance(thrLoc[0], thrLoc[1], firstEl[0], firstEl[1]);
    const lastEl = centerlineFeature.geometry.coordinates[
      centerlineFeature.geometry.coordinates.length - 1
    ] as Position;
    const dist2 = pointDistance(thrLoc[0], thrLoc[1], lastEl[0], lastEl[1]);
    if (dist1 > dist2) {
      this.btvOppositeThresholdPosition = centerlineFeature.geometry.coordinates[0] as Position;
    } else {
      this.btvOppositeThresholdPosition = lastEl;
    }

    // Derive LDA from geometry (if we take the LDA database value, there might be drawing errors)
    const lda = dist1 > dist2 ? dist1 : dist2;

    const heading = thresholdFeature.properties?.brngtrue ?? 0;

    this.btvRunwayLda.set(lda);
    this.btvRunwayBearingTrue.set(heading);
    this.btvRunway.set(runway);
    this.remaininingDistToRwyEnd.set(lda - MIN_TOUCHDOWN_ZONE_DISTANCE);
    this.remaininingDistToExit.set(lda - MIN_TOUCHDOWN_ZONE_DISTANCE);

    const pub = this.bus.getPublisher<FmsOansData>();
    pub.pub('oansSelectedLandingRunway', runway, true);
    Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_LENGTH', lda, Arinc429SignStatusMatrix.NormalOperation);
    Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_BEARING', heading, Arinc429SignStatusMatrix.NormalOperation);

    this.drawBtvLayer();
  }

  selectExitFromOans(exit: string, feature: Feature<Geometry, AmdbProperties>) {
    if (this.btvRunway.get() == null) {
      return;
    }

    const thrLoc = this.btvThresholdPosition;
    const exitLastIndex = feature.geometry.coordinates.length - 1;
    const exitLoc1 = feature.geometry.coordinates[0] as Position;
    const exitLoc2 = feature.geometry.coordinates[exitLastIndex] as Position;
    const exitDistFromCenterLine1 = pointToLineDistance(
      exitLoc1,
      this.btvThresholdPosition,
      this.btvOppositeThresholdPosition,
    );
    const exitDistFromCenterLine2 = pointToLineDistance(
      exitLoc2,
      this.btvThresholdPosition,
      this.btvOppositeThresholdPosition,
    );

    // Check whether valid path: Exit start position (i.e. point of exit line closest to threshold) should be inside runway
    const exitStartDistFromThreshold =
      exitDistFromCenterLine1 < exitDistFromCenterLine2
        ? pointDistance(thrLoc[0], thrLoc[1], exitLoc1[0], exitLoc1[1])
        : pointDistance(thrLoc[0], thrLoc[1], exitLoc2[0], exitLoc2[1]);

    const exitAngle =
      exitDistFromCenterLine1 < exitDistFromCenterLine2
        ? pointAngle(thrLoc[0], thrLoc[1], exitLoc1[0], exitLoc1[1]) -
          pointAngle(exitLoc1[0], exitLoc1[1], feature.geometry.coordinates[1][0], feature.geometry.coordinates[1][1])
        : pointAngle(thrLoc[0], thrLoc[1], exitLoc2[0], exitLoc2[1]) -
          pointAngle(
            exitLoc2[0],
            exitLoc2[1],
            feature.geometry.coordinates[exitLastIndex - 1][0],
            feature.geometry.coordinates[exitLastIndex - 1][1],
          );
    // Don't run backwards, don't start outside of runway, don't start before minimum touchdown distance
    if (
      Math.abs(exitAngle) > 120 ||
      Math.min(exitDistFromCenterLine1, exitDistFromCenterLine2) > 20 ||
      exitStartDistFromThreshold < MIN_TOUCHDOWN_ZONE_DISTANCE
    ) {
      return;
    }
    this.btvExitPosition = exitDistFromCenterLine1 < exitDistFromCenterLine2 ? exitLoc1 : exitLoc2;

    // Subtract 400m due to distance of touchdown zone from threshold
    const exitDistance =
      pointDistance(thrLoc[0], thrLoc[1], this.btvExitPosition[0], this.btvExitPosition[1]) -
      MIN_TOUCHDOWN_ZONE_DISTANCE;

    this.bus.getPublisher<FmsOansData>().pub('oansSelectedExit', exit);
    Arinc429Word.toSimVarValue(
      'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE',
      exitDistance,
      Arinc429SignStatusMatrix.NormalOperation,
    );

    this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `BTV ${this.btvRunway.get().substring(4)}/${exit}`, true);

    this.btvPathGeometry = Array.from(feature.geometry.coordinates as Position[]);
    if (exitDistFromCenterLine1 < exitDistFromCenterLine2) {
      this.btvPathGeometry.unshift(thrLoc);
    } else {
      this.btvPathGeometry.push(thrLoc);
    }

    this.btvExitDistance.set(exitDistance);
    this.btvExit.set(exit);

    this.drawBtvLayer();
  }

  selectRunwayFromNavdata(
    runway: string,
    lda: number,
    heading: number,
    btvThresholdPosition: Position,
    btvOppositeThresholdPosition: Position,
  ) {
    this.clearSelection();

    this.btvThresholdPosition = btvThresholdPosition;
    this.btvOppositeThresholdPosition = btvOppositeThresholdPosition;
    this.btvRunwayLda.set(lda);
    this.btvRunwayBearingTrue.set(heading);
    this.btvRunway.set(runway);
    this.remaininingDistToRwyEnd.set(lda - MIN_TOUCHDOWN_ZONE_DISTANCE);
    this.remaininingDistToExit.set(lda - MIN_TOUCHDOWN_ZONE_DISTANCE);

    const pub = this.bus.getPublisher<FmsOansData>();
    pub.pub('oansSelectedLandingRunway', runway, true);

    Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_LENGTH', lda, Arinc429SignStatusMatrix.NormalOperation);
    Arinc429Word.toSimVarValue('L:A32NX_OANS_RWY_BEARING', heading, Arinc429SignStatusMatrix.NormalOperation);
  }

  selectExitFromManualEntry(reqStoppingDistance: number, btvExitPosition: Position) {
    this.btvExitPosition = btvExitPosition;

    // Account for touchdown zone distance
    const correctedStoppingDistance = reqStoppingDistance - MIN_TOUCHDOWN_ZONE_DISTANCE;

    this.bus.getPublisher<FmsOansData>().pub('oansSelectedExit', 'N/A');
    Arinc429Word.toSimVarValue(
      'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE',
      correctedStoppingDistance,
      Arinc429SignStatusMatrix.NormalOperation,
    );

    this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `BTV ${this.btvRunway.get().substring(4)}/MANUAL`, true);

    this.btvExitDistance.set(correctedStoppingDistance);
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
    Arinc429Word.toSimVarValue('L:A32NX_BTV_TURNAROUND_IDLE_REVERSE', 0, Arinc429SignStatusMatrix.NoComputedData);
    Arinc429Word.toSimVarValue('L:A32NX_BTV_TURNAROUND_MAX_REVERSE', 0, Arinc429SignStatusMatrix.NoComputedData);
  }

  updateRemainingDistances(pos: Position) {
    // Only update below 600ft AGL, and in landing FMGC phase
    const ra1 = new Arinc429Word(this.radioAltitude1.get());
    const ra2 = new Arinc429Word(this.radioAltitude2.get());

    if (
      (!ra1.isNormalOperation() && !ra2.isNormalOperation()) ||
      (ra1.isNormalOperation() ? ra1.value : ra2.value) > 600 ||
      this.fwsFlightPhase.get() < 9 ||
      this.fwsFlightPhase.get() > 11
    ) {
      this.remaininingDistToRwyEnd.set(-1);
      this.remaininingDistToExit.set(-1);
      return;
    }

    if (this.btvThresholdPosition && this.btvThresholdPosition.length > 0) {
      if (this.btvOppositeThresholdPosition && this.btvOppositeThresholdPosition.length > 0) {
        const rwyEndDistanceFromTdz =
          pointDistance(
            this.btvThresholdPosition[0],
            this.btvThresholdPosition[1],
            this.btvOppositeThresholdPosition[0],
            this.btvOppositeThresholdPosition[1],
          ) - MIN_TOUCHDOWN_ZONE_DISTANCE;

        const rwyEndDistance = pointDistance(
          pos[0],
          pos[1],
          this.btvOppositeThresholdPosition[0],
          this.btvOppositeThresholdPosition[1],
        );

        this.remaininingDistToRwyEnd.set(MathUtils.round(Math.min(rwyEndDistanceFromTdz, rwyEndDistance), 0.1));
      }

      if (this.btvExitPosition && this.btvExitPosition.length > 0) {
        const exitDistanceFromTdz =
          pointDistance(
            this.btvThresholdPosition[0],
            this.btvThresholdPosition[1],
            this.btvExitPosition[0],
            this.btvExitPosition[1],
          ) - MIN_TOUCHDOWN_ZONE_DISTANCE;

        const exitDistance = pointDistance(pos[0], pos[1], this.btvExitPosition[0], this.btvExitPosition[1]);

        this.remaininingDistToExit.set(MathUtils.round(Math.min(exitDistanceFromTdz, exitDistance), 0.1));
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

    const radioAlt1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioAlt2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    const radioAlt = radioAlt1.isFailureWarning() || radioAlt1.isNoComputedData() ? radioAlt2 : radioAlt1;

    // Below 600ft RA, if somewhere on approach, update DRY/WET lines according to predicted touchdown point
    const dryWetLinesAreUpdating = radioAlt.valueOr(1000) <= 600;

    // Aircraft distance after threshold
    const aircraftDistFromThreshold = pointDistance(
      this.btvThresholdPosition[0],
      this.btvThresholdPosition[1],
      this.aircraftPpos[0],
      this.aircraftPpos[1],
    );
    const aircraftDistFromRunwayEnd = pointDistance(
      this.btvOppositeThresholdPosition[0],
      this.btvOppositeThresholdPosition[1],
      this.aircraftPpos[0],
      this.aircraftPpos[1],
    );
    const isPastThreshold = aircraftDistFromRunwayEnd < this.btvRunwayLda.get();
    // As soon as aircraft passes the touchdown zone distance, draw DRY and WET stop bars from there
    const touchdownDistance =
      dryWetLinesAreUpdating && isPastThreshold && aircraftDistFromThreshold > MIN_TOUCHDOWN_ZONE_DISTANCE
        ? aircraftDistFromThreshold
        : MIN_TOUCHDOWN_ZONE_DISTANCE;
    const dryRunoverCondition = touchdownDistance + this.dryStoppingDistance.get() > this.btvRunwayLda.get();
    const wetRunoverCondition = touchdownDistance + this.wetStoppingDistance.get() > this.btvRunwayLda.get();

    const latDistance = 27.5 / this.getZoomLevelInverseScale();
    const strokeWidth = 3.5 / this.getZoomLevelInverseScale();

    // DRY stop line
    if (this.dryStoppingDistance.get() > 0 && !this.aircraftOnGround.get()) {
      const distanceToDraw = Math.min(
        this.dryStoppingDistance.get(),
        this.btvRunwayLda.get() - touchdownDistance + CLAMP_DRY_STOPBAR_DISTANCE,
      );
      const dryStopLinePoint = fractionalPointAlongLine(
        this.btvThresholdPosition[0],
        this.btvThresholdPosition[1],
        this.btvOppositeThresholdPosition[0],
        this.btvOppositeThresholdPosition[1],
        (touchdownDistance + distanceToDraw) / this.btvRunwayLda.get(),
      );

      const dryP1 = [
        latDistance * Math.cos((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) +
          dryStopLinePoint[0],
        latDistance * Math.sin((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) +
          dryStopLinePoint[1],
      ];
      const dryP2 = [
        latDistance * Math.cos(-this.btvRunwayBearingTrue.get() * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[0],
        latDistance * Math.sin(-this.btvRunwayBearingTrue.get() * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[1],
      ];

      ctx.beginPath();
      ctx.lineWidth = strokeWidth + 10;
      ctx.strokeStyle = '#000000';
      ctx.moveTo(dryP1[0], dryP1[1] * -1);
      ctx.lineTo(dryStopLinePoint[0], dryStopLinePoint[1] * -1);
      ctx.lineTo(dryP2[0], dryP2[1] * -1);
      ctx.stroke();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = dryRunoverCondition ? '#ff0000' : '#ff94ff';
      ctx.moveTo(dryP1[0], dryP1[1] * -1);
      ctx.lineTo(dryStopLinePoint[0], dryStopLinePoint[1] * -1);
      ctx.lineTo(dryP2[0], dryP2[1] * -1);
      ctx.stroke();

      // Label
      const dryLabel: Label = {
        text: 'DRY',
        style: dryRunoverCondition ? LabelStyle.BtvStopLineRed : LabelStyle.BtvStopLineMagenta,
        position: dryP2,
        rotation: 0,
        associatedFeature: null,
      };
      this.labelManager.visibleLabels.insert(dryLabel);
      this.labelManager.labels.push(dryLabel);
    }

    // WET stop line
    if (this.wetStoppingDistance.get() > 0 && !this.aircraftOnGround.get()) {
      const distanceToDraw = Math.min(
        this.wetStoppingDistance.get(),
        this.btvRunwayLda.get() - touchdownDistance + CLAMP_WET_STOPBAR_DISTANCE,
      );
      const wetStopLinePoint = fractionalPointAlongLine(
        this.btvThresholdPosition[0],
        this.btvThresholdPosition[1],
        this.btvOppositeThresholdPosition[0],
        this.btvOppositeThresholdPosition[1],
        (touchdownDistance + distanceToDraw) / this.btvRunwayLda.get(),
      );

      const wetP1 = [
        latDistance * Math.cos((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) +
          wetStopLinePoint[0],
        latDistance * Math.sin((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) +
          wetStopLinePoint[1],
      ];
      const wetP2 = [
        latDistance * Math.cos(-this.btvRunwayBearingTrue.get() * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[0],
        latDistance * Math.sin(-this.btvRunwayBearingTrue.get() * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[1],
      ];

      ctx.beginPath();
      ctx.lineWidth = strokeWidth + 10;
      ctx.strokeStyle = '#000000';
      ctx.moveTo(wetP1[0], wetP1[1] * -1);
      ctx.lineTo(wetStopLinePoint[0], wetStopLinePoint[1] * -1);
      ctx.lineTo(wetP2[0], wetP2[1] * -1);
      ctx.stroke();
      ctx.lineWidth = strokeWidth;
      let labelStyle: LabelStyle;
      if (!dryRunoverCondition && !wetRunoverCondition) {
        ctx.strokeStyle = '#ff94ff'; // magenta
        labelStyle = LabelStyle.BtvStopLineMagenta;
      } else if (!dryRunoverCondition && wetRunoverCondition) {
        ctx.strokeStyle = '#e68000'; // amber
        labelStyle = LabelStyle.BtvStopLineAmber;
      } else {
        ctx.strokeStyle = '#ff0000';
        labelStyle = LabelStyle.BtvStopLineRed;
      }
      ctx.moveTo(wetP1[0], wetP1[1] * -1);
      ctx.lineTo(wetStopLinePoint[0], wetStopLinePoint[1] * -1);
      ctx.lineTo(wetP2[0], wetP2[1] * -1);
      ctx.stroke();

      // Label
      const wetLabel: Label = {
        text: 'WET',
        style: labelStyle,
        position: wetP2,
        rotation: 0,
        associatedFeature: null,
      };
      this.labelManager.visibleLabels.insert(wetLabel);
      this.labelManager.labels.push(wetLabel);
    }

    // On ground & above 25kts: STOP line
    if (this.liveStoppingDistance.get() > 0 && this.aircraftOnGround.get() && this.groundSpeed.value > 25) {
      const liveRunOverCondition = this.remaininingDistToRwyEnd.get() - this.liveStoppingDistance.get() <= 0;
      // If runover predicted, draw stop bar a little behind the runway end
      const distanceToDraw =
        liveRunOverCondition &&
        this.liveStoppingDistance.get() - this.remaininingDistToRwyEnd.get() > CLAMP_DRY_STOPBAR_DISTANCE
          ? this.remaininingDistToRwyEnd.get() + 100
          : this.liveStoppingDistance.get();
      const stopLinePoint = fractionalPointAlongLine(
        this.btvThresholdPosition[0],
        this.btvThresholdPosition[1],
        this.btvOppositeThresholdPosition[0],
        this.btvOppositeThresholdPosition[1],
        (aircraftDistFromThreshold + distanceToDraw) / this.btvRunwayLda.get(),
      );

      const stopP1 = [
        latDistance * Math.cos((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) +
          stopLinePoint[0],
        latDistance * Math.sin((180 - this.btvRunwayBearingTrue.get()) * MathUtils.DEGREES_TO_RADIANS) +
          stopLinePoint[1],
      ];
      const stopP2 = [
        latDistance * Math.cos(-this.btvRunwayBearingTrue.get() * MathUtils.DEGREES_TO_RADIANS) + stopLinePoint[0],
        latDistance * Math.sin(-this.btvRunwayBearingTrue.get() * MathUtils.DEGREES_TO_RADIANS) + stopLinePoint[1],
      ];

      ctx.beginPath();
      ctx.lineWidth = strokeWidth + 10;
      ctx.strokeStyle = '#000000';
      ctx.moveTo(stopP1[0], stopP1[1] * -1);
      ctx.lineTo(stopLinePoint[0], stopLinePoint[1] * -1);
      ctx.lineTo(stopP2[0], stopP2[1] * -1);
      ctx.stroke();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = liveRunOverCondition ? '#ff0000' : '#00ff00';
      ctx.moveTo(stopP1[0], stopP1[1] * -1);
      ctx.lineTo(stopLinePoint[0], stopLinePoint[1] * -1);
      ctx.lineTo(stopP2[0], stopP2[1] * -1);
      ctx.stroke();

      // Label
      const stoplineLabel: Label = {
        text: '',
        style: liveRunOverCondition ? LabelStyle.BtvStopLineRed : LabelStyle.BtvStopLineGreen,
        position: stopP1,
        rotation: 0,
        associatedFeature: null,
      };
      this.labelManager.visibleLabels.insert(stoplineLabel);
      this.labelManager.labels.push(stoplineLabel);
    }
  }

  drawBtvLayer() {
    if (!this.canvasRef?.getOrDefault()) {
      return;
    }

    const isStopLineStyle = (s: LabelStyle) =>
      [
        LabelStyle.BtvStopLineAmber,
        LabelStyle.BtvStopLineGreen,
        LabelStyle.BtvStopLineMagenta,
        LabelStyle.BtvStopLineRed,
      ].includes(s);

    this.canvasRef.instance
      .getContext('2d')
      .clearRect(0, 0, this.canvasRef.instance.width, this.canvasRef.instance.height);
    while (this.labelManager.visibleLabels.getArray().findIndex((it) => isStopLineStyle(it.style)) !== -1) {
      this.labelManager.visibleLabels.removeAt(
        this.labelManager.visibleLabels.getArray().findIndex((it) => isStopLineStyle(it.style)),
      );
    }
    this.labelManager.labels = this.labelManager.labels.filter((it) => !isStopLineStyle(it.style));
    this.drawBtvPath();
    this.drawStopLines();
  }

  private skip = 0;

  /**
   * Updates and issues OANS RWY AHEAD advisories on PFD and ND
   * @param globalPos Aircraft position in WGS-84
   * @param airportRefPos Airport reference position in WGS-84
   * @param aircraftBearing Aircraft bearing in degrees
   * @param runwayFeatures Runway AMDB feature collection
   */
  updateRwyAheadAdvisory(
    globalPos: Coordinates,
    airportRefPos: Coordinates,
    aircraftBearing: number,
    runwayFeatures: FeatureCollection<Geometry, AmdbProperties>,
  ): void {
    // Only update every 10 position update, computation is around 4ms
    this.skip++;
    if (this.skip % 10 !== 0) {
      return;
    }

    if (
      this.aircraftOnGround.get() === false ||
      this.groundSpeed.ssm !== Arinc429SignStatusMatrix.NormalOperation ||
      this.groundSpeed.value > 40 ||
      this.groundSpeed.value < 1
    ) {
      // Transmit no advisory
      this.rwyAheadArinc.ssm = Arinc429SignStatusMatrix.NormalOperation;
      this.rwyAheadArinc.setBitValue(11, false);
      Arinc429Word.toSimVarValue('L:A32NX_OANS_WORD_1', this.rwyAheadArinc.value, this.rwyAheadArinc.ssm);

      this.bus.getPublisher<FmsOansData>().pub('ndRwyAheadQfu', '', true);
      return;
    }

    // Warn 7s before entering the runway area: Draw area from aircraft nose to 7s in front of aircraft (with a/c width), check if intersects with runway geometry
    // Only available with AMDB data atm, i.e. Navigraph sub
    const distNose = 73 / 2 / MathUtils.METRES_TO_NAUTICAL_MILES;
    const dist7Sec = (this.groundSpeed.value / 60 / 60) * 7 + distNose; // Add distance to aircraft front
    const nosePosition = placeBearingDistance(globalPos, aircraftBearing, distNose);
    const predictionHorizon = placeBearingDistance(globalPos, aircraftBearing, dist7Sec);
    const line = lineString([
      [nosePosition.lat, nosePosition.long],
      [predictionHorizon.lat, predictionHorizon.long],
    ]);
    const leftLine = lineOffset(line, 30, { units: 'meters' });
    const rightLine = lineOffset(line, -30, { units: 'meters' });
    const volumeCoords = [
      globalToAirportCoordinates(airportRefPos, {
        lat: leftLine.geometry.coordinates[0][0],
        long: leftLine.geometry.coordinates[0][1],
      }) as Position,
      globalToAirportCoordinates(airportRefPos, {
        lat: leftLine.geometry.coordinates[1][0],
        long: leftLine.geometry.coordinates[1][1],
      }) as Position,
      globalToAirportCoordinates(airportRefPos, {
        lat: rightLine.geometry.coordinates[1][0],
        long: rightLine.geometry.coordinates[1][1],
      }) as Position,
      globalToAirportCoordinates(airportRefPos, {
        lat: rightLine.geometry.coordinates[0][0],
        long: rightLine.geometry.coordinates[0][1],
      }) as Position,
      globalToAirportCoordinates(airportRefPos, {
        lat: leftLine.geometry.coordinates[0][0],
        long: leftLine.geometry.coordinates[0][1],
      }) as Position,
    ];

    // From here on comparing local to local coords
    const predictionVolume = polygon([volumeCoords]);
    const acLocalCoords = globalToAirportCoordinates(airportRefPos, globalPos);

    const insideRunways = [];
    runwayFeatures.features.forEach((feat) => {
      if (feat.properties.idrwy) {
        const inside = booleanContains(feat.geometry as Polygon, point(acLocalCoords));
        if (inside) {
          insideRunways.push(feat.properties.idrwy.replace('.', ' - '));
        }
      }
    });

    const willEnterRunwaysNotInside = [];
    for (const feat of runwayFeatures.features) {
      if (feat.properties.idrwy) {
        const qfu = feat.properties.idrwy.replace('.', ' - ');
        const intersects = !booleanDisjoint(predictionVolume, feat.geometry as Polygon); // very costly
        if (intersects && !insideRunways.includes(qfu)) {
          willEnterRunwaysNotInside.push(qfu);
          break;
        }
      }
    }

    // Set rwyAhead to false (i.e. suppress), if:
    // More than 30s since rwyAheadTriggeredTime, or
    // Aircraft inside runway area
    if (
      (this.rwyAheadTriggered && Date.now() - this.rwyAheadTriggeredTime > 30_000) ||
      willEnterRunwaysNotInside.length === 0
    ) {
      this.rwyAheadTriggered = false;
      this.rwyAheadTriggeredTime = 0;
      this.rwyAheadQfu = '';
    } else {
      if (!this.rwyAheadTriggered) {
        this.rwyAheadTriggeredTime = Date.now();
      }

      this.rwyAheadTriggered = true;
      this.rwyAheadQfu = willEnterRunwaysNotInside[0];
    }

    // Transmit on bus
    this.rwyAheadArinc.ssm = Arinc429SignStatusMatrix.NormalOperation;
    this.rwyAheadArinc.setBitValue(11, this.rwyAheadTriggered && this.rwyAheadQfu !== '');
    Arinc429Word.toSimVarValue('L:A32NX_OANS_WORD_1', this.rwyAheadArinc.value, this.rwyAheadArinc.ssm);

    this.bus.getPublisher<FmsOansData>().pub('ndRwyAheadQfu', this.rwyAheadQfu, true);
  }
}
