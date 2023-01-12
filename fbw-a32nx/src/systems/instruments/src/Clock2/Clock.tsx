import { ClockSimvars } from 'instruments/src/Clock2/shared/ClockSimvarPublisher';
import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { Chrono } from './Components/Chrono';

import './style.scss';

interface ClockProps extends ComponentProps {
    bus: EventBus;
}

export class ClockRoot extends DisplayComponent<ClockProps> {
    private readonly ltsTest = Subject.create(false);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockSimvars>();
        sub.on('ltsTest').whenChanged().handle((ltsTest) => {
            this.ltsTest.set(ltsTest === 0);
        });
    }

    render(): VNode {
        return (
            <svg version="1.1" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <g class="day on">
                    <Chrono bus={this.props.bus} ltsTest={this.ltsTest} />
                </g>
            </svg>
        );
    }
}
