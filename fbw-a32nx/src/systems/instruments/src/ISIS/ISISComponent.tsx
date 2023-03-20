// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArtificialHorizonDisplay } from './ArtificialHorizonDisplay';
import { ISISDisplayUnit } from './ISISDisplayUnit';
import { DisplayComponent, EventBus, FSComponent, VNode } from 'msfssdk';

export interface ISISProps {
    bus: EventBus,
}

export class ISISComponent extends DisplayComponent<ISISProps> {
    onAfterRender(node: VNode) {
        super.onAfterRender(node);
    }

    render(): VNode | null {
        return (
            <ISISDisplayUnit bus={this.props.bus}>
                <ArtificialHorizonDisplay bus={this.props.bus} />
            </ISISDisplayUnit>
        );
    }
}
