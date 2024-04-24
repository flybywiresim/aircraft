import { FSComponent, DisplayComponent, VNode, ComponentProps, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus } from 'instruments/src/MsfsAvionicsCommon/ArincEventBus';
import { BATSimvars } from './BATSimvarPublisher';

interface BATProps extends ComponentProps {
    bus: ArincEventBus;
}

export class BATComponent extends DisplayComponent<BATProps> {
    public render(): VNode {
        return (
            <svg className="bat-svg" viewBox="0 0 200 100">
                <BatDisplay bus={this.props.bus} batteryNumber={1} x="184" y="45" />
                <BatDisplay bus={this.props.bus} batteryNumber={2} x="184" y="95" />
            </svg>
        );
    }
}

interface BatDisplayProp extends ComponentProps {
    bus: ArincEventBus
    batteryNumber: number
    x: string
    y: string
}

class BatDisplay extends DisplayComponent<BatDisplayProp> {
    private isLtsTest: boolean = false

    private dc2IsPowered: boolean = false

    private voltage: number = 88.8

    private displayValue = Subject.create('')

    public onAfterRender(node: VNode): void {
        const batteryMap = {
            1: 'batVoltage1',
            2: 'batVoltage2',
        };
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<BATSimvars>();
        // sub.on(this.props.batteryNumber === 1 ? 'batVoltage1' : 'batVoltage2').withPrecision(1).handle((value) => {
        sub.on(batteryMap[this.props.batteryNumber]).withPrecision(1).handle((value) => {
            this.voltage = value;
            this.updateDisplayValue();
        });
        sub.on('annSwitchState').whenChanged().handle((value) => {
            this.isLtsTest = value === 0;
            this.updateDisplayValue();
        });
        sub.on('dc2IsPowered').whenChanged().handle((value) => {
            this.dc2IsPowered = value;
            this.updateDisplayValue();
        });
    }

    private updateDisplayValue():void {
        const toDisplay: string = Number(this.getDisplayValue()).toFixed(1);
        this.displayValue.set(`${toDisplay}V`);
    }

    private getDisplayValue(): number {
        if (this.isLtsTest && this.dc2IsPowered) return 88.8;
        return this.voltage;
    }

    public render(): VNode {
        return (
            <text x={this.props.x} y={this.props.y}>
                {this.displayValue}
            </text>
        );
    }
}
