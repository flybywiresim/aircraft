import { ComponentProps, DisplayComponent, EventBus, FSComponent, HEvent, Subject, VNode } from 'msfssdk';
import { ClockSimvars } from '../shared/ClockSimvarPublisher';

interface ChronoProps extends ComponentProps {
    bus: EventBus;
}

const getDisplayString = (seconds: number | null, running: boolean) : string => (seconds == null ? ''
    : `${Math.floor(Math.min(seconds, 5999) / 60).toString().padStart(2, '0')}${running ? ':' : ' '}${(Math.floor(Math.min(seconds, 5999) % 60)).toString().padStart(2, '0')}`);

export class Chrono extends DisplayComponent<ChronoProps> {
    private readonly chronoText = Subject.create('');

    constructor(props) {
        super(props);

        const hEventsSub = this.props.bus.getSubscriber<HEvent>();

        hEventsSub.on('hEvent').handle((eventName) => {
            if (eventName === 'A32NX_CHRONO_TOGGLE') {
                // TODO
            }
        });
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockSimvars>();
        sub.on('ltsTest').whenChanged().handle((ltsTest) => {
            if (ltsTest === 0) {
                this.chronoText.set('88:88');
            } else {
                this.chronoText.set(getDisplayString(10, true));
            }
        });
    }

    public render(): VNode {
        return (
            <text x="47" y="60" class="fontBig">{this.chronoText}</text>
        );
    }
}
