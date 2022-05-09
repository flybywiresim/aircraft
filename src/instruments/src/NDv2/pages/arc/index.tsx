import { DisplayComponent, EventBus, FSComponent, MappedSubject, Subject, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { EfisNdMode } from '@shared/NavigationDisplay';
import { Airplane } from '../../shared/Airplane';
import { TrackBug } from '../../shared/TrackBug';
import { ArcModeUnderlay } from './ArcModeUnderlay';
import { SelectedHeadingBug } from './SelectedHeadingBug';
import { NDSimvars } from '../../NDSimvarPublisher';
import { LubberLine } from './LubberLine';
import { getSmallestAngle } from '../../../PFD/PFDUtils';
import { Flag } from '../../shared/Flag';
import { NDPage } from '../NDPage';
import { CrossTrackError } from '../../shared/CrossTrackError';
import { RadioNeedle } from '../../shared/RadioNeedle';
import { TcasWxrMessages } from '../../TcasWxrMessages';

export class ArcModePage extends DisplayComponent<{ bus: EventBus, isUsingTrackUpMode: Subscribable<boolean> }> implements NDPage {
    public isVisible = Subject.create(false);

    private readonly headingWord = Subject.create(Arinc429Word.empty());

    private readonly trackWord = Subject.create(Arinc429Word.empty());

    private readonly ringAvailable = MappedSubject.create(([isUsingTrackUpMode, headingWord, trackWord]) => {
        if (isUsingTrackUpMode) {
            return headingWord.isNormalOperation() && trackWord.isNormalOperation();
        }

        return headingWord.isNormalOperation();
    }, this.props.isUsingTrackUpMode, this.headingWord, this.trackWord);

    private readonly ringRotation = Subject.create<number>(0);

    private readonly planeRotation = MappedSubject.create(([isUsingTrackUpMode, headingWord, trackWord]) => {
        if (isUsingTrackUpMode) {
            if (headingWord.isNormalOperation() && trackWord.isNormalOperation()) {
                return getSmallestAngle(headingWord.value, trackWord.value);
            }
        }

        return 0;
    }, this.props.isUsingTrackUpMode, this.headingWord, this.trackWord);

    private readonly trkFlagShown = MappedSubject.create(([isUsingTrackUpMode, trackWord]) => {
        if (isUsingTrackUpMode) {
            return !trackWord.isNormalOperation();
        }

        return false;
    }, this.props.isUsingTrackUpMode, this.trackWord);

    private readonly hdgFlagShown = MappedSubject.create(([headingWord]) => !headingWord.isNormalOperation(), this.headingWord);

    private readonly mapFlagShown = MappedSubject.create(([headingWord]) => !headingWord.isNormalOperation(), this.headingWord);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDSimvars>();

        sub.on('heading').whenChanged().handle((v) => {
            this.headingWord.set(new Arinc429Word(v));
            this.handleRingRotation();
        });

        sub.on('groundTrack').whenChanged().handle((v) => {
            this.trackWord.set(new Arinc429Word(v));
        });
    }

    private handleRingRotation() {
        const isUsingTrackUpMode = this.props.isUsingTrackUpMode.get();

        const rotationWord = isUsingTrackUpMode ? this.trackWord.get() : this.headingWord.get();

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
                    <RadioNeedle bus={this.props.bus} index={1} side="L" mode={EfisNdMode.ARC} />
                    <RadioNeedle bus={this.props.bus} index={2} side="L" mode={EfisNdMode.ARC} />
                </g>

                <SelectedHeadingBug
                    bus={this.props.bus}
                    rotationOffset={this.planeRotation}
                />

                <TrackBug
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                    bus={this.props.bus}
                />

                <Airplane
                    x={Subject.create(384)}
                    y={Subject.create(626)}
                    available={this.headingWord.map((it) => it.isNormalOperation())}
                    rotation={this.planeRotation}
                />
                <LubberLine
                    available={this.headingWord.map((it) => it.isNormalOperation())}
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
