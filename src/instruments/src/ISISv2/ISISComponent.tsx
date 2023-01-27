// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArtificialHorizonDisplay } from 'instruments/src/ISISv2/ArtificialHorizonDisplay';
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
        /*  <DisplayUnit bus={this.props.bus} /> */
            <ArtificialHorizonDisplay bus={this.props.bus} />
        );
    }
}
