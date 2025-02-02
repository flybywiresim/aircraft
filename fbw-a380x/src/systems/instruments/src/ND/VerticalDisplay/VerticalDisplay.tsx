import {
  A380EfisNdRangeValue,
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  ArincEventBus,
  EfisNdMode,
  EfisSide,
  MathUtils,
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

export interface VerticalDisplayProps extends ComponentProps {
  bus: ArincEventBus;
  side: EfisSide;
}

export interface GenericFcuEvents {
  ndMode: EfisNdMode;
  ndRangeSetting: A380EfisNdRangeValue;
}

const VERTICAL_DISPLAY_MAX_ALTITUDE = 70000;
const VERTICAL_DISPLAY_MIN_ALTITUDE = -500;

export class VerticalDisplay extends DisplayComponent<VerticalDisplayProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getArincSubscriber<
    GenericFcuEvents & NDSimvars & DmcLogicEvents & SimplaneValues & FmsSymbolsData & NDControlEvents
  >();

  private readonly labelSvgRef = FSComponent.createRef<SVGElement>();

  private readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode'), EfisNdMode.ARC);

  private readonly ndRangeSetting = ConsumerSubject.create(this.sub.on('ndRangeSetting'), 10).map(
    (r) => a380EfisRangeSettings[r],
  );
  private readonly vdRange = this.ndRangeSetting.map((r) => Math.max(10, Math.min(r, 160)));

  private readonly fmsPath = ConsumerSubject.create(this.sub.on('verticalPath'), []);
  private readonly displayedFmsPath = MappedSubject.create(
    ([path, ndRange]) => {
      const fmsPathToDisplay: VerticalPathCheckpoint[] = [];

      for (const p of path) {
        if (p.distanceFromAircraft > ndRange) {
          break;
        }
        fmsPathToDisplay.push(p);
      }
      return fmsPathToDisplay;
    },
    this.fmsPath,
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
  private readonly headingWord = Arinc429ConsumerSubject.create(this.sub.on('heading'));

  /** either magnetic or true track depending on true ref mode */
  private readonly trackWord = Arinc429ConsumerSubject.create(this.sub.on('track'));

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

  private readonly planeSymbolVisibility = MappedSubject.create(
    ([alt, avail]) =>
      alt.isNormalOperation() && alt.value < VERTICAL_DISPLAY_MAX_ALTITUDE && avail ? 'visible' : 'hidden',
    this.baroCorrectedAltitude,
    this.vdAvailable,
  );

  private readonly rangeMarkerVisibility = this.vdAvailable.map((a) => (a ? 'visible' : 'hidden'));
  private readonly rangeOver160ArrowVisible = this.ndRangeSetting.map((r) => (r > 160 ? 'visible' : 'hidden'));

  private readonly rangeMarkerText = [
    this.vdRange.map((value) => (value / 4) * 1),
    this.vdRange.map((value) => (value / 4) * 2),
    this.vdRange.map((value) => (value / 4) * 3),
    this.vdRange.map((value) => (value / 4) * 4),
  ];

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
        return baroMode === 'STD' ? Math.floor(dashAlt / 100) : dashAlt;
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
      this.fmsPath,
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
      this.planeSymbolVisibility,
      this.rangeMarkerVisibility,
      this.rangeOver160ArrowVisible,
      this.altitudeFlTextVisible,
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
      const altitudesToConsider = [egoAltitude, pathFirstAltitude, pathLastAltitude];
      while (altitudesToConsider.length > 1) {
        if (Math.max(...altitudesToConsider) - Math.min(...altitudesToConsider) > verticalExtent) {
          altitudesToConsider.pop();
        } else {
          lowerLimit = Math.max(
            VERTICAL_DISPLAY_MIN_ALTITUDE,
            Math.min(
              Math.min(...altitudesToConsider) - 0.8 * verticalExtent,
              VERTICAL_DISPLAY_MAX_ALTITUDE - verticalExtent,
            ),
          );

          break;
        }
      }

      // console.log('path', lowerLimit, altitudesToConsider);
      return [lowerLimit, lowerLimit + verticalExtent];
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
          displayedFmsPath={this.displayedFmsPath}
          vdRange={this.vdRange}
          verticalRange={this.verticalRange}
        />
        <svg
          ref={this.labelSvgRef}
          class="vd-svg"
          viewBox="0 0 768 1024"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: this.visible }}
        >
          <g>
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
            <text x="10" y="900" class="White FontSmallest" visibility={this.altitudeFlTextVisible}>
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
