import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../Publishers/FcuSimvarPublisher';

export class AltDisplay extends DisplayComponent<{ bus: EventBus }> {
  private sub = this.props.bus.getSubscriber<FcuSimvars>();

  private altValue = ConsumerSubject.create(this.sub.on('afsDisplayAltValue'), 0);

  private lightsTest = ConsumerSubject.create(this.sub.on('lightsTest'), false);

  private altValueSub = MappedSubject.create(
    ([lightsTest, altValue]) => {
      if (lightsTest) {
        return '8.8.8.8.8';
      } else {
        return Math.round(altValue).toString().padStart(5, '0');
      }
    },
    this.lightsTest,
    this.altValue,
  );

  public render(): VNode {
    return (
      <div id="Altitude">
        <svg width="125%" height="100%">
          <text id="ALT" class="Common Active" x="31%" y="20%">
            ALT
          </text>
          <text id="Value" class="Common Value" x="4%" y="97%">
            {this.altValueSub}
          </text>
        </svg>
      </div>
    );
  }
}
