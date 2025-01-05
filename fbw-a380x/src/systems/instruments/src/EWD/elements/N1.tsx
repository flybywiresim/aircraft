import {
  DisplayComponent,
  Subscribable,
  VNode,
  FSComponent,
  EventBus,
  ConsumerSubject,
  Subject,
  MappedSubject,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import {
  GaugeComponent,
  GaugeMarkerComponent,
  splitDecimals,
  ThrottlePositionDonutComponent,
  ThrustTransientComponent,
} from '../../MsfsAvionicsCommon/gauges';

interface N1Props {
  bus: EventBus;
  x: number;
  y: number;
  engine: number;
  active: Subscribable<boolean>;
  n1Degraded: Subscribable<boolean>;
}

export class N1 extends DisplayComponent<N1Props> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();

  private readonly n1 = ConsumerSubject.create(
    this.sub.on(`n1_${this.props.engine}`).withPrecision(1).whenChanged(),
    0,
  );

  private readonly throttle_position = ConsumerSubject.create(
    this.sub.on(`throttle_position_n1_${this.props.engine}`).withPrecision(2).whenChanged(),
    0,
  );

  private readonly n1Commanded = ConsumerSubject.create(
    this.sub.on(`n1_commanded_${this.props.engine}`).withPrecision(2).whenChanged(),
    0,
  );

  private readonly athrEngaged = ConsumerSubject.create(
    this.sub.on('autothrustStatus').withPrecision(2).whenChanged(),
    0,
  ).map((it) => it !== 0);

  private readonly n1Idle = ConsumerSubject.create(this.sub.on('n1Idle').withPrecision(1).whenChanged(), 0);

  private n1PercentSplit1 = this.n1.map((n1) => splitDecimals(n1)[0]);
  private n1PercentSplit2 = this.n1.map((n1) => splitDecimals(n1)[1]);

  private radius = 64;
  private startAngle = 230;
  private endAngle = 90;
  private min = 2;
  private max = 11.1;

  private xDegraded = this.props.x + 2;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render() {
    return (
      <>
        <g id={`N1-indicator-${this.props.engine}`}>
          <g visibility={this.props.active.map((it) => (it ? 'hidden' : 'visible'))}>
            <GaugeComponent
              x={this.props.x}
              y={this.props.y}
              radius={this.radius}
              startAngle={this.startAngle}
              endAngle={this.endAngle}
              visible={Subject.create(true)}
              class="GaugeComponent SW2 WhiteLine"
            />
            <text class="F26 End Amber Spread" x={this.props.x + 48} y={this.props.y + 45}>
              XX
            </text>
          </g>
          <g
            visibility={MappedSubject.create(
              ([a, n1d]) => (a && !n1d ? 'visible' : 'hidden'),
              this.props.active,
              this.props.n1Degraded,
            )}
          >
            <text class="F26 End Green" x={this.props.x + 6} y={this.props.y + 45}>
              {this.n1PercentSplit1}
            </text>
            <text class="F26 End Green" x={this.props.x + 20} y={this.props.y + 45}>
              .
            </text>
            <text class="F20 End Green" x={this.props.x + 36} y={this.props.y + 45}>
              {this.n1PercentSplit2}
            </text>
          </g>
          <g
            visibility={MappedSubject.create(
              SubscribableMapFunctions.and(),
              this.props.active,
              this.props.n1Degraded,
            ).map((it) => (it ? 'visible' : 'hidden'))}
          >
            <text class="F26 End Green" x={this.xDegraded + 46} y={this.props.y + 45}>
              {this.n1PercentSplit1}
            </text>
            <text class="F26 End Green" x={this.xDegraded + 60} y={this.props.y + 45}>
              .
            </text>
            <text class="F20 End Green" x={this.xDegraded + 76} y={this.props.y + 45}>
              {this.n1PercentSplit2}
            </text>
            <ThrustTransientComponent
              x={this.props.x}
              y={this.props.y}
              min={this.min / 10}
              max={this.max / 10}
              thrustActual={this.n1.map((it) => it / 100)}
              thrustTarget={this.n1Commanded.map((n1Commanded) => n1Commanded / 100)}
              radius={this.radius}
              startAngle={this.startAngle}
              endAngle={this.endAngle}
              visible={this.athrEngaged}
              class="TransientIndicator"
            />
            <GaugeComponent
              x={this.xDegraded}
              y={this.props.y}
              radius={this.radius}
              startAngle={this.startAngle}
              endAngle={this.endAngle}
              visible={Subject.create(true)}
              class="GaugeComponent Gauge"
            >
              <GaugeComponent
                x={this.xDegraded}
                y={this.props.y}
                radius={this.radius - 2}
                startAngle={this.endAngle - 24}
                endAngle={this.endAngle}
                visible={Subject.create(true)}
                class="GaugeComponent Gauge ThickRedLine"
              />
              <GaugeMarkerComponent
                value={Subject.create(2)}
                x={this.xDegraded}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={this.startAngle}
                endAngle={this.endAngle}
                class="GaugeText Gauge"
                showValue
                textNudgeY={0}
                textNudgeX={8}
                multiplierInner={0.9}
              />
              <GaugeMarkerComponent
                value={Subject.create(4)}
                x={this.xDegraded}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={this.startAngle}
                endAngle={this.endAngle}
                class="GaugeText Gauge"
                textNudgeY={6}
                textNudgeX={13}
                multiplierInner={0.9}
              />
              <GaugeMarkerComponent
                value={Subject.create(6)}
                x={this.xDegraded}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={this.startAngle}
                endAngle={this.endAngle}
                class="GaugeText Gauge"
                showValue
                textNudgeX={7}
                textNudgeY={13}
                multiplierInner={0.9}
              />
              <GaugeMarkerComponent
                value={Subject.create(8)}
                x={this.xDegraded}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={this.startAngle}
                endAngle={this.endAngle}
                class="GaugeText Gauge"
                multiplierInner={0.9}
              />
              <GaugeMarkerComponent
                value={Subject.create(10)}
                x={this.xDegraded}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={this.startAngle}
                endAngle={this.endAngle}
                class="GaugeText Gauge"
                showValue
                textNudgeY={7}
                textNudgeX={-30}
                multiplierInner={0.9}
              />
              <rect x={this.xDegraded - 13} y={this.props.y + 19} width={96} height={30} class="DarkGreyBox" />
              <GaugeMarkerComponent
                value={MappedSubject.create(([n1, idle]) => (n1 <= idle ? idle / 10 : n1 / 10), this.n1, this.n1Idle)}
                x={this.xDegraded}
                y={this.props.y}
                min={this.min}
                max={this.max}
                radius={this.radius}
                startAngle={this.startAngle}
                endAngle={this.endAngle}
                class="GaugeIndicator Gauge"
                multiplierOuter={1.1}
                indicator
              />
            </GaugeComponent>
            <ThrottlePositionDonutComponent
              value={this.throttle_position.map((throttle_position) =>
                throttle_position < 0.3 ? 0.3 : throttle_position / 10,
              )}
              x={this.xDegraded}
              y={this.props.y}
              min={this.min}
              max={this.max}
              radius={this.radius}
              startAngle={this.startAngle}
              endAngle={this.endAngle}
              class="DonutThrottleIndicator"
            />
          </g>
        </g>
      </>
    );
  }
}
