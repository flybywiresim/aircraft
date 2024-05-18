import { ComponentProps, DisplayComponent, FSComponent, EventBus, VNode, Subject, HEvent } from '@microsoft/msfs-sdk';
import { ClockSimvars } from '../shared/ClockSimvarPublisher';

enum DisplayTime {
  Hours,
  Minutes,
  Seconds,
}

const secondsToDisplay = (seconds: number): number[] => {
  const displayTime = [0, 0, 0];

  displayTime[DisplayTime.Hours] = Math.floor(seconds / Clock.SECONDS_PER_HOUR);
  displayTime[DisplayTime.Minutes] = Math.floor((seconds % Clock.SECONDS_PER_HOUR) / Clock.SECONDS_PER_MINUTE);
  displayTime[DisplayTime.Seconds] = Math.floor(seconds % Clock.SECONDS_PER_MINUTE);

  return displayTime;
};

interface ClockProps extends ComponentProps {
  bus: EventBus;
}

export class Clock extends DisplayComponent<ClockProps> {
  static readonly SECONDS_PER_MINUTE = 60;

  static readonly SECONDS_PER_HOUR = this.SECONDS_PER_MINUTE * 60;

  private readonly clockTextBig = Subject.create('');

  private readonly clockTextSmall = Subject.create('');

  private readonly ltsTest = Subject.create(false);

  private ltsState: number;

  private dc2IsPowered: boolean;

  private readonly dcHot1IsPowered = Subject.create(true);

  private readonly dateMode = Subject.create(false);

  private readonly currentUTC = Subject.create(0);

  private readonly currentDate = Subject.create({ dayOfMonth: 1, monthOfYear: 1, year: 1970 });

  private updateClockText(): void {
    if (!this.dcHot1IsPowered.get()) {
      this.clockTextBig.set('');
      this.clockTextSmall.set('');
      return;
    }

    if (this.ltsTest.get()) {
      this.clockTextBig.set('88:88');
      this.clockTextSmall.set('88');
      return;
    }

    if (!this.dateMode.get()) {
      const displayTime = secondsToDisplay(this.currentUTC.get());
      this.clockTextBig.set(
        `${displayTime[DisplayTime.Hours].toString().padStart(2, '0')}:${displayTime[DisplayTime.Minutes].toString().padStart(2, '0')}`,
      );
      this.clockTextSmall.set(displayTime[DisplayTime.Seconds].toString().padStart(2, '0'));
    } else {
      this.clockTextBig.set(
        `${this.currentDate.get().monthOfYear.toString().padStart(2, '0')}:${this.currentDate.get().dayOfMonth.toString().padStart(2, '0')}`,
      );
      this.clockTextSmall.set(this.currentDate.get().year.toString().substring(2, 4));
    }
  }

  public onAfterRender(node: VNode): void {
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
      .handle((dcHot1IsPowered) => this.dcHot1IsPowered.set(dcHot1IsPowered));

    sub
      .on('currentUTC')
      .withPrecision(0)
      .handle((currentUTC) => this.currentUTC.set(currentUTC));
    sub
      .on('dayOfMonth')
      .whenChanged()
      .handle((dayOfMonth) => this.currentDate.set({ ...this.currentDate.get(), dayOfMonth }));
    sub
      .on('monthOfYear')
      .whenChanged()
      .handle((monthOfYear) => this.currentDate.set({ ...this.currentDate.get(), monthOfYear }));
    sub
      .on('year')
      .whenChanged()
      .handle((year) => this.currentDate.set({ ...this.currentDate.get(), year }));

    const hEventsSub = this.props.bus.getSubscriber<HEvent>();
    hEventsSub.on('hEvent').handle((eventName) => {
      switch (eventName) {
        case 'A32NX_CHRONO_DATE':
          this.dateMode.set(!this.dateMode.get());
          break;
        default:
          break;
      }
    });

    [this.ltsTest, this.dcHot1IsPowered, this.dateMode, this.currentUTC].forEach((attr) =>
      attr.sub(() => this.updateClockText()),
    );
  }

  public render(): VNode {
    return (
      <>
        <text x="6" y="153" class="fontBig">
          {this.clockTextBig}
        </text>
        <text x="190" y="147" class="fontSmall">
          {this.clockTextSmall}
        </text>
      </>
    );
  }
}
