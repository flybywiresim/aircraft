import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { debouncedTimeDelta } from '../shared/Utils';
import { ClockSimvars } from '../shared/ClockSimvarPublisher';

const getDisplayString = (seconds: number | null, running: boolean, ltsTest: boolean): string => {
  if (ltsTest) {
    return '88:88';
  }

  if (seconds !== null) {
    return (
      Math.floor(Math.min(seconds, ElapsedTime.MAX_DISPLAYABLE_TIME_SECONDS) / ElapsedTime.SECONDS_PER_HOUR)
        .toString()
        .padStart(2, '0') +
      (running ? ':' : ' ') +
      Math.floor(
        (Math.min(seconds, ElapsedTime.MAX_DISPLAYABLE_TIME_SECONDS) % ElapsedTime.SECONDS_PER_HOUR) /
          ElapsedTime.SECONDS_PER_MINUTE,
      )
        .toString()
        .padStart(2, '0')
    );
  }
  return '';
};

interface ElapsedTimeProps extends ComponentProps {
  bus: EventBus;
}

export class ElapsedTime extends DisplayComponent<ElapsedTimeProps> {
  static readonly SECONDS_PER_MINUTE = 60;

  static readonly SECONDS_PER_HOUR = this.SECONDS_PER_MINUTE * 60;

  static readonly MAX_DISPLAYABLE_TIME_SECONDS = this.SECONDS_PER_HOUR * 99 + this.SECONDS_PER_MINUTE * 59; // 99 hours and 59 minutes in seconds

  private readonly timerText = Subject.create('');

  private readonly elapsedTime = Subject.create(null);

  private readonly ltsTest = Subject.create(false);

  private readonly elapsedKnobPos = Subject.create(1);

  private ltsState: number;

  private dc2IsPowered: boolean;

  private dcEssIsPowered: boolean;

  private prevTime: number;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockSimvars>();
    sub
      .on('ltsTest')
      .whenChanged()
      .handle((ltsTest) => {
        this.ltsState = ltsTest;
        this.ltsTest.set(ltsTest === 0 && this.dc2IsPowered);
      });

    sub
      .on('dc2IsPowered')
      .whenChanged()
      .handle((dc2IsPowered) => {
        this.dc2IsPowered = dc2IsPowered;
        this.ltsTest.set(this.ltsState === 0 && dc2IsPowered);
      });

    sub
      .on('dcHot1IsPowered')
      .whenChanged()
      .handle((dcHot1IsPowered) => {
        if (!dcHot1IsPowered) {
          this.elapsedTime.set(null);
        }
      });

    sub
      .on('dcEssIsPowered')
      .whenChanged()
      .handle((dcEssIsPowered) => (this.dcEssIsPowered = dcEssIsPowered));

    sub
      .on('elapsedKnobPos')
      .whenChanged()
      .handle((elapsedKnobPos) => this.elapsedKnobPos.set(elapsedKnobPos));

    sub
      .on('absTime')
      .atFrequency(5)
      .handle((absTime) => {
        if (this.dcEssIsPowered) {
          if (this.elapsedKnobPos.get() === 0) {
            const newElapsedTime = (this.elapsedTime.get() || 0) + debouncedTimeDelta(absTime, this.prevTime);
            this.elapsedTime.set(newElapsedTime);
          } else if (this.elapsedKnobPos.get() === 2) {
            this.elapsedTime.set(null);
          }
          this.prevTime = absTime;
        }
      });

    this.elapsedTime.sub((elapsedTime) =>
      SimVar.SetSimVarValue('L:A32NX_CHRONO_ET_ELAPSED_TIME', 'number', elapsedTime ?? -1),
    ); // Simvar ist not nullable, so a -1 placeholder is used

    [this.elapsedTime, this.ltsTest, this.elapsedKnobPos].forEach((attr) =>
      attr.sub(() =>
        this.timerText.set(
          getDisplayString(this.elapsedTime.get(), this.elapsedKnobPos.get() === 0, this.ltsTest.get()),
        ),
      ),
    );
  }

  render(): VNode {
    return (
      <text x="47" y="247" class="fontBig">
        {this.timerText}
      </text>
    );
  }
}
