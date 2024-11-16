import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';

interface EisDisplayProps extends ComponentProps {
  isCaptSide: boolean;
  x: number;
  y: number;
  bus: EventBus;
}

export class EisDisplay extends DisplayComponent<EisDisplayProps> {
  private baroValueMode = 0;

  private baroValue = 0;

  private baroMode = 0;

  private lightsTest = false;

  private baroValueSub = Subject.create('');

  private qnhLabelSub = Subject.create('');

  private qfeLabelSub = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('lightsTest')
      .whenChanged()
      .handle((value) => {
        this.lightsTest = value === 0;

        this.handleLabels();
        this.handleValue();
      });

    sub
      .on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroValueMode`)
      .whenChanged()
      .handle((newVal) => {
        this.baroValueMode = newVal;
        this.handleLabels();
        this.handleValue();
      });

    sub
      .on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroValue`)
      .whenChanged()
      .handle((newVal) => {
        this.baroValue = newVal;
        this.handleValue();
      });

    sub
      .on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroMode`)
      .whenChanged()
      .handle((newVal) => {
        this.baroMode = newVal;
        this.handleLabels();
        this.handleValue();
      });
  }

  private handleValue() {
    if (this.lightsTest) {
      this.baroValueSub.set('88.88');
    } else if (this.baroValueMode === 0) {
      this.baroValueSub.set('Std');
    } else if (this.baroValueMode === 1) {
      this.baroValueSub.set(Math.round(this.baroValue).toString());
    } else {
      this.baroValueSub.set(this.baroValue.toFixed(2));
    }
  }

  private handleLabels() {
    if (this.lightsTest) {
      this.qfeLabelSub.set('Active');
      this.qnhLabelSub.set('Active');
    } else if (this.baroMode === 0) {
      this.qfeLabelSub.set('Inactive');
      this.qnhLabelSub.set('Inactive');
    } else if (this.baroMode === 1) {
      this.qfeLabelSub.set('Inactive');
      this.qnhLabelSub.set('Active');
    } else {
      this.qfeLabelSub.set('Active');
      this.qnhLabelSub.set('Inactive');
    }
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <text id="QFE" class={this.qfeLabelSub} x="50" y="61.5">
          QFE
        </text>
        <text id="QNH" class={this.qnhLabelSub} x="300" y="61.5" text-anchor="end">
          QNH
        </text>
        <text id="Value" class="Value" x="28" y="165">
          {this.baroValueSub}
        </text>
      </g>
    );
  }
}
