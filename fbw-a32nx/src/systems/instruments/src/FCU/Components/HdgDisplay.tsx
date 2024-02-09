import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';

export class HdgDisplay extends DisplayComponent<{ x: number; y: number; bus: EventBus }> {
  private value = 0;

  private dashes = false;

  private managed = false;

  private trkFpaMode = false;

  private lightsTest = false;

  private dotVisibilitySub = Subject.create('');

  private hdgLabelSub = Subject.create('');

  private trkLabelSub = Subject.create('');

  private valueSub = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('lightsTest')
      .whenChanged()
      .handle((value) => {
        this.lightsTest = value === 0;

        this.handleLabels();
        this.handleHdgDisplay();
        this.handleDot();
      });

    sub
      .on('afsDisplayTrkFpaMode')
      .whenChanged()
      .handle((value) => {
        this.trkFpaMode = value;

        this.handleLabels();
      });

    sub
      .on('afsDisplayHdgTrkDashes')
      .whenChanged()
      .handle((value) => {
        this.dashes = value;
        this.handleHdgDisplay();
      });

    sub
      .on('afsDisplayHdgTrkValue')
      .whenChanged()
      .handle((value) => {
        this.value = value;
        this.handleHdgDisplay();
      });

    sub
      .on('afsDisplayHdgTrkManaged')
      .whenChanged()
      .handle((value) => {
        this.managed = value;
        this.handleDot();
      });
  }

  private handleHdgDisplay() {
    if (this.lightsTest) {
      this.valueSub.set('888');
    } else if (this.dashes) {
      this.valueSub.set('---');
    } else {
      this.valueSub.set(Math.round(this.value).toString().padStart(3, '0'));
    }
  }

  private handleLabels() {
    this.trkLabelSub.set(this.trkFpaMode || this.lightsTest ? 'Active' : 'Inactive');
    this.hdgLabelSub.set(!this.trkFpaMode || this.lightsTest ? 'Active' : 'Inactive');
  }

  private handleDot() {
    this.dotVisibilitySub.set(this.managed || this.lightsTest ? 'visible' : 'hidden');
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <text id="HDG" class={this.hdgLabelSub} x="77" y="57.6">
          HDG
        </text>
        <text id="TRK" class={this.trkLabelSub} x="210" y="57.6">
          TRK
        </text>
        <text id="LAT" class="Active" x="328" y="57.6">
          LAT
        </text>
        <text id="Value" class="Value" x="87" y="163">
          {this.valueSub}
        </text>
        <circle id="Illuminator" r="28" cx="374" cy="119" visibility={this.dotVisibilitySub} />
      </g>
    );
  }
}
