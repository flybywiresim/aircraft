import {
  A380EfisNdRangeValue,
  ArcPathVector,
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  ArincEventBus,
  EfisNdMode,
  EfisSide,
  LinePathVector,
  MathUtils,
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

import './style.scss';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { FmsSymbolsData } from 'instruments/src/ND/FmsSymbolsPublisher';
import { pathVectorLength, PathVectorType } from '@fmgc/guidance/lnav/PathVector';

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

export class VerticalDisplayDummy extends DisplayComponent<VerticalDisplayProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getArincSubscriber<
    GenericFcuEvents & NDSimvars & DmcLogicEvents & SimplaneValues & FmsSymbolsData
  >();

  private topRef = FSComponent.createRef<SVGElement>();

  private readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode'), EfisNdMode.ARC);

  private readonly ndRangeSetting = ConsumerSubject.create(this.sub.on('ndRangeSetting'), 10).map(
    (r) => a380EfisRangeSettings[r],
  );

  private readonly fmsSymbols = ConsumerSubject.create(this.sub.on('symbols'), []);
  private readonly fmsPath = ConsumerSubject.create(this.sub.on('vectorsActive'), []);
  private readonly displayedFmsPath = MappedSubject.create(
    ([path, ndRange]) => {
      let accumulatedLegDistance = 0;
      const fmsPathToDisplay: (LinePathVector | ArcPathVector)[] = [];

      for (const p of path) {
        if (p.type !== PathVectorType.DebugPoint) {
          fmsPathToDisplay.push(p);
        }
        accumulatedLegDistance += pathVectorLength(p);

        if (accumulatedLegDistance > ndRange) {
          break;
        }
      }
      return fmsPathToDisplay;
    },
    this.fmsPath,
    this.ndRangeSetting,
  );

  private readonly visible = MappedSubject.create(
    ([mode, range]) =>
      [EfisNdMode.PLAN, EfisNdMode.ROSE_ILS, EfisNdMode.ROSE_VOR].includes(mode) || range === -1 ? 'none' : 'block',
    this.ndMode,
    this.ndRangeSetting,
  );

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
    this.sub.on('baroCorrectedAltitude').withArinc429Precision(0),
    0,
  );

  private readonly verticalRange = MappedSubject.create(
    ([ndRange, egoAltitude, fmsPath]) => {
      const firstAltitude = fmsPath.length > 0 ? fmsPath[0].startAltitude : undefined;
      const lastAltitude = fmsPath.length > 0 ? fmsPath[fmsPath.length - 1].endAltitude : undefined;
      return this.minMaxVerticalRange(ndRange, egoAltitude.valueOr(0), firstAltitude, lastAltitude);
    },
    this.ndRangeSetting,
    this.baroCorrectedAltitude,
    this.displayedFmsPath,
  );

  private readonly minAltitude = this.verticalRange.map((v) => v[0]);
  private readonly maxAltitude = this.verticalRange.map((v) => v[1]);

  private readonly planeSymbolY = this.baroCorrectedAltitude.map((a) =>
    a.isNormalOperation() ? this.altToY(a.value) : 0,
  );

  private readonly planeSymbolVisibility = MappedSubject.create(
    ([alt, avail]) =>
      alt.isNormalOperation() && alt.value < VERTICAL_DISPLAY_MAX_ALTITUDE && avail ? 'visible' : 'hidden',
    this.baroCorrectedAltitude,
    this.vdAvailable,
  );

  private readonly rangeMarkerVisibility = this.vdAvailable.map((a) => (a ? 'visible' : 'hidden'));

  private readonly rangeMarkerText = [
    this.ndRangeSetting.map((value) => (value / 4) * 1),
    this.ndRangeSetting.map((value) => (value / 4) * 2),
    this.ndRangeSetting.map((value) => (value / 4) * 3),
    this.ndRangeSetting.map((value) => (value / 4) * 4),
  ];

  private readonly altitudeFlTextVisible = this.baroMode.map((m) => (m === 'STD' ? 'visible' : 'hidden'));

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(
      this.ndMode,
      this.ndRangeSetting,
      this.fmsSymbols,
      this.fmsPath,
      this.displayedFmsPath,
      this.visible,
      this.headingWord,
      this.trackWord,
      this.vdAvailable,
      this.lineColor,
      this.baroMode,
      this.baroCorrectedAltitude,
      this.verticalRange,
      this.minAltitude,
      this.maxAltitude,
      this.planeSymbolY,
      this.planeSymbolVisibility,
      this.rangeMarkerVisibility,
      this.altitudeFlTextVisible,
    );

    for (const rm of this.rangeMarkerText) {
      this.subscriptions.push(rm);
    }

    this.displayedFmsPath.sub((p) => console.log(p));
  }

  /**
   *
   * @param ndRange in nm
   * @param egoAltitude in ft
   * @param pathFirstAltitude in ft
   * @param pathLastAltitude in ft
   * @returns min and max altitude of vertical display vertical range in ft
   */
  private minMaxVerticalRange(
    ndRange: number,
    egoAltitude: number,
    pathFirstAltitude?: number,
    pathLastAltitude?: number,
  ): [number, number] {
    const cappedNdRange = Math.max(10, Math.min(ndRange, 160));
    // Vertical range with 4° slope
    const verticalExtent =
      cappedNdRange * MathUtils.FEET_TO_NAUTICAL_MILES * Math.sin(4 * MathUtils.DEGREES_TO_RADIANS);

    if (pathFirstAltitude === undefined || pathLastAltitude === undefined) {
      // No path available, try to place a/c in the middle
      const lowerLimit = Math.max(
        VERTICAL_DISPLAY_MIN_ALTITUDE,
        Math.min(egoAltitude + 0.5 * verticalExtent, VERTICAL_DISPLAY_MAX_ALTITUDE - verticalExtent),
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
          // const highestPathAltitude = Math.max(...altitudesToConsider.slice(1));
          //const isClimbing = highestPathAltitude - altitudesToConsider[0];

          lowerLimit = Math.max(
            VERTICAL_DISPLAY_MIN_ALTITUDE,
            Math.min(
              Math.min(...altitudesToConsider) + 0.8 * verticalExtent,
              VERTICAL_DISPLAY_MAX_ALTITUDE - verticalExtent,
            ),
          );

          break;
        }
      }

      return [lowerLimit, lowerLimit + verticalExtent];
    }
  }

  private altToY(alt: number) {
    return 800 + (this.maxAltitude.get() - alt) / ((this.maxAltitude.get() - this.minAltitude.get()) / 200);
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <svg
        ref={this.topRef}
        class="vd-svg"
        viewBox="0 0 768 1024"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: this.visible }}
      >
        <g>
          <line x1="105" x2="105" y1="800" y2="1000" stroke={this.lineColor} stroke-width="2" />
          <line
            x1="105"
            x2="120"
            y1={this.altToY(20000)}
            y2={this.altToY(20000)}
            stroke={this.lineColor}
            stroke-width="2"
          />
          <line
            x1="105"
            x2="120"
            y1={this.altToY(15000)}
            y2={this.altToY(15000)}
            stroke={this.lineColor}
            stroke-width="2"
          />
          <line
            x1="105"
            x2="120"
            y1={this.altToY(10000)}
            y2={this.altToY(10000)}
            stroke={this.lineColor}
            stroke-width="2"
          />
          <line
            x1="105"
            x2="120"
            y1={this.altToY(5000)}
            y2={this.altToY(5000)}
            stroke={this.lineColor}
            stroke-width="2"
          />
          <line x1="105" x2="120" y1={this.altToY(0)} y2={this.altToY(0)} stroke={this.lineColor} stroke-width="2" />
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
        </g>
        <g visibility={this.rangeMarkerVisibility}>
          <text x="95" y={this.altToY(0) + 7.5} class="White FontSmallest EndAlign">
            0
          </text>
          <text x="95" y={this.altToY(10000) + 7.5} class="White FontSmallest EndAlign">
            {this.baroMode.map((m) => (m === 'STD' ? '100' : '10000'))}
          </text>
          <text x="95" y={this.altToY(20000) + 7.5} class="White FontSmallest EndAlign">
            {this.baroMode.map((m) => (m === 'STD' ? '200' : '20000'))}
          </text>
          <text x="10" y="900" class="White FontSmallest" visibility={this.altitudeFlTextVisible}>
            FL
          </text>
        </g>
      </svg>
    );
  }
}
