import { DisplayComponent, Subscribable, VNode, FSComponent, EventBus } from '@microsoft/msfs-sdk';
import { EGT } from 'instruments/src/EWDv2/elements/EGT';

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
        {/* <IgnitionBorder x={x} y={y} engine={engine} active={active} /> */}
        {/* <ThrustGauge
          x={this.props.x + 2}
          y={this.props.y - 3}
          engine={this.props.engine}
          active={this.props.active}
          n1Degraded={this.props.n1Degraded}
        /> */}
        {/*<N1 x={x} y={y + 65} engine={engine} active={active} n1Degraded={n1Degraded} />*/}
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
