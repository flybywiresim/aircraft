import { DisplayComponent, Subscribable, VNode, FSComponent, EventBus } from '@microsoft/msfs-sdk';
import { AttentionGetter } from 'instruments/src/EWD/elements/AttentionGetter';
import { EGT } from 'instruments/src/EWD/elements/EGT';
import { N1 } from 'instruments/src/EWD/elements/N1';
import { ThrustGauge } from 'instruments/src/EWD/elements/ThrustGauge';

interface EngineGaugeProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: number;
  active: Subscribable<boolean>;
  n1Degraded: Subscribable<boolean>;
}

export class EngineGauge extends DisplayComponent<EngineGaugeProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render() {
    return (
      <g id={`Engine-Gauge-${this.props.engine}`}>
        <AttentionGetter
          bus={this.props.bus}
          x={this.props.x}
          y={this.props.y}
          engine={this.props.engine}
          active={this.props.active}
        />
        <ThrustGauge
          bus={this.props.bus}
          x={this.props.x + 2}
          y={this.props.y - 3}
          engine={this.props.engine}
          active={this.props.active}
          n1Degraded={this.props.n1Degraded}
        />
        <N1
          bus={this.props.bus}
          x={this.props.x}
          y={this.props.y + 65}
          engine={this.props.engine}
          active={this.props.active}
          n1Degraded={this.props.n1Degraded}
        />
        <EGT
          bus={this.props.bus}
          x={this.props.x + 4}
          y={this.props.y + 212}
          engine={this.props.engine}
          active={this.props.active}
        />
      </g>
    );
  }
}
