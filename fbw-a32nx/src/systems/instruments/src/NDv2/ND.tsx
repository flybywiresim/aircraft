// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, DisplayComponent, EventBus, FSComponent, MappedSubject, Subject, VNode } from 'msfssdk';
import { SimVarString } from '@shared/simvar';
import { EfisNdMode, EfisNdRangeValue, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { AdirsSimVars } from '../MsfsAvionicsCommon/SimVarTypes';
import { NDSimvars } from './NDSimvarPublisher';
import { ArcModePage } from './pages/arc';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { FmMessages } from './FmMessages';
import { Flag } from './shared/Flag';
import { CanvasMap } from './shared/map/CanvasMap';
import { EcpSimVars } from '../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { NDPage } from './pages/NDPage';
import { PlanModePage } from './pages/plan';
import { RadioNavInfo } from './shared/RadioNavInfo';
import { RoseNavPage } from './pages/rose/RoseNavPage';
import { RoseLSPage } from './pages/rose/RoseLSPage';
import { RoseVorPage } from './pages/rose/RoseVorPage';
import { NDControlEvents } from './NDControlEvents';
import { Airplane } from './shared/Airplane';
import { TcasWxrMessages } from './TcasWxrMessages';
import { Arinc429RegisterSubject } from '../MsfsAvionicsCommon/Arinc429RegisterSubject';
import { Chrono } from './Chrono';
import { WindIndicator } from './shared/WindIndicator';
import { TerrainMapThresholds } from './TerrainMapThresholds';

const PAGE_GENERATION_BASE_DELAY = 500;
const PAGE_GENERATION_RANDOM_DELAY = 70;

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-nd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface NDProps {
    bus: EventBus,

    side: EfisSide,
}

export class NDComponent extends DisplayComponent<NDProps> {
    private displayBrightness = Subject.create(0);

    private displayFailed = Subject.create(false);

    private displayPowered = Subject.create(false);

    private readonly isUsingTrackUpMode = Subject.create(true);

    private readonly magneticHeadingWord = Arinc429RegisterSubject.createEmpty();

    private readonly trueHeadingWord = Arinc429RegisterSubject.createEmpty();

    private readonly magneticTrackWord = Arinc429RegisterSubject.createEmpty();

    private readonly trueTrackWord = Arinc429RegisterSubject.createEmpty();

    private readonly mapRangeRadius = Subject.create(0);

    private readonly roseLSPage = FSComponent.createRef<RoseLSPage>();

    private readonly roseVorPage = FSComponent.createRef<RoseVorPage>();

    private readonly roseNavPage = FSComponent.createRef<RoseNavPage>();

    private readonly arcPage = FSComponent.createRef<ArcModePage>();

    private readonly planPage = FSComponent.createRef<PlanModePage>();

    private currentPageMode = Subject.create(EfisNdMode.ARC);

    private currentPageInstance: NDPage;

    private readonly pageChangeInProgress = Subject.create(false);

    private pageChangeInvalidationTimeout = -1;

    private readonly rangeChangeInProgress = Subject.create(false);

    private rangeChangeInvalidationTimeout = -1;

    private readonly mapRecomputing = MappedSubject.create(([pageChange, rangeChange]) => {
        return pageChange || rangeChange;
    }, this.pageChangeInProgress, this.rangeChangeInProgress);

    private readonly trkFlagShown = MappedSubject.create(([isUsingTrackUpMode, trackWord, currentPageMode]) => {
        if (currentPageMode === EfisNdMode.PLAN) {
            return false;
        }

        if (isUsingTrackUpMode) {
            return !trackWord.isNormalOperation();
        }

        return false;
    }, this.isUsingTrackUpMode, this.magneticTrackWord, this.currentPageMode);

    private readonly hdgFlagShown = MappedSubject.create(([headingWord, currentPageMode]) => {
        if (currentPageMode === EfisNdMode.PLAN) {
            return false;
        }

        return !headingWord.isNormalOperation();
    }, this.magneticHeadingWord, this.currentPageMode);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const isCaptainSide = getDisplayIndex() === 1;

        this.currentPageInstance = this.arcPage.instance;

        this.currentPageInstance.isVisible.set(true);
        this.currentPageInstance.onShow();

        const sub = this.props.bus.getSubscriber<NDSimvars & NDControlEvents & EcpSimVars & ClockEvents>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value === 1);
        });

        // TODO use DMC data
        sub.on('magHeadingRaw').whenChanged().handle((value) => {
            this.magneticHeadingWord.setWord(value);
        });

        // TODO use DMC data
        sub.on('trueHeadingRaw').whenChanged().handle((value) => {
            this.trueHeadingWord.setWord(value);
        });

        // TODO use DMC data
        sub.on('magTrackRaw').whenChanged().handle((value) => {
            this.magneticTrackWord.setWord(value);
        });

        // TODO use DMC data
        sub.on('trueTrackRaw').whenChanged().handle((value) => {
            this.trueTrackWord.setWord(value);
        });

        sub.on('ndRangeSetting').whenChanged().handle((value) => {
            this.mapRangeRadius.set(rangeSettings[value]);
            this.invalidateRange();
        });

        sub.on('ndMode').whenChanged().handle((mode) => {
            this.handleNewMapPage(mode);
        });

        this.mapRecomputing.sub((recomputing) => {
            this.props.bus.getPublisher<NDControlEvents>().pub('set_map_recomputing', recomputing);
        });
    }

    private handleNewMapPage(mode: EfisNdMode) {
        if (mode === this.currentPageMode.get()) {
            return;
        }

        this.currentPageInstance.isVisible.set(false);
        this.currentPageInstance.onHide();

        this.currentPageMode.set(mode);

        switch (mode) {
        case EfisNdMode.ROSE_ILS:
            this.currentPageInstance = this.roseLSPage.instance;
            break;
        case EfisNdMode.ROSE_VOR:
            this.currentPageInstance = this.roseVorPage.instance;
            break;
        case EfisNdMode.ROSE_NAV:
            this.currentPageInstance = this.roseNavPage.instance;
            break;
        case EfisNdMode.ARC:
            this.currentPageInstance = this.arcPage.instance;
            break;
        case EfisNdMode.PLAN:
            this.currentPageInstance = this.planPage.instance;
            break;
        default:
            console.warn(`Unknown ND page mode=${mode}`);
            break;
        }

        this.currentPageInstance.isVisible.set(true);
        this.currentPageInstance.onShow();

        this.invalidatePage();
    }

    private invalidateRange() {
        if (this.rangeChangeInvalidationTimeout !== -1) {
            window.clearTimeout(this.rangeChangeInvalidationTimeout);
        }

        this.rangeChangeInProgress.set(true);
        this.rangeChangeInvalidationTimeout = window.setTimeout(() => {
            this.rangeChangeInProgress.set(false);
        }, (Math.random() * PAGE_GENERATION_RANDOM_DELAY) + PAGE_GENERATION_BASE_DELAY);
    }

    private invalidatePage() {
        if (this.pageChangeInvalidationTimeout !== -1) {
            window.clearTimeout(this.pageChangeInvalidationTimeout);
        }

        this.pageChangeInProgress.set(true);
        this.pageChangeInvalidationTimeout = window.setTimeout(() => {
            this.pageChangeInProgress.set(false);
        }, (Math.random() * PAGE_GENERATION_RANDOM_DELAY) + PAGE_GENERATION_BASE_DELAY);
    }

    render(): VNode | null {
        return (
            <DisplayUnit bus={this.props.bus} failed={this.displayFailed} powered={this.displayPowered} brightness={this.displayBrightness}>
                {/* ND Vector graphics - bottom layer */}
                <svg class="nd-svg" viewBox="0 0 768 768">
                    <RoseLSPage
                        bus={this.props.bus}
                        ref={this.roseLSPage}
                        heading={this.magneticHeadingWord}
                        rangeValue={this.mapRangeRadius as Subject<EfisNdRangeValue>}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                        index={this.props.side === 'L' ? 2 : 1}
                    />
                    <RoseVorPage
                        bus={this.props.bus}
                        ref={this.roseVorPage}
                        heading={this.magneticHeadingWord}
                        rangeValue={this.mapRangeRadius as Subject<EfisNdRangeValue>}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                        index={this.props.side === 'R' ? 2 : 1}
                    />
                    <RoseNavPage
                        bus={this.props.bus}
                        ref={this.roseNavPage}
                        heading={this.magneticHeadingWord}
                        rangeValue={this.mapRangeRadius as Subject<EfisNdRangeValue>}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                    />
                    <ArcModePage
                        ref={this.arcPage}
                        bus={this.props.bus}
                        headingWord={this.magneticHeadingWord}
                        trueHeadingWord={this.trueHeadingWord}
                        trackWord={this.magneticTrackWord}
                        trueTrackWord={this.trueTrackWord}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                    />
                    <PlanModePage
                        ref={this.planPage}
                        bus={this.props.bus}
                        aircraftTrueHeading={this.trueHeadingWord}
                    />

                    <WindIndicator bus={this.props.bus} />
                    <SpeedIndicator bus={this.props.bus} />
                    <ToWaypointIndicator bus={this.props.bus} />
                    <ApproachIndicator bus={this.props.bus} />

                    <Flag shown={Subject.create(false)} x={384} y={54} class="Cyan FontSmallest">TRUE</Flag>
                    <Flag shown={Subject.create(false)} x={350} y={84} class="Amber FontSmall">DISPLAY SYSTEM VERSION INCONSISTENCY</Flag>
                    <Flag shown={Subject.create(false)} x={384} y={170} class="Amber FontMedium">CHECK HDG</Flag>
                    <Flag shown={this.trkFlagShown} x={381} y={204} class="Red FontSmallest">TRK</Flag>
                    <Flag shown={this.hdgFlagShown} x={384} y={241} class="Red FontLarge">HDG</Flag>

                    <Flag shown={this.rangeChangeInProgress} x={384} y={320} class="Green FontIntermediate">
                        RANGE CHANGE
                    </Flag>
                    <Flag
                        shown={MappedSubject.create(([rangeChange, pageChange]) => !rangeChange && pageChange, this.rangeChangeInProgress, this.pageChangeInProgress)}
                        x={384}
                        y={320}
                        class="Green FontIntermediate"
                    >
                        MODE CHANGE
                    </Flag>

                    <TerrainMapThresholds bus={this.props.bus} />

                    <RadioNavInfo bus={this.props.bus} index={1} />
                    <RadioNavInfo bus={this.props.bus} index={2} />
                </svg>

                {/* ND Raster map - middle layer */}
                <CanvasMap
                    bus={this.props.bus}
                    x={Subject.create(384)}
                    y={Subject.create(384)}
                />

                {/* ND Vector graphics - top layer */}
                <svg class="nd-svg nd-top-layer" viewBox="0 0 768 768">
                    <Airplane bus={this.props.bus} />

                    <Chrono bus={this.props.bus} />

                    <TcasWxrMessages bus={this.props.bus} mode={this.currentPageMode} />
                    <FmMessages bus={this.props.bus} mode={this.currentPageMode} />
                </svg>
            </DisplayUnit>
        );
    }
}

class SpeedIndicator extends DisplayComponent<{ bus: EventBus }> {
    private readonly groundSpeedRef = FSComponent.createRef<SVGTextElement>();

    private readonly trueAirSpeedRef = FSComponent.createRef<SVGTextElement>();

    private readonly groundSpeedRegister = Arinc429RegisterSubject.createEmpty();

    private readonly trueAirSpeedRegister = Arinc429RegisterSubject.createEmpty();

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars>();

        sub.on('groundSpeed').whenChanged().handle((value) => this.groundSpeedRegister.setWord(value));

        this.groundSpeedRegister.sub((data) => {
            const element = this.groundSpeedRef.instance;

            element.textContent = data.isNormalOperation() ? Math.round(data.value).toString() : '';
        }, true);

        sub.on('trueAirSpeed').whenChanged().handle((value) => this.trueAirSpeedRegister.setWord(value));

        this.trueAirSpeedRegister.sub((data) => {
            const element = this.trueAirSpeedRef.instance;

            element.textContent = data.isNormalOperation() ? Math.round(data.value).toString() : '';
        }, true);
    }

    render(): VNode | null {
        return (
            <Layer x={2} y={25}>
                <text x={0} y={0} class="White FontSmallest">GS</text>
                <text ref={this.groundSpeedRef} x={89} y={0} class="Green FontIntermediate EndAlign" />
                <text x={95} y={0} class="White FontSmallest">TAS</text>
                <text ref={this.trueAirSpeedRef} x={201} y={0} class="Green FontIntermediate EndAlign" />
            </Layer>
        );
    }
}

class ApproachIndicator extends DisplayComponent<{ bus: EventBus }> {
    private apprMessage0: number;

    private apprMessage1: number;

    private readonly approachMessageValue = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDSimvars & ClockEvents>();

        sub.on('apprMessage0Captain').whenChanged().handle((value) => {
            this.apprMessage0 = value;
        });

        sub.on('toWptIdent1Captain').whenChanged().handle((value) => {
            this.apprMessage1 = value;
        });

        sub.on('realTime').whenChangedBy(100).handle(() => {
            this.refreshToWptIdent();
        });
    }

    private refreshToWptIdent(): void {
        const ident = SimVarString.unpack([this.apprMessage0, this.apprMessage1]);

        this.approachMessageValue.set(ident);
    }

    render(): VNode | null {
        return (
            <Layer x={384} y={26}>
                <text class="Green FontMedium MiddleAlign">{this.approachMessageValue}</text>
            </Layer>
        );
    }
}

class ToWaypointIndicator extends DisplayComponent<{ bus: EventBus }> {
    private efisMode: EfisNdMode = EfisNdMode.ARC;

    private topWptIdent0: number;

    private topWptIdent1: number;

    private readonly largeDistanceNumberRef = FSComponent.createRef<SVGTextElement>();

    private readonly smallDistanceIntegerPartRef = FSComponent.createRef<SVGTextElement>();

    private readonly smallDistanceDecimalPartRef = FSComponent.createRef<SVGTextElement>();

    private readonly visibleSub = Subject.create(false);

    private readonly bearingContainerVisible = Subject.create(false);

    private readonly bearingRwf = FSComponent.createRef<SVGTextElement>();

    private readonly toWptIdentValue = Subject.create('');

    private readonly distanceSmallContainerVisible = Subject.create(false);

    private readonly distanceLargeContainerVisible = Subject.create(false);

    private readonly distanceNmUnitVisible = Subject.create(false);

    private readonly etaValue = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDSimvars & EcpSimVars & ClockEvents>();

        sub.on('ndMode').whenChanged().handle((value) => {
            this.efisMode = value;

            this.handleVisibility();
        });

        sub.on('toWptIdent0Captain').whenChanged().handle((value) => {
            this.topWptIdent0 = value;
        });

        sub.on('toWptIdent1Captain').whenChanged().handle((value) => {
            this.topWptIdent1 = value;
        });

        sub.on('toWptBearingCaptain').whenChanged().handle((value) => {
            if (value && Number.isFinite(value)) {
                this.bearingContainerVisible.set(true);
                this.bearingRwf.instance.textContent = (Math.round(value)).toString().padStart(3, '0');
            } else {
                this.bearingContainerVisible.set(false);
            }
        });

        sub.on('toWptDistanceCaptain').whenChanged().handle((value) => {
            this.handleToWptDistance(value);
        });

        sub.on('toWptEtaCaptain').whenChanged().handle((value) => {
            this.handleToWptEta(value);
        });

        sub.on('realTime').whenChangedBy(100).handle(() => {
            this.refreshToWptIdent();
        });
    }

    private handleVisibility() {
        const visible = this.efisMode === EfisNdMode.ROSE_NAV || this.efisMode === EfisNdMode.ARC || this.efisMode === EfisNdMode.PLAN;

        this.visibleSub.set(visible);
    }

    private handleToWptDistance(value: number) {
        if (!value) {
            this.distanceSmallContainerVisible.set(false);
            this.distanceLargeContainerVisible.set(false);
            this.distanceNmUnitVisible.set(false);
            return;
        }

        this.distanceNmUnitVisible.set(true);

        if (value > 20) {
            this.distanceSmallContainerVisible.set(false);
            this.distanceLargeContainerVisible.set(true);

            this.largeDistanceNumberRef.instance.textContent = Math.round(value).toString();
        } else {
            const integerPart = Math.trunc(value);
            const decimalPart = (value - integerPart).toString()[2];

            this.distanceSmallContainerVisible.set(true);
            this.distanceLargeContainerVisible.set(false);

            this.smallDistanceIntegerPartRef.instance.textContent = integerPart.toString();
            this.smallDistanceDecimalPartRef.instance.textContent = decimalPart;
        }
    }

    private handleToWptEta(eta: Seconds) {
        if (eta === -1) {
            this.etaValue.set('');
            return;
        }

        const hh = Math.floor(eta / 3600);
        const mm = Math.floor((eta % 3600) / 60);

        const utc = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

        this.etaValue.set(utc);
    }

    private refreshToWptIdent(): void {
        const ident = SimVarString.unpack([this.topWptIdent0, this.topWptIdent1]);

        this.toWptIdentValue.set(ident);
    }

    private readonly visibilityFn = (v) => (v ? 'inherit' : 'hidden');

    render(): VNode | null {
        return (
            <Layer x={690} y={25} visible={this.visibleSub}>
                <text x={-13} y={0} class="White FontIntermediate EndAlign">{this.toWptIdentValue}</text>

                <g visibility={this.bearingContainerVisible.map(this.visibilityFn)}>
                    <text ref={this.bearingRwf} x={54} y={0} class="Green FontIntermediate EndAlign" />
                    <text x={73} y={2} class="Cyan FontIntermediate EndAlign">&deg;</text>
                </g>

                <g visibility={this.distanceLargeContainerVisible.map(this.visibilityFn)}>
                    <text ref={this.largeDistanceNumberRef} x={39} y={32} class="Green FontIntermediate EndAlign" />
                </g>

                <g visibility={this.distanceSmallContainerVisible.map(this.visibilityFn)}>
                    <text ref={this.smallDistanceIntegerPartRef} x={6} y={32} class="Green FontIntermediate EndAlign" />
                    <text x={3} y={32} class="Green FontSmallest StartAlign">.</text>
                    <text ref={this.smallDistanceDecimalPartRef} x={20} y={32} class="Green FontSmallest StartAlign" />
                </g>

                <text x={72} y={32} class="Cyan FontSmallest EndAlign" visibility={this.distanceNmUnitVisible.map(this.visibilityFn)}>
                    NM
                </text>

                <text x={72} y={66} class="Green FontIntermediate EndAlign">{this.etaValue}</text>
            </Layer>
        );
    }
}
