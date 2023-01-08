// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { EWDSimvars } from './shared/EWDSimvarPublisher';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface FFProps {
    bus: EventBus;
    x: number;
    y: number;
    engine: 1 | 2;
    metric: Subscribable<boolean>;
}
export class FF extends DisplayComponent<FFProps> {
    private inactiveVisibility = Subject.create('hidden');

    private activeVisibility = Subject.create('hidden');

    private ff: number = 0;

    private ffDisplay = Subject.create(0);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents & EWDSimvars>();

        sub.on(`engine${this.props.engine}Fadec`).whenChanged().handle((f) => {
            this.inactiveVisibility.set(f ? 'hidden' : 'visible');
            this.activeVisibility.set(f ? 'visible' : 'hidden');
        });

        sub.on(`engine${this.props.engine}FF`).whenChanged().handle((ff) => {
            const metric = this.props.metric.get();
            const fuelWeight = metric ? ff : ff / 0.4535934;
            const roundValue = metric ? 10 : 20;
            this.ff = Math.round(fuelWeight / roundValue) * roundValue;
        });

        sub.on('realTime').atFrequency(1).handle((_t) => {
            this.ffDisplay.set(this.ff);
        });
    }

    render(): VNode {
        return (
            <Layer x={this.props.x} y={this.props.y}>
                <g visibility={this.inactiveVisibility}>
                    <text class="Large End Amber" x={-20} y={0}>XX</text>
                </g>
                <g visibility={this.activeVisibility}>
                    <text class="Large End Green" x={0} y={0}>{this.ffDisplay}</text>
                </g>
            </Layer>
        );
    }
}
