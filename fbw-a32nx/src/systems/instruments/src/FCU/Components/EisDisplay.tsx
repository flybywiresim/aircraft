import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';

interface EisDisplayProps extends ComponentProps {
  isCaptSide: boolean;
  x: number;
  y: number;
  bus: EventBus;
}

export class EisDisplay extends DisplayComponent<EisDisplayProps> {
  private baroValueMode = ConsumerSubject.create(null, 0);

  private baroValue = ConsumerSubject.create(null, 0);

  private baroMode = ConsumerSubject.create(null, 0);

  private lightsTest = Subject.create(false);

  private baroValueSub = MappedSubject.create(
    ([lightsTest, baroValueMode, baroValue]) => {
      if (lightsTest) {
        return '88.88';
      } else if (baroValueMode === 0) {
        return 'Std';
      } else if (baroValueMode === 1) {
        return Math.round(baroValue).toString().padStart(4, '0');
      } else {
        return baroValue.toFixed(2);
      }
    },
    this.lightsTest,
    this.baroValueMode,
    this.baroValue,
  );

  private qnhLabelSub = MappedSubject.create(
    ([lightsTest, baroMode]) => {
      if (lightsTest) {
        return 'Active';
      } else if (baroMode === 0) {
        return 'Inactive';
      } else if (baroMode === 1) {
        return 'Active';
      } else {
        return 'Inactive';
      }
    },
    this.lightsTest,
    this.baroMode,
  );

  private qfeLabelSub = MappedSubject.create(
    ([lightsTest, baroMode]) => {
      if (lightsTest) {
        return 'Active';
      } else if (baroMode === 0) {
        return 'Inactive';
      } else if (baroMode === 1) {
        return 'Inactive';
      } else {
        return 'Active';
      }
    },
    this.lightsTest,
    this.baroMode,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('lightsTest')
      .whenChanged()
      .handle((value) => {
        this.lightsTest.set(value === 0);
      });

    this.baroValueMode.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroValueMode`));

    this.baroValue.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroValue`));

    this.baroMode.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroMode`));
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
