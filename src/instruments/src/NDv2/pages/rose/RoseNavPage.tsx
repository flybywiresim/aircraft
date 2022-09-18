import { FSComponent, Subject, VNode } from 'msfssdk';
import { RoseMode } from './RoseMode';
import { TrackLine } from '../../shared/TrackLine';
import { TrackBug } from '../../shared/TrackBug';
import { RoseModeUnderlay } from './RoseModeUnderlay';

export class RoseNavPage extends RoseMode {
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

                <TrackLine
                    bus={this.props.bus}
                    x={384}
                    y={384}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />
                <TrackBug
                    bus={this.props.bus}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />
            </g>
        );
    }
}
