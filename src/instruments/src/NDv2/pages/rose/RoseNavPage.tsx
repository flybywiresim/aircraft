import { FSComponent, Subject, VNode } from 'msfssdk';
import { RoseMode, RoseModeOverlay, RoseModeProps } from './RoseMode';

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
            </g>
        );
    }
}
