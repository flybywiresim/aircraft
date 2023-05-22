import { ComponentProps, DisplayComponent, FSComponent, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { EfisNdMode } from '@shared/NavigationDisplay';
import { Arinc429WordData } from '@shared/arinc429';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { VorSimVars } from 'instruments/src/MsfsAvionicsCommon/providers/VorBusPublisher';
import { AdirsSimVars } from 'instruments/src/MsfsAvionicsCommon/SimVarTypes';
import { Arinc429ConsumerSubject } from 'instruments/src/MsfsAvionicsCommon/Arinc429ConsumerSubject';
import { RoseMode, RoseModeProps } from './RoseMode';
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

    //  private readonly headingWord = Arinc429ConsumerSubject.create(null);

    private readonly courseSub = Subject.create(0);

    private readonly courseDeviationSub = Subject.create(0);

    private readonly ilsAvailableSub = Subject.create(false);

    private readonly ilsFrequencySub = Subject.create(0);

    private readonly localizerValidSub = Subject.create(false);

    onShow() {
        super.onShow();

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        const sub = this.props.bus.getSubscriber<AdirsSimVars & DmcEvents & VorSimVars>();

        const index: 3 | 4 = this.props.index + 2 as (3|4);

        // this.headingWord.setConsumer(sub.on('heading'));

        sub.on(`nav${index}Obs`).whenChanged().handle((v) => this.courseSub.set(v));

        sub.on(`nav${index}RadialError`).whenChanged().handle((v) => this.courseDeviationSub.set(v));

        sub.on(`nav${index}Available`).whenChanged().handle((v) => this.ilsAvailableSub.set(v));

        sub.on(`nav${index}Frequency`).whenChanged().handle((v) => this.ilsFrequencySub.set(v));

        sub.on('localizerValid').whenChanged().handle((v) => this.localizerValidSub.set(v));

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
                <IlsCaptureOverlay
                    heading={this.props.headingWord}
                    course={this.courseSub}
                    courseDeviation={this.courseDeviationSub}
                    available={this.localizerValidSub}
                    ilsFrequency={this.ilsFrequencySub}

                />
            </g>
        );
    }
}

interface IlsCaptureOverlayProps extends ComponentProps {
    heading: Subscribable<Arinc429WordData>,
    course: Subscribable<number>,
    courseDeviation: Subscribable<number>,
    available: Subscribable<boolean>,
    ilsFrequency: Subscribable<number>,
}

class IlsCaptureOverlay extends DisplayComponent<IlsCaptureOverlayProps> {
        // we can't tell if the course is valid from the MSFS radio, so at least check that the frequency is
        private readonly pointerVisibilitySub = MappedSubject.create(([ilsFrequency]) => {
            return ilsFrequency >= 108 && ilsFrequency <= 112;
        }, this.props.ilsFrequency);

        private readonly visible = MappedSubject.create(([heading, available]) => {
            return heading.isNormalOperation() && available;
        }, this.props.heading, this.props.available);

        private readonly rotation = MappedSubject.create(([heading, course]) => {
            if (heading.isNormalOperation()) {
                return course - heading.value;
            }
            return 0;
        }, this.props.heading, this.props.course);

        private readonly pointerColor = MappedSubject.create(([heading]) => {
            if (heading.isNormalOperation()) {
                return 'Cyan';
            }

            return 'White';
        }, this.props.heading)

        private readonly deviation = MappedSubject.create(([courseDeviation]) => {
            const dots = Math.max(-2, Math.min(2, courseDeviation / 0.8));
            return dots * 74;
        }, this.props.courseDeviation);

        render(): VNode {
            return (
                <g
                    visibility={this.visible.map((visible) => (visible ? 'inherit' : 'hidden'))}
                    transform={this.rotation.map((deg) => `rotate(${deg} 384 384)`)}
                    stroke="white"
                    strokeWidth={3}
                    fill="none"
                >
                    <g id="ils-deviation-scale">
                        <circle cx={236} cy={384} r={5} />
                        <circle cx={310} cy={384} r={5} />
                        <circle cx={458} cy={384} r={5} />
                        <circle cx={532} cy={384} r={5} />
                    </g>

                    <g visibility={this.pointerVisibilitySub}>
                        <path
                            d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
                            class="rounded shadow"
                            id="ils-course-pointer-shadow"
                            strokeWidth={4.5}
                        />
                        <path
                            d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
                            class="rounded Magenta"
                            id="ils-course-pointer"
                            strokeWidth={4}
                        />
                    </g>

                    <g visibility={this.props.available.map((a) => (a ? 'visible' : 'hidden'))}>
                        <path
                            d="M384,304 L384,464"
                            class="rounded shadow"
                            transform={this.deviation.map((cdiPx) => `translate(${cdiPx}, 0)`)}
                            id="ils-deviation-shadow"
                            strokeWidth={4.5}
                        />
                        <path
                            d="M384,304 L384,464"
                            class="rounded Magenta"
                            transform={this.deviation.map((cdiPx) => `translate(${cdiPx}, 0)`)}
                            id="ils-deviation"
                            strokeWidth={4}
                        />
                    </g>

                </g>
            );
        }
}
