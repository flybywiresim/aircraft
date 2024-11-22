import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';

export class SpdDisplay extends DisplayComponent<{ x: number; y: number; bus: EventBus }> {
  private value = 0;

  private dashes = false;

  private managed = false;

  private machActive = false;

  private lightsTest = false;

  private dotVisibilitySub = Subject.create('');

  private spdLabelSub = Subject.create('');

  private machLabelSub = Subject.create('');

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
        this.handleSpeedDisplay();
        this.handleDot();
      });

    sub
      .on('afsDisplayMachMode')
      .whenChanged()
      .handle((value) => {
        this.machActive = value;

        this.handleSpeedDisplay();
        this.handleLabels();
      });

    sub
      .on('afsDisplaySpdMachDashes')
      .whenChanged()
      .handle((value) => {
        this.dashes = value;
        this.handleSpeedDisplay();
      });

    sub
      .on('afsDisplaySpdMachValue')
      .whenChanged()
      .handle((value) => {
        this.value = value;
        this.handleSpeedDisplay();
      });

    sub
      .on('afsDisplaySpdMachManaged')
      .whenChanged()
      .handle((value) => {
        this.managed = value;
        this.handleDot();
      });
  }

  private handleSpeedDisplay() {
    if (this.lightsTest) {
      this.valueSub.set('8.88');
    } else if (this.machActive && this.dashes) {
      this.valueSub.set('-.--');
    } else if (this.machActive && !this.dashes) {
      this.valueSub.set(this.value.toFixed(2));
    } else if (this.dashes) {
      this.valueSub.set('---');
    } else {
      this.valueSub.set(Math.round(this.value).toString().padStart(3, '0'));
    }
  }

  private handleLabels() {
    this.machLabelSub.set(this.machActive || this.lightsTest ? 'Active' : 'Inactive');
    this.spdLabelSub.set(!this.machActive || this.lightsTest ? 'Active' : 'Inactive');
  }

  private handleDot() {
    this.dotVisibilitySub.set(this.managed || this.lightsTest ? 'visible' : 'hidden');
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <text id="SPD" class={this.spdLabelSub} x="77" y="57.6">
          SPD
        </text>
        <text id="MACH" class={this.machLabelSub} x="205" y="57.6">
          MACH
        </text>
        <text id="Value" class="Value" x="92" y="163">
          {this.valueSub}
        </text>
        <circle id="Illuminator" r="28" cx="374" cy="119" visibility={this.dotVisibilitySub} />
      </g>
    );
  }
}
