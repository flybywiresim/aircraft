import { ComponentProps, DisplayComponent, EventBus, FSComponent, VNode } from 'msfssdk';
import { ClockSimvars } from './shared/ClockSimvarPublisher';
import { Chrono } from './Components/Chrono';
import { Clock } from './Components/Clock';
import { ElapsedTime } from './Components/ElapsedTime';

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

        sub.on('timeOfDay').whenChanged().handle((timeOfDay) => {
            if (timeOfDay === 1 || timeOfDay === 2) {
                this.gElementRef.instance.classList.add('day');
                this.gElementRef.instance.classList.remove('night');
            } else {
                this.gElementRef.instance.classList.add('night');
                this.gElementRef.instance.classList.remove('day');
            }
        });
    }

    render(): VNode {
        return (
            <svg version="1.1" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <g ref={this.gElementRef}>
                    <Chrono bus={this.props.bus} />
                    <Clock bus={this.props.bus} />
                    <ElapsedTime bus={this.props.bus} />
                </g>
            </svg>
        );
    }
}
