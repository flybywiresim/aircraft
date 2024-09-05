import {
  A380EfisNdRangeValue,
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

import './style.scss';

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

  private readonly sub = this.props.bus.getSubscriber<GenericFcuEvents & NDSimvars>();

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

  private readonly baroModeIsStd = ConsumerSubject.create(this.sub.on('baroMode').whenChanged(), false);

  private readonly currentAltitude = ConsumerSubject.create(this.sub.on('pposAlt').whenChanged(), 0);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  private altToY(alt: number) {
    return 800 + (this.maxAlt - alt) / ((this.maxAlt - this.minAlt) / 200);
  }

  render(): VNode {
    return (
      <svg
        ref={this.topRef}
        viewBox="0 0 768 1024"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: this.visible }}
      >
        <g>
          <line x1="105" x2="105" y1="800" y2="1000" stroke="white" stroke-width="2" />
          <line x1="105" x2="120" y1={this.altToY(20000)} y2={this.altToY(20000)} stroke="white" stroke-width="2" />
          <line x1="105" x2="120" y1={this.altToY(15000)} y2={this.altToY(15000)} stroke="white" stroke-width="2" />
          <line x1="105" x2="120" y1={this.altToY(10000)} y2={this.altToY(10000)} stroke="white" stroke-width="2" />
          <line x1="105" x2="120" y1={this.altToY(5000)} y2={this.altToY(5000)} stroke="white" stroke-width="2" />
          <line x1="105" x2="120" y1={this.altToY(0)} y2={this.altToY(0)} stroke="white" stroke-width="2" />
          <line
            x1="97"
            x2="115"
            y1={this.currentAltitude.map((a) => this.altToY(a))}
            y2={this.currentAltitude.map((a) => this.altToY(a))}
            stroke="yellow"
            stroke-width="4"
          />
        </g>
        <g>
          <line x1="150" x2="690" y1="800" y2="800" stroke="white" stroke-width="2" />
          <line x1="150" x2="150" y1="800" y2="1000" stroke="white" stroke-width="2" stroke-dasharray="8" />
          <line x1="285" x2="285" y1="800" y2="1000" stroke="white" stroke-width="2" stroke-dasharray="8" />
          <line x1="420" x2="420" y1="800" y2="1000" stroke="white" stroke-width="2" stroke-dasharray="8" />
          <line x1="555" x2="555" y1="800" y2="1000" stroke="white" stroke-width="2" stroke-dasharray="8" />
          <line x1="690" x2="690" y1="800" y2="1000" stroke="white" stroke-width="2" />
        </g>
        <g>
          <text x="150" y="798" class="Cyan FontSmallest MiddleAlign">
            0
          </text>
          <text x="285" y="798" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 1)}
          </text>
          <text x="420" y="798" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 2)}
          </text>
          <text x="555" y="798" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 3)}
          </text>
          <text x="690" y="798" class="Cyan FontSmallest MiddleAlign">
            {this.ndRangeSetting.map((value) => (value / 4) * 4)}
          </text>
        </g>
        <g>
          <text x="95" y={this.altToY(0) + 7.5} class="White FontSmallest EndAlign">
            0
          </text>
          <text x="95" y={this.altToY(10000) + 7.5} class="White FontSmallest EndAlign">
            {this.baroModeIsStd.map((m) => (m ? '100' : '10000'))}
          </text>
          <text x="95" y={this.altToY(20000) + 7.5} class="White FontSmallest EndAlign">
            {this.baroModeIsStd.map((m) => (m ? '200' : '20000'))}
          </text>
          <text
            x="10"
            y="900"
            class="White FontSmallest"
            visibility={this.baroModeIsStd.map((s) => (s ? 'visible' : 'hidden'))}
          >
            FL
          </text>
        </g>
      </svg>
    );
  }
}
