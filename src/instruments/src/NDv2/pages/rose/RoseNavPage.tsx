import { FSComponent, Subject, VNode } from 'msfssdk';
import { RoseMode, RoseModeOverlay, RoseModeProps } from './RoseMode';
import { Airplane } from '../../shared/Airplane';

export class RoseNavPage extends RoseMode<RoseModeProps> {
    isVisible = Subject.create(false);

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((v) => (v ? 'visible' : 'hidden'))}>
                <RoseModeOverlay
                    heading={this.props.heading}
                    tcasMode={this.props.tcasMode}
                    rangeValue={this.props.rangeValue}
                    visible={this.isVisible}
                />

                <Airplane
                    x={Subject.create(384)}
                    y={Subject.create(384)}
                    available={this.isVisible}
                    rotation={Subject.create(0)}
                />
            </g>
        );
    }
}
