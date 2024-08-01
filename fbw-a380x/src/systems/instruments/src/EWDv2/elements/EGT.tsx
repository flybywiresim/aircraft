import {
  DisplayComponent,
  Subscribable,
  VNode,
  FSComponent,
  EventBus,
  ConsumerSubject,
  Subject,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWDv2/shared/EwdSimvarPublisher';
import { GaugeComponent, GaugeMarkerComponent, GaugeMaxEGTComponent } from '../../MsfsAvionicsCommon/gauges';

interface EGTProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: number;
  active: Subscribable<boolean>;
}

export class EGT extends DisplayComponent<EGTProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();

  private readonly throttleMode = ConsumerSubject.create(this.sub.on('thrust_limit_type').whenChanged(), 0);

  private readonly togaWarning = ConsumerSubject.create(this.sub.on('athrTogaWarning').whenChanged(), false);

  private readonly egt = ConsumerSubject.create(this.sub.on('egt').whenChanged(), 0);

  private readonly egtModeMax = Subject.create(0);

  private radius = 68;
  private startAngle = 270;
  private endAngle = 90;
  private min = 0;
  private max = 1000;

  private warningEGTColor = (EGTemperature: number) => {
    if (EGTemperature >= 900) {
      return 'Red';
    }
    if (EGTemperature > 850 && this.throttleMode.get() < 3) {
      return 'Amber';
    }
    return 'Green';
  };

  private updateModeEGTMax() {
    switch (this.throttleMode.get()) {
      case 4:
        this.egtModeMax.set(this.togaWarning.get() ? 1060 : 1025);
        break;

      case 1:
      case 2:
      case 3:
      case 5:
        this.egtModeMax.set(1025);
        break;

      default:
        this.egtModeMax.set(750);
        break;
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.throttleMode.sub(() => this.updateModeEGTMax());
    this.togaWarning.sub(() => this.updateModeEGTMax());
  }

  render() {
    return (
      <>
        <g id={`EGT-indicator-${this.props.engine}`}>
          <g visibility={this.props.active.map((it) => (!it ? 'visible' : 'hidden'))}>
            <GaugeComponent
              x={this.props.x}
              y={this.props.y}
              radius={this.radius}
              startAngle={Subject.create(this.startAngle)}
              endAngle={Subject.create(this.endAngle)}
              visible={Subject.create(true)}
              class="GaugeComponent WhiteLine SW2"
            />
            <text class="F26 End Amber" x={this.props.x + 17} y={this.props.y + 11.7}>
              XX
            </text>
          </g>
          <g visibility={this.props.active.map((it) => (it ? 'visible' : 'hidden'))}>
            <text
              class={this.egt.map((egt) => `Large End ${this.warningEGTColor(egt)}`)}
              x={this.props.x + 33}
              y={this.props.y + 11.7}
            >
              {this.egt.map((egt) => Math.min([3, 4].includes(this.throttleMode.get()) ? 900 : 850, Math.round(egt)))}
            </text>
            <GaugeComponent
              x={this.props.x}
              y={this.props.y}
              radius={this.radius}
              startAngle={Subject.create(this.startAngle)}
              endAngle={Subject.create(this.endAngle)}
              visible={Subject.create(true)}
              class="GaugeComponent Gauge"
            >
              <GaugeComponent
                x={this.props.x}
                y={this.props.y}
                radius={this.radius - 2}
                startAngle={Subject.create(this.endAngle - 20)}
                endAngle={Subject.create(this.endAngle)}
                visible={Subject.create(true)}
                class="GaugeComponent Gauge ThickRedLine"
              />
              <GaugeMarkerComponent
                value={Subject.create(this.min)}
                x={this.props.x}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={Subject.create(this.startAngle)}
                endAngle={Subject.create(this.endAngle)}
                class="GaugeText Gauge Medium"
              />
              <GaugeMarkerComponent
                value={Subject.create(500)}
                x={this.props.x}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={Subject.create(this.startAngle)}
                endAngle={Subject.create(this.endAngle)}
                class="GaugeText Gauge"
              />
              <GaugeMarkerComponent
                value={Subject.create(this.max)}
                x={this.props.x}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={Subject.create(this.startAngle)}
                endAngle={Subject.create(this.endAngle)}
                class="GaugeText Gauge RedLine"
              />
              <GaugeMaxEGTComponent
                value={this.egtModeMax}
                x={this.props.x}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={Subject.create(this.startAngle)}
                endAngle={Subject.create(this.endAngle)}
                class="GaugeThrustLimitIndicatorFill Gauge"
              />
              <rect x={this.props.x - 36} y={this.props.y - 11} width={72} height={26} class="DarkGreyBox" />
              <GaugeMarkerComponent
                value={this.egt.map((egt) => Math.min([3, 4].includes(this.throttleMode.get()) ? 900 : 850, egt))}
                x={this.props.x}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={Subject.create(this.startAngle)}
                endAngle={Subject.create(this.endAngle)}
                class={this.egt.map((egt) => `${this.warningEGTColor(egt)}GaugeIndicator Gauge`)}
                multiplierInner={0.75}
                indicator
                halfIndicator
              />
            </GaugeComponent>
          </g>
        </g>
      </>
    );
  }
}
