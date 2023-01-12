import { ComponentProps, DisplayComponent, FSComponent, EventBus, VNode, Subject, HEvent } from 'msfssdk';
import { ClockSimvars } from '../shared/ClockSimvarPublisher';

const secondsToDisplay = (seconds: number): number[] => {
    const displayTime = [0, 0, 0];

    displayTime[0] = Math.floor(seconds / 3600);
    displayTime[1] = Math.floor((seconds % 3600) / 60);
    displayTime[2] = Math.floor(seconds % 60);

    return displayTime;
};

interface ClockProps extends ComponentProps {
    bus: EventBus;
}

export class Clock extends DisplayComponent<ClockProps> {
    private readonly clockTextBig = Subject.create('');

    private readonly clockTextSmall = Subject.create('');

    private readonly ltsTest = Subject.create(false);

    private readonly dateMode = Subject.create(false);

    private readonly currentUTC = Subject.create(0);

    private readonly currentDate = Subject.create({ dayOfMonth: 1, monthOfYear: 1, year: 1970 });

    private updateClockText(): void {
        if (this.ltsTest.get()) {
            this.clockTextBig.set('88:88');
            this.clockTextSmall.set('88');
        } else if (!this.dateMode.get()) {
            const displayTime = secondsToDisplay(this.currentUTC.get());
            this.clockTextBig.set(`${displayTime[0].toString().padStart(2, '0')}:${displayTime[1].toString().padStart(2, '0')}`);
            this.clockTextSmall.set(displayTime[2].toString().padStart(2, '0'));
        } else {
            this.clockTextBig.set(`${this.currentDate.get().monthOfYear.toString().padStart(2, '0')}:${this.currentDate.get().dayOfMonth.toString().padStart(2, '0')}`);
            this.clockTextSmall.set(this.currentDate.get().year.toString().substring(2, 4));
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockSimvars>();
        sub.on('ltsTest').whenChanged().handle((ltsTest) => this.ltsTest.set(ltsTest === 0));

        sub.on('currentUTC').atFrequency(5).handle((currentUTC) => this.currentUTC.set(currentUTC));
        sub.on('dayOfMonth').atFrequency(1).handle((dayOfMonth) => this.currentDate.set({ ...this.currentDate.get(), dayOfMonth }));
        sub.on('monthOfYear').atFrequency(1).handle((monthOfYear) => this.currentDate.set({ ...this.currentDate.get(), monthOfYear }));
        sub.on('year').atFrequency(1).handle((year) => this.currentDate.set({ ...this.currentDate.get(), year }));

        const hEventsSub = this.props.bus.getSubscriber<HEvent>();
        hEventsSub.on('hEvent').handle((eventName) => {
            switch (eventName) {
            case 'A32NX_CHRONO_DATE':
                this.dateMode.set(!this.dateMode.get());
                break;
            default: break;
            }
        });

        [
            this.ltsTest,
            this.dateMode,
            this.currentUTC,
        ].forEach((attr) => attr.sub(() => this.updateClockText()));
    }

    public render(): VNode {
        return (
            <>
                <text x="6" y="153" class="fontBig">{this.clockTextBig}</text>
                <text x="190" y="147" class="fontSmall">{this.clockTextSmall}</text>
            </>
        );
    }
}
