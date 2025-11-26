import {
  ClockEvents,
  ConsumerSubject,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { DestroyableComponent } from '../../MsfsAvionicsCommon/DestroyableComponent';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { EcamLimitations } from '../../MsfsAvionicsCommon/EcamMessages';
import { FwsEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';

interface WdLimitationsProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
}

export class WdLimitations extends DestroyableComponent<WdLimitationsProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars & FwsEvents>();

  private readonly limitationsLeft = ConsumerSubject.create(this.sub.on(`fws_limitations_all_phases`), []);
  private readonly limitationsRight = ConsumerSubject.create(this.sub.on(`fws_limitations_appr_ldg`), []);

  private readonly limitationsLeftFormatString = this.limitationsLeft.map((limits) =>
    limits.map((val) => EcamLimitations[val]).join('\r'),
  );

  private readonly limitationsRightFormatString = this.limitationsRight.map((limits) =>
    limits.map((val) => EcamLimitations[val]).join('\r'),
  );

  private readonly limitationsLines = MappedSubject.create(
    ([all, apprLdg]) => (all.length > 0 || apprLdg.length > 0 ? Math.max(all.length, apprLdg.length) : 0),
    this.limitationsLeft,
    this.limitationsRight,
  );
  private readonly limitationsDisplay = this.limitationsLines.map((lines) => (lines > 0 ? 'flex' : 'none'));
  private readonly limitationsHeight = this.limitationsLines.map((lines) => `${lines * 30 + 3}px`);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.limitationsLeft,
      this.limitationsRight,
      this.limitationsLeftFormatString,
      this.limitationsRightFormatString,
      this.limitationsLines,
      this.limitationsDisplay,
      this.limitationsHeight,
    );
  }

  render() {
    return (
      <>
        <div
          class="LimitationsContainer"
          style={{
            display: this.limitationsDisplay,
          }}
        >
          <span class="LimitationsHeading Underline">LIMITATIONS</span>
          <div class="MemosDividedArea">
            <div class="MemosLeft">
              <span class="LimitationsHeading">ALL PHASES</span>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.limitationsHeight }}>
                <FormattedFwcText x={0} y={24} message={this.limitationsLeftFormatString} />
              </svg>
            </div>
            <div class="MemosRight">
              <span class="LimitationsHeading">APPR & LDG</span>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.limitationsHeight }}>
                <FormattedFwcText x={0} y={24} message={this.limitationsRightFormatString} />
              </svg>
            </div>
          </div>
        </div>
      </>
    );
  }
}
