import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';

interface AttentionGetterProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: number;
  active: Subscribable<boolean>;
}

export class AttentionGetter extends DisplayComponent<AttentionGetterProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();

  private readonly n1 = ConsumerSubject.create(
    this.sub.on(`n1_${this.props.engine}`).withPrecision(1).whenChanged(),
    0,
  );

  private readonly engineState = ConsumerSubject.create(
    this.sub.on(`engine_state_${this.props.engine}`).whenChanged(),
    0,
  );

  private readonly n1Idle = ConsumerSubject.create(this.sub.on('n1Idle').withPrecision(1).whenChanged(), 0);

  private readonly visible = MappedSubject.create(
    ([active, n1, n1Idle, es]) => active && !!(n1 < Math.floor(n1Idle) - 1 && es === 2),
    this.props.active,
    this.n1,
    this.n1Idle,
    this.engineState,
  );

  render() {
    return (
      <g
        id={`attention-getter-${this.props.engine}`}
        visibility={this.visible.map((it) => (it ? 'inherit' : 'hidden'))}
      >
        <path class="WhiteLine" d={`m ${this.props.x - 74} ${this.props.y - 13} l 0,-72 l 162,0 l 0,72`} />
        <path class="WhiteLine" d={`m ${this.props.x - 74} ${this.props.y + 168} l 0,72 l 162,0 l 0,-72`} />
      </g>
    );
  }
}
