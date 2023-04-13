// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { ArtificialHorizonDisplay } from './ArtificialHorizonDisplay';
import { ISISDisplayUnit } from './ISISDisplayUnit';

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
