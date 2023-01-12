import { ComponentProps, DisplayComponent, EventBus, FSComponent, VNode } from 'msfssdk';
import { ClockSimvars } from './shared/ClockSimvarPublisher';
import { Chrono } from './Components/Chrono';
import { Clock } from './Components/Clock';

import './style.scss';

interface ClockProps extends ComponentProps {
    bus: EventBus;
}

export class ClockRoot extends DisplayComponent<ClockProps> {
    private readonly gElementRef = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockSimvars>();
        sub.on('dcEssIsPowered').whenChanged().handle((dccEssIsPowered) => {
            if (dccEssIsPowered) {
                this.gElementRef.instance.classList.add('on');
                this.gElementRef.instance.classList.remove('off');
            } else {
                this.gElementRef.instance.classList.add('off');
                this.gElementRef.instance.classList.remove('on');
            }
        });
    }

    render(): VNode {
        return (
            <svg version="1.1" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <g ref={this.gElementRef} class="day">
                    <Chrono bus={this.props.bus} />
                    <Clock bus={this.props.bus} />
                </g>
            </svg>
        );
    }
}
