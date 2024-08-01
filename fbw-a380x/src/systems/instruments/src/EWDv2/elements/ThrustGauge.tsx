import { DisplayComponent, Subscribable, VNode, FSComponent, EventBus } from '@microsoft/msfs-sdk';

interface ThrustGaugeProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: number;
  active: Subscribable<boolean>;
  n1Degraded: Subscribable<boolean>;
}

export class ThrustGauge extends DisplayComponent<ThrustGaugeProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render() {
    return <g id={`Engine-Gauge-${this.props.engine}`}></g>;
  }
}
