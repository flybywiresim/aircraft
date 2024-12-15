import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { EcamLimitations } from '../../MsfsAvionicsCommon/EcamMessages';

interface WdLimitationsProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
}

export class WdLimitations extends DisplayComponent<WdLimitationsProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

  private readonly limitationsLeftSvgRef = FSComponent.createRef<SVGGraphicsElement>();

  private readonly limitationsRightSvgRef = FSComponent.createRef<SVGGraphicsElement>();

  private readonly limitationsLeft = Array.from(Array(10), (_, idx) =>
    ConsumerSubject.create(this.sub.on(`limitations_all_${idx + 1}`).whenChanged(), 0),
  );

  private readonly limitationsRight = Array.from(Array(10), (_, idx) =>
    ConsumerSubject.create(this.sub.on(`limitations_apprldg_${idx + 1}`).whenChanged(), 0),
  );

  private readonly limitationsLeftFormatString = Subject.create('');

  private readonly limitationsRightFormatString = Subject.create('');

  private readonly limitationsDisplay = Subject.create(false);

  private update() {
    this.limitationsLeftFormatString.set(
      this.limitationsLeft
        .filter((v) => !!v.get())
        .map((val) => EcamLimitations[val.get()])
        .join('\r'),
    );
    this.limitationsRightFormatString.set(
      this.limitationsRight
        .filter((v) => !!v.get())
        .map((val) => EcamLimitations[val.get()])
        .join('\r'),
    );

    this.limitationsLeftSvgRef.instance.style.height = `${this.limitationsLeft.filter((v) => !!v.get()).length * 30 + 3}px`;
    this.limitationsRightSvgRef.instance.style.height = `${this.limitationsRight.filter((v) => !!v.get()).length * 30 + 3}px`;

    this.limitationsDisplay.set(
      this.limitationsLeftFormatString.get().length > 0 || this.limitationsRightFormatString.get().length > 0,
    );
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.limitationsLeft.forEach((el) => el.sub(() => this.update(), true));
    this.limitationsRight.forEach((el) => el.sub(() => this.update(), true));

    this.sub
      .on('realTime')
      .atFrequency(0.05)
      .handle(() => this.update());
  }

  render() {
    return (
      <>
        <div
          class="LimitationsContainer"
          style={{
            display: MappedSubject.create(
              SubscribableMapFunctions.and(),
              this.limitationsDisplay,
              this.props.visible,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          <span class="LimitationsHeading Underline">LIMITATIONS</span>
          <div class="MemosDividedArea">
            <div class="MemosLeft">
              <span class="LimitationsHeading">ALL PHASES</span>
              <svg ref={this.limitationsLeftSvgRef} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <FormattedFwcText x={0} y={24} message={this.limitationsLeftFormatString} />
              </svg>
            </div>
            <div class="MemosRight">
              <span class="LimitationsHeading">APPR & LDG</span>
              <svg ref={this.limitationsRightSvgRef} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <FormattedFwcText x={0} y={24} message={this.limitationsRightFormatString} />
              </svg>
            </div>
          </div>
        </div>
      </>
    );
  }
}
