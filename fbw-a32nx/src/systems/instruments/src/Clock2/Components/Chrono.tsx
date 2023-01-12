import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { ClockSimvars } from '../shared/ClockSimvarPublisher';

interface ChronoProps extends ComponentProps {
    bus: EventBus;
}

export class Chrono extends DisplayComponent<ChronoProps> {
    private readonly chronoText = Subject.create('');

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockSimvars>();
        sub.on('ltsTest').whenChanged().handle((ltsTest) => {
            if (ltsTest === 0) {
                this.chronoText.set('88:88');
            } else {
                this.chronoText.set('00:00');
            }
        });
    }

    public render(): VNode {
        return (
            <text x="47" y="60" class="fontBig">{this.chronoText}</text>
        );
    }
}
