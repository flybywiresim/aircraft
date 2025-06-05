import { Arinc429ConsumerSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { splitDecimals } from '../../MsfsAvionicsCommon/gauges';
import {
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429Values } from 'instruments/src/EWD/shared/ArincValueProvider';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { ThrustGauge } from 'instruments/src/EWD/elements/ThrustGauge';

export class N1Limit extends DisplayComponent<{
  x: number;
  y: number;
  active: Subscribable<boolean>;
  hidden: Subscribable<boolean>;
  bus: ArincEventBus;
}> {
  private readonly sub = this.props.bus.getArincSubscriber<EwdSimvars & Arinc429Values>();
  private readonly N1LimitType = ConsumerSubject.create(this.sub.on('thrust_limit_type'), 0);
  private readonly N1ThrustLimit = ConsumerSubject.create(this.sub.on('thrust_limit'), 0);
  private readonly flexTemp = ConsumerSubject.create(this.sub.on('flex'), 0);
  private readonly sat = Arinc429ConsumerSubject.create(this.sub.on('sat').withArinc429Precision(0));
  private readonly thrustLimitTypeArray = ['', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'];

  private readonly displayFlexTemp = MappedSubject.create(
    ([flexTemp, sat, N1LimitType, active]) => {
      return active && flexTemp !== 0 && flexTemp >= sat.value - 10 && N1LimitType === 3;
    },
    this.flexTemp,
    this.sat,
    this.N1LimitType,
    this.props.active,
  );

  private readonly cpiomBAgsDiscrete = Arinc429ConsumerSubject.create(undefined);
  private readonly thrustLimitIdle = ConsumerSubject.create(this.sub.on('thrust_limit_idle').whenChanged(), 0);
  private readonly thrustLimitToga = ConsumerSubject.create(this.sub.on('thrust_limit_toga').whenChanged(), 0);
  private readonly thrustLimitMax = MappedSubject.create(
    ([cpiomB, thrustLimitToga]) =>
      !cpiomB.bitValueOr(13, false) && !cpiomB.bitValueOr(14, false) ? thrustLimitToga : thrustLimitToga + 0.6,
    this.cpiomBAgsDiscrete,
    this.thrustLimitToga,
  );

  private readonly thrustLimitTHR = MappedSubject.create(
    ([n1, thrustLimitIdle, thrustLimitMax]) =>
      ThrustGauge.thrustPercentFromN1(n1, thrustLimitIdle, thrustLimitMax, 0.042),
    this.N1ThrustLimit,
    this.thrustLimitIdle,
    this.thrustLimitMax,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <g id="Thrust-Rating-Mode" style={{ display: this.props.hidden.map((v) => (v ? 'none' : '')) }}>
        <text
          class="F26 Center Amber"
          x={this.props.x - 18}
          y={this.props.y}
          style={{ display: this.props.active.map((a) => (a ? 'none' : '')) }}
        >
          XX
        </text>

        <text
          class="Huge End Cyan"
          style={{ display: this.props.active.map((a) => (a ? '' : 'none')) }}
          x={this.props.x}
          y={this.props.y}
        >
          {this.N1LimitType.map((t) => this.thrustLimitTypeArray[t])}
        </text>
        <text
          class="F26 End Green Spread"
          style={{ display: this.props.active.map((a) => (a ? '' : 'none')) }}
          x={this.props.x + 69}
          y={this.props.y - 2}
        >
          {this.thrustLimitTHR.map((l) => splitDecimals(l)[0])}
        </text>
        <text
          class="F26 End Green"
          style={{ display: this.props.active.map((a) => (a ? '' : 'none')) }}
          x={this.props.x + 86}
          y={this.props.y - 2}
        >
          .
        </text>
        <text
          class="F20 End Green"
          style={{ display: this.props.active.map((a) => (a ? '' : 'none')) }}
          x={this.props.x + 101}
          y={this.props.y - 2}
        >
          {this.thrustLimitTHR.map((l) => splitDecimals(l)[1])}
        </text>
        <text
          class="F20 End Cyan"
          style={{ display: this.props.active.map((a) => (a ? '' : 'none')) }}
          x={this.props.x + 117}
          y={this.props.y - 2}
        >
          %
        </text>

        <text
          class={{ F20: true, Cyan: true, HiddenElement: this.displayFlexTemp.map((v) => !v) }}
          x={this.props.x + 154}
          y={this.props.y}
        >
          {this.flexTemp.map((t) => Math.round(t))}
          &deg;C
        </text>
      </g>
    );
  }
}
