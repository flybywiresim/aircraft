import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';
import { HdgDisplay } from './HdgDisplay';
import { SpdDisplay } from './SpdDisplay';
import { VerticalDisplay } from './VerticalDisplay';

interface AfsDisplayProps extends ComponentProps {
  bus: EventBus;
}

export class AfsDisplay extends DisplayComponent<AfsDisplayProps> {
  private lightsTest = false;

  private trkFpaMode = false;

  private trkFpaLabelSub = Subject.create('');

  private hdgVsLabelSub = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('lightsTest')
      .whenChanged()
      .handle((value) => {
        this.lightsTest = value === 0;

        this.handleLabels();
      });

    sub
      .on('afsDisplayTrkFpaMode')
      .whenChanged()
      .handle((value) => {
        this.trkFpaMode = value;
        this.handleLabels();
      });
  }

  private handleLabels() {
    this.trkFpaLabelSub.set(this.trkFpaMode || this.lightsTest ? 'Active' : 'Inactive');
    this.hdgVsLabelSub.set(!this.trkFpaMode || this.lightsTest ? 'Active' : 'Inactive');
  }

  public render(): VNode {
    return (
      <>
        <g transform="translate(0 0)">
          <SpdDisplay bus={this.props.bus} x={0} y={0} />

          <HdgDisplay bus={this.props.bus} x={512} y={0} />

          <text id="HDG" class={this.hdgVsLabelSub} x="1229" y="96" text-anchor="end" alignment-baseline="middle">
            HDG
          </text>
          <text id="TRK" class={this.trkFpaLabelSub} x="1229" y="163" text-anchor="end">
            TRK
          </text>
        </g>

        <g transform="translate(0 224)">
          <text id="VS" class={this.hdgVsLabelSub} x="51" y="96" alignment-baseline="middle">
            V/S
          </text>
          <text id="FPA" class={this.trkFpaLabelSub} x="51" y="163">
            FPA
          </text>

          <VerticalDisplay bus={this.props.bus} x={256} y={0} />
        </g>
      </>
    );
  }
}
