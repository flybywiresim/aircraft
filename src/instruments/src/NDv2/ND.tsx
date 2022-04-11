// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FSComponent, DisplayComponent, EventBus, VNode, ClockEvents } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { SimVarString } from '@shared/simvar';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { AdirsSimVars } from '../MsfsAvionicsCommon/SimVarTypes';
import { NDSimvars } from './NDSimvarPublisher';
import { ArcModeOverlay } from './pages/Arc';

export interface NDProps {
    bus: EventBus,
}

export class NDComponent extends DisplayComponent<NDProps> {
    render(): VNode | null {
        return (
            <DisplayUnit bus={this.props.bus}>
                <svg class="pfd-svg" viewBox="0 0 768 768">
                    <WindIndicator bus={this.props.bus} />
                    <SpeedIndicator bus={this.props.bus} />
                    <ApproachIndicator bus={this.props.bus} />
                    <ToWaypointIndicator bus={this.props.bus} />

                    <ArcModeOverlay bus={this.props.bus} />
                </svg>
            </DisplayUnit>
        );
    }
}

class Layer extends DisplayComponent<{ x: number, y: number }> {
    render(): VNode | null {
        const { x, y } = this.props;

        return (
            <g transform={`translate(${x}, ${y})`}>
                {this.props.children}
            </g>
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

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars>();

        sub.on('groundSpeed').whenChanged().handle((value) => {
            const decodedValue = new Arinc429Word(value);

            const element = this.groundSpeedRef.instance;

            if (decodedValue.isNormalOperation()) {
                element.style.visibility = 'visible';
                element.textContent = Math.round(decodedValue.value).toString();
            } else {
                element.style.visibility = 'hidden';
            }
        });

        sub.on('speed').whenChanged().handle((value) => {
            const decodedValue = new Arinc429Word(value);

            const element = this.trueAirSpeedRef.instance;

            if (decodedValue.isNormalOperation()) {
                element.style.visibility = 'visible';
                element.textContent = Math.round(decodedValue.value).toString();
            } else {
                element.style.visibility = 'hidden';
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
    render(): VNode | null {
        return (
            <Layer x={384} y={26}>
                <text class="Green FontMedium MiddleAlign">ILS18-Y</text>
            </Layer>
        );
    }
}

class ToWaypointIndicator extends DisplayComponent<{ bus: EventBus }> {
    private topWptIdent0: number;

    private topWptIdent1: number;

    private readonly identRef = FSComponent.createRef<SVGTextElement>();

    private readonly bearingContainerRef = FSComponent.createRef<SVGGElement>();

    private readonly bearingRwf = FSComponent.createRef<SVGTextElement>();

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
                this.bearingContainerRef.instance.style.visibility = 'visible';
                this.bearingRwf.instance.textContent = (Math.round(value)).toString().padStart(3, '0');
            } else {
                this.bearingContainerRef.instance.style.visibility = 'hidden';
            }
        });

        sub.on('realTime').whenChangedBy(100).handle(() => {
            this.refreshToWptIdent();
        });
    }

    private refreshToWptIdent(): void {
        const ident = SimVarString.unpack([this.topWptIdent0, this.topWptIdent1]);

        this.identRef.instance.textContent = ident;
    }

    render(): VNode | null {
        return (
            <Layer x={690} y={25}>
                <text ref={this.identRef} x={-13} y={0} class="White FontIntermediate EndAlign" />

                <g ref={this.bearingContainerRef}>
                    <text ref={this.bearingRwf} x={54} y={0} class="Green FontIntermediate EndAlign" />
                    <text x={73} y={2} class="Cyan FontIntermediate EndAlign">&deg;</text>
                </g>

                <text x={6} y={32} class="Green FontIntermediate EndAlign">1</text>
                <text x={3} y={32} class="Green FontSmallest StartAlign">.</text>
                <text x={20} y={32} class="Green FontSmallest StartAlign">8</text>

                <text x={72} y={32} class="Cyan FontSmallest EndAlign">NM</text>

                <text x={72} y={66} class="Green FontIntermediate EndAlign">17:52</text>
            </Layer>
        );
    }
}
