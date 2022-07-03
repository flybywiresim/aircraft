import {
    FSComponent,
    ComponentProps,
    DisplayComponent,
    MappedSubject,
    Subject,
    Subscribable,
    VNode,
    EventBus,
} from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { EfisNdMode } from '@shared/NavigationDisplay';
import { Airplane } from '../../shared/Airplane';
import { TrackBug } from '../../shared/TrackBug';
import { ArcModeUnderlay } from './ArcModeUnderlay';
import { SelectedHeadingBug } from './SelectedHeadingBug';
import { LubberLine } from './LubberLine';
import { getSmallestAngle } from '../../../PFD/PFDUtils';
import { Flag } from '../../shared/Flag';
import { NDPage } from '../NDPage';
import { CrossTrackError } from '../../shared/CrossTrackError';
import { RadioNeedle } from '../../shared/RadioNeedle';
import { TcasWxrMessages } from '../../TcasWxrMessages';
import { TrackLine } from '../../shared/TrackLine';

export interface ArcModePageProps extends ComponentProps {
    bus: EventBus,
    headingWord: Subscribable<Arinc429Word>,
    trackWord: Subscribable<Arinc429Word>,
    isUsingTrackUpMode: Subscribable<boolean>,
}

export class ArcModePage extends DisplayComponent<ArcModePageProps> implements NDPage {
    public isVisible = Subject.create(false);

    private readonly ringAvailable = MappedSubject.create(([isUsingTrackUpMode, headingWord, trackWord]) => {
        if (isUsingTrackUpMode) {
            return headingWord.isNormalOperation() && trackWord.isNormalOperation();
        }

        return headingWord.isNormalOperation();
    }, this.props.isUsingTrackUpMode, this.props.headingWord, this.props.trackWord);

    private readonly ringRotation = Subject.create<number>(0);

    private readonly planeRotation = MappedSubject.create(([isUsingTrackUpMode, headingWord, trackWord]) => {
        if (isUsingTrackUpMode) {
            if (headingWord.isNormalOperation() && trackWord.isNormalOperation()) {
                return getSmallestAngle(headingWord.value, trackWord.value);
            }
        }

        return 0;
    }, this.props.isUsingTrackUpMode, this.props.headingWord, this.props.trackWord);

    private readonly trkFlagShown = MappedSubject.create(([isUsingTrackUpMode, trackWord]) => {
        if (isUsingTrackUpMode) {
            return !trackWord.isNormalOperation();
        }

        return false;
    }, this.props.isUsingTrackUpMode, this.props.trackWord);

    private readonly hdgFlagShown = MappedSubject.create(([headingWord]) => !headingWord.isNormalOperation(), this.props.headingWord);

    private readonly mapFlagShown = MappedSubject.create(([headingWord]) => !headingWord.isNormalOperation(), this.props.headingWord);

    // eslint-disable-next-line
    private readonly airplaneShown = MappedSubject.create(([isVisible, headingWord]) => {
        return isVisible && headingWord.isNormalOperation();
    }, this.isVisible, this.props.headingWord);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.props.headingWord.sub(() => this.handleRingRotation());
        this.props.trackWord.sub(() => this.handleRingRotation());
        this.props.isUsingTrackUpMode.sub(() => this.handleRingRotation());
    }

    private handleRingRotation() {
        const isUsingTrackUpMode = this.props.isUsingTrackUpMode.get();

        const rotationWord = isUsingTrackUpMode ? this.props.trackWord.get() : this.props.headingWord.get();

        if (rotationWord.isNormalOperation()) {
            this.ringRotation.set(rotationWord.value);
        }
    }

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((visible) => (visible ? 'visible' : 'hidden'))}>
                <ArcModeUnderlay
                    bus={this.props.bus}
                    ringAvailable={this.ringAvailable}
                    ringRotation={this.ringRotation}
                />

                <g clipPath="url(#arc-mode-map-clip)">
                    <RadioNeedle
                        bus={this.props.bus}
                        headingWord={this.props.headingWord}
                        trackWord={this.props.trackWord}
                        isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                        index={1}
                        side="L"
                        mode={EfisNdMode.ARC}
                    />
                    <RadioNeedle
                        bus={this.props.bus}
                        headingWord={this.props.headingWord}
                        trackWord={this.props.trackWord}
                        isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                        index={2}
                        side="L"
                        mode={EfisNdMode.ARC}
                    />
                </g>

                <SelectedHeadingBug
                    bus={this.props.bus}
                    rotationOffset={this.planeRotation}
                    visible={this.isVisible}
                />

                <TrackLine
                    bus={this.props.bus}
                    x={384}
                    y={620}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />
                <TrackBug
                    bus={this.props.bus}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />

                <Airplane
                    x={Subject.create(384)}
                    y={Subject.create(626)}
                    available={this.airplaneShown}
                    rotation={this.planeRotation}
                />
                <LubberLine
                    available={this.props.headingWord.map((it) => it.isNormalOperation())}
                    rotation={this.planeRotation}
                />

                <Flag shown={this.trkFlagShown} x={381} y={204} class="Red FontSmallest">TRK</Flag>
                <Flag shown={this.hdgFlagShown} x={384} y={241} class="Red FontLarge">HDG</Flag>
                <Flag shown={this.mapFlagShown} x={384} y={320.6} class="Red FontLarge">MAP NOT AVAIL</Flag>

                <CrossTrackError bus={this.props.bus} x={390} y={646} isPlanMode={Subject.create(false)} />

                <TcasWxrMessages bus={this.props.bus} mode={EfisNdMode.ARC} />
            </g>
        );
    }
}
