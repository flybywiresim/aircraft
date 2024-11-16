import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';

export class VerticalDisplay extends DisplayComponent<{ x: number; y: number; bus: EventBus }> {
  private altValue = 0;

  private vsValue = 0;

  private vsDashes = false;

  private trkFpaMode = false;

  private managed = false;

  private lightsTest = false;

  private dotVisibilitySub = Subject.create('');

  private vsLabelSub = Subject.create('');

  private fpaLabelSub = Subject.create('');

  private altValueSub = Subject.create('');

  private vsValueSub = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('lightsTest')
      .whenChanged()
      .handle((value) => {
        this.lightsTest = value === 0;

        this.handleLabels();
        this.handleVsFpaDisplay();
        this.handleAltDisplay();
        this.handleDot();
      });

    sub
      .on('afsDisplayTrkFpaMode')
      .whenChanged()
      .handle((value) => {
        this.trkFpaMode = value;

        this.handleVsFpaDisplay();
        this.handleLabels();
      });

    sub
      .on('afsDisplayVsFpaDashes')
      .whenChanged()
      .handle((value) => {
        this.vsDashes = value;
        this.handleVsFpaDisplay();
      });

    sub
      .on('afsDisplayVsFpaValue')
      .whenChanged()
      .handle((value) => {
        this.vsValue = value;
        this.handleVsFpaDisplay();
      });

    sub
      .on('afsDisplayAltValue')
      .whenChanged()
      .handle((value) => {
        this.altValue = value;
        this.handleAltDisplay();
      });

    sub
      .on('afsDisplayLvlChManaged')
      .whenChanged()
      .handle((value) => {
        this.managed = value;

        this.handleDot();
      });
  }

  private handleAltDisplay() {
    if (this.lightsTest) {
      this.altValueSub.set('88888');
    } else {
      this.altValueSub.set(Math.round(this.altValue).toString().padStart(5, '0'));
    }
  }

  private handleVsFpaDisplay() {
    const sign = Math.sign(this.vsValue) >= 0 ? '+' : '~';
    const absValue = Math.abs(this.vsValue);

    if (this.lightsTest) {
      this.vsValueSub.set('+8.888');
    } else if (this.trkFpaMode && this.vsDashes) {
      this.vsValueSub.set('~-.-');
    } else if (this.trkFpaMode && !this.vsDashes) {
      this.vsValueSub.set(`${sign}${absValue.toFixed(1)}`);
    } else if (this.vsDashes) {
      this.vsValueSub.set('~----');
    } else {
      this.vsValueSub.set(
        `${sign}${Math.floor(absValue * 0.01)
          .toString()
          .padStart(2, '0')}oo`,
      );
    }
  }

  private handleLabels() {
    this.fpaLabelSub.set(this.trkFpaMode || this.lightsTest ? 'Active' : 'Inactive');
    this.vsLabelSub.set(!this.trkFpaMode || this.lightsTest ? 'Active' : 'Inactive');
  }

  private handleDot() {
    this.dotVisibilitySub.set(this.managed || this.lightsTest ? 'visible' : 'hidden');
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <g>
          <text id="ALT" class="Active" x="256" y="57.6">
            ALT
          </text>
          <text id="Value" class="Value" x="96" y="163">
            {this.altValueSub}
          </text>
        </g>

        <g transform="translate(512 0)">
          <text id="VS" x="348" y="57.6" text-anchor="end" class={this.vsLabelSub}>
            V/S
          </text>
          <text id="FPA" x="461" y="57.6" text-anchor="end" class={this.fpaLabelSub}>
            FPA
          </text>
          <text id="Value" class="Value" x="77" y="163">
            {this.vsValueSub}
          </text>
        </g>

        <g>
          <line x1="369" y1="34.5" x2="369" y2="57.6" />
          <line x1="369" y1="38.4" x2="440" y2="38.4" />
          <text id="LVLCH" class="Active" x="450.5" y="57.6">
            LVL/CH
          </text>
          <line x1="747.5" y1="34.5" x2="747.5" y2="57.6" />
          <line x1="747.5" y1="38.4" x2="676" y2="38.4" />
          <circle id="Illuminator" r="28" cx="544" cy="119" visibility={this.dotVisibilitySub} />
        </g>
      </g>
    );
  }
}
