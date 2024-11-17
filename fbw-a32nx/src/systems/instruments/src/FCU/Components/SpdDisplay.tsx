import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';

export class SpdDisplay extends DisplayComponent<{ x: number; y: number; bus: EventBus }> {
  private value = ConsumerSubject.create(null, 0);

  private dashes = ConsumerSubject.create(null, false);

  private managed = ConsumerSubject.create(null, false);

  private machActive = ConsumerSubject.create(null, false);

  private lightsTest = Subject.create(false);

  private dotVisibilitySub = MappedSubject.create(
    ([lightsTest, managed]) => (managed || lightsTest ? 'visible' : 'hidden'),
    this.lightsTest,
    this.managed,
  );

  private spdLabelSub = MappedSubject.create(
    ([machActive, lightsTest]) => !machActive || lightsTest,
    this.machActive,
    this.lightsTest,
  );
  private machLabelSub = MappedSubject.create(
    ([machActive, lightsTest]) => machActive || lightsTest,
    this.machActive,
    this.lightsTest,
  );

  private valueSub = MappedSubject.create(
    ([lightsTest, dashes, value, machActive]) => {
      if (lightsTest) {
        return '8.88';
      } else if (machActive && dashes) {
        return '-.--';
      } else if (machActive && !dashes) {
        return value.toFixed(2);
      } else if (dashes) {
        return '---';
      } else {
        return Math.round(value).toString().padStart(3, '0');
      }
    },
    this.lightsTest,
    this.dashes,
    this.value,
    this.machActive,
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

    this.machActive.setConsumer(sub.on('afsDisplayMachMode'));

    this.dashes.setConsumer(sub.on('afsDisplaySpdMachDashes'));

    this.value.setConsumer(sub.on('afsDisplaySpdMachValue'));

    this.managed.setConsumer(sub.on('afsDisplaySpdMachManaged'));
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <text
          id="SPD"
          class={{ Active: this.spdLabelSub, Inactive: this.spdLabelSub.map(SubscribableMapFunctions.not()) }}
          x="77"
          y="57.6"
        >
          SPD
        </text>
        <text
          id="MACH"
          class={{ Active: this.machLabelSub, Inactive: this.machLabelSub.map(SubscribableMapFunctions.not()) }}
          x="205"
          y="57.6"
        >
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
