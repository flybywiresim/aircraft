// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EventBus, DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { EWDSimvars } from './shared/EWDSimvarPublisher';

interface AFloorProps {
    bus: EventBus;
}
export class AFloor extends DisplayComponent<AFloorProps> {
    private visibility = Subject.create('hidden');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<EWDSimvars>();

        sub.on('autoThrustMode').whenChanged().handle((mode) => {
            this.visibility.set(mode === 13 ? 'visible' : 'hidden');
        });
    }

    render(): VNode {
        return (
            <text class="Amber Large End" x={150} y={27} visibility={this.visibility}>A.FLOOR</text>
        );
    }
}
