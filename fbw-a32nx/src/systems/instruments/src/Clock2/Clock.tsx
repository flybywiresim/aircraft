import { ComponentProps, DisplayComponent, EventBus, FSComponent, VNode } from 'msfssdk';
import { Chrono } from './Components/Chrono';

import './style.scss';

interface ClockProps extends ComponentProps {
    bus: EventBus;
}

export class ClockRoot extends DisplayComponent<ClockProps> {
    render(): VNode {
        return (
            <svg version="1.1" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <g class="day on">
                    <Chrono bus={this.props.bus} />
                </g>
            </svg>
        );
    }
}
