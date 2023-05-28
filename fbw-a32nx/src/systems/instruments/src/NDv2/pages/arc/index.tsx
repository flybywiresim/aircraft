import { FSComponent, ComponentProps, ConsumerSubject, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Arinc429WordData } from '@shared/arinc429';
import { EfisNdMode, rangeSettings } from '@shared/NavigationDisplay';
import { LsCourseBug } from 'instruments/src/NDv2/pages/arc/LsCourseBug';
import { ArincEventBus } from 'instruments/src/MsfsAvionicsCommon/ArincEventBus';
import { ArcModeUnderlay } from './ArcModeUnderlay';
import { SelectedHeadingBug } from './SelectedHeadingBug';
import { getSmallestAngle } from '../../../PFD/PFDUtils';
import { Flag } from '../../shared/Flag';
import { NDPage } from '../NDPage';
import { RadioNeedle } from '../../shared/RadioNeedle';
import { NDControlEvents } from '../../NDControlEvents';
import { AdirsSimVars } from '../../../MsfsAvionicsCommon/SimVarTypes';
import { EcpSimVars } from '../../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { Arinc429RegisterSubject } from '../../../MsfsAvionicsCommon/Arinc429RegisterSubject';

export interface ArcModePageProps extends ComponentProps {
    bus: ArincEventBus,
    headingWord: Subscribable<Arinc429WordData>,
    trueHeadingWord: Subscribable<Arinc429WordData>,
    trackWord: Subscribable<Arinc429WordData>,
    trueTrackWord: Subscribable<Arinc429WordData>,
    isUsingTrackUpMode: Subscribable<boolean>,
}

export class ArcModePage extends NDPage<ArcModePageProps> {
    public isVisible = Subject.create(false);

    // TODO these two should be FM pos maybe ?

    private readonly pposLatWord = Arinc429RegisterSubject.createEmpty();

    private readonly pposLonWord = Arinc429RegisterSubject.createEmpty();

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

    // TODO in the future, this should be looking at stuff like FM position invalid or not map frames transmitted
    private readonly mapFlagShown = MappedSubject.create(([headingWord, latWord, longWord]) => {
        return !headingWord.isNormalOperation() || !latWord.isNormalOperation() || !longWord.isNormalOperation();
    }, this.props.headingWord, this.pposLatWord, this.pposLonWord);

    onShow() {
        super.onShow();

        this.handleMovePlane();
        this.handleRotatePlane();
        this.handleMoveMap();
        this.handleMapRotation();
        this.handleScaleMap();
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars & EcpSimVars>();

        sub.on('latitude').whenChanged().handle((v) => this.pposLatWord.setWord(v));
        sub.on('longitude').whenChanged().handle((v) => this.pposLonWord.setWord(v));

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

        publisher.pub('set_map_efis_mode', EfisNdMode.ARC);
        publisher.pub('set_map_pixel_radius', 498);
        publisher.pub('set_map_range_radius', rangeSettings[this.mapRangeSub.get()]);
        publisher.pub('set_map_center_y_bias', 242);
    }

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((visible) => (visible ? 'visible' : 'hidden'))}>
                {/* inverted map overlays for terrain map in WASM module  */}
                <path name="arc-mode-bottom-left-map-area" d="M0,625 L122,625 L174,683 L174,768 L0,768 L0,625" class="nd-inverted-map-area" />
                <path name="arc-mode-bottom-right-map-area" d="M768,562 L648,562 L591,625 L591,768 L768,768 L768,562" class="nd-inverted-map-area" />
                <path name="arc-mode-top-map-area" d="M0,0 L0,312 a492,492 0 0 1 768,0 L768,0 L0,0" class="nd-inverted-map-area" />

                <ArcModeUnderlay
                    bus={this.props.bus}
                    ringAvailable={this.ringAvailable}
                    ringRotation={this.ringRotation}
                />

                <g clip-path="url(#arc-mode-map-clip)">
                    <RadioNeedle
                        bus={this.props.bus}
                        headingWord={this.props.headingWord}
                        trackWord={this.props.trackWord}
                        isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                        index={1}
                        mode={EfisNdMode.ARC}
                        centreHeight={620}
                    />
                    <RadioNeedle
                        bus={this.props.bus}
                        headingWord={this.props.headingWord}
                        trackWord={this.props.trackWord}
                        isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                        index={2}
                        mode={EfisNdMode.ARC}
                        centreHeight={620}
                    />
                </g>

                <LsCourseBug
                    bus={this.props.bus}
                    rotationOffset={this.planeRotation}
                />

                <SelectedHeadingBug
                    bus={this.props.bus}
                    rotationOffset={this.planeRotation}
                />

                <Flag visible={this.mapFlagShown} x={384} y={320.6} class="Red FontLarge">MAP NOT AVAIL</Flag>

            </g>
        );
    }
}
