import {
  A380EfisNdRangeValue,
  Arinc429ConsumerSubject,
  Arinc429RegisterSubject,
  ArincEventBus,
  EfisNdMode,
  EfisSide,
  a380EfisRangeSettings,
} from '@flybywiresim/fbw-sdk';
import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  VNode,
} from '@microsoft/msfs-sdk';
import { NDSimvars } from 'instruments/src/ND/NDSimvarPublisher';
import { DmcLogicEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';

import './style.scss';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';

export interface VerticalDisplayProps extends ComponentProps {
  bus: ArincEventBus;
  side: EfisSide;
}

export interface GenericFcuEvents {
  ndMode: EfisNdMode;
  ndRangeSetting: A380EfisNdRangeValue;
}

export class VerticalDisplayDummy extends DisplayComponent<VerticalDisplayProps> {
  private readonly minAlt = -500;
  private readonly maxAlt = 24000;

  private readonly sub = this.props.bus.getArincSubscriber<
    GenericFcuEvents & NDSimvars & DmcLogicEvents & SimplaneValues
  >();

  private topRef = FSComponent.createRef<SVGElement>();

  private readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode').whenChanged(), EfisNdMode.ARC);

  private readonly ndRangeSetting = ConsumerSubject.create(this.sub.on('ndRangeSetting').whenChanged(), 10).map(
    (r) => a380EfisRangeSettings[r],
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

  private readonly baroMode = ConsumerSubject.create(this.sub.on('baroMode').whenChanged(), 'STD');

  private readonly baroCorrectedAltitudeRaw = ConsumerSubject.create(
    this.sub.on('baroCorrectedAltitude').whenChanged(),
    0,
  );

  private readonly baroCorrectedAltitude = Arinc429RegisterSubject.createEmpty();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.baroCorrectedAltitudeRaw.sub((w) => this.baroCorrectedAltitude.setWord(w));
  }

  private altToY(alt: number) {
    return 800 + (this.maxAlt - alt) / ((this.maxAlt - this.minAlt) / 200);
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
            y1={this.baroCorrectedAltitude.map((a) => (a.isNormalOperation() ? this.altToY(a.value) : 0))}
            y2={this.baroCorrectedAltitude.map((a) => (a.isNormalOperation() ? this.altToY(a.value) : 0))}
            stroke="yellow"
            stroke-width="4"
            visibility={MappedSubject.create(
              ([alt, avail]) => (alt.isNormalOperation() && alt.value < 24000 && avail ? 'visible' : 'hidden'),
              this.baroCorrectedAltitude,
              this.vdAvailable,
            )}
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
        <g visibility={this.vdAvailable.map((a) => (a ? 'visible' : 'hidden'))}>
          <text x="150" y="797" class="Cyan FontSmallest MiddleAlign">
            0
          </text>
          <text x="285" y="797" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 1)}
          </text>
          <text x="420" y="797" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 2)}
          </text>
          <text x="555" y="797" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 3)}
          </text>
          <text x="690" y="797" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 4)}
          </text>
        </g>
        <g visibility={this.vdAvailable.map((a) => (a ? 'visible' : 'hidden'))}>
          <text x="95" y={this.altToY(0) + 7.5} class="White FontSmallest EndAlign">
            0
          </text>
          <text x="95" y={this.altToY(10000) + 7.5} class="White FontSmallest EndAlign">
            {this.baroMode.map((m) => (m === 'STD' ? '100' : '10000'))}
          </text>
          <text x="95" y={this.altToY(20000) + 7.5} class="White FontSmallest EndAlign">
            {this.baroMode.map((m) => (m === 'STD' ? '200' : '20000'))}
          </text>
          <text
            x="10"
            y="900"
            class="White FontSmallest"
            visibility={this.baroMode.map((m) => (m === 'STD' ? 'visible' : 'hidden'))}
          >
            FL
          </text>
        </g>
      </svg>
    );
  }
}
