import { FSComponent, Subject, VNode } from 'msfssdk';
import { RoseMode, RoseModeProps } from './RoseMode';
import { Airplane } from '../../shared/Airplane';
import { TrackBug } from '../../shared/TrackBug';
import { RoseModeUnderlay } from './RoseModeUnderlay';

export class RoseVorPage extends RoseMode<RoseModeProps> {
    isVisible = Subject.create(false);

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((v) => (v ? 'visible' : 'hidden'))}>
                <RoseModeUnderlay
                    heading={this.props.heading}
                    tcasMode={this.props.tcasMode}
                    rangeValue={this.props.rangeValue}
                    visible={this.isVisible}
                />

                <TrackBug
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                    bus={this.props.bus}
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
