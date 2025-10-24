// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, MappedSubject, NodeReference, Subject, Subscribable } from '@microsoft/msfs-sdk';
import {
  AmdbProperties,
  Arinc429LocalVarConsumerSubject,
  BTV_MIN_TOUCHDOWN_ZONE_DISTANCE,
  FmsOansData,
  GenericAdirsEvents,
  IrBusEvents,
  LgciuBusEvents,
  OansMapProjection,
  RaBusEvents,
  Runway,
} from '@flybywiresim/fbw-sdk';
import {
  booleanContains,
  booleanDisjoint,
  Feature,
  FeatureCollection,
  Geometry,
  lineOffset,
  lineString,
  point,
  polygon,
  Polygon,
  Position,
} from '@turf/turf';
import { Arinc429Register, Arinc429SignStatusMatrix, MathUtils } from '@flybywiresim/fbw-sdk';
import { Label, LabelStyle } from '.';
import { BtvData } from '../../../shared/src/publishers/OansBtv/BtvPublisher';
import { OancLabelManager } from './OancLabelManager';
import { fractionalPointAlongLine, pointAngle, pointToLineDistance } from './OancMapUtils';
import { Coordinates, placeBearingDistance } from 'msfs-geo';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

const CLAMP_DRY_STOPBAR_DISTANCE = 100; // If stop bar is <> meters behind end of runway, clamp to this distance behind end of runway
const CLAMP_WET_STOPBAR_DISTANCE = 200; // If stop bar is <> meters behind end of runway, clamp to this distance behind end of runway

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */

export class OansBrakeToVacateSelection<T extends number> {
  private readonly sub = this.bus.getSubscriber<
    BtvData & FmsOansData & IrBusEvents & LgciuBusEvents & GenericAdirsEvents & RaBusEvents
  >();

  private readonly runwayLengthArinc = Arinc429Register.empty();

  private readonly runwayBearingArinc = Arinc429Register.empty();

  constructor(
    private readonly bus: EventBus,
    private readonly labelManager?: OancLabelManager<T>,
    private readonly aircraftOnGround?: Subscribable<boolean>,
    private readonly aircraftPpos?: Subscribable<Position>,
    private readonly airportCoordinates?: Subscribable<Coordinates>,
    private readonly canvasRef?: NodeReference<HTMLCanvasElement>,
    private readonly canvasCentreX?: Subscribable<number>,
    private readonly canvasCentreY?: Subscribable<number>,
    private readonly zoomLevelIndex?: Subscribable<number>,
    private getZoomLevelInverseScale?: () => number,
  ) {
    this.dryStoppingDistance.sub(() => this.drawBtvLayer());
    this.wetStoppingDistance.sub(() => this.drawBtvLayer());
    this.liveStoppingDistance.sub(() => this.drawBtvLayer());
    this.remaininingDistToRwyEnd.sub(() => this.drawBtvLayer());
    this.aircraftOnGround?.sub(() => this.drawBtvLayer());
    this.zoomLevelIndex?.sub(() => this.drawBtvLayer());

    this.clearSelection();
  }

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remaininingDistToRwyEnd = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('oansRemainingDistToRwyEnd'),
  );

  readonly btvRunway = Subject.create<string | null>(null);

  /** Landing distance available, in meters. Null if not set. */
  readonly btvRunwayLda = Subject.create<number | null>(null);

  /** Runway heading, in degrees. Null if not set. */
  readonly btvRunwayBearingTrue = Subject.create<number | null>(null);

  /** Reference point used to coordinate transformations from nav db reference. */
  private navDbAirportCoordinates: Coordinates | null = null;

  /** Threshold, used for runway end distance calculation. Airport local coordinates, reference point from AMDB. */
  private btvThresholdPositionOansReference: Position | undefined;

  /** Opposite threshold, used for runway end distance calculation. Airport local coordinates, reference point from AMDB. */
  private btvOppositeThresholdPositionOansReference: Position | undefined;

  /** Threshold, used for runway end distance calculation. Airport local coordinates, reference point from nav db. */
  private btvThresholdPositionNavDbReference: Position = [];

  /** Opposite threshold, used for runway end distance calculation. Airport local coordinates, reference point from nav db. */
  private btvOppositeThresholdPositionNavDbReference: Position = [];

  /** Selected exit */
  readonly btvExit = Subject.create<string | null>(null);

  /** Distance to exit, in meters. Null if not set. */
  readonly btvExitDistance = Subject.create<number | null>(null);

  /** BTV exit position. Airport local coordinates, reference point from AMDB. */
  private btvExitPositionOansReference: Position | undefined;
  /** BTV exit position. Airport local coordinates, reference point from nav db. */
  private btvExitPositionNavDbReference: Position = [];

  /** "runway ahead" advisory was triggered */
  private rwyAheadTriggered: boolean = false;

  /** QFU of currently active "RWY AHEAD" advisory. */
  private rwyAheadQfu: string = '';

  /** Timestamp at which "runway ahead" advisory was triggered */
  private rwyAheadTriggeredTime: number = 0;

  private rwyAheadPredictionVolumePoints: Position[] = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];

  private readonly rwyAheadArinc = Arinc429Register.empty();

  private btvPathGeometry: Position[] = [];

  /** Stopping distance for dry rwy conditions, in meters. Null if not set. Counted from touchdown distance (min. 400m).  */
  private readonly dryStoppingDistance = ConsumerSubject.create(this.sub.on('dryStoppingDistance').whenChanged(), 0);

  /** Stopping distance for wet rwy conditions, in meters. Null if not set. Counted from touchdown distance (min. 400m).  */
  private readonly wetStoppingDistance = ConsumerSubject.create(this.sub.on('wetStoppingDistance').whenChanged(), 0);

  /** Live remaining stopping distance during deceleration, in meters. Null if not set. Counted from actual aircraft position. */
  private readonly liveStoppingDistance = ConsumerSubject.create(this.sub.on('stopBarDistance').whenChanged(), 0);

  private readonly radioAltitude1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ra_radio_altitude_1'));
  private readonly radioAltitude2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ra_radio_altitude_2'));
  private readonly radioAltitude3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ra_radio_altitude_3'));

  private readonly groundSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('groundSpeed'));

  private readonly lgciuDiscreteWord2_1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('lgciu_discrete_word_2_1'),
  );
  private readonly lgciuDiscreteWord2_2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('lgciu_discrete_word_2_2'),
  );
  private readonly onGround = MappedSubject.create(
    ([g1, g2]) => {
      if (g1.isNormalOperation()) {
        return g1.bitValue(11);
      } else {
        return g2.bitValueOr(11, false);
      }
    },
    this.lgciuDiscreteWord2_1,
    this.lgciuDiscreteWord2_2,
  );

  async selectRunwayFromOans(
    runway: string,
    centerlineFeature: Feature<Geometry, AmdbProperties>,
    thresholdFeature: Feature<Geometry, AmdbProperties>,
  ) {
    this.clearSelection();

    // Select opposite threshold location
    const thrLoc = thresholdFeature.geometry.coordinates as Position;
    this.btvThresholdPositionOansReference = thrLoc;
    const firstEl = centerlineFeature.geometry.coordinates[0] as Position;
    const dist1 = MathUtils.pointDistance(thrLoc[0], thrLoc[1], firstEl[0], firstEl[1]);
    const lastEl = centerlineFeature.geometry.coordinates[
      centerlineFeature.geometry.coordinates.length - 1
    ] as Position;
    const dist2 = MathUtils.pointDistance(thrLoc[0], thrLoc[1], lastEl[0], lastEl[1]);
    if (dist1 > dist2) {
      this.btvOppositeThresholdPositionOansReference = centerlineFeature.geometry.coordinates[0] as Position;
    } else {
      this.btvOppositeThresholdPositionOansReference = lastEl;
    }

    // Transform to airport local coordinates; from OANS ref point to nav db ref point
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const arps = await db.getAirports([runway.substring(0, 4)]);
    this.navDbAirportCoordinates = arps[0].location;
    const globalThresholdCoordinates: Coordinates = { lat: 0, long: 0 };
    OansMapProjection.airportToGlobalCoordinates(
      this.airportCoordinates!.get(),
      this.btvThresholdPositionOansReference,
      globalThresholdCoordinates,
    );
    OansMapProjection.globalToAirportCoordinates(
      this.navDbAirportCoordinates,
      globalThresholdCoordinates,
      this.btvThresholdPositionNavDbReference,
    );

    OansMapProjection.airportToGlobalCoordinates(
      this.airportCoordinates!.get(),
      this.btvOppositeThresholdPositionOansReference,
      globalThresholdCoordinates,
    );
    OansMapProjection.globalToAirportCoordinates(
      this.navDbAirportCoordinates,
      globalThresholdCoordinates,
      this.btvOppositeThresholdPositionNavDbReference,
    );
    // Derive LDA from geometry (if we take the LDA database value, there might be drawing errors)
    const lda = dist1 > dist2 ? dist1 : dist2;

    const heading = thresholdFeature.properties?.brngmag ?? 0;

    this.btvRunwayLda.set(lda);
    this.btvRunwayBearingTrue.set(heading);
    this.btvRunway.set(runway);

    const pub = this.bus.getPublisher<FmsOansData>();
    pub.pub('oansSelectedLandingRunway', runway);
    pub.pub(
      'oansThresholdPositions',
      [this.btvThresholdPositionNavDbReference, this.btvOppositeThresholdPositionNavDbReference],
      true,
    );

    this.runwayLengthArinc.setValue(lda);
    this.runwayLengthArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
    this.runwayLengthArinc.writeToSimVar('L:A32NX_OANS_RWY_LENGTH');

    this.runwayBearingArinc.setValue(heading);
    this.runwayBearingArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
    this.runwayBearingArinc.writeToSimVar('L:A32NX_OANS_RWY_BEARING');

    this.drawBtvLayer();
  }

  async selectExitFromOans(exit: string, feature: Feature<Geometry, AmdbProperties>) {
    if (
      this.btvRunway.get() == null ||
      !this.btvThresholdPositionOansReference ||
      !this.btvOppositeThresholdPositionOansReference ||
      !this.navDbAirportCoordinates
    ) {
      return;
    }

    const thrLoc = this.btvThresholdPositionOansReference;
    const exitLastIndex = feature.geometry.coordinates.length - 1;
    const exitLoc1 = feature.geometry.coordinates[0] as Position;
    const exitLoc2 = feature.geometry.coordinates[exitLastIndex] as Position;
    const exitDistFromCenterLine1 = pointToLineDistance(
      exitLoc1,
      this.btvThresholdPositionOansReference,
      this.btvOppositeThresholdPositionOansReference,
    );
    const exitDistFromCenterLine2 = pointToLineDistance(
      exitLoc2,
      this.btvThresholdPositionOansReference,
      this.btvOppositeThresholdPositionOansReference,
    );

    // Check whether valid path: Exit start position (i.e. point of exit line closest to threshold) should be inside runway
    const exitStartDistFromThreshold =
      exitDistFromCenterLine1 < exitDistFromCenterLine2
        ? MathUtils.pointDistance(thrLoc[0], thrLoc[1], exitLoc1[0], exitLoc1[1])
        : MathUtils.pointDistance(thrLoc[0], thrLoc[1], exitLoc2[0], exitLoc2[1]);

    const geoCoords = feature.geometry.coordinates as Position[]; // trust me, bro
    const exitAngle =
      exitDistFromCenterLine1 < exitDistFromCenterLine2
        ? pointAngle(thrLoc[0], thrLoc[1], exitLoc1[0], exitLoc1[1]) -
          pointAngle(exitLoc1[0], exitLoc1[1], geoCoords[1][0], geoCoords[1][1])
        : pointAngle(thrLoc[0], thrLoc[1], exitLoc2[0], exitLoc2[1]) -
          pointAngle(exitLoc2[0], exitLoc2[1], geoCoords[exitLastIndex - 1][0], geoCoords[exitLastIndex - 1][1]);
    // Don't run backwards, don't start outside of runway, don't start before minimum touchdown distance
    if (
      Math.abs(exitAngle) > 120 ||
      Math.min(exitDistFromCenterLine1, exitDistFromCenterLine2) > 20 ||
      exitStartDistFromThreshold < BTV_MIN_TOUCHDOWN_ZONE_DISTANCE
    ) {
      return;
    }
    this.btvExitPositionOansReference = exitDistFromCenterLine1 < exitDistFromCenterLine2 ? exitLoc1 : exitLoc2;

    // Transform to airport local coordinates; from OANS ref point to nav db ref point
    const globalExitCoordinates: Coordinates = { lat: 0, long: 0 };
    OansMapProjection.airportToGlobalCoordinates(
      this.airportCoordinates!.get(),
      this.btvExitPositionOansReference,
      globalExitCoordinates,
    );
    OansMapProjection.globalToAirportCoordinates(
      this.navDbAirportCoordinates,
      globalExitCoordinates,
      this.btvExitPositionNavDbReference,
    );

    this.bus.getPublisher<FmsOansData>().pub('oansExitPosition', this.btvExitPositionNavDbReference, true);
    console.log('Selected BTV exit position:', this.btvExitPositionNavDbReference);

    // Subtract 400m due to distance of touchdown zone from threshold
    const exitDistance =
      MathUtils.pointDistance(
        thrLoc[0],
        thrLoc[1],
        this.btvExitPositionOansReference[0],
        this.btvExitPositionOansReference[1],
      ) - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;

    this.bus.getPublisher<FmsOansData>().pub('oansSelectedExit', exit);
    this.bus
      .getPublisher<FmsOansData>()
      .pub('ndBtvMessage', `BTV ${this.btvRunway.get()?.substring(4) ?? ''}/${exit}`, true);

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

    this.btvThresholdPositionNavDbReference = btvThresholdPosition;
    this.btvOppositeThresholdPositionNavDbReference = btvOppositeThresholdPosition;
    this.btvThresholdPositionOansReference = undefined;
    this.btvOppositeThresholdPositionOansReference = undefined;
    this.btvRunwayLda.set(lda);
    this.btvRunwayBearingTrue.set(heading);
    this.btvRunway.set(runway);

    const pub = this.bus.getPublisher<FmsOansData>();
    pub.pub('oansSelectedLandingRunway', runway);
    pub.pub(
      'oansThresholdPositions',
      [this.btvThresholdPositionNavDbReference, this.btvOppositeThresholdPositionNavDbReference],
      true,
    );

    this.runwayLengthArinc.setValue(lda);
    this.runwayLengthArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
    this.runwayLengthArinc.writeToSimVar('L:A32NX_OANS_RWY_LENGTH');

    this.runwayBearingArinc.setValue(heading);
    this.runwayBearingArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
    this.runwayBearingArinc.writeToSimVar('L:A32NX_OANS_RWY_BEARING');
  }

  public async setBtvRunwayFromNavdata(destination: string, rwyIdent: string): Promise<[Runway, Coordinates]> {
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const arps = await db.getAirports([destination]);
    const arpCoordinates = arps[0].location;

    const runways = await db.getRunways(destination);
    const landingRunwayNavdata = runways.filter((rw) => rw.ident === rwyIdent)[0];
    const oppositeThreshold = placeBearingDistance(
      landingRunwayNavdata.thresholdLocation,
      landingRunwayNavdata.bearing,
      landingRunwayNavdata.length / MathUtils.METRES_TO_NAUTICAL_MILES,
    );
    const localThr: Position = [0, 0];
    const localOppThr: Position = [0, 0];
    OansMapProjection.globalToAirportCoordinates(arpCoordinates, landingRunwayNavdata.thresholdLocation, localThr);
    OansMapProjection.globalToAirportCoordinates(arpCoordinates, oppositeThreshold, localOppThr);

    this.selectRunwayFromNavdata(
      rwyIdent,
      landingRunwayNavdata.length,
      landingRunwayNavdata.bearing,
      localThr,
      localOppThr,
    );

    return [landingRunwayNavdata, arpCoordinates];
  }

  selectExitFromManualEntry(reqStoppingDistance: number, btvExitPosition: Position) {
    this.btvExitPositionNavDbReference = btvExitPosition;
    this.btvExitPositionOansReference = undefined;

    // Requested stopping distance measured from runway threshold (i.e. LDA)
    const correctedStoppingDistance = reqStoppingDistance;

    const pub = this.bus.getPublisher<FmsOansData>();
    pub.pub('oansSelectedExit', 'N/A');
    pub.pub('oansExitPosition', this.btvExitPositionNavDbReference, true);

    pub.pub('ndBtvMessage', `BTV ${this.btvRunway.get()?.substring(4) ?? ''}/MANUAL`, true);

    this.btvExitDistance.set(correctedStoppingDistance);
    this.btvExit.set('N/A');
  }

  clearSelection() {
    this.btvThresholdPositionOansReference = undefined;
    this.btvOppositeThresholdPositionOansReference = undefined;
    this.btvThresholdPositionNavDbReference = [];
    this.btvOppositeThresholdPositionNavDbReference = [];
    this.btvRunwayLda.set(null);
    this.btvRunwayBearingTrue.set(null);
    this.btvRunway.set(null);

    this.btvExitPositionOansReference = undefined;
    this.btvExitPositionNavDbReference = [];
    this.btvExitDistance.set(null);
    this.btvExit.set(null);
    this.btvPathGeometry = [];
    this.drawBtvLayer();

    const pub = this.bus.getPublisher<FmsOansData>();
    pub.pub('oansSelectedLandingRunway', null);
    pub.pub('oansSelectedExit', null, true);
    pub.pub('oansThresholdPositions', [], true);
    pub.pub('oansExitPosition', [], true);
    pub.pub('ndBtvMessage', '', true);

    this.runwayLengthArinc.setValue(0);
    this.runwayLengthArinc.setSsm(Arinc429SignStatusMatrix.NoComputedData);
    this.runwayLengthArinc.writeToSimVar('L:A32NX_OANS_RWY_LENGTH');

    this.runwayBearingArinc.setValue(0);
    this.runwayBearingArinc.setSsm(Arinc429SignStatusMatrix.NoComputedData);
    this.runwayBearingArinc.writeToSimVar('L:A32NX_OANS_RWY_BEARING');
  }

  drawBtvPath() {
    const ctx = this.canvasRef?.instance.getContext('2d');
    if (!this.btvPathGeometry.length || !this.canvasRef?.getOrDefault() || !ctx) {
      return;
    }

    ctx.resetTransform();
    ctx.translate(this.canvasCentreX?.get() ?? 0, this.canvasCentreY?.get() ?? 0);

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
    const ctx = this.canvasRef?.instance.getContext('2d');
    const aircraftPpos = this.aircraftPpos?.get();
    const acOnGround = this.aircraftOnGround?.get();
    const rwyBearingTrue = this.btvRunwayBearingTrue.get();
    if (
      !this.btvThresholdPositionOansReference?.length ||
      !this.btvOppositeThresholdPositionOansReference ||
      !this.canvasRef?.getOrDefault() ||
      !ctx ||
      !aircraftPpos ||
      !this.getZoomLevelInverseScale ||
      acOnGround === undefined ||
      rwyBearingTrue === null
    ) {
      return;
    }

    ctx.resetTransform();
    ctx.translate(this.canvasCentreX?.get() ?? 0, this.canvasCentreY?.get() ?? 0);

    const radioAlt = !this.radioAltitude1.get().isInvalid()
      ? this.radioAltitude1.get()
      : !this.radioAltitude2.get().isInvalid()
        ? this.radioAltitude2.get()
        : this.radioAltitude3.get();

    // Below 600ft RA, if somewhere on approach, update DRY/WET lines according to predicted touchdown point
    const dryWetLinesAreUpdating = radioAlt.valueOr(1000) <= 600;

    // Aircraft distance after threshold

    const aircraftDistFromThreshold = MathUtils.pointDistance(
      this.btvThresholdPositionOansReference[0],
      this.btvThresholdPositionOansReference[1],
      aircraftPpos[0],
      aircraftPpos[1],
    );
    const aircraftDistFromRunwayEnd = MathUtils.pointDistance(
      this.btvOppositeThresholdPositionOansReference[0],
      this.btvOppositeThresholdPositionOansReference[1],
      aircraftPpos[0],
      aircraftPpos[1],
    );
    const rwyLda = this.btvRunwayLda.get() ?? 0;
    const isPastThreshold = aircraftDistFromRunwayEnd < rwyLda;
    // As soon as aircraft passes the touchdown zone distance, draw DRY and WET stop bars from there
    const touchdownDistance =
      dryWetLinesAreUpdating && isPastThreshold && aircraftDistFromThreshold > BTV_MIN_TOUCHDOWN_ZONE_DISTANCE
        ? aircraftDistFromThreshold
        : BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;
    const dryRunoverCondition = touchdownDistance + this.dryStoppingDistance.get() > rwyLda;
    const wetRunoverCondition = touchdownDistance + this.wetStoppingDistance.get() > rwyLda;

    const latDistance = 27.5 / this.getZoomLevelInverseScale();
    const strokeWidth = 3.5 / this.getZoomLevelInverseScale();

    // DRY stop line
    if (this.dryStoppingDistance.get() > 0 && !acOnGround) {
      const distanceToDraw = Math.min(
        this.dryStoppingDistance.get(),
        rwyLda - touchdownDistance + CLAMP_DRY_STOPBAR_DISTANCE,
      );
      const dryStopLinePoint = fractionalPointAlongLine(
        this.btvThresholdPositionOansReference[0],
        this.btvThresholdPositionOansReference[1],
        this.btvOppositeThresholdPositionOansReference[0],
        this.btvOppositeThresholdPositionOansReference[1],
        (touchdownDistance + distanceToDraw) / rwyLda,
      );

      const dryP1 = [
        latDistance * Math.cos((180 - rwyBearingTrue) * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[0],
        latDistance * Math.sin((180 - rwyBearingTrue) * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[1],
      ];
      const dryP2 = [
        latDistance * Math.cos(-rwyBearingTrue * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[0],
        latDistance * Math.sin(-rwyBearingTrue * MathUtils.DEGREES_TO_RADIANS) + dryStopLinePoint[1],
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
        associatedFeature: undefined,
      };
      this.labelManager?.visibleLabels.insert(dryLabel);
      this.labelManager?.labels.push(dryLabel);
    }

    // WET stop line
    if (this.wetStoppingDistance.get() > 0 && !acOnGround) {
      const distanceToDraw = Math.min(
        this.wetStoppingDistance.get(),
        rwyLda - touchdownDistance + CLAMP_WET_STOPBAR_DISTANCE,
      );
      const wetStopLinePoint = fractionalPointAlongLine(
        this.btvThresholdPositionOansReference[0],
        this.btvThresholdPositionOansReference[1],
        this.btvOppositeThresholdPositionOansReference[0],
        this.btvOppositeThresholdPositionOansReference[1],
        (touchdownDistance + distanceToDraw) / rwyLda,
      );

      const wetP1 = [
        latDistance * Math.cos((180 - rwyBearingTrue) * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[0],
        latDistance * Math.sin((180 - rwyBearingTrue) * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[1],
      ];
      const wetP2 = [
        latDistance * Math.cos(-rwyBearingTrue * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[0],
        latDistance * Math.sin(-rwyBearingTrue * MathUtils.DEGREES_TO_RADIANS) + wetStopLinePoint[1],
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
        associatedFeature: undefined,
      };
      this.labelManager?.visibleLabels.insert(wetLabel);
      this.labelManager?.labels.push(wetLabel);
    }

    // On ground & above 25kts: STOP line
    const distToRwyEnd = this.remaininingDistToRwyEnd.get();
    if (
      this.liveStoppingDistance.get() > 0 &&
      acOnGround &&
      this.groundSpeed.get().value > 25 &&
      distToRwyEnd.ssm === Arinc429SignStatusMatrix.NormalOperation
    ) {
      const liveRunOverCondition = distToRwyEnd.value - this.liveStoppingDistance.get() <= 0;
      // If runover predicted, draw stop bar a little behind the runway end
      const distanceToDraw =
        liveRunOverCondition && this.liveStoppingDistance.get() - distToRwyEnd.value > CLAMP_DRY_STOPBAR_DISTANCE
          ? distToRwyEnd.value + 100
          : this.liveStoppingDistance.get();
      const stopLinePoint = fractionalPointAlongLine(
        this.btvThresholdPositionOansReference[0],
        this.btvThresholdPositionOansReference[1],
        this.btvOppositeThresholdPositionOansReference[0],
        this.btvOppositeThresholdPositionOansReference[1],
        (aircraftDistFromThreshold + distanceToDraw) / rwyLda,
      );

      const stopP1 = [
        latDistance * Math.cos((180 - rwyBearingTrue) * MathUtils.DEGREES_TO_RADIANS) + stopLinePoint[0],
        latDistance * Math.sin((180 - rwyBearingTrue) * MathUtils.DEGREES_TO_RADIANS) + stopLinePoint[1],
      ];
      const stopP2 = [
        latDistance * Math.cos(-rwyBearingTrue * MathUtils.DEGREES_TO_RADIANS) + stopLinePoint[0],
        latDistance * Math.sin(-rwyBearingTrue * MathUtils.DEGREES_TO_RADIANS) + stopLinePoint[1],
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
        associatedFeature: undefined,
      };
      this.labelManager?.visibleLabels.insert(stoplineLabel);
      this.labelManager?.labels.push(stoplineLabel);
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
      ?.clearRect(0, 0, this.canvasRef.instance.width, this.canvasRef.instance.height);
    while (this.labelManager?.visibleLabels.getArray().findIndex((it) => isStopLineStyle(it.style)) !== -1) {
      this.labelManager?.visibleLabels.removeAt(
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
    // Only update every 10th position update, computation is around 4ms
    this.skip++;
    if (this.skip % 10 !== 0) {
      return;
    }

    const aircraftPpos = this.aircraftPpos?.get();

    if (
      this.onGround.get() === false ||
      this.groundSpeed.get().ssm !== Arinc429SignStatusMatrix.NormalOperation ||
      this.groundSpeed.get().value > 40 ||
      this.groundSpeed.get().value < 1 ||
      !aircraftPpos
    ) {
      this.transmitRwyAheadAdvisory(false, '', true);
      return;
    }

    // Warn 7s before entering the runway area: Draw area from aircraft nose to 7s in front of aircraft (with a/c width), check if intersects with runway geometry
    // Only available with AMDB data atm, i.e. Navigraph sub
    const distNose = 73 / 2 / MathUtils.METRES_TO_NAUTICAL_MILES;
    const dist7Sec = (this.groundSpeed.get().value / 60 / 60) * 7 + distNose; // Add distance to aircraft front
    const nosePosition = placeBearingDistance(globalPos, aircraftBearing, distNose);
    const predictionHorizon = placeBearingDistance(globalPos, aircraftBearing, dist7Sec);
    const line = lineString([
      [nosePosition.lat, nosePosition.long],
      [predictionHorizon.lat, predictionHorizon.long],
    ]);
    const leftLine = lineOffset(line, 30, { units: 'meters' });
    const rightLine = lineOffset(line, -30, { units: 'meters' });
    OansMapProjection.globalToAirportCoordinates(
      airportRefPos,
      {
        lat: leftLine.geometry.coordinates[0][0],
        long: leftLine.geometry.coordinates[0][1],
      },
      this.rwyAheadPredictionVolumePoints[0],
    );
    OansMapProjection.globalToAirportCoordinates(
      airportRefPos,
      {
        lat: leftLine.geometry.coordinates[1][0],
        long: leftLine.geometry.coordinates[1][1],
      },
      this.rwyAheadPredictionVolumePoints[1],
    );
    OansMapProjection.globalToAirportCoordinates(
      airportRefPos,
      {
        lat: rightLine.geometry.coordinates[1][0],
        long: rightLine.geometry.coordinates[1][1],
      },
      this.rwyAheadPredictionVolumePoints[2],
    );
    OansMapProjection.globalToAirportCoordinates(
      airportRefPos,
      {
        lat: rightLine.geometry.coordinates[0][0],
        long: rightLine.geometry.coordinates[0][1],
      },
      this.rwyAheadPredictionVolumePoints[3],
    );
    OansMapProjection.globalToAirportCoordinates(
      airportRefPos,
      {
        lat: leftLine.geometry.coordinates[0][0],
        long: leftLine.geometry.coordinates[0][1],
      },
      this.rwyAheadPredictionVolumePoints[4],
    );

    // From here on comparing local to local coords
    const predictionVolume = polygon([this.rwyAheadPredictionVolumePoints]);

    const insideRunways: string[] = [];
    runwayFeatures.features.forEach((feat) => {
      if (feat.properties.idrwy) {
        const inside = booleanContains(feat.geometry as Polygon, point(aircraftPpos));
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
    this.transmitRwyAheadAdvisory(this.rwyAheadTriggered && this.rwyAheadQfu !== '', this.rwyAheadQfu);
  }

  transmitRwyAheadAdvisory(bitValue: boolean, qfu: string, faulty = false) {
    // Transmit no advisory
    this.rwyAheadArinc.setSsm(
      faulty ? Arinc429SignStatusMatrix.FailureWarning : Arinc429SignStatusMatrix.NormalOperation,
    );
    this.rwyAheadArinc.setBitValue(11, bitValue);
    this.rwyAheadArinc.writeToSimVar('L:A32NX_OANS_WORD_1');

    this.bus.getPublisher<FmsOansData>().pub('ndRwyAheadQfu', qfu, true);
    return;
  }
}
