// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EventBus, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { AFloor } from './AFloor';
import { Idle } from './Idle';
import { N1Idle } from './N1Idle';
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
                <AFloor bus={this.props.bus} />
                <Idle bus={this.props.bus} />
                <N1Idle bus={this.props.bus} />
                <PacksNaiWai bus={this.props.bus} />
            </>
        );
    }
}
