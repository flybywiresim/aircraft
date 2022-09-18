import { FSComponent, ComponentProps, MappedSubject, Subject, Subscribable, VNode, EventBus, ConsumerSubject } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { EfisNdMode, rangeSettings } from '@shared/NavigationDisplay';
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
import { NDControlEvents } from '../../NDControlEvents';
import { AdirsSimVars } from '../../../MsfsAvionicsCommon/SimVarTypes';
import { EcpSimVars } from '../../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';

export interface ArcModePageProps extends ComponentProps {
    bus: EventBus,
    headingWord: Subscribable<Arinc429Word>,
    trueHeadingWord: Subscribable<Arinc429Word>,
    trackWord: Subscribable<Arinc429Word>,
    trueTrackWord: Subscribable<Arinc429Word>,
    isUsingTrackUpMode: Subscribable<boolean>,
}

export class ArcModePage extends NDPage<ArcModePageProps> {
    public isVisible = Subject.create(false);

    // TODO these two should be FM pos maybe ?

    private readonly pposLatWord = Subject.create(Arinc429Word.empty());

    private readonly pposLonWord = Subject.create(Arinc429Word.empty());

    private readonly mapRangeSub = ConsumerSubject.create(this.props.bus.getSubscriber<EcpSimVars>().on('ndRangeSetting').whenChanged(), -1);

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

    onShow() {
        super.onShow();

        this.handleMovePlane();

        const sub = this.props.bus.getSubscriber<AdirsSimVars & EcpSimVars>();

        sub.on('latitude').whenChanged().handle((v) => this.pposLatWord.set(new Arinc429Word(v)));
        sub.on('longitude').whenChanged().handle((v) => this.pposLonWord.set(new Arinc429Word(v)));
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.isVisible.sub((visible) => {
            if (visible) {
                this.handleRotatePlane();
                this.handleMoveMap();
                this.handleMapRotation();
                this.handleScaleMap();
            }
        });

        this.props.headingWord.sub(() => this.handleRingRotation());
        this.props.trueHeadingWord.sub(() => this.handleMapRotation());
        this.props.trackWord.sub(() => this.handleRingRotation());
        this.props.trueTrackWord.sub(() => this.handleMapRotation());
        this.props.isUsingTrackUpMode.sub(() => this.handleRingRotation());

        this.planeRotation.sub(() => {
            if (this.isVisible.get()) {
                this.handleRotatePlane();
            }
        });

        this.pposLatWord.sub(() => this.handleMoveMap());
        this.pposLonWord.sub(() => this.handleMoveMap());

        this.mapRangeSub.sub(() => this.handleScaleMap());
    }

    private handleRingRotation() {
        const isUsingTrackUpMode = this.props.isUsingTrackUpMode.get();

        const rotationWord = isUsingTrackUpMode ? this.props.trackWord.get() : this.props.headingWord.get();

        if (rotationWord.isNormalOperation()) {
            this.ringRotation.set(rotationWord.value);
        }
    }

    private handleMapRotation() {
        if (!this.isVisible.get()) {
            return;
        }

        const isUsingTrackUpMode = this.props.isUsingTrackUpMode.get();

        const rotationWord = isUsingTrackUpMode ? this.props.trueTrackWord.get() : this.props.trueHeadingWord.get();

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        if (rotationWord.isNormalOperation()) {
            publisher.pub('set_map_up_course', rotationWord.value);
        } else {
            publisher.pub('set_map_up_course', -1);
        }
    }

    private handleMovePlane() {
        if (!this.isVisible.get()) {
            return;
        }

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        publisher.pub('set_show_plane', true);
        publisher.pub('set_plane_x', 384);
        publisher.pub('set_plane_y', 626);
        publisher.pub('set_show_map', true);
    }

    private handleMoveMap() {
        if (!this.isVisible.get()) {
            return;
        }

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        const latWord = this.pposLatWord.get();
        const lonWord = this.pposLonWord.get();

        if (latWord.isNormalOperation() && lonWord.isNormalOperation()) {
            publisher.pub('set_show_map', true);
            publisher.pub('set_map_center_lat', latWord.value);
            publisher.pub('set_map_center_lon', lonWord.value);
        } else {
            publisher.pub('set_show_map', false);
        }
    }

    private handleRotatePlane() {
        if (!this.isVisible.get()) {
            return;
        }

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        publisher.pub('set_plane_rotation', this.planeRotation.get());
    }

    private handleScaleMap() {
        if (!this.isVisible.get()) {
            return;
        }

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        publisher.pub('set_map_range_radius', rangeSettings[this.mapRangeSub.get()]);
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
