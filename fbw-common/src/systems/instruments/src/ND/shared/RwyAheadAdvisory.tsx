import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429Word, ArincEventBus } from 'index-no-react';
import { FmsOansData } from 'instruments/src/OANC';
import { RopRowOansSimVars } from '../../MsfsAvionicsCommon/providers';

export interface RwyAheadAdvisoryProps {
  bus: ArincEventBus;
}

export class RwyAheadAdvisory extends DisplayComponent<RwyAheadAdvisoryProps> {
  private readonly flagRef = FSComponent.createRef<SVGTextElement>();

  private readonly qfu = Subject.create<string>('');

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.props.bus
      .getSubscriber<RopRowOansSimVars>()
      .on('oansWord1Raw')
      .whenChanged()
      .handle((it) => {
        const w = new Arinc429Word(it);
        this.flagRef.instance.style.display = w.getBitValueOr(11, false) ? 'block' : 'none';
      });

    this.props.bus
      .getSubscriber<FmsOansData>()
      .on('ndRwyAheadQfu')
      .whenChanged()
      .handle((it) => this.qfu.set(it));
  }

  render(): VNode | null {
    return (
      <g ref={this.flagRef}>
        <rect
          x="273"
          y="209"
          width="210"
          height="40"
          stroke="yellow"
          stroke-width="3"
          fill="black"
          style="RwyAheadAnimation"
        />
        <text
          x={378}
          y={241}
          class="FontLarge Yellow MiddleAlign RwyAheadAnimation TextOutline"
          style="stroke-width: 0.25mm;"
        >
          {this.qfu}
        </text>
      </g>
    );
  }
}
