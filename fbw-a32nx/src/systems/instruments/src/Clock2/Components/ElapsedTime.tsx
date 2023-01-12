import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { debouncedTimeDelta } from './Chrono';
import { ClockSimvars } from '../shared/ClockSimvarPublisher';

const getDisplayString = (seconds: number | null, running: boolean, ltsTest: boolean) : string => {
    if (ltsTest) {
        return '88:88';
    }

    if (seconds !== null) {
        return `${Math.floor(Math.min(seconds, 5999) / 60).toString().padStart(2, '0')}${running ? ':' : ' '}${(Math.floor(Math.min(seconds, 5999) % 60)).toString().padStart(2, '0')}`;
    }
    return '';
};

interface ElapsedTimeProps extends ComponentProps {
    bus: EventBus;
}

export class ElapsedTime extends DisplayComponent<ElapsedTimeProps> {
    private readonly timerText = Subject.create('');

    private readonly elapsedTime = Subject.create(null);

    private readonly ltsTest = Subject.create(false);

    private readonly elapsedKnobPos = Subject.create(1);

    private dcEssIsPowered: boolean;

    private prevTime: number;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockSimvars>();
        sub.on('ltsTest').whenChanged().handle((ltsTest) => this.ltsTest.set(ltsTest === 0));

        sub.on('dcHot1IsPowered').whenChanged().handle((dcHot1IsPowered) => {
            if (!dcHot1IsPowered) {
                this.elapsedTime.set(null);
            }
        });

        sub.on('dcEssIsPowered').whenChanged().handle((dcEssIsPowered) => this.dcEssIsPowered = dcEssIsPowered);

        sub.on('elapsedKnobPos').whenChanged().handle((elapsedKnobPos) => this.elapsedKnobPos.set(elapsedKnobPos));

        sub.on('absTime').atFrequency(5).handle((absTime) => {
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

        this.elapsedTime.sub((elapsedTime) => SimVar.SetSimVarValue('L:A32NX_CHRONO_ET_ELAPSED_TIME', 'number', elapsedTime ?? -1)); // Simvar ist not nullable, so a -1 placeholder is used

        [
            this.elapsedTime,
            this.ltsTest,
            this.elapsedKnobPos,
        ].forEach((attr) => attr.sub(() => this.timerText.set(getDisplayString(this.elapsedTime.get(), this.elapsedKnobPos.get() === 0, this.ltsTest.get()))));
    }

    render(): VNode {
        return (
            <text x="47" y="247" class="fontBig">{this.timerText}</text>
        );
    }
}
