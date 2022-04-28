// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FSComponent, DisplayComponent, EventBus, VNode, ClockEvents, Subject } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { SimVarString } from '@shared/simvar';
import { rangeSettings } from '@shared/NavigationDisplay';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { AdirsSimVars } from '../MsfsAvionicsCommon/SimVarTypes';
import { NDSimvars } from './NDSimvarPublisher';
import { ArcModePage } from './pages/arc';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { FmMessages } from './FmMessages';
import { Flag } from './shared/Flag';
import { CanvasMap } from './shared/CanvasMap';
import { EcpSimVars } from '../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';

export interface NDProps {
    bus: EventBus,
}

export class NDComponent extends DisplayComponent<NDProps> {
    private readonly isUsingTrackUpMode = Subject.create(true);

    private readonly lat = Subject.create(0);

    private readonly lon = Subject.create(0);

    private readonly magneticHeadingWord = Subject.create(Arinc429Word.empty());

    private readonly trueHeading = Subject.create(0);

    private readonly headingWord = Subject.create(Arinc429Word.empty());

    private readonly trackWord = Subject.create(Arinc429Word.empty());

    private readonly magVar = Subject.create(0);

    private readonly mapRotation = Subject.create(0);

    private readonly mapRangeRadius = Subject.create(0);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDSimvars & EcpSimVars & ClockEvents>();

        sub.on('heading').whenChanged().handle((value) => {
            this.magneticHeadingWord.set(new Arinc429Word(value));
            console.log(`${this.magneticHeadingWord.get().value}bruh`);
            this.handleMapRotation();
        });

        // TODO use ADIRS for this
        sub.on('trueHeading').whenChanged().handle((value) => {
            this.trueHeading.set(value);
            this.handleMapRotation();
        });

        sub.on('groundTrack').whenChanged().handle((value) => {
            this.trackWord.set(new Arinc429Word(value));
            this.handleMapRotation();
        });

        sub.on('ndRangeSetting').whenChanged().handle((value) => {
            this.mapRangeRadius.set(rangeSettings[value]);
        });
    }

    private handleMapRotation() {
        const usingTrackUpMode = this.isUsingTrackUpMode.get();

        if (usingTrackUpMode) {
            const trackWord = this.trackWord.get();

            if (trackWord.isNormalOperation()) {
                const magVar = this.trueHeading.get() - this.magneticHeadingWord.get().value;

                this.mapRotation.set(trackWord.value + magVar);
            } else {
                this.mapRotation.set(0);
            }
        } else {
            const headingWord = this.headingWord.get();

            if (headingWord.isNormalOperation()) {
                this.mapRotation.set(this.trueHeading.get());
            } else {
                this.mapRotation.set(0);
            }
        }
    }

    render(): VNode | null {
        return (
            <DisplayUnit bus={this.props.bus}>
                <svg class="pfd-svg" viewBox="0 0 768 768">
                    <WindIndicator bus={this.props.bus} />
                    <SpeedIndicator bus={this.props.bus} />
                    <ToWaypointIndicator bus={this.props.bus} />
                    <ApproachIndicator bus={this.props.bus} />

                    <Flag shown={Subject.create(false)} x={384} y={54} class="Cyan FontSmallest">TRUE</Flag>
                    <Flag shown={Subject.create(false)} x={350} y={84} class="Amber FontSmall">DISPLAY SYSTEM VERSION INCONSISTENCY</Flag>
                    <Flag shown={Subject.create(false)} x={384} y={170} class="Amber FontMedium">CHECK HDG</Flag>

                    <ArcModePage
                        bus={this.props.bus}
                        isUsingTrackUpMode={this.isUsingTrackUpMode}
                    />

                    <FmMessages bus={this.props.bus} />
                </svg>

                <CanvasMap
                    bus={this.props.bus}
                    x={384}
                    y={626}
                    width={1240}
                    height={1240}
                    mapRotation={this.mapRotation}
                    mapRangeRadius={this.mapRangeRadius}
                />
            </DisplayUnit>
        );
    }
}

class WindIndicator extends DisplayComponent<{ bus: EventBus }> {
    render(): VNode | null {
        return (
            <Layer x={23} y={58}>
                <text x={25} y={0} class="Green FontSmall EndAlign">
                    356
                </text>
                <text x={31} y={-1} class="White FontSmallest">/</text>
                <text x={50} y={0} class="Green FontSmall">
                    11
                </text>
                <Layer x={3} y={10}>
                    <path
                        class="Green"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        d="M 0 30 v -30 m -6.5 12 l 6.5 -12 l 6.5 12"
                        transform={`rotate(${270} 0 15)`}
                        visibility="visible"
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
                    <text ref={this.largeDistanceNumberRef} x={39} y={32} class="Green FontIntermediate EndAlign">50</text>
                </g>

                <g visibility={this.distanceSmallContainerVisible.map(this.visibilityFn)}>
                    <text ref={this.smallDistanceIntegerPartRef} x={6} y={32} class="Green FontIntermediate EndAlign">1</text>
                    <text x={3} y={32} class="Green FontSmallest StartAlign">.</text>
                    <text ref={this.smallDistanceDecimalPartRef} x={20} y={32} class="Green FontSmallest StartAlign">8</text>
                </g>

                <text x={72} y={32} class="Cyan FontSmallest EndAlign" visibility={this.distanceNmUnitVisible.map(this.visibilityFn)}>
                    NM
                </text>

                <text x={72} y={66} class="Green FontIntermediate EndAlign">17:52</text>
            </Layer>
        );
    }
}
