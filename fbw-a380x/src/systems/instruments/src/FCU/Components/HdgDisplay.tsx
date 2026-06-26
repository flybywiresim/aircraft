import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../Publishers/FcuSimvarPublisher';

export class HdgDisplay extends DisplayComponent<{ bus: EventBus }> {
  private sub = this.props.bus.getSubscriber<FcuSimvars>();

  private value = ConsumerSubject.create(this.sub.on('afsDisplayHdgTrkValue'), 0);

  private dashes = ConsumerSubject.create(this.sub.on('afsDisplayHdgTrkDashes'), false);

  private trkFpaMode = ConsumerSubject.create(this.sub.on('afsDisplayTrkFpaMode'), false);

  private trueActive = ConsumerSubject.create(this.sub.on('afsDisplayTrueMode'), false);

  private lightsTest = ConsumerSubject.create(this.sub.on('lightsTest'), false);

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

  private trueLabelSub = MappedSubject.create(
    ([trueActive, lightsTest]) => trueActive || lightsTest,
    this.trueActive,
    this.lightsTest,
  );

  private unitLabelSub = MappedSubject.create(
    ([dashes, lightsTest]) => !dashes || lightsTest,
    this.dashes,
    this.lightsTest,
  );

  private valueSub = MappedSubject.create(
    ([lightsTest, dashes, value]) => {
      if (lightsTest) {
        return '8.8.8';
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

  public render(): VNode {
    return (
      <div id="Heading">
        <svg width="100%" height="100%">
          <text
            id="TRUE"
            class={{
              Common: true,
              Active: this.trueLabelSub,
              Inactive: this.trueLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="23%"
            y="20%"
          >
            TRUE
          </text>
          <text
            id="HDG"
            class={{
              Common: true,
              Active: this.hdgLabelSub,
              Inactive: this.hdgLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="48%"
            y="20%"
          >
            HDG
          </text>
          <text
            id="TRK"
            class={{
              Common: true,
              Active: this.trkLabelSub,
              Inactive: this.trkLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="68%"
            y="20%"
          >
            TRK
          </text>
          <text id="Value" class="Common Value" x="47%" y="97%">
            {this.valueSub}
          </text>
          <text
            id="DEGREES"
            class={{
              Common: true,
              Active: this.unitLabelSub,
              Inactive: this.unitLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="89%"
            y="97%"
          >
            &#176;
          </text>
        </svg>
      </div>
    );
  }
}
