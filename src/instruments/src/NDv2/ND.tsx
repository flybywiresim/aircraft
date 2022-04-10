// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FSComponent, DisplayComponent, EventBus, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { AdirsSimVars } from '../MsfsAvionicsCommon/SimVarTypes';

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
            <Layer x={23} y={57}>
                <text x={25} y={0} class="Green FontSmall EndAlign">
                    356
                </text>
                <text x={31} y={-1} class="White FontSmallest">/</text>
                <text x={50} y={0} class="Green FontSmall">
                    11
                </text>
                <Layer x={5} y={8}>
                    <path
                        class="Green"
                        strokeWidth={2.25}
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
