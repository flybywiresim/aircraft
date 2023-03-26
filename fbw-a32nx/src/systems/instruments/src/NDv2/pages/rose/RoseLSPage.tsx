import { FSComponent, Subject, VNode } from 'msfssdk';
import { EfisNdMode } from '@shared/NavigationDisplay';
import { RoseMode, RoseModeProps } from './RoseMode';
import { TrackBug } from '../../shared/TrackBug';
import { RoseModeUnderlay } from './RoseModeUnderlay';
import { NDControlEvents } from '../../NDControlEvents';
import { IlsInfoIndicator } from './IlsInfoIndicator';
import { GlideSlope } from './Glideslope';
import { RadioNeedle } from '../../shared/RadioNeedle';

export interface RoseLsProps extends RoseModeProps {
    index: 1 | 2,
}

export class RoseLSPage extends RoseMode<RoseLsProps> {
    isVisible = Subject.create(false);

    onShow() {
        super.onShow();

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        publisher.pub('set_show_map', false);
    }

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((v) => (v ? 'visible' : 'hidden'))}>
                <IlsInfoIndicator bus={this.props.bus} index={this.props.index} />

                <GlideSlope bus={this.props.bus} />

                <RoseModeUnderlay
                    bus={this.props.bus}
                    heading={this.props.headingWord}
                    visible={this.isVisible}
                />

                <RadioNeedle
                    bus={this.props.bus}
                    headingWord={this.props.headingWord}
                    trackWord={this.props.trackWord}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                    index={1}
                    mode={EfisNdMode.ROSE_NAV}
                    centreHeight={384}
                />
                <RadioNeedle
                    bus={this.props.bus}
                    headingWord={this.props.headingWord}
                    trackWord={this.props.trackWord}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                    index={2}
                    mode={EfisNdMode.ROSE_NAV}
                    centreHeight={384}
                />

                {/* FIXME LOC indications */}

                <TrackBug
                    bus={this.props.bus}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />
            </g>
        );
    }
}
