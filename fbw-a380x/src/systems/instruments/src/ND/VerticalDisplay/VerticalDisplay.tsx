import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  ArincEventBus,
  EfisNdMode,
  EfisRecomputingReason,
  EfisSide,
  FcuSimVars,
  MathUtils,
  NdSymbol,
  NdSymbolTypeFlags,
  VerticalPathCheckpoint,
  a380EfisRangeSettings,
} from '@flybywiresim/fbw-sdk';
import {
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { NDSimvars } from 'instruments/src/ND/NDSimvarPublisher';
import { DmcLogicEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';

import '../style.scss';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { FmsSymbolsData } from 'instruments/src/ND/FmsSymbolsPublisher';
import { NDControlEvents } from 'instruments/src/ND/NDControlEvents';
import { VerticalDisplayCanvasMap } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayCanvasMap';
import { VerticalMode } from '@shared/autopilot';
import { pathVectorLength, pathVectorPoint } from '@fmgc/guidance/lnav/PathVector';
import { bearingTo } from 'msfs-geo';
import { GenericFcuEvents, GenericTawsEvents, TrackLine } from '@flybywiresim/navigation-display';
import { AesuBusEvents } from 'instruments/src/MsfsAvionicsCommon/providers/AesuBusPublisher';
import { FGVars } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { A380XFcuBusEvents } from 'instruments/src/MsfsAvionicsCommon/providers/A380XFcuBusPublisher';
import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';

export interface VerticalDisplayProps extends ComponentProps {
  bus: ArincEventBus;
  side: EfisSide;
}

export const VERTICAL_DISPLAY_MAX_ALTITUDE = 70000;
export const VERTICAL_DISPLAY_MIN_ALTITUDE = -500;
export const VERTICAL_DISPLAY_CANVAS_WIDTH = 540;
export const VERTICAL_DISPLAY_CANVAS_HEIGHT = 200;
export const VD_FPA_TO_DISPLAY_ANGLE =
  (Math.asin(VERTICAL_DISPLAY_CANVAS_HEIGHT / VERTICAL_DISPLAY_CANVAS_WIDTH) * MathUtils.RADIANS_TO_DEGREES) / 4; // multiply FPA with this angle to get display angle in VD

export class VerticalDisplay extends DisplayComponent<VerticalDisplayProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getArincSubscriber<
    GenericFcuEvents &
      GenericTawsEvents &
      NDSimvars &
      DmcLogicEvents &
      SimplaneValues &
      FmsSymbolsData &
      NDControlEvents &
      ClockEvents &
      AesuBusEvents &
      FGVars &
      A380XFcuBusEvents &
      FcuSimVars &
      MfdSurvEvents
  >();

  private readonly labelSvgRef = FSComponent.createRef<SVGElement>();

  private readonly canvasMapRef = FSComponent.createRef<VerticalDisplayCanvasMap>();

  private readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode'), EfisNdMode.ARC);

  private readonly ndRangeSetting = ConsumerSubject.create(this.sub.on('ndRangeSetting'), 10).map(
    (r) => a380EfisRangeSettings[r],
  );
  private readonly vdRange = MappedSubject.create(
    ([mode, range]) =>
      mode === EfisNdMode.ARC ? Math.max(10, Math.min(range, 160)) : Math.max(5, Math.min(range / 2, 160)),
    this.ndMode,
    this.ndRangeSetting,
  );

  private readonly fmsLateralPath = ConsumerSubject.create(this.sub.on('vectorsActive'), []);
  private readonly fmsVerticalPath = ConsumerSubject.create(this.sub.on('a32nx_fms_vertical_path'), []);
  private readonly displayedFmsPath = MappedSubject.create(
    ([path, ndRange]) => {
      const fmsPathToDisplay: VerticalPathCheckpoint[] = [];

      for (const p of path) {
        fmsPathToDisplay.push(p);
        if (p.distanceFromAircraft > ndRange * 1.2) {
          break;
        }
      }
      return fmsPathToDisplay;
    },
    this.fmsVerticalPath,
    this.vdRange,
  );

  private readonly mapRecomputing = ConsumerSubject.create(this.sub.on('set_map_recomputing'), false);
  private readonly mapRecomputingReason = ConsumerSubject.create(
    this.sub.on('set_map_recomputing_reason'),
    EfisRecomputingReason.None,
  );

  private readonly visible = MappedSubject.create(
    ([mode, range]) =>
      [EfisNdMode.PLAN, EfisNdMode.ROSE_ILS, EfisNdMode.ROSE_VOR].includes(mode) || range === -1 ? 'none' : 'block',
    this.ndMode,
    this.ndRangeSetting,
  );

  /** either magnetic or true heading depending on true ref mode */
  private readonly headingWord = Arinc429ConsumerSubject.create(this.sub.on('heading').atFrequency(0.5));

  /** either magnetic or true track depending on true ref mode */
  private readonly trackWord = Arinc429ConsumerSubject.create(this.sub.on('track').atFrequency(0.5));

  private readonly vdAvailable = MappedSubject.create(
    ([hdg, trk]) => hdg.isNormalOperation() && trk.isNormalOperation(),
    this.headingWord,
    this.trackWord,
  );

  private readonly lineColor = this.vdAvailable.map((a) => (a ? 'white' : 'red'));

  private readonly baroMode = ConsumerSubject.create(this.sub.on('baroMode'), 'STD');

  private readonly baroCorrectedAltitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('baroCorrectedAltitude'),
    0,
  );

  private readonly verticalRange = MappedSubject.create(
    ([vdRange, egoAltitude, fmsPath]) => {
      const firstAltitude = fmsPath.length > 0 ? fmsPath[0].altitude : undefined;
      const lastAltitude = fmsPath.length > 0 ? fmsPath[fmsPath.length - 1].altitude : undefined;
      const range = VerticalDisplay.minMaxVerticalRange(vdRange, egoAltitude.valueOr(0), firstAltitude, lastAltitude);
      SimVar.SetSimVarValue(
        `L:A32NX_VD_${this.props.side === 'L' ? 1 : 2}_RANGE_LOWER`,
        SimVarValueType.Number,
        range[0],
      );
      SimVar.SetSimVarValue(
        `L:A32NX_VD_${this.props.side === 'L' ? 1 : 2}_RANGE_UPPER`,
        SimVarValueType.Number,
        range[1],
      );
      return range;
    },
    this.vdRange,
    this.baroCorrectedAltitude,
    this.displayedFmsPath,
  );

  private readonly planeSymbolY = MappedSubject.create(
    ([alt, range]) => VerticalDisplay.altToY(alt.valueOr(0), range),
    this.baroCorrectedAltitude,
    this.verticalRange,
  );

  private readonly fpa = Arinc429LocalVarConsumerSubject.create(this.sub.on('fpaRaw'));
  private readonly planeSymbolTransform = MappedSubject.create(
    ([y, fpa]) => `translate (132 ${y - 14}) rotate (${-fpa.valueOr(0) * VD_FPA_TO_DISPLAY_ANGLE}, 20, 10) scale(0.9)`,
    this.planeSymbolY,
    this.fpa,
  );
  private readonly planeRotationVisibility = MappedSubject.create(
    ([fpa, avail]) => (!fpa.isFailureWarning() && avail ? 'inherit' : 'hidden'),
    this.fpa,
    this.vdAvailable,
  );

  private readonly planeSymbolVisibility = MappedSubject.create(
    ([alt, avail]) =>
      alt.isNormalOperation() && alt.value < VERTICAL_DISPLAY_MAX_ALTITUDE && avail ? 'inherit' : 'hidden',
    this.baroCorrectedAltitude,
    this.vdAvailable,
  );

  private readonly rangeMarkerVisibility = this.vdAvailable.map((a) => (a ? 'visible' : 'hidden'));
  private readonly rangeOver160ArrowVisible = MappedSubject.create(
    ([mode, range]) => {
      if (mode === EfisNdMode.ARC) {
        return range > 160 ? 'inherit' : 'hidden';
      } else {
        return range > 320 ? 'inherit' : 'hidden';
      }
    },
    this.ndMode,
    this.ndRangeSetting,
  );

  private readonly rangeMarkerText = [
    this.vdRange.map((value) => (value / 4) * 1),
    this.vdRange.map((value) => (value / 4) * 2),
    this.vdRange.map((value) => (value / 4) * 3),
    this.vdRange.map((value) => (value / 4) * 4),
  ];

  private readonly activeLateralMode = ConsumerSubject.create(this.sub.on('fg.fma.lateralMode'), 0);
  private readonly armedLateralMode = ConsumerSubject.create(this.sub.on('fg.fma.lateralArmedBitmask'), 0);
  private readonly shouldShowTrackLine = MappedSubject.create(
    ([active, armed]) => TrackLine.shouldShowTrackLine(active, armed),
    this.activeLateralMode,
    this.armedLateralMode,
  );
  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('fg.fma.verticalMode'), 0);
  private readonly fgAltConstraint = ConsumerSubject.create(this.sub.on('fg.altitudeConstraint'), 0);
  private readonly selectedAltitude = ConsumerSubject.create(this.sub.on('selectedAltitude'), 0);
  private readonly isSelectedVerticalMode = MappedSubject.create(
    ([mode, cstr]) =>
      cstr === 0 &&
      (mode === VerticalMode.OP_CLB ||
        mode === VerticalMode.OP_DES ||
        mode === VerticalMode.VS ||
        mode === VerticalMode.FPA),
    this.activeVerticalMode,
    this.fgAltConstraint,
  );
  private readonly targetAltitude = MappedSubject.create(
    ([selAlt, isSelected, altCstr]) => (isSelected || !altCstr ? selAlt : altCstr),
    this.selectedAltitude,
    this.isSelectedVerticalMode,
    this.fgAltConstraint,
  );
  private readonly targetAltitudeFormatted = MappedSubject.create(
    ([alt, baroMode]) => (baroMode === 'STD' ? `FL ${Math.floor(alt / 100).toFixed(0)}` : alt.toFixed(0)),
    this.targetAltitude,
    this.baroMode,
  );

  private readonly targetAltitudeTextVisibility = MappedSubject.create(
    ([alt, range]) => (alt < range[0] || alt > range[1] ? 'inherit' : 'hidden'),
    this.targetAltitude,
    this.verticalRange,
  );
  private readonly targetAltitudeSymbolVisibility = this.targetAltitudeTextVisibility.map((v) =>
    v === 'hidden' ? 'inherit' : 'hidden',
  );

  private readonly altitudeTargetTransform = MappedSubject.create(
    ([alt, verticalRange]) => `translate (99 ${VerticalDisplay.altToY(alt, verticalRange) - 19})`,
    this.targetAltitude,
    this.verticalRange,
  );

  private readonly altitudeTargetColor = MappedSubject.create(
    ([mode, altCstr]) => {
      if (mode === VerticalMode.ALT_CST || mode === VerticalMode.ALT_CST_CPT || altCstr) {
        return '#ff94ff';
      } else if (
        mode === VerticalMode.FINAL ||
        mode === VerticalMode.GS_CPT ||
        mode === VerticalMode.GS_TRACK ||
        mode === VerticalMode.LAND ||
        mode === VerticalMode.FLARE ||
        mode === VerticalMode.ROLL_OUT
      ) {
        return '#ffffff';
      }
      return '#00ffff';
    },
    this.activeVerticalMode,
    this.fgAltConstraint,
  );

  private readonly altitudeTapeLineY = Array.from(Array(8), (_, index) =>
    MappedSubject.create(
      ([vdRange, verticalRange]) => {
        const dashAlt = VerticalDisplay.altitudeTapeAlt(index, vdRange, verticalRange);
        return VerticalDisplay.altToY(dashAlt, verticalRange);
      },
      this.vdRange,
      this.verticalRange,
    ),
  );
  private readonly altitudeTapeTextY = Array.from(Array(8), (_, index) =>
    this.altitudeTapeLineY[index].map((y) => y + 7.5),
  );
  private readonly altitudeTapeText = Array.from(Array(8), (_, index) =>
    MappedSubject.create(
      ([vdRange, verticalRange, baroMode]) => {
        const dashAlt = VerticalDisplay.altitudeTapeAlt(index, vdRange, verticalRange);
        return baroMode === 'STD' ? Math.floor(dashAlt / 100).toFixed(0) : dashAlt.toFixed(0);
      },
      this.vdRange,
      this.verticalRange,
      this.baroMode,
    ),
  );
  private readonly altitudeFlTextVisible = this.baroMode.map((m) => (m === 'STD' ? 'visible' : 'hidden'));

  private readonly wxrTawsSysSelected = ConsumerSubject.create(this.sub.on('a32nx_aesu_wxr_taws_sys_selected'), 1);
  private readonly terrSysOff = ConsumerSubject.create(this.sub.on('a32nx_aesu_terr_sys_off'), false);
  private readonly activeOverlay = ConsumerSubject.create(this.sub.on('a380x_efis_cp_active_overlay'), 0);

  private readonly rangeChangeFlagCondition = MappedSubject.create(
    ([flagShown, flagReason]) =>
      flagShown &&
      (flagReason === EfisRecomputingReason.RangeChange || flagReason === EfisRecomputingReason.ModeAndRangeChange),
    this.mapRecomputing,
    this.mapRecomputingReason,
  );
  private readonly modeChangeFlagCondition = MappedSubject.create(
    ([flagShown, flagReason]) => flagShown && flagReason === EfisRecomputingReason.ModeChange,
    this.mapRecomputing,
    this.mapRecomputingReason,
  );
  private readonly trajNotAvailFlagCondition = Subject.create(false);
  private readonly noTerrAndWxDataAvailFlagCondition = MappedSubject.create(([terrOff]) => terrOff, this.terrSysOff);

  private readonly terr1Failed = ConsumerSubject.create(this.sub.on('a32nx_aesu_terr_failed_1'), false);
  private readonly terr2Failed = ConsumerSubject.create(this.sub.on('a32nx_aesu_terr_failed_2'), false);
  private readonly wxr1Failed = ConsumerSubject.create(this.sub.on('a32nx_aesu_wxr_failed_1'), false);
  private readonly wxr2Failed = ConsumerSubject.create(this.sub.on('a32nx_aesu_wxr_failed_2'), false);
  private readonly terrInop = MappedSubject.create(
    ([sel, t1, t2]) => (sel === 1 ? t1 : sel === 2 ? t2 : true),
    this.wxrTawsSysSelected,
    this.terr1Failed,
    this.terr2Failed,
  );
  private readonly activeWxrFailed = MappedSubject.create(
    ([sel, w1, w2]) => (sel === 1 ? w1 : sel === 2 ? w2 : true),
    this.wxrTawsSysSelected,
    this.wxr1Failed,
    this.wxr2Failed,
  );

  private readonly wxrInop = MappedSubject.create(
    ([activeFailed, activeOverlay]) => activeOverlay === 1 && activeFailed,
    this.activeWxrFailed,
    this.activeOverlay,
  );

  private readonly rangeChangeFlagVisibility = MappedSubject.create(
    ([rangeChange, _modeChange, trajNotAvail, noTerrAndWx, terrInop, wxrInop]) =>
      rangeChange && !trajNotAvail && !noTerrAndWx && !terrInop && !wxrInop ? 'inherit' : 'hidden',
    this.rangeChangeFlagCondition,
    this.modeChangeFlagCondition,
    this.trajNotAvailFlagCondition,
    this.noTerrAndWxDataAvailFlagCondition,
    this.terrInop,
    this.wxrInop,
  );

  private readonly modeChangeFlagVisibility = MappedSubject.create(
    ([_rangeChange, modeChange, trajNotAvail, noTerrAndWx, terrInop, wxrInop]) =>
      modeChange && !trajNotAvail && !noTerrAndWx && !terrInop && !wxrInop ? 'inherit' : 'hidden',
    this.rangeChangeFlagCondition,
    this.modeChangeFlagCondition,
    this.trajNotAvailFlagCondition,
    this.noTerrAndWxDataAvailFlagCondition,
    this.terrInop,
    this.wxrInop,
  );

  private readonly trajNotAvailFlagVisibility = MappedSubject.create(
    ([_rangeChange, _modeChange, trajNotAvail, noTerrAndWx, terrInop, wxrInop]) =>
      trajNotAvail && !noTerrAndWx && !terrInop && !wxrInop ? 'inherit' : 'hidden',
    this.rangeChangeFlagCondition,
    this.modeChangeFlagCondition,
    this.trajNotAvailFlagCondition,
    this.noTerrAndWxDataAvailFlagCondition,
    this.terrInop,
    this.wxrInop,
  );

  private readonly noTerrAndWxDataAvailFlagVisibility = MappedSubject.create(
    ([_rangeChange, _modeChange, _trajNotAvail, noTerrAndWx, terrInop, wxrInop]) =>
      noTerrAndWx && !terrInop && !wxrInop ? 'inherit' : 'hidden',
    this.rangeChangeFlagCondition,
    this.modeChangeFlagCondition,
    this.trajNotAvailFlagCondition,
    this.noTerrAndWxDataAvailFlagCondition,
    this.terrInop,
    this.wxrInop,
  );

  private readonly terrInopFlagVisibility = MappedSubject.create(
    ([_rangeChange, _modeChange, _trajNotAvail, _noTerrAndWx, terrInop, _wxrInop]) => (terrInop ? 'inherit' : 'hidden'),
    this.rangeChangeFlagCondition,
    this.modeChangeFlagCondition,
    this.trajNotAvailFlagCondition,
    this.noTerrAndWxDataAvailFlagCondition,
    this.terrInop,
    this.wxrInop,
  );

  private readonly wxrInopFlagVisibility = MappedSubject.create(
    ([_rangeChange, _modeChange, _trajNotAvail, _noTerrAndWx, _terrInop, wxrInop]) => (wxrInop ? 'inherit' : 'hidden'),
    this.rangeChangeFlagCondition,
    this.modeChangeFlagCondition,
    this.trajNotAvailFlagCondition,
    this.noTerrAndWxDataAvailFlagCondition,
    this.terrInop,
    this.wxrInop,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(
      this.ndMode,
      this.ndRangeSetting,
      this.vdRange,
      this.fmsLateralPath,
      this.fmsVerticalPath,
      this.displayedFmsPath,
      this.mapRecomputing,
      this.mapRecomputingReason,
      this.visible,
      this.headingWord,
      this.trackWord,
      this.vdAvailable,
      this.lineColor,
      this.baroMode,
      this.baroCorrectedAltitude,
      this.verticalRange,
      this.planeSymbolY,
      this.fpa,
      this.planeSymbolTransform,
      this.planeRotationVisibility,
      this.planeSymbolVisibility,
      this.rangeMarkerVisibility,
      this.rangeOver160ArrowVisible,
      this.activeLateralMode,
      this.armedLateralMode,
      this.shouldShowTrackLine,
      this.activeVerticalMode,
      this.fgAltConstraint,
      this.selectedAltitude,
      this.isSelectedVerticalMode,
      this.targetAltitude,
      this.altitudeTargetTransform,
      this.targetAltitudeTextVisibility,
      this.targetAltitudeSymbolVisibility,
      this.altitudeTargetTransform,
      this.altitudeTargetColor,
      this.altitudeFlTextVisible,
      this.wxrTawsSysSelected,
      this.terrSysOff,
      this.activeOverlay,
      this.rangeChangeFlagCondition,
      this.modeChangeFlagCondition,
      this.noTerrAndWxDataAvailFlagCondition,
      this.terr1Failed,
      this.terr2Failed,
      this.wxr1Failed,
      this.wxr2Failed,
      this.activeWxrFailed,
      this.terrInop,
      this.wxrInop,
      this.rangeChangeFlagVisibility,
      this.modeChangeFlagVisibility,
      this.trajNotAvailFlagVisibility,
      this.noTerrAndWxDataAvailFlagVisibility,
      this.terrInopFlagVisibility,
      this.wxrInopFlagVisibility,
      this.targetAltitudeFormatted,
    );

    for (const rm of this.rangeMarkerText) {
      this.subscriptions.push(rm);
    }

    for (const rm of this.altitudeTapeLineY) {
      this.subscriptions.push(rm);
    }

    for (const rm of this.altitudeTapeTextY) {
      this.subscriptions.push(rm);
    }

    for (const rm of this.altitudeTapeText) {
      this.subscriptions.push(rm);
    }

    this.subscriptions.push(
      this.vdRange.sub(() => this.calculateAndTransmitEndOfVdMarker()),
      this.fmsLateralPath.sub(() => this.calculateAndTransmitEndOfVdMarker()),
      this.canvasMapRef.instance.canvasInvalid.pipe(this.trajNotAvailFlagCondition),
      this.sub
        .on('realTime')
        .atFrequency(5)
        .handle(() => this.calculateAndTransmitEndOfVdMarker()),
    );

    this.calculateAndTransmitEndOfVdMarker();
  }

  /**
   *
   * @param vdRange in nm
   * @param egoAltitude in ft
   * @param pathFirstAltitude in ft
   * @param pathLastAltitude in ft
   * @returns min and max altitude of vertical display vertical range in ft
   */
  public static minMaxVerticalRange(
    vdRange: number,
    egoAltitude: number,
    pathFirstAltitude?: number,
    pathLastAltitude?: number,
  ): [number, number] {
    // Vertical range with 4° slope
    const verticalExtent = vdRange * MathUtils.FEET_TO_NAUTICAL_MILES * Math.sin(4 * MathUtils.DEGREES_TO_RADIANS);

    if (pathFirstAltitude === undefined || pathLastAltitude === undefined) {
      // No path available, try to place a/c in the middle
      const lowerLimit = Math.max(
        VERTICAL_DISPLAY_MIN_ALTITUDE,
        Math.min(egoAltitude - 0.5 * verticalExtent, VERTICAL_DISPLAY_MAX_ALTITUDE - verticalExtent),
      );
      return [lowerLimit, lowerLimit + verticalExtent];
    } else {
      // Try to fit in egoAltitude, pathFirstAltitude and pathLastAltitude (with descending priority)
      // If that doesn't work, remove altitude with lowest priority, and try again
      let lowerLimit = VERTICAL_DISPLAY_MIN_ALTITUDE;
      let upperLimit = VERTICAL_DISPLAY_MAX_ALTITUDE;
      const pathHighest = Math.max(pathFirstAltitude, pathLastAltitude);
      const pathLowest = Math.min(pathFirstAltitude, pathLastAltitude);

      // Try to cover vertical extent of all displayed waypoints
      lowerLimit = Math.max(VERTICAL_DISPLAY_MIN_ALTITUDE, (pathLowest + pathHighest - verticalExtent) / 2);
      upperLimit = lowerLimit + verticalExtent;

      // If ego altitude not contained, shift until it is contained by a margin
      if (egoAltitude < lowerLimit) {
        lowerLimit = Math.max(VERTICAL_DISPLAY_MIN_ALTITUDE, egoAltitude - 0.15 * verticalExtent);
        upperLimit = lowerLimit + verticalExtent;
      } else if (egoAltitude > upperLimit) {
        upperLimit = Math.min(VERTICAL_DISPLAY_MAX_ALTITUDE, egoAltitude + 0.15 * verticalExtent);
        lowerLimit = upperLimit - verticalExtent;
      }

      return [lowerLimit, upperLimit];
    }
  }

  public static altToY(alt: number, verticalRange: [number, number]) {
    return 800 + (verticalRange[1] - alt) / ((verticalRange[1] - verticalRange[0]) / 200);
  }

  public static altitudeTapeAlt(index: number, vdRange: number, verticalRange: [number, number]) {
    let altitudePerDash = 500;
    switch (vdRange) {
      case 10:
        altitudePerDash = 500;
        break;
      case 20:
        altitudePerDash = 1000;
        break;
      case 40:
        altitudePerDash = 2000;
        break;
      case 80:
        altitudePerDash = 5000;
        break;
      case 160:
        altitudePerDash = 10000;
        break;
    }
    return Math.max(0, Math.ceil(verticalRange[0] / altitudePerDash) * altitudePerDash) + altitudePerDash * index;
  }

  calculateAndTransmitEndOfVdMarker() {
    const isInVdMapMode = this.ndMode.get() === EfisNdMode.ARC || this.ndMode.get() === EfisNdMode.ROSE_NAV;
    const ndRange =
      this.ndMode.get() === EfisNdMode.ROSE_NAV ? this.ndRangeSetting.get() / 2 : this.ndRangeSetting.get();
    const vdAndNdRangeDisagreeing = this.vdRange.get() !== ndRange;
    if (isInVdMapMode && !this.shouldShowTrackLine.get() && this.fmsLateralPath.get()) {
      let totalDistanceFromAircraft = this.fmsVerticalPath?.get()[0]?.distanceFromAircraft ?? 0;
      for (const path of this.fmsLateralPath.get()) {
        const pathDistance = pathVectorLength(path);

        if (totalDistanceFromAircraft + pathDistance > this.vdRange.get()) {
          const dist = pathDistance - (this.vdRange.get() - totalDistanceFromAircraft);
          const symbolLocation = pathVectorPoint(path, dist);
          const justBeforeSymbolLocation = pathVectorPoint(path, dist - 0.05);

          if (symbolLocation && justBeforeSymbolLocation) {
            const bearing = bearingTo(symbolLocation, justBeforeSymbolLocation);
            const symbol: NdSymbol = {
              location: symbolLocation,
              direction: bearing,
              databaseId: 'END_OF_VD',
              ident: 'END_OF_VD',
              type: NdSymbolTypeFlags.CyanColor,
              distanceFromAirplane: this.vdRange.get(),
            };
            this.props.bus.getPublisher<GenericTawsEvents>().pub('endOfVdMarker', symbol);
          }
          return;
        } else {
          totalDistanceFromAircraft += pathDistance;
        }
      }
      this.props.bus.getPublisher<GenericTawsEvents>().pub('endOfVdMarker', null);
    } else if (isInVdMapMode && vdAndNdRangeDisagreeing) {
      // Track line
      const symbol: NdSymbol = {
        location: null,
        databaseId: 'END_OF_VD',
        ident: 'END_OF_VD',
        type: NdSymbolTypeFlags.CyanColor,
        distanceFromAirplane: this.vdRange.get(),
      };
      this.props.bus.getPublisher<GenericTawsEvents>().pub('endOfVdMarker', symbol);
    } else {
      this.props.bus.getPublisher<GenericTawsEvents>().pub('endOfVdMarker', null);
    }
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <VerticalDisplayCanvasMap
          ref={this.canvasMapRef}
          bus={this.props.bus}
          visible={this.visible}
          fmsVerticalPath={this.fmsVerticalPath}
          vdRange={this.vdRange}
          verticalRange={this.verticalRange}
          isSelectedVerticalMode={this.isSelectedVerticalMode}
          shouldShowTrackLine={this.shouldShowTrackLine}
          fpa={this.fpa}
          selectedAltitude={this.selectedAltitude}
        />
        <svg
          ref={this.labelSvgRef}
          class="vd-svg"
          viewBox="0 0 768 1024"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: this.visible }}
        >
          <defs>
            <clipPath id="AltitudeTapeMask">
              <path d="m 0,1000 v-200 h130 v200 z" />
            </clipPath>
          </defs>
          <g clip-path="url(#AltitudeTapeMask)">
            <line x1="105" x2="105" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((_, index) => {
              if (index % 2 === 0) {
                return (
                  <>
                    <line
                      x1="105"
                      x2="120"
                      y1={this.altitudeTapeLineY[index]}
                      y2={this.altitudeTapeLineY[index]}
                      stroke={this.lineColor}
                      stroke-width="2"
                    />
                    <text
                      x="95"
                      y={this.altitudeTapeTextY[index]}
                      class="White FontSmallest EndAlign"
                      visibility={this.rangeMarkerVisibility}
                    >
                      {this.altitudeTapeText[index]}
                    </text>
                  </>
                );
              } else {
                return (
                  <line
                    x1="105"
                    x2="120"
                    y1={this.altitudeTapeLineY[index]}
                    y2={this.altitudeTapeLineY[index]}
                    stroke={this.lineColor}
                    stroke-width="2"
                  />
                );
              }
            })}
            <text x="5" y="900" class="White FontSmallest" visibility={this.altitudeFlTextVisible}>
              FL
            </text>
            <line
              x1="97"
              x2="115"
              y1={this.planeSymbolY}
              y2={this.planeSymbolY}
              stroke="yellow"
              stroke-width="4"
              visibility={this.planeSymbolVisibility}
            />
          </g>
          <text
            x="100"
            y="800"
            class="EndAlign FontSmall"
            fill={this.altitudeTargetColor}
            visibility={this.targetAltitudeTextVisibility}
          >
            {this.targetAltitudeFormatted}
          </text>
          <g transform={this.planeSymbolTransform} visibility={this.planeRotationVisibility}>
            <line
              fill="none"
              stroke="#ffff00"
              x1="5.31255"
              y1="15.74998"
              x2="33.81273"
              y2="15.74998"
              stroke-width="4"
              stroke-linecap="round"
            />
            <path
              d="m4.96875,15.81249l-0.03125,-11.0625l11.4375,11"
              fill="#ffff00"
              stroke="#ffff00"
              stroke-width="3"
              stroke-linejoin="round"
            />
          </g>
          <g visibility={this.targetAltitudeSymbolVisibility} clip-path="url(#AltitudeTapeMask)">
            <path
              fill="none"
              stroke={this.altitudeTargetColor}
              transform={this.altitudeTargetTransform}
              stroke-width="2"
              d="m1,35l0,-34l12,0l0,12l-6,6l6,6l0,12l-12,0l0,-2z"
            />
          </g>
          <g>
            <line x1="150" x2="690" y1="800" y2="800" stroke={this.lineColor} stroke-width="2" />
            <line x1="150" x2="150" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" stroke-dasharray="8" />
            <line x1="285" x2="285" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" stroke-dasharray="8" />
            <line x1="420" x2="420" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" stroke-dasharray="8" />
            <line x1="555" x2="555" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" stroke-dasharray="8" />
            <line x1="690" x2="690" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" />
          </g>
          <g visibility={this.rangeMarkerVisibility}>
            <text x="150" y="797" class="Cyan FontSmallest MiddleAlign">
              0
            </text>
            <text x="285" y="797" class="Cyan FontSmallest MiddleAlign">
              {this.rangeMarkerText[0]}
            </text>
            <text x="420" y="797" class="Cyan FontSmallest MiddleAlign">
              {this.rangeMarkerText[1]}
            </text>
            <text x="555" y="797" class="Cyan FontSmallest MiddleAlign">
              {this.rangeMarkerText[2]}
            </text>
            <text x="690" y="797" class="Cyan FontSmallest MiddleAlign">
              {this.rangeMarkerText[3]}
            </text>
            <g visibility={this.rangeOver160ArrowVisible} transform="translate(715 777)">
              <line fill="none" stroke="#00ffff" x1="0" y1="11.25" x2="22.5" y2="11.25" stroke-width="2" />
              <line fill="none" x1="22.5" y1="11.25" x2="11.25" y2="3" stroke="#00ffff" stroke-width="2" />
              <line fill="none" x1="22.5" y1="11.25" x2="11.25" y2="19.5" stroke="#00ffff" stroke-width="2" />
            </g>
          </g>
          <text
            x={418}
            y={929}
            class="Green FontSmall MiddleAlign shadow"
            style={{ visibility: this.modeChangeFlagVisibility }}
          >
            VD MODE CHANGE
          </text>
          <text
            x={422}
            y={929}
            class="Green FontSmall MiddleAlign shadow"
            style={{ visibility: this.rangeChangeFlagVisibility }}
          >
            VD RANGE CHANGE
          </text>
          <text
            x={422}
            y={890}
            class="White FontSmall MiddleAlign shadow"
            style={{ visibility: this.noTerrAndWxDataAvailFlagVisibility }}
          >
            NO TERR AND WX DATA AVAILABLE
          </text>
          <text
            x={285}
            y={960}
            class="Amber FontSmall MiddleAlign shadow"
            style={{ visibility: this.terrInopFlagVisibility }}
          >
            TERR INOP
          </text>
          <text
            x={565}
            y={960}
            class="Amber FontSmall MiddleAlign shadow"
            style={{ visibility: this.wxrInopFlagVisibility }}
          >
            WXR INOP
          </text>
          <text
            x={422}
            y={990}
            class="Amber FontSmall MiddleAlign shadow"
            style={{ visibility: this.trajNotAvailFlagVisibility }}
          >
            TRAJ NOT AVAIL
          </text>
        </svg>
      </>
    );
  }
}
