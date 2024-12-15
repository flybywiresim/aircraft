// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  DebounceTimer,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  SubscribableArrayEventType,
  UnitType,
  VNode,
  Wait,
} from '@microsoft/msfs-sdk';
import {
  AmdbFeatureCollection,
  AmdbFeatureTypeStrings,
  AmdbProjection,
  AmdbProperties,
  FeatureType,
  FeatureTypeString,
  MathUtils,
  PolygonalStructureType,
  EfisNdMode,
  MapParameters,
  EfisSide,
  FmsOansData,
  FcuSimVars,
  GenericAdirsEvents,
  Arinc429LocalVarConsumerSubject,
} from '@flybywiresim/fbw-sdk';
import {
  BBox,
  bbox,
  bboxPolygon,
  booleanPointInPolygon,
  centroid,
  Feature,
  featureCollection,
  FeatureCollection,
  Geometry,
  LineString,
  Point,
  Polygon,
  Position,
} from '@turf/turf';
import { bearingTo, clampAngle, Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';

import { OansControlEvents } from './OansControlEventPublisher';
import { reciprocal } from '@fmgc/guidance/lnav/CommonGeometry';
import { FmsDataStore } from './OancControlPanelUtils';
import { OansBrakeToVacateSelection } from './OansBrakeToVacateSelection';
import { STYLE_DATA } from './style-data';
import { OancMovingModeOverlay, OancStaticModeOverlay } from './OancMovingModeOverlay';
import { OancAircraftIcon } from './OancAircraftIcon';
import { OancLabelManager } from './OancLabelManager';
import { OancPositionComputer } from './OancPositionComputer';
import { NavigraphAmdbClient } from './api/NavigraphAmdbClient';
import { globalToAirportCoordinates, pointAngle, pointDistance } from './OancMapUtils';

export const OANC_RENDER_WIDTH = 768;
export const OANC_RENDER_HEIGHT = 768;

const FEATURE_DRAW_PER_FRAME = 50;

export const ZOOM_TRANSITION_TIME_MS = 300;

const PAN_MIN_MOVEMENT = 10;

const LABEL_FEATURE_TYPES = [
  FeatureType.TaxiwayElement,
  FeatureType.VerticalPolygonalStructure,
  FeatureType.PaintedCenterline,
  FeatureType.ParkingStandLocation,
  FeatureType.RunwayExitLine,
];

const LABEL_POLYGON_STRUCTURE_TYPES = [PolygonalStructureType.TerminalBuilding];

export type A320EfisZoomRangeValue = 0.2 | 0.5 | 1 | 2.5;

export type A380EfisZoomRangeValue = 0.2 | 0.5 | 1 | 2 | 5;

export const a320EfisZoomRangeSettings: A320EfisZoomRangeValue[] = [0.2, 0.5, 1, 2.5];

export const a380EfisZoomRangeSettings: A380EfisZoomRangeValue[] = [0.2, 0.5, 1, 2, 5];

const DEFAULT_SCALE_NM = 0.539957;

const LAYER_VISIBILITY_RULES = [
  [true, true, true, true, false, false, true, true],
  [true, true, true, true, false, false, false, true],
  [false, true, false, false, true, true, false, true],
  [false, true, false, false, true, true, false, true],
  [false, true, false, false, true, true, false, true],
];

export const LABEL_VISIBILITY_RULES = [true, true, true, true, true];

export enum LabelStyle {
  Taxiway = 'taxiway',
  ExitLine = 'exit-line',
  TerminalBuilding = 'terminal-building',
  RunwayAxis = 'runway-axis',
  RunwayEnd = 'runway-end',
  FmsSelectedRunwayEnd = 'runway-end-fms-selected',
  FmsSelectedRunwayAxis = 'runway-axis-fms-selected',
  BtvSelectedRunwayEnd = 'runway-end-btv-selected',
  BtvSelectedRunwayArrow = 'runway-arrow-btv-selected',
  BtvSelectedExit = 'exit-line-btv-selected',
  BtvStopLineMagenta = 'btv-stop-line-magenta',
  BtvStopLineAmber = 'btv-stop-line-amber',
  BtvStopLineRed = 'btv-stop-line-red',
  BtvStopLineGreen = 'btv-stop-line-green',
}

export interface Label {
  text: string;
  style: LabelStyle;
  position: Position;
  rotation: number | undefined;
  associatedFeature: Feature<Geometry, AmdbProperties>;
}

export interface ContextMenuItemData {
  name: string;

  disabled?: boolean | Subscribable<boolean>;

  onPressed?: () => void;
}

export interface OancProps<T extends number> extends ComponentProps {
  bus: EventBus;
  side: EfisSide;
  contextMenuVisible?: Subject<boolean>;
  contextMenuX?: Subject<number>;
  contextMenuY?: Subject<number>;
  contextMenuItems?: ContextMenuItemData[];
  zoomValues: T[];
}

export class Oanc<T extends number> extends DisplayComponent<OancProps<T>> {
  private readonly sub = this.props.bus.getSubscriber<
    FcuSimVars & OansControlEvents & FmsOansData & GenericAdirsEvents
  >();

  private readonly animationContainerRef = [
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>(),
  ];

  private readonly panContainerRef = [FSComponent.createRef<HTMLDivElement>(), FSComponent.createRef<HTMLDivElement>()];

  private readonly layerCanvasRefs = [
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
  ];

  private readonly layerCanvasScaleContainerRefs = [
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
    FSComponent.createRef<HTMLCanvasElement>(),
  ];

  public labelContainerRef = FSComponent.createRef<HTMLDivElement>();

  public data: AmdbFeatureCollection | undefined;

  private dataBbox: BBox | undefined;

  private arpCoordinates: Subject<Coordinates | undefined> = Subject.create(undefined);

  private canvasCenterCoordinates: Coordinates | undefined;

  private readonly dataAirportName = Subject.create('');

  private readonly dataAirportIcao = Subject.create('');

  private readonly dataAirportIata = Subject.create('');

  private readonly positionString = Subject.create('');

  private readonly positionVisible = Subject.create(false);

  private readonly airportInfoLine1 = this.dataAirportName.map((it) => it.toUpperCase());

  private readonly airportInfoLine2 = MappedSubject.create(
    ([icao, iata]) => `${icao}  ${iata}`,
    this.dataAirportIcao,
    this.dataAirportIata,
  );

  private layerFeatures: FeatureCollection<Geometry, AmdbProperties>[] = [
    featureCollection([]), // Layer 0: TAXIWAY BG + TAXIWAY SHOULDER
    featureCollection([]), // Layer 1: APRON + STAND BG + BUILDINGS (terminal only)
    featureCollection([]), // Layer 2: RUNWAY (with markings)
    featureCollection([]), // Layer 3: RUNWAY (without markings)
    featureCollection([]), // Layer 4: TAXIWAY GUIDANCE LINES (scaled width), HOLD SHORT LINES
    featureCollection([]), // Layer 5: TAXIWAY GUIDANCE LINES (unscaled width)
    featureCollection([]), // Layer 6: STAND GUIDANCE LINES (scaled width)
    featureCollection([]), // Layer 7: DYNAMIC CONTENT (BTV PATH, STOP LINES)
  ];

  public amdbClient = new NavigraphAmdbClient();

  private labelManager = new OancLabelManager<T>(this);

  private positionComputer = new OancPositionComputer<T>(this);

  public dataLoading = false;

  public doneDrawing = false;

  private isPanningArmed = false;

  public isPanning = false;

  private lastPanX = 0;

  private lastPanY = 0;

  public panArmedX = Subject.create(0);

  public panArmedY = Subject.create(0);

  public panOffsetX = Subject.create(0);

  public panOffsetY = Subject.create(0);

  public panBeingAnimated = Subject.create(false);

  // eslint-disable-next-line arrow-body-style
  private readonly isMapPanned = MappedSubject.create(
    ([panX, panY, panBeingAnimated]) => {
      return panX !== 0 || panY !== 0 || panBeingAnimated;
    },
    this.panOffsetX,
    this.panOffsetY,
    this.panBeingAnimated,
  );

  public modeAnimationOffsetX = Subject.create(0);

  public modeAnimationOffsetY = Subject.create(0);

  private modeAnimationMapNorthUp = Subject.create(false);

  private canvasWidth = Subject.create(0);

  private canvasHeight = Subject.create(0);

  private canvasCentreX = Subject.create(0);

  private canvasCentreY = Subject.create(0);

  // TODO: Should be using GPS position interpolated with IRS velocity data
  private readonly pposLatWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('latitude'));

  private readonly pposLongWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('longitude'));

  public readonly ppos = MappedSubject.create(
    ([latWord, longWord]) => ({ lat: latWord.value, long: longWord.value }) as Coordinates,
    this.pposLatWord,
    this.pposLongWord,
  );

  private readonly trueHeadingWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('trueHeadingRaw'));

  public referencePos: Coordinates = { lat: 0, long: 0 };

  public readonly aircraftWithinAirport = Subject.create(false);

  private readonly airportWithinRange = Subject.create(false);

  private readonly airportBearing = Subject.create(0);

  public readonly projectedPpos = MappedSubject.create(
    ([ppos, arpCoordinates], previous: Position) => {
      if (arpCoordinates) {
        return globalToAirportCoordinates(arpCoordinates, ppos, [0, 0]);
      }

      return previous;
    },
    this.ppos,
    this.arpCoordinates,
  );

  private readonly aircraftOnGround = Subject.create(true);

  private readonly mapHeading = Subject.create(0);

  public readonly interpolatedMapHeading = Subject.create(0);

  public readonly previousZoomLevelIndex: Subject<number> = Subject.create(this.props.zoomValues.length - 1);

  public readonly zoomLevelIndex: Subject<number> = Subject.create(this.props.zoomValues.length - 1);

  public readonly canvasCentreReferencedMapParams = new MapParameters();

  public readonly arpReferencedMapParams = new MapParameters();

  private readonly oansVisible = ConsumerSubject.create<boolean>(null, false);

  private readonly efisNDModeSub = ConsumerSubject.create<EfisNdMode>(null, EfisNdMode.PLAN);

  private readonly efisOansRangeSub = ConsumerSubject.create<number>(null, 4);

  private readonly overlayNDModeSub = Subject.create(EfisNdMode.PLAN);

  private readonly ndModeSwitchDelayDebouncer = new DebounceTimer();

  private readonly fmsDataStore = new FmsDataStore(this.props.bus);

  private readonly btvUtils = new OansBrakeToVacateSelection<T>(
    this.props.bus,
    this.labelManager,
    this.aircraftOnGround,
    this.projectedPpos,
    this.layerCanvasRefs[7],
    this.canvasCentreX,
    this.canvasCentreY,
    this.zoomLevelIndex,
    this.getZoomLevelInverseScale.bind(this),
  );

  private readonly airportNotInActiveFpln = MappedSubject.create(
    ([ndMode, arpt, origin, dest, altn]) => ndMode !== EfisNdMode.ARC && ![origin, dest, altn].includes(arpt),
    this.overlayNDModeSub,
    this.dataAirportIcao,
    this.fmsDataStore.origin,
    this.fmsDataStore.destination,
    this.fmsDataStore.alternate,
  );

  private readonly pposNotAvailable = MappedSubject.create(
    ([lat, long, trueHeading]) =>
      !lat.isNormalOperation() || !long.isNormalOperation() || !trueHeading.isNormalOperation(),
    this.pposLatWord,
    this.pposLongWord,
    this.trueHeadingWord,
  );

  // eslint-disable-next-line arrow-body-style
  public usingPposAsReference = MappedSubject.create(
    ([overlayNDMode, aircraftOnGround, aircraftWithinAirport]) => {
      return (aircraftOnGround && aircraftWithinAirport) || overlayNDMode === EfisNdMode.ARC;
    },
    this.overlayNDModeSub,
    this.aircraftOnGround,
    this.aircraftWithinAirport,
  );

  // eslint-disable-next-line arrow-body-style
  private readonly showAircraft = MappedSubject.create(
    ([icao, pposRef]) => icao !== '' && pposRef,
    this.dataAirportIcao,
    this.usingPposAsReference,
  );

  private readonly aircraftX = Subject.create(0);

  private readonly aircraftY = Subject.create(0);

  private readonly aircraftRotation = Subject.create(0);

  private readonly zoomLevelScales: number[] = this.props.zoomValues.map((it) => 1 / ((it * 2) / DEFAULT_SCALE_NM));

  private readonly airportLoading = Subject.create(false);

  private readonly arptNavPosLostFlagVisible = MappedSubject.create(
    ([pposNotAvailable, efisNDModeSub]) => pposNotAvailable && efisNDModeSub !== EfisNdMode.PLAN,
    this.pposNotAvailable,
    this.overlayNDModeSub,
  );

  private readonly pleaseWaitFlagVisible = MappedSubject.create(
    ([arptNavPosLostFlagVisible, airportLoading]) => !arptNavPosLostFlagVisible && airportLoading,
    this.arptNavPosLostFlagVisible,
    this.airportLoading,
  );

  private readonly oansNotAvailable = ConsumerSubject.create(null, false);

  private readonly anyFlagVisible = MappedSubject.create(
    ([arptNavPosLostFlagVisible, pleaseWaitFlagVisible]) => arptNavPosLostFlagVisible || pleaseWaitFlagVisible,
    this.arptNavPosLostFlagVisible,
    this.pleaseWaitFlagVisible,
  );

  public getZoomLevelInverseScale() {
    const multiplier = this.overlayNDModeSub.get() === EfisNdMode.ROSE_NAV ? 0.5 : 1;

    return this.zoomLevelScales[this.zoomLevelIndex.get()] * multiplier;
  }

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.labelContainerRef.instance.addEventListener('mousedown', this.handleCursorPanStart.bind(this));
    this.labelContainerRef.instance.addEventListener('mousemove', this.handleCursorPanMove.bind(this));
    this.labelContainerRef.instance.addEventListener('mouseup', this.handleCursorPanStop.bind(this));

    this.oansVisible.setConsumer(this.sub.on('ndShowOans'));
    this.oansNotAvailable.setConsumer(this.sub.on('oansNotAvail'));
    this.efisNDModeSub.setConsumer(this.sub.on('ndMode'));

    this.efisNDModeSub.sub((mode) => {
      this.handleNDModeChange(mode);
      this.handleLabelFilter();
    }, true);

    this.efisOansRangeSub.setConsumer(this.sub.on('oansRange'));

    this.efisOansRangeSub.sub((range) => this.zoomLevelIndex.set(range), true);

    this.sub
      .on('oansDisplayAirport')
      .whenChanged()
      .handle((airport) => {
        this.loadAirportMap(airport);
      });

    this.fmsDataStore.origin.sub(() => this.updateLabelClasses());
    this.fmsDataStore.departureRunway.sub(() => this.updateLabelClasses());
    this.fmsDataStore.destination.sub(() => this.updateLabelClasses());
    this.fmsDataStore.landingRunway.sub(() => this.updateLabelClasses());
    this.btvUtils.btvRunway.sub(() => this.updateLabelClasses());
    this.btvUtils.btvExit.sub(() => {
      this.updateLabelClasses();
    });

    this.labelManager.visibleLabels.sub((index, type, item) => {
      switch (type) {
        case SubscribableArrayEventType.Added: {
          if (Array.isArray(item)) {
            for (const label of item as Label[]) {
              const element = this.createLabelElement(label);

              this.labelContainerRef.instance.appendChild(element);
              this.labelManager.visibleLabelElements.set(label, element);
            }
          } else {
            const element = this.createLabelElement(item as Label);

            this.labelContainerRef.instance.appendChild(element);
            this.labelManager.visibleLabelElements.set(item as Label, element);
          }
          break;
        }
        case SubscribableArrayEventType.Removed: {
          if (Array.isArray(item)) {
            for (const label of item as Label[]) {
              const element = this.labelManager.visibleLabelElements.get(label);
              this.labelContainerRef.instance.removeChild(element);
              this.labelManager.visibleLabelElements.delete(label);
            }
          } else {
            const element = this.labelManager.visibleLabelElements.get(item as Label);
            if (element) {
              this.labelContainerRef.instance.removeChild(element);
              this.labelManager.visibleLabelElements.delete(item as Label);
            }
          }
          break;
        }
        default:
          break;
      }
    });

    this.zoomLevelIndex.sub(() => this.handleLabelFilter(), true);

    MappedSubject.create(this.panOffsetX, this.panOffsetY).sub(([x, y]) => {
      this.panContainerRef[0].instance.style.transform = `translate(${x}px, ${y}px)`;
      this.panContainerRef[1].instance.style.transform = `translate(${x}px, ${y}px)`;

      this.labelManager.reflowLabels(
        this.fmsDataStore.departureRunway.get(),
        this.fmsDataStore.landingRunway.get(),
        this.btvUtils.btvRunway.get(),
        this.btvUtils.btvExit.get(),
      );
    });

    MappedSubject.create(
      ([x, y]) => {
        this.animationContainerRef[0].instance.style.transform = `translate(${x}px, ${y}px)`;
        this.animationContainerRef[1].instance.style.transform = `translate(${x}px, ${y}px)`;
      },
      this.modeAnimationOffsetX,
      this.modeAnimationOffsetY,
    );
  }

  private handleLabelFilter() {
    this.labelManager.showLabels = false;

    if (this.efisNDModeSub.get() === EfisNdMode.ARC) {
      switch (this.zoomLevelIndex.get()) {
        case 4:
        case 3:
          this.labelManager.currentFilter = { type: 'none' };
          break;
        case 2:
          this.labelManager.currentFilter = { type: 'major' };
          break;
        default:
          this.labelManager.currentFilter = { type: 'null' };
          break;
      }
    } else {
      switch (this.zoomLevelIndex.get()) {
        case 0:
          this.labelManager.currentFilter = { type: 'runwayBtvSelection', runwayIdent: null, showAdjacent: true };
          break;
        default:
          this.labelManager.currentFilter = { type: 'runwayBtvSelection', runwayIdent: null, showAdjacent: false };
          break;
      }
    }

    this.handleLayerVisibilities();

    setTimeout(() => (this.labelManager.showLabels = true), ZOOM_TRANSITION_TIME_MS + 200);
  }

  public async loadAirportMap(icao: string) {
    this.dataLoading = true;

    this.airportLoading.set(true);

    this.clearData();
    this.clearMap();
    this.btvUtils.clearSelection();

    const includeFeatureTypes: FeatureType[] = Object.values(STYLE_DATA).reduce(
      (acc, it) => [
        ...acc,
        ...it.reduce((acc, it) => [...acc, ...(it?.dontFetchFromAmdb ? [] : it.forFeatureTypes)], []),
      ],
      [],
    );
    const includeLayers = includeFeatureTypes.map((it) => AmdbFeatureTypeStrings[it]);

    // Additional stuff we need that isn't handled by the canvas renderer
    includeLayers.push(FeatureTypeString.AerodromeReferencePoint);
    includeLayers.push(FeatureTypeString.ParkingStandLocation);
    includeLayers.push(FeatureTypeString.PaintedCenterline);
    includeLayers.push(FeatureTypeString.RunwayThreshold);

    const data = await this.amdbClient.getAirportData(icao, includeLayers, undefined);
    const wgs84ArpDat = await this.amdbClient.getAirportData(
      icao,
      [FeatureTypeString.AerodromeReferencePoint],
      undefined,
      AmdbProjection.Epsg4326,
    );

    const features = Object.values(data).reduce(
      (acc, it) => [...acc, ...it.features],
      [] as Feature<Geometry, AmdbProperties>[],
    );
    const airportMap: AmdbFeatureCollection = featureCollection(features);

    const wgs84ReferencePoint = wgs84ArpDat.aerodromereferencepoint.features[0];

    if (!wgs84ReferencePoint) {
      console.error('[OANC](loadAirportMap) Invalid airport data - aerodrome reference point not found');
      return;
    }

    const refPointLat = (wgs84ReferencePoint.geometry as Point).coordinates[1];
    const refPointLong = (wgs84ReferencePoint.geometry as Point).coordinates[0];
    const projectionScale = 1000;

    if (!refPointLat || !refPointLong || !projectionScale) {
      console.error(
        '[OANC](loadAirportMap) Invalid airport data - aerodrome reference point does not contain lat/long/scale custom properties',
      );
      return;
    }
    this.arpCoordinates.set({ lat: refPointLat, long: refPointLong });

    this.data = airportMap;

    this.dataAirportName.set(wgs84ReferencePoint.properties.name);
    this.dataAirportIcao.set(icao);
    this.dataAirportIata.set(wgs84ReferencePoint.properties.iata);

    // Figure out the boundaries of the map data
    const dataBbox = bbox(airportMap);

    if (!this.pposNotAvailable.get()) {
      this.aircraftWithinAirport.set(booleanPointInPolygon(this.projectedPpos.get(), bboxPolygon(dataBbox)));
    } else {
      this.aircraftWithinAirport.set(false);
    }

    const width = (dataBbox[2] - dataBbox[0]) * 1;
    const height = (dataBbox[3] - dataBbox[1]) * 1;

    this.canvasWidth.set(width);
    this.canvasHeight.set(height);
    this.canvasCentreX.set(Math.abs(dataBbox[0]));
    this.canvasCentreY.set(Math.abs(dataBbox[3]));

    this.canvasCenterCoordinates = this.calculateCanvasCenterCoordinates();

    this.sortDataIntoLayers(this.data);
    this.generateAllLabels(this.data);

    this.dataLoading = false;
  }

  private calculateCanvasCenterCoordinates() {
    const pxDistanceToCanvasCentre = pointDistance(
      this.canvasWidth.get() / 2,
      this.canvasHeight.get() / 2,
      this.canvasCentreX.get(),
      this.canvasCentreY.get(),
    );
    const nmDistanceToCanvasCentre = UnitType.NMILE.convertFrom(pxDistanceToCanvasCentre / 1_000, UnitType.KILOMETER);
    const angleToCanvasCentre = clampAngle(
      pointAngle(
        this.canvasWidth.get() / 2,
        this.canvasHeight.get() / 2,
        this.canvasCentreX.get(),
        this.canvasCentreY.get(),
      ) + 90,
    );

    return placeBearingDistance(this.arpCoordinates.get(), reciprocal(angleToCanvasCentre), nmDistanceToCanvasCentre);
  }

  private createLabelElement(label: Label): HTMLDivElement {
    const element = document.createElement('div');

    element.classList.add('oanc-label');
    element.classList.add(`oanc-label-style-${label.style}`);
    element.textContent = label.text;

    if (label.style === LabelStyle.RunwayEnd) {
      element.addEventListener('click', () => {
        const thresholdFeature = this.data.features.filter(
          (it) => it.properties.feattype === FeatureType.RunwayThreshold && it.properties?.idthr === label.text,
        );
        this.btvUtils.selectRunwayFromOans(
          `${this.dataAirportIcao.get()}${label.text}`,
          label.associatedFeature,
          thresholdFeature[0],
        );
      });
    }
    if (
      label.style === LabelStyle.ExitLine &&
      label.associatedFeature.properties.feattype === FeatureType.RunwayExitLine
    ) {
      element.addEventListener('click', () => {
        this.btvUtils.selectExitFromOans(label.text, label.associatedFeature);
      });
    }

    return element;
  }

  private sortDataIntoLayers(data: FeatureCollection<Geometry, AmdbProperties>) {
    for (let i = 0; i < this.layerFeatures.length; i++) {
      const layer = this.layerFeatures[i];

      const layerFeatureTypes = STYLE_DATA[i].reduce(
        (acc, rule) => [...acc, ...rule.forFeatureTypes],
        [] as FeatureType[],
      );
      const layerPolygonStructureTypes = STYLE_DATA[i].reduce(
        (acc, rule) => [...acc, ...(rule.forPolygonStructureTypes ?? [])],
        [] as PolygonalStructureType[],
      );
      const layerData = data.features.filter((it) => {
        if (it.properties.feattype === FeatureType.VerticalPolygonalStructure) {
          return (
            layerFeatureTypes.includes(FeatureType.VerticalPolygonalStructure) &&
            layerPolygonStructureTypes.includes(it.properties.plysttyp)
          );
        }
        return layerFeatureTypes.includes(it.properties.feattype);
      });

      layer.features.push(...layerData);
    }
  }

  private generateAllLabels(data: FeatureCollection<Geometry, AmdbProperties>) {
    for (const feature of data.features) {
      if (!LABEL_FEATURE_TYPES.includes(feature.properties.feattype)) {
        continue;
      }

      // Only include "Taxiway" features that have a valid "idlin" property
      if (feature.properties.feattype === FeatureType.TaxiwayElement && !feature.properties.idlin) {
        continue;
      }

      // Only include "VerticalPolygonObject" features whose "plysttyp" property has what we want
      if (
        feature.properties.feattype === FeatureType.VerticalPolygonalStructure &&
        !LABEL_POLYGON_STRUCTURE_TYPES.includes(feature.properties.plysttyp)
      ) {
        continue;
      }

      let labelPosition: Position;
      switch (feature.geometry.type) {
        case 'Point': {
          const point = feature.geometry as Point;

          labelPosition = point.coordinates;
          break;
        }
        case 'Polygon': {
          const polygon = feature.geometry as Polygon;

          labelPosition = centroid(polygon).geometry.coordinates;
          break;
        }
        case 'LineString': {
          const lineString = feature.geometry as LineString;

          labelPosition = centroid(lineString).geometry.coordinates;
          break;
        }
        default: {
          console.error(`[OANC] Cannot determine label position for geometry of type '${feature.geometry.type}'`);
        }
      }

      if (feature.properties.feattype === FeatureType.PaintedCenterline) {
        const designators: string[] = [];
        if (feature.properties.idrwy) {
          designators.push(...feature.properties.idrwy.split('.'));
        }

        if (designators.length === 0) {
          console.error(`Runway feature (id=${feature.properties.id}) does not have a valid idrwy value`);
          continue;
        }

        const runwayLine = feature.geometry as LineString;
        const runwayLineStart = runwayLine.coordinates[0];
        const runwayLineEnd = runwayLine.coordinates[runwayLine.coordinates.length - 1];
        const runwayLineBearing = clampAngle(
          -Math.atan2(runwayLineStart[1] - runwayLineEnd[1], runwayLineStart[0] - runwayLineEnd[0]) *
            MathUtils.RADIANS_TO_DEGREES +
            90,
        );

        // If reciprocal bearing doesn't match to rwy designator[0], swap designators
        if (
          Math.abs(Number(designators[0].replace(/\D/g, '')) * 10 - reciprocal(runwayLineBearing)) > 90 &&
          designators.length === 2
        ) {
          const copied = Array.from(designators);
          designators.length = 0;
          designators.push(copied[1], copied[0]);
        }

        const isFmsOrigin = this.dataAirportIcao.get() === this.fmsDataStore.origin.get();
        const isFmsDestination = this.dataAirportIcao.get() === this.fmsDataStore.origin.get();
        const isSelectedRunway =
          (isFmsOrigin && designators.includes(this.fmsDataStore.departureRunway.get()?.substring(4))) ||
          (isFmsDestination && designators.includes(this.fmsDataStore.landingRunway.get()?.substring(4)));

        const label1: Label = {
          text: designators[0],
          style:
            this.btvUtils.btvRunway.get() === designators[0] ? LabelStyle.BtvSelectedRunwayEnd : LabelStyle.RunwayEnd,
          position: runwayLineStart,
          rotation: reciprocal(runwayLineBearing),
          associatedFeature: feature,
        };
        this.labelManager.visibleLabels.insert(label1);
        this.labelManager.labels.push(label1);

        // Sometimes, runways have only one designator (e.g. EDDF 18R)
        if (designators[1]) {
          const label2: Label = {
            text: designators[1],
            style:
              this.btvUtils.btvRunway.get() === designators[1] ? LabelStyle.BtvSelectedRunwayEnd : LabelStyle.RunwayEnd,
            position: runwayLineEnd,
            rotation: runwayLineBearing,
            associatedFeature: feature,
          };
          this.labelManager.visibleLabels.insert(label2);
          this.labelManager.labels.push(label2);

          const label3: Label = {
            text: `${designators[0]}-${designators[1]}`,
            style: isSelectedRunway ? LabelStyle.FmsSelectedRunwayAxis : LabelStyle.RunwayAxis,
            position: runwayLineEnd,
            rotation: runwayLineBearing,
            associatedFeature: feature,
          };
          this.labelManager.visibleLabels.insert(label3);
          this.labelManager.labels.push(label3);
        } else {
          const label3: Label = {
            text: designators[0],
            style: isSelectedRunway ? LabelStyle.FmsSelectedRunwayAxis : LabelStyle.RunwayAxis,
            position: runwayLineEnd,
            rotation: runwayLineBearing,
            associatedFeature: feature,
          };
          this.labelManager.visibleLabels.insert(label3);
          this.labelManager.labels.push(label3);
        }

        // Selected FMS runway (origin or destination)
        const labelFms1: Label = {
          text: designators[0],
          style: LabelStyle.FmsSelectedRunwayEnd,
          position: runwayLineStart,
          rotation: reciprocal(runwayLineBearing),
          associatedFeature: feature,
        };
        this.labelManager.labels.push(labelFms1);
        this.labelManager.visibleLabels.insert(labelFms1);

        const labelFms2: Label = {
          text: designators[1],
          style: LabelStyle.FmsSelectedRunwayEnd,
          position: runwayLineEnd,
          rotation: runwayLineBearing,
          associatedFeature: feature,
        };
        this.labelManager.labels.push(labelFms2);
        this.labelManager.visibleLabels.insert(labelFms2);

        // BTV selected runway
        const btvSelectedArrow1: Label = {
          text: designators[0],
          style: LabelStyle.BtvSelectedRunwayArrow,
          position: runwayLineStart,
          rotation: reciprocal(runwayLineBearing),
          associatedFeature: feature,
        };
        this.labelManager.labels.push(btvSelectedArrow1);
        this.labelManager.visibleLabels.insert(btvSelectedArrow1);

        const btvSelectedArrow2: Label = {
          text: designators[1],
          style: LabelStyle.BtvSelectedRunwayArrow,
          position: runwayLineEnd,
          rotation: runwayLineBearing,
          associatedFeature: feature,
        };
        this.labelManager.labels.push(btvSelectedArrow2);
        this.labelManager.visibleLabels.insert(btvSelectedArrow2);
      } else {
        const text = feature.properties.idlin ?? feature.properties.idstd ?? feature.properties.ident ?? undefined;

        if (
          feature.properties.feattype === FeatureType.ParkingStandLocation &&
          text !== undefined &&
          text.includes('_')
        ) {
          continue;
        }

        if (text !== undefined) {
          let style: LabelStyle.TerminalBuilding | LabelStyle.Taxiway | LabelStyle.ExitLine;
          switch (feature.properties.feattype) {
            case FeatureType.VerticalPolygonalStructure:
              style = LabelStyle.TerminalBuilding;
              break;
            case FeatureType.ParkingStandLocation:
              style = LabelStyle.TerminalBuilding;
              break;
            case FeatureType.RunwayExitLine:
              style = LabelStyle.ExitLine;
              break;
            default:
              style = LabelStyle.Taxiway;
              break;
          }

          const existing = this.labelManager.labels.filter((it) => it.text === text);

          const shortestDistance = existing.reduce((shortestDistance, label) => {
            const distance = pointDistance(label.position[0], label.position[1], labelPosition[0], labelPosition[1]);

            return distance > shortestDistance ? distance : shortestDistance;
          }, Number.MAX_SAFE_INTEGER);

          if (
            (feature.properties.feattype === FeatureType.ParkingStandLocation &&
              existing.some((it) => feature.properties.termref === it.associatedFeature.properties.termref)) ||
            shortestDistance < 50
          ) {
            continue;
          }

          const label = {
            text: text.toUpperCase(),
            style,
            position: labelPosition,
            rotation: undefined,
            associatedFeature: feature,
          };

          this.labelManager.labels.push(label);
          this.labelManager.visibleLabels.insert(label);
        }
      }
    }
  }

  private lastLayerDrawnIndex = 0;

  private lastFeatureDrawnIndex = 0;

  private lastTime = 0;

  public Update() {
    const now = Date.now();
    const deltaTime = (now - this.lastTime) / 1_000;
    this.lastTime = now;

    if (!this.data || this.dataLoading) return;

    this.aircraftOnGround.set(
      ![6, 7, 8, 9].includes(SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', SimVarValueType.Number)),
    );

    // This will always be false without ppos, otherwise it will be updated below
    let airportTooFarAwayAndInArcMode = false;

    if (!this.pposNotAvailable.get()) {
      this.aircraftWithinAirport.set(booleanPointInPolygon(this.projectedPpos.get(), bboxPolygon(bbox(this.data))));

      const distToArpt = this.arpCoordinates.get() ? distanceTo(this.ppos.get(), this.arpCoordinates.get()) : 9999;

      // If in ARC mode and airport more than 30nm away, apply a hack to not create a huge canvas (only shift airport a little bit out of view with a static offset)
      airportTooFarAwayAndInArcMode = this.usingPposAsReference.get() && distToArpt > 30;

      if (this.arpCoordinates.get()) {
        this.airportWithinRange.set(distToArpt < this.props.zoomValues[this.zoomLevelIndex.get()] + 3); // Add 3nm for airport dimension, FIXME better estimation
        this.airportBearing.set(bearingTo(this.ppos.get(), this.arpCoordinates.get()));
      } else {
        this.airportWithinRange.set(true);
        this.airportBearing.set(0);
      }
    } else {
      this.aircraftWithinAirport.set(false);
      this.airportWithinRange.set(true);
    }

    if (this.usingPposAsReference.get() || !this.arpCoordinates.get()) {
      this.referencePos = this.ppos.get();
    } else {
      this.referencePos = this.arpCoordinates.get();
    }

    if (!this.pposNotAvailable.get()) {
      const position = this.positionComputer.computePosition();

      if (position) {
        this.positionVisible.set(true);
        this.positionString.set(position);
      } else {
        this.positionVisible.set(false);
      }

      this.props.bus.getPublisher<FmsOansData>().pub('oansAirportLocalCoordinates', this.projectedPpos.get(), true);
      this.btvUtils.updateRwyAheadAdvisory(
        this.ppos.get(),
        this.arpCoordinates.get(),
        this.trueHeadingWord.get().value,
        this.layerFeatures[2],
      );
    } else {
      this.positionVisible.set(false);
    }

    // If OANS is not visible on this side (i.e. range selector is not on ZOOM), don't continue here to save runtime
    if (!this.oansVisible.get()) {
      return;
    }

    const mapTargetHeading = this.modeAnimationMapNorthUp.get() ? 0 : this.trueHeadingWord.get().value;
    this.mapHeading.set(mapTargetHeading);

    const interpolatedMapHeading = this.interpolatedMapHeading.get();

    if (Math.abs(mapTargetHeading - interpolatedMapHeading) > 0.1) {
      const rotateLeft = MathUtils.diffAngle(interpolatedMapHeading, mapTargetHeading) < 0;

      if (rotateLeft) {
        this.interpolatedMapHeading.set(clampAngle(interpolatedMapHeading - deltaTime * 90));

        if (MathUtils.diffAngle(this.interpolatedMapHeading.get(), mapTargetHeading) > 0) {
          this.interpolatedMapHeading.set(mapTargetHeading);
        }
      } else {
        this.interpolatedMapHeading.set(clampAngle(interpolatedMapHeading + deltaTime * 90));

        if (MathUtils.diffAngle(this.interpolatedMapHeading.get(), mapTargetHeading) < 0) {
          this.interpolatedMapHeading.set(mapTargetHeading);
        }
      }
    }

    const mapCurrentHeading = this.interpolatedMapHeading.get();

    this.canvasCentreReferencedMapParams.compute(this.canvasCenterCoordinates, 0, 0.539957, 1_000, mapCurrentHeading);
    this.arpReferencedMapParams.compute(this.arpCoordinates.get(), 0, 0.539957, 1_000, mapCurrentHeading);

    let [offsetX, offsetY]: [number, number] = [0, 0];
    if (airportTooFarAwayAndInArcMode) {
      const shiftBy = 5 * Math.max(this.canvasWidth.get(), this.canvasHeight.get());
      [offsetX, offsetY] = [shiftBy, shiftBy];
    } else {
      [offsetX, offsetY] = this.canvasCentreReferencedMapParams.coordinatesToXYy(this.referencePos);
    }

    // TODO figure out how to not need this
    offsetY *= -1;

    const rotate = -mapCurrentHeading;

    // Transform layers
    for (let i = 0; i < this.layerCanvasRefs.length; i++) {
      const canvas = this.layerCanvasRefs[i].instance;
      const canvasScaleContainer = this.layerCanvasScaleContainerRefs[i].instance;

      const scale = this.getZoomLevelInverseScale();

      const translateX = -(this.canvasWidth.get() / 2) + OANC_RENDER_WIDTH / 2;
      const translateY = -(this.canvasHeight.get() / 2) + OANC_RENDER_HEIGHT / 2;

      canvas.style.transform = `translate(${-offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;

      canvasScaleContainer.style.left = `${translateX}px`;
      canvasScaleContainer.style.top = `${translateY}px`;
      canvasScaleContainer.style.transform = `scale(${scale})`;

      const context = canvas.getContext('2d');

      context.resetTransform();

      context.translate(this.canvasCentreX.get(), this.canvasCentreY.get());
    }

    // Transform airplane
    this.aircraftX.set(384);
    this.aircraftY.set(384);
    this.aircraftRotation.set(this.trueHeadingWord.get().value - mapCurrentHeading);

    // FIXME Use this to update pan offset when zooming
    /* if (this.previousZoomLevelIndex.get() !== this.zoomLevelIndex.get()) {
            // In PLAN mode, re-pan to zoom in to center of screen
            this.panOffsetX.set(this.panOffsetX.get() / this.zoomLevelScales[this.previousZoomLevelIndex.get()] * this.zoomLevelScales[this.zoomLevelIndex.get()]);
            this.panOffsetY.set(this.panOffsetY.get() / this.zoomLevelScales[this.previousZoomLevelIndex.get()] * this.zoomLevelScales[this.zoomLevelIndex.get()]);

            this.previousZoomLevelIndex.set(this.zoomLevelIndex.get());
        } */

    // Reflow labels if necessary
    if (this.lastLayerDrawnIndex > this.layerCanvasRefs.length - 1) {
      this.doneDrawing = true;

      this.airportLoading.set(false);

      this.labelManager.reflowLabels(
        this.fmsDataStore.departureRunway.get(),
        this.fmsDataStore.landingRunway.get(),
        this.btvUtils.btvRunway.get(),
        this.btvUtils.btvExit.get(),
      );

      return;
    }

    const layerFeatures = this.layerFeatures[this.lastLayerDrawnIndex];
    const layerCanvas = this.layerCanvasRefs[this.lastLayerDrawnIndex].instance.getContext('2d');

    if (this.lastFeatureDrawnIndex < layerFeatures.features.length) {
      renderFeaturesToCanvas(
        this.lastLayerDrawnIndex,
        layerCanvas,
        layerFeatures,
        this.lastFeatureDrawnIndex,
        this.lastFeatureDrawnIndex + FEATURE_DRAW_PER_FRAME,
      );

      this.lastFeatureDrawnIndex += FEATURE_DRAW_PER_FRAME;
    } else {
      this.lastLayerDrawnIndex++;
      this.lastFeatureDrawnIndex = 0;
    }
  }

  private updateLabelClasses() {
    this.labelManager.updateLabelClasses(
      this.fmsDataStore,
      this.dataAirportIcao.get() === this.fmsDataStore.origin.get(),
      this.dataAirportIcao.get() === this.fmsDataStore.destination.get(),
      this.btvUtils.btvRunway.get(),
      this.btvUtils.btvExit.get(),
    );
  }

  private clearData(): void {
    for (const layer of this.layerFeatures) {
      layer.features.length = 0;
    }

    this.labelManager.clearLabels();
  }

  private clearMap(): void {
    this.lastLayerDrawnIndex = 0;
    this.lastFeatureDrawnIndex = 0;

    for (const layer of this.layerCanvasRefs) {
      const ctx = layer.instance.getContext('2d');
      const cw = this.canvasWidth.get();
      const ch = this.canvasHeight.get();

      ctx.clearRect(0, 0, cw, ch);
    }

    this.panOffsetX.set(0);
    this.panOffsetY.set(0);
  }

  public async disablePanningTransitions(): Promise<void> {
    for (const container of this.panContainerRef) {
      container.instance.style.transition = 'reset';
    }

    await Wait.awaitFrames(1);

    this.panBeingAnimated.set(false);
  }

  public async enablePanningTransitions(): Promise<void> {
    for (const container of this.panContainerRef) {
      container.instance.style.transition = `transform ${ZOOM_TRANSITION_TIME_MS}ms linear`;
    }

    await Wait.awaitFrames(1);

    this.panBeingAnimated.set(true);
  }

  private async handleNDModeChange(newMode: EfisNdMode) {
    if (this.panOffsetX.get() !== 0 || this.panOffsetY.get() !== 0) {
      // We need to first animate to the default position
      await this.enablePanningTransitions();

      this.panOffsetX.set(0);
      this.panOffsetY.set(0);
      await Wait.awaitDelay(ZOOM_TRANSITION_TIME_MS);

      await this.disablePanningTransitions();
    }

    switch (newMode) {
      case EfisNdMode.ROSE_NAV:
        this.modeAnimationOffsetX.set(0);
        this.modeAnimationOffsetY.set(0);
        break;
      case EfisNdMode.ARC:
        this.modeAnimationOffsetX.set(0);
        this.modeAnimationOffsetY.set(620 - OANC_RENDER_HEIGHT / 2);
        break;
      case EfisNdMode.PLAN:
        this.modeAnimationOffsetX.set(0);
        this.modeAnimationOffsetY.set(0);
        break;
      default:
      // noop
    }

    this.ndModeSwitchDelayDebouncer.schedule(() => {
      this.overlayNDModeSub.set(newMode);

      switch (newMode) {
        case EfisNdMode.ROSE_NAV:
          this.modeAnimationMapNorthUp.set(false);
          break;
        case EfisNdMode.ARC:
          this.modeAnimationMapNorthUp.set(false);
          break;
        case EfisNdMode.PLAN:
          this.modeAnimationMapNorthUp.set(true);
          break;
        default:
        // noop
      }
    }, ZOOM_TRANSITION_TIME_MS);
  }

  private handleLayerVisibilities() {
    const rule = LAYER_VISIBILITY_RULES[this.zoomLevelIndex.get()];

    for (let i = 0; i < this.layerCanvasScaleContainerRefs.length; i++) {
      const shouldBeVisible = rule[i];

      const layerContainer = this.layerCanvasScaleContainerRefs[i].instance;

      layerContainer.style.visibility = shouldBeVisible ? 'inherit' : 'hidden';
    }
  }

  public handleZoomIn(): void {
    if (this.zoomLevelIndex.get() !== 0) {
      this.zoomLevelIndex.set(this.zoomLevelIndex.get() - 1);
    }
  }

  public handleZoomOut(): void {
    if (this.zoomLevelIndex.get() !== this.props.zoomValues.length - 1) {
      this.zoomLevelIndex.set(this.zoomLevelIndex.get() + 1);
    }
  }

  public handleCursorPanStart(event: MouseEvent): void {
    if (this.dataAirportIcao.get()) {
      this.isPanningArmed = true;
      this.panArmedX.set(event.screenX);
      this.panArmedY.set(event.screenY);
    }
  }

  public handleCursorPanMove(event: MouseEvent): void {
    if (this.isPanningArmed) {
      const adx = Math.abs(event.screenX - this.panArmedX.get());
      const ady = Math.abs(event.screenY - this.panArmedY.get());

      // We only actually start panning if we move more than a certain amount - this is to ensure we can differentiate between panning
      // and opening the context menu
      if (adx > PAN_MIN_MOVEMENT || ady > PAN_MIN_MOVEMENT) {
        this.isPanningArmed = false;
        this.isPanning = true;
      }
    }

    if (this.isPanning) {
      this.panOffsetX.set(this.panOffsetX.get() + event.screenX - this.lastPanX);
      this.panOffsetY.set(this.panOffsetY.get() + event.screenY - this.lastPanY);
    }

    this.lastPanX = event.screenX;
    this.lastPanY = event.screenY;
  }

  public handleCursorPanStop(event: MouseEvent): void {
    this.props.contextMenuX?.set(event.screenX);
    this.props.contextMenuY?.set(event.screenY);
    if (!this.isPanning) {
      this.isPanningArmed = false;
      this.props.contextMenuVisible?.set(!this.props.contextMenuVisible.get());
    }
    this.isPanning = false;
  }

  public projectPoint(coordinates: Position): [number, number] {
    const labelX = coordinates[0];
    const labelY = coordinates[1];

    // eslint-disable-next-line prefer-const
    let [offsetX, offsetY] = this.arpReferencedMapParams.coordinatesToXYy(this.referencePos);

    // TODO figure out how to not need this
    offsetY *= -1;

    const mapCurrentHeading = this.interpolatedMapHeading.get();
    const rotate = -mapCurrentHeading;

    const hypotenuse = Math.sqrt(labelX ** 2 + labelY ** 2) * this.getZoomLevelInverseScale();
    const angle = clampAngle(Math.atan2(labelY, labelX) * MathUtils.RADIANS_TO_DEGREES);

    const rotationAdjustX = hypotenuse * Math.cos((angle - rotate) * MathUtils.DEGREES_TO_RADIANS);
    const rotationAdjustY = hypotenuse * Math.sin((angle - rotate) * MathUtils.DEGREES_TO_RADIANS);

    const scaledOffsetX = offsetX * this.getZoomLevelInverseScale();
    const scaledOffsetY = offsetY * this.getZoomLevelInverseScale();

    let labelScreenX = OANC_RENDER_WIDTH / 2 + rotationAdjustX + -scaledOffsetX + this.panOffsetX.get();
    let labelScreenY = OANC_RENDER_HEIGHT / 2 + -rotationAdjustY + scaledOffsetY + this.panOffsetY.get();

    labelScreenX += this.modeAnimationOffsetX.get();
    labelScreenY += this.modeAnimationOffsetY.get();

    return [labelScreenX, labelScreenY];
  }

  render(): VNode | null {
    return (
      <>
        <div
          class="oanc-flag-container FontSmall"
          style={{ visibility: this.pleaseWaitFlagVisible.map((v) => (v ? 'inherit' : 'hidden')) }}
        >
          PLEASE WAIT
        </div>
        <div
          class="oanc-flag-container amber FontLarge"
          style={{ visibility: this.arptNavPosLostFlagVisible.map((v) => (v ? 'inherit' : 'hidden')) }}
        >
          ARPT NAV POS LOST
        </div>

        <div style={{ display: this.anyFlagVisible.map((v) => (v ? 'none' : 'block')) }}>
          <svg viewBox="0 0 768 768" style="position: absolute;">
            <defs>
              <clipPath id="rose-mode-map-clip">
                <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155" />
              </clipPath>
              <clipPath id="rose-mode-wx-terr-clip">
                <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,384 L45,384 L45,155" />
              </clipPath>
              <clipPath id="rose-mode-tcas-clip">
                <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155" />
              </clipPath>
              <clipPath id="arc-mode-map-clip">
                <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312" />
              </clipPath>
              <clipPath id="arc-mode-wx-terr-clip">
                <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L0,625 L0,312" />
              </clipPath>
              <clipPath id="arc-mode-tcas-clip">
                <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312" />
              </clipPath>
              <clipPath id="arc-mode-overlay-clip-4">
                <path d="m 6 0 h 756 v 768 h -756 z" />
              </clipPath>
              <clipPath id="arc-mode-overlay-clip-3">
                <path d="m 0 564 l 384 145 l 384 -145 v -564 h -768 z" />
              </clipPath>
              <clipPath id="arc-mode-overlay-clip-2">
                <path d="m 0 532 l 384 155 l 384 -146 v -512 h -768 z" />
              </clipPath>
              <clipPath id="arc-mode-overlay-clip-1">
                <path d="m 0 519 l 384 145 l 384 -86 v -580 h -768 z" />
              </clipPath>
            </defs>
          </svg>

          <div
            ref={this.animationContainerRef[0]}
            style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
          >
            <div ref={this.panContainerRef[0]} style="position: absolute;">
              <div
                ref={this.layerCanvasScaleContainerRefs[0]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[0]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[1]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[1]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[2]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[2]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[3]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[3]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[4]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[4]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[5]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[5]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[6]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[6]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>
              <div
                ref={this.layerCanvasScaleContainerRefs[7]}
                style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear;`}
              >
                <canvas ref={this.layerCanvasRefs[7]} width={this.canvasWidth} height={this.canvasHeight} />
              </div>

              <OancAircraftIcon
                isVisible={this.showAircraft}
                x={this.aircraftX}
                y={this.aircraftY}
                rotation={this.aircraftRotation}
              />
            </div>
          </div>

          <div
            ref={this.labelContainerRef}
            style={`position: absolute; width: ${OANC_RENDER_WIDTH}px; height: ${OANC_RENDER_HEIGHT}px; pointer-events: auto;`}
          />

          <div
            ref={this.animationContainerRef[1]}
            style={`position: absolute; transition: transform ${ZOOM_TRANSITION_TIME_MS}ms linear; pointer-events: none;`}
          >
            <div ref={this.panContainerRef[1]} style="position: absolute;">
              <OancMovingModeOverlay
                bus={this.props.bus}
                oansRange={this.zoomLevelIndex.map((it) => this.props.zoomValues[it])}
                ndMode={this.overlayNDModeSub}
                rotation={this.interpolatedMapHeading}
                isMapPanned={this.isMapPanned}
                airportWithinRange={this.airportWithinRange}
                airportBearing={this.airportBearing}
                airportIcao={this.dataAirportIcao}
              />
            </div>
          </div>

          <div
            style={`position: absolute; width: ${OANC_RENDER_WIDTH}px; height: ${OANC_RENDER_HEIGHT}px; pointer-events: none`}
          >
            <div class="oanc-top-mask" />
            <div class="oanc-bottom-mask">
              <span
                class="oanc-position"
                style={{
                  display: this.positionVisible.map((it) => (it ? 'block' : 'none')),
                }}
              >
                {this.positionString}
              </span>

              <span
                class="oanc-bottom-flag FontSmall"
                style={{
                  display: this.pposNotAvailable.map((it) => (it ? 'block' : 'none')),
                }}
              >
                ARPT NAV POS LOST
              </span>
            </div>

            <span class="oanc-airport-info" id="oanc-airport-info-line1">
              {this.airportInfoLine1}
            </span>
            <span class="oanc-airport-info" id="oanc-airport-info-line2">
              {this.airportInfoLine2}
            </span>
            <span
              class="oanc-airport-not-in-active-fpln"
              style={{ display: this.airportNotInActiveFpln.map((it) => (it ? 'inherit' : 'none')) }}
            >
              ARPT NOT IN
              <br />
              ACTIVE F/PLN
            </span>
          </div>

          <OancStaticModeOverlay
            bus={this.props.bus}
            oansRange={this.zoomLevelIndex.map((it) => this.props.zoomValues[it])}
            ndMode={this.overlayNDModeSub}
            rotation={this.interpolatedMapHeading}
            isMapPanned={this.isMapPanned}
            airportWithinRange={this.airportWithinRange}
            airportBearing={this.airportBearing}
            airportIcao={this.dataAirportIcao}
          />
        </div>
      </>
    );
  }
}

const pathCache = new Map<string, Path2D[]>();
const pathIdCache = new Map<Feature, string>();

function renderFeaturesToCanvas(
  layer: number,
  ctx: CanvasRenderingContext2D,
  data: FeatureCollection<Geometry, AmdbProperties>,
  startIndex: number,
  endIndex: number,
) {
  const styleRules = STYLE_DATA[layer];

  for (let i = startIndex; i < Math.min(endIndex, data.features.length); i++) {
    const feature = data.features[i];
    let doStroke = false;

    let doFill = false;

    const matchingRule = styleRules.find((it) => {
      if (feature.properties.feattype === FeatureType.VerticalPolygonalStructure) {
        return (
          it.forFeatureTypes.includes(feature.properties.feattype) &&
          it.forPolygonStructureTypes.includes(feature.properties.plysttyp)
        );
      }

      return it.forFeatureTypes.includes(feature.properties.feattype);
    });

    if (!matchingRule) {
      console.error(
        `No matching style rule for feature (feattype=${feature.properties.feattype}) in rules for layer #${layer}`,
      );
      continue;
    }

    if (matchingRule.styles.doStroke !== undefined) {
      doStroke = matchingRule.styles.doStroke;
    }

    if (matchingRule.styles.doFill !== undefined) {
      doFill = matchingRule.styles.doFill;
    }

    if (matchingRule.styles.strokeStyle !== undefined) {
      ctx.strokeStyle = matchingRule.styles.strokeStyle;
    }

    if (matchingRule.styles.lineWidth !== undefined) {
      ctx.lineWidth = matchingRule.styles.lineWidth;
    }

    if (matchingRule.styles.fillStyle !== undefined) {
      ctx.fillStyle = matchingRule.styles.fillStyle;
    }

    let id = pathIdCache.get(feature);
    if (!id) {
      id = `${feature.properties.id}-${feature.properties.feattype}`;

      pathIdCache.set(feature, id);
    }

    const cachedPaths = pathCache.get(id);

    switch (feature.geometry.type) {
      case 'LineString': {
        const outline = feature.geometry as LineString;

        let path: Path2D;
        if (cachedPaths) {
          // eslint-disable-next-line prefer-destructuring
          path = cachedPaths[0];
        } else {
          path = new Path2D();

          path.moveTo(outline.coordinates[0][0], outline.coordinates[0][1] * -1);

          for (let i = 1; i < outline.coordinates.length; i++) {
            const point = outline.coordinates[i];
            path.lineTo(point[0], point[1] * -1);
          }

          pathCache.set(`${feature.properties.id}-${feature.properties.feattype}`, [path]);
        }

        if (doFill) {
          ctx.fill(path);
        }

        if (doStroke) {
          ctx.stroke(path);
        }

        break;
      }
      case 'Polygon': {
        const polygon = feature.geometry as Polygon;

        let paths: Path2D[] = [];
        if (cachedPaths) {
          paths = cachedPaths;
        } else {
          for (const outline of polygon.coordinates) {
            const toCachePath = new Path2D();

            toCachePath.moveTo(outline[0][0], outline[0][1] * -1);

            for (let i = 1; i < outline.length; i++) {
              const point = outline[i];
              toCachePath.lineTo(point[0], point[1] * -1);
            }

            paths.push(toCachePath);
          }

          pathCache.set(`${feature.properties.id}-${feature.properties.feattype}`, paths);
        }

        for (const path of paths) {
          if (doStroke) {
            ctx.stroke(path);
          }

          if (doFill) {
            ctx.fill(path);
          }
        }
        break;
      }
      default: {
        console.log(`Could not draw geometry of type: ${feature.geometry.type}`);
        break;
      }
    }
  }
}
