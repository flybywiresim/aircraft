import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject } from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';

interface IdleProps {
  bus: EventBus;
  x: number;
  y: number;
}

export class Idle extends DisplayComponent<IdleProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();

  private readonly n1 = [
    ConsumerSubject.create(this.sub.on(`n1_1`).withPrecision(1).whenChanged(), 0),
    ConsumerSubject.create(this.sub.on(`n1_2`).withPrecision(1).whenChanged(), 0),
    ConsumerSubject.create(this.sub.on(`n1_3`).withPrecision(1).whenChanged(), 0),
    ConsumerSubject.create(this.sub.on(`n1_4`).withPrecision(1).whenChanged(), 0),
  ];

  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwc_flight_phase').whenChanged(), 0);

  private readonly autothrustStatus = ConsumerSubject.create(this.sub.on('autothrustStatus').whenChanged(), 0);

  private readonly n1Idle = ConsumerSubject.create(this.sub.on('n1Idle').withPrecision(1).whenChanged(), 0);

  private readonly visible = MappedSubject.create(
    ([e1, e2, e3, e4, fp, as, idle]) => {
      const idleBuf = idle + 2;
      const enginesIdle = [e1 <= idleBuf, e2 <= idleBuf, e3 <= idleBuf, e4 <= idleBuf];
      return enginesIdle.filter(Boolean).length >= 3 && fp >= 6 && fp <= 9 && as !== 0 ? 'inherit' : 'hidden';
    },
    this.n1[0],
    this.n1[1],
    this.n1[2],
    this.n1[3],
    this.fwcFlightPhase,
    this.autothrustStatus,
    this.n1Idle,
  );

  render() {
    return (
      <text x={this.props.x} y={this.props.y} class={`IdleTextPulse Green F26 Center`} visibility={this.visible}>
        IDLE
      </text>
    );
  }
}
