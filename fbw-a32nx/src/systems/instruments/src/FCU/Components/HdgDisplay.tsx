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

export class HdgDisplay extends DisplayComponent<{ x: number; y: number; bus: EventBus }> {
  private value = ConsumerSubject.create(null, 0);

  private dashes = ConsumerSubject.create(null, false);

  private managed = ConsumerSubject.create(null, false);

  private trkFpaMode = ConsumerSubject.create(null, false);

  private lightsTest = Subject.create(false);

  private dotVisibilitySub = MappedSubject.create(
    ([lightsTest, managed]) => (managed || lightsTest ? 'visible' : 'hidden'),
    this.lightsTest,
    this.managed,
  );

  private trkLabelSub = MappedSubject.create(
    ([trkFpa, lightsTest]) => trkFpa || lightsTest,
    this.trkFpaMode,
    this.lightsTest,
  );
  private hdgLabelSub = MappedSubject.create(
    ([trkFpa, lightsTest]) => !trkFpa || lightsTest,
    this.trkFpaMode,
    this.lightsTest,
  );

  private valueSub = MappedSubject.create(
    ([lightsTest, dashes, value]) => {
      if (lightsTest) {
        return '888';
      } else if (dashes) {
        return '---';
      } else {
        return Math.round(value).toString().padStart(3, '0');
      }
    },
    this.lightsTest,
    this.dashes,
    this.value,
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

    this.trkFpaMode.setConsumer(sub.on('afsDisplayTrkFpaMode'));

    this.dashes.setConsumer(sub.on('afsDisplayHdgTrkDashes'));

    this.value.setConsumer(sub.on('afsDisplayHdgTrkValue'));

    this.managed.setConsumer(sub.on('afsDisplayHdgTrkManaged'));
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <text
          id="HDG"
          class={{ Active: this.hdgLabelSub, Inactive: this.hdgLabelSub.map(SubscribableMapFunctions.not()) }}
          x="77"
          y="57.6"
        >
          HDG
        </text>
        <text
          id="TRK"
          class={{ Active: this.trkLabelSub, Inactive: this.trkLabelSub.map(SubscribableMapFunctions.not()) }}
          x="210"
          y="57.6"
        >
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
