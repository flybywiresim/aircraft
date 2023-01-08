// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EventBus, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { AFloor } from './AFloor';
import { EGT } from './EGT';
import { Idle } from './Idle';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { N1 } from './N1';
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

                <Layer x={0} y={96}>
                    <N1 bus={this.props.bus} engine={1} x={234} y={0} />
                    <N1 bus={this.props.bus} engine={2} x={534} y={0} />
                    <text class="Large Center" x={387} y={26}>N1</text>
                    <text class="Medium Center Cyan" x={384} y={45}>%</text>
                </Layer>

                <Layer x={0} y={248}>
                    <EGT bus={this.props.bus} engine={1} x={234} y={0} />
                    <EGT bus={this.props.bus} engine={2} x={533} y={0} />
                    <text class="Large Center" x={385} y={-16}>EGT</text>
                    <text class="Medium Center Cyan" x={379} y={6}>&deg;C</text>
                </Layer>
            </>
        );
    }
}
