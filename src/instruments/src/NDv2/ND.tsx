// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, DisplayComponent, EventBus, FSComponent, MappedSubject, Subject, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { SimVarString } from '@shared/simvar';
import { EfisNdMode, EfisNdRangeValue, rangeSettings } from '@shared/NavigationDisplay';
import { TcasMode } from '@tcas/lib/TcasConstants';
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

const PAGE_GENERATION_BASE_DELAY = 500;
const PAGE_GENERATION_RANDOM_DELAY = 70;

export interface NDProps {
    bus: EventBus,
}

export class NDComponent extends DisplayComponent<NDProps> {
    private readonly isUsingTrackUpMode = Subject.create(true);

    private readonly magneticHeadingWord = Subject.create(Arinc429Word.empty());

    private readonly trueHeadingWord = Subject.create(Arinc429Word.empty());

    private readonly magneticTrackWord = Subject.create(Arinc429Word.empty());

    private readonly trueTrackWord = Subject.create(Arinc429Word.empty());

    private readonly mapRotation = Subject.create(0);

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

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.currentPageInstance = this.arcPage.instance;

        this.currentPageInstance.isVisible.set(true);
        this.currentPageInstance.onShow();

        const sub = this.props.bus.getSubscriber<NDSimvars & NDControlEvents & EcpSimVars & ClockEvents>();

        sub.on('heading').whenChangedBy(0.01).handle((value) => {
            this.magneticHeadingWord.set(new Arinc429Word(value));
            this.handleMapRotation();
        });

        sub.on('trueHeading').whenChangedBy(0.01).handle((value) => {
            this.trueHeadingWord.set(new Arinc429Word(value));
            this.handleMapRotation();
        });

        sub.on('groundTrack').whenChangedBy(0.01).handle((value) => {
            this.magneticTrackWord.set(new Arinc429Word(value));
            this.handleMapRotation();
        });

        sub.on('trueGroundTrack').whenChangedBy(0.01).handle((value) => {
            this.trueTrackWord.set(new Arinc429Word(value));
            this.handleMapRotation();
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

    private handleMapRotation() {
        const usingTrackUpMode = this.isUsingTrackUpMode.get();

        if (usingTrackUpMode) {
            const trueTrackWord = this.trueTrackWord.get();

            if (trueTrackWord.isNormalOperation()) {
                this.mapRotation.set(trueTrackWord.value);
            } else {
                this.mapRotation.set(0);
            }
        } else {
            const trueHeadingWord = this.trueHeadingWord.get();

            if (trueHeadingWord.isNormalOperation()) {
                this.mapRotation.set(this.trueHeadingWord.get().value);
            } else {
                this.mapRotation.set(0);
            }
        }
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
            <DisplayUnit bus={this.props.bus}>
                {/* ND Vector graphics - bottom layer */}
                <svg class="nd-svg" viewBox="0 0 768 768">
                    <WindIndicator bus={this.props.bus} />
                    <SpeedIndicator bus={this.props.bus} />
                    <ToWaypointIndicator bus={this.props.bus} />
                    <ApproachIndicator bus={this.props.bus} />

                    <Flag shown={Subject.create(false)} x={384} y={54} class="Cyan FontSmallest">TRUE</Flag>
                    <Flag shown={Subject.create(false)} x={350} y={84} class="Amber FontSmall">
                        DISPLAY SYSTEM VERSION
                        INCONSISTENCY
                    </Flag>
                    <Flag shown={Subject.create(false)} x={384} y={170} class="Amber FontMedium">CHECK HDG</Flag>

                    <Flag shown={this.rangeChangeInProgress} x={384} y={320} class="Green FontIntermediate">
                        RANGE
                        CHANGE
                    </Flag>
                    <Flag
                        shown={MappedSubject.create(([rangeChange, pageChange]) => !rangeChange && pageChange, this.rangeChangeInProgress, this.pageChangeInProgress)}
                        x={384}
                        y={320}
                        class="Green FontIntermediate"
                    >
                        MODE CHANGE
                    </Flag>

                    <RoseLSPage
                        bus={this.props.bus}
                        ref={this.roseLSPage}
                        heading={this.magneticHeadingWord}
                        tcasMode={Subject.create(TcasMode.STBY)}
                        rangeValue={this.mapRangeRadius as Subject<EfisNdRangeValue>}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                    />
                    <RoseVorPage
                        bus={this.props.bus}
                        ref={this.roseVorPage}
                        heading={this.magneticHeadingWord}
                        tcasMode={Subject.create(TcasMode.STBY)}
                        rangeValue={this.mapRangeRadius as Subject<EfisNdRangeValue>}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                        index={1} // FIXME
                    />
                    <RoseNavPage
                        bus={this.props.bus}
                        ref={this.roseNavPage}
                        heading={this.magneticHeadingWord}
                        tcasMode={Subject.create(TcasMode.STBY)}
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

                    <FmMessages bus={this.props.bus} />

                    <RadioNavInfo bus={this.props.bus} index={1} />
                    <RadioNavInfo bus={this.props.bus} index={2} />
                </svg>

                {/* ND Raster map - middle layer */}
                <CanvasMap
                    bus={this.props.bus}
                    x={Subject.create(384)}
                    y={this.currentPageMode.map((mode) => {
                        if (mode === EfisNdMode.ARC) {
                            return 626;
                        }

                        return 384;
                    })}
                    width={1240}
                    height={1240}
                />

                {/* ND Vector graphics - top layer */}
                <svg class="nd-svg nd-top-layer" viewBox="0 0 768 768">
                    <Airplane bus={this.props.bus} />
                </svg>
            </DisplayUnit>
        );
    }
}

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

class WindIndicator extends DisplayComponent<{ bus: EventBus }> {
    private readonly windDirectionWord = Subject.create(Arinc429Word.empty());

    private readonly windVelocityWord = Subject.create(Arinc429Word.empty());

    private readonly planeHeadingWord = Subject.create(Arinc429Word.empty());

    private readonly windDirectionText = Subject.create('');

    private readonly windVelocityText = Subject.create('');

    private readonly windArrowVisible = Subject.create(false);

    private readonly windArrowRotation = Subject.create(0);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars>();

        sub.on('windDirection').whenChanged().atFrequency(2).handle((value) => {
            const word = new Arinc429Word(value);

            this.windDirectionWord.set(word);

            this.handleWindDirection();
            this.handleWindArrow();
        });

        sub.on('windVelocity').whenChanged().atFrequency(2).handle((value) => {
            const word = new Arinc429Word(value);

            this.windVelocityWord.set(word);

            this.handleWindVelocity();
        });

        sub.on('heading').whenChanged().atFrequency(2).handle((value) => {
            const word = new Arinc429Word(value);

            this.planeHeadingWord.set(word);

            this.handleWindArrow();
        });
    }

    private handleWindDirection() {
        const direction = this.windDirectionWord.get();
        const velocity = this.windVelocityWord.get();

        if (direction.isNormalOperation()) {
            if (velocity.value < Number.EPSILON) {
                this.windDirectionText.set('---');
            } else {
                const text = Math.round(direction.value).toString().padStart(3, '0');

                this.windDirectionText.set(text);
            }
        } else {
            this.windDirectionText.set('');
        }
    }

    private handleWindVelocity() {
        const velocity = this.windVelocityWord.get();

        if (velocity.isNormalOperation()) {
            if (velocity.value < Number.EPSILON) {
                this.windVelocityText.set('---');
            } else {
                const text = Math.round(velocity.value).toString();

                this.windVelocityText.set(text);
            }
        } else {
            this.windVelocityText.set('');
        }
    }

    private handleWindArrow() {
        const direction = this.windDirectionWord.get();
        const velocity = this.windVelocityWord.get();
        const heading = this.planeHeadingWord.get();

        if (!direction.isNormalOperation() || !velocity.isNormalOperation() || !heading.isNormalOperation()) {
            this.windArrowVisible.set(false);
            return;
        }

        const directionValue = direction.value;
        const velocityValue = velocity.value;
        const headingValue = heading.value;

        if (velocityValue > 2) {
            this.windArrowVisible.set(true);

            this.windArrowRotation.set(mod(Math.round(directionValue) - Math.round(headingValue) + 180, 360));
        } else {
            this.windArrowVisible.set(false);
        }
    }

    render(): VNode | null {
        return (
            <Layer x={23} y={58}>
                <text x={25} y={0} class="Green FontSmall EndAlign">
                    {this.windDirectionText}
                </text>
                <text x={31} y={-1} class="White FontSmallest">/</text>
                <text x={50} y={0} class="Green FontSmall">
                    {this.windVelocityText}
                </text>
                <Layer x={3} y={10}>
                    <path
                        class="Green"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        d="M 0 30 v -30 m -6.5 12 l 6.5 -12 l 6.5 12"
                        transform={this.windArrowRotation.map((rotation) => `rotate(${rotation} 0 15)`)}
                        visibility={this.windArrowVisible.map((visible) => (visible ? 'visible' : 'hidden'))}
                    />
                </Layer>
            </Layer>
        );
    }
}

class SpeedIndicator extends DisplayComponent<{ bus: EventBus }> {
    private readonly groundSpeedRef = FSComponent.createRef<SVGTextElement>();

    private readonly trueAirSpeedRef = FSComponent.createRef<SVGTextElement>();

    private readonly groundSpeedVisible = Subject.create(false)

    private readonly trueAirSpeedVisible = Subject.create(false);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars>();

        sub.on('groundSpeed').whenChangedBy(0.5).handle((value) => {
            const decodedValue = new Arinc429Word(value);

            const element = this.groundSpeedRef.instance;

            if (decodedValue.isNormalOperation()) {
                this.groundSpeedVisible.set(true);
                element.textContent = Math.round(decodedValue.value).toString();
            } else {
                this.groundSpeedVisible.set(false);
            }
        });

        sub.on('speed').whenChangedBy(0.5).handle((value) => {
            const decodedValue = new Arinc429Word(value);

            const element = this.trueAirSpeedRef.instance;

            if (decodedValue.isNormalOperation()) {
                this.trueAirSpeedVisible.set(true);
                element.textContent = Math.round(decodedValue.value).toString();
            } else {
                this.trueAirSpeedVisible.set(false);
            }
        });
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
    private topWptIdent0: number;

    private topWptIdent1: number;

    private readonly largeDistanceNumberRef = FSComponent.createRef<SVGTextElement>();

    private readonly smallDistanceIntegerPartRef = FSComponent.createRef<SVGTextElement>();

    private readonly smallDistanceDecimalPartRef = FSComponent.createRef<SVGTextElement>();

    private readonly bearingContainerVisible = Subject.create(false);

    private readonly bearingRwf = FSComponent.createRef<SVGTextElement>();

    private readonly toWptIdentValue = Subject.create('');

    private readonly distanceSmallContainerVisible = Subject.create(false);

    private readonly distanceLargeContainerVisible = Subject.create(false);

    private readonly distanceNmUnitVisible = Subject.create(false);

    private readonly etaValue = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDSimvars & ClockEvents>();

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

    private readonly visibilityFn = (v) => (v ? 'visible' : 'hidden');

    render(): VNode | null {
        return (
            <Layer x={690} y={25}>
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
