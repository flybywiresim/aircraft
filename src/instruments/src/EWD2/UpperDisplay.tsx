// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EventBus, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { EWDSimvars } from './shared/EWDSimvarPublisher';
import { PacksNaiWai } from './PacksNaiWai';

interface UpperDisplayProps {
    bus: EventBus;
}
export class UpperDisplay extends DisplayComponent<UpperDisplayProps> {
    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <>
                <PacksNaiWai bus={this.props.bus} />
            </>
        );
    }
}
