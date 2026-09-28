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

export class SpdDisplay extends DisplayComponent<{ bus: EventBus }> {
  private sub = this.props.bus.getSubscriber<FcuSimvars>();

  private value = ConsumerSubject.create(this.sub.on('afsDisplaySpdMachValue'), 0);

  private dashes = ConsumerSubject.create(this.sub.on('afsDisplaySpdMachDashes'), false);

  private machActive = ConsumerSubject.create(this.sub.on('afsDisplayMachMode'), false);

  private lightsTest = ConsumerSubject.create(this.sub.on('lightsTest'), false);

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

  private unitLabelSub = MappedSubject.create(
    ([dashes, lightsTest, machActive]) => !machActive && (!dashes || lightsTest),
    this.dashes,
    this.lightsTest,
    this.machActive,
  );

  private valueSub = MappedSubject.create(
    ([lightsTest, dashes, value, machActive]) => {
      if (lightsTest) {
        return '8.8.8';
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

  public render(): VNode {
    return (
      <div id="Speed">
        <svg width="100%" height="100%">
          <text
            id="SPD"
            class={{
              Common: true,
              Active: this.spdLabelSub,
              Inactive: this.spdLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="47%"
            y="20%"
          >
            SPD
          </text>
          <text
            id="MACH"
            class={{
              Common: true,
              Active: this.machLabelSub,
              Inactive: this.machLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="0%"
            y="20%"
          >
            MACH
          </text>
          <text id="Value" class="Common Value" x="6%" y="97%">
            {this.valueSub}
          </text>
          <text
            id="KNOTS"
            class={{
              Common: true,
              Active: this.unitLabelSub,
              Inactive: this.unitLabelSub.map(SubscribableMapFunctions.not()),
            }}
            x="79%"
            y="97%"
          >
            KT
          </text>
        </svg>
      </div>
    );
  }
}
