import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  ArincEventBus,
  EfisNdMode,
  EfisSide,
  MathUtils,
  NdSymbol,
  NdSymbolTypeFlags,
  VerticalPathCheckpoint,
  a380EfisRangeSettings,
} from '@flybywiresim/fbw-sdk';
import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
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
import { VdSimvars } from '../VdSimvarPublisher';
import { ArmedLateralMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';
import { pathVectorLength, pathVectorPoint } from '@fmgc/guidance/lnav/PathVector';
import { bearingTo } from 'msfs-geo';
import { GenericFcuEvents, GenericTawsEvents } from '@flybywiresim/navigation-display';

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
      VdSimvars &
      DmcLogicEvents &
      SimplaneValues &
      FmsSymbolsData &
      NDControlEvents
  >();

  private readonly labelSvgRef = FSComponent.createRef<SVGElement>();

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
  private readonly fmsVerticalPath = ConsumerSubject.create(this.sub.on('verticalPath'), []);
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

  private readonly visible = MappedSubject.create(
    ([mode, range]) =>
      [EfisNdMode.PLAN, EfisNdMode.ROSE_ILS, EfisNdMode.ROSE_VOR].includes(mode) || range === -1 ? 'none' : 'block',
    this.ndMode,
    this.ndRangeSetting,
  );

  private readonly rangeChangeFlagVisibility = this.mapRecomputing.map((v) => (v ? 'inherit' : 'hidden'));

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
      return VerticalDisplay.minMaxVerticalRange(vdRange, egoAltitude.valueOr(0), firstAltitude, lastAltitude);
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

  // FIXME ADIRS selection missing for ND
  /* private readonly fpaMain = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(getDisplayIndex() === 1 ? 'fpa_1' : 'fpa_2'),
  );
  private readonly fpaBackup = Arinc429LocalVarConsumerSubject.create(this.sub.on('fpa_3'));
  private readonly attHdgSelect = ConsumerSubject.create(this.sub.on('attHdgKnob'), 1);
  private readonly fpa = MappedSubject.create(
    ([attHdg, main, bkup]) => (attHdg === 1 ? main : bkup),
    this.attHdgSelect,
    this.fpaMain,
    this.fpaBackup,
  );*/
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

  private readonly activeLateralMode = ConsumerSubject.create(this.sub.on('activeLateralMode'), 0);
  private readonly armedLateralMode = ConsumerSubject.create(this.sub.on('armedLateralMode'), 0);
  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('activeVerticalMode'), 0);
  private readonly fgAltConstraint = ConsumerSubject.create(this.sub.on('altConstraint'), 0);
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

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(
      this.ndMode,
      this.ndRangeSetting,
      this.vdRange,
      this.fmsVerticalPath,
      this.displayedFmsPath,
      this.mapRecomputing,
      this.visible,
      this.rangeChangeFlagVisibility,
      this.headingWord,
      this.trackWord,
      this.vdAvailable,
      this.lineColor,
      this.baroMode,
      this.baroCorrectedAltitude,
      this.verticalRange,
      this.planeSymbolY,
      // this.fpaMain,
      // this.fpaBackup,
      //this.attHdgSelect,
      this.fpa,
      this.planeSymbolTransform,
      this.planeRotationVisibility,
      this.planeSymbolVisibility,
      this.rangeMarkerVisibility,
      this.rangeOver160ArrowVisible,
      this.altitudeFlTextVisible,
      this.activeVerticalMode,
      this.fgAltConstraint,
      this.selectedAltitude,
      this.isSelectedVerticalMode,
      this.targetAltitude,
      this.altitudeTargetTransform,
      this.targetAltitudeSymbolVisibility,
      this.altitudeTargetColor,
      this.targetAltitudeFormatted,
      this.targetAltitudeTextVisibility,
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
    const shouldShowTrackLine =
      (this.activeLateralMode.get() === LateralMode.NONE ||
        this.activeLateralMode.get() === LateralMode.HDG ||
        this.activeLateralMode.get() === LateralMode.TRACK ||
        this.activeLateralMode.get() === LateralMode.RWY ||
        this.activeLateralMode.get() === LateralMode.RWY_TRACK ||
        this.activeLateralMode.get() === LateralMode.GA_TRACK) &&
      !isArmed(this.armedLateralMode.get(), ArmedLateralMode.NAV);
    if (!shouldShowTrackLine) {
      let totalDistanceFromAircraft = 0;
      for (const path of this.fmsLateralPath.get()) {
        const pathDistance = pathVectorLength(path);

        if (totalDistanceFromAircraft + pathDistance > this.vdRange.get()) {
          const symbolLocation = pathVectorPoint(path, this.vdRange.get() - totalDistanceFromAircraft);
          const justBeforeSymbolLocation = pathVectorPoint(path, this.vdRange.get() - totalDistanceFromAircraft - 0.05);

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
    } else if (this.ndRangeSetting.get() !== this.vdRange.get()) {
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
          bus={this.props.bus}
          visible={this.visible}
          fmsVerticalPath={this.fmsVerticalPath}
          vdRange={this.vdRange}
          verticalRange={this.verticalRange}
          isSelectedVerticalMode={this.isSelectedVerticalMode}
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
            x={422}
            y={929}
            class="Green FontSmall MiddleAlign shadow"
            style={{ visibility: this.rangeChangeFlagVisibility }}
          >
            VD RANGE CHANGE
          </text>
        </svg>
      </>
    );
  }
}
