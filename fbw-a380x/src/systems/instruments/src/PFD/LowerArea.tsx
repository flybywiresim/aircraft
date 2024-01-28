import { Arinc429Values, ArincValueProvider } from 'instruments/src/PFD/shared/ArincValueProvider';
import { PFDSimvars } from 'instruments/src/PFD/shared/PFDSimvarPublisher';
import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

export class LowerArea extends DisplayComponent<{ bus: EventBus }> {
    render(): VNode {
        return (
            <g>
                <path class="ThickStroke White" d="M 2.1 157.7 h 154.4" />
                <path class="ThickStroke White" d="M 67 158 v 51.8" />

                <Memos />
                <Limitations />
                <FlapsIndicator bus={this.props.bus} />
            </g>
        );
    }
}

const circlePath = (r: number, cx: number, cy: number) => `M ${cx} ${cy} m ${r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0`;

class FlapsIndicator extends DisplayComponent<{ bus: EventBus }> {
    private targetClass = Subject.create('');

    private targetText = Subject.create('');

    private targetVisible = Subject.create('hidden');

    private flapSlatIndexClass = Subject.create('');

    private targetBoxVisible = Subject.create('hidden');

    private slatsClass = Subject.create('');

    private slatsLineClass = Subject.create('');

    private slatsTargetPos = Subject.create(0);

    private flapsTargetPos = Subject.create(0);

    private slatsPath = Subject.create('');

    private slatsLinePath = Subject.create('');

    private flapsLinePath = Subject.create('');

    private flapsPath = Subject.create('');

    private alphaLockEngaged = Subject.create(false);

    private configClean: boolean = false;

    private config1: boolean = false;

    private config2: boolean = false;

    private config3: boolean = false;

    private configFull: boolean = false;

    private flaps1AutoRetract: boolean = false;

    private slatsOut: boolean = false;

    private flapsOut: boolean = false;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents & Arinc429Values>();

        sub.on('slatsFlapsStatus').whenChanged().handle((s) => {
            this.configClean = s.getBitValue(17);
            this.config1 = s.getBitValue(18);
            this.config2 = s.getBitValue(19);
            this.config3 = s.getBitValue(20);
            this.configFull = s.getBitValue(21);
            this.flaps1AutoRetract = s.getBitValue(26);

            const alphaLockEngaged = s.getBitValue(24);
            this.alphaLockEngaged.set(alphaLockEngaged);

            if (this.configClean) {
                this.targetText.set('0');
            } else if (this.config1 && this.flaps1AutoRetract) {
                this.targetText.set('1');
            } else if (this.config1) {
                this.targetText.set('1+F');
            } else if (this.config2) {
                this.targetText.set('2');
            } else if (this.config3) {
                this.targetText.set('3');
            } else if (this.configFull) {
                this.targetText.set('FULL');
            } else {
                this.targetText.set('');
            }

            if (alphaLockEngaged) {
                this.slatsClass.set('Slats GreenPulseNoFill');
                this.slatsLineClass.set('GreenLine GreenPulse');
            } else {
                this.slatsClass.set('Slats');
                this.slatsLineClass.set('GreenPulse');
            }
        });

        sub.on('slatsPosition').whenChanged().handle((s) => {
            const slats = s.valueOr(0);

            this.slatsOut = slats > 6.1;

            const xFactor = -0.43;
            const yFactor = 0.09;
            const synchroFactor = 0.081;

            let synchroOffset = 0;
            let positionFactor = 0;
            let positionOffset = 0;
            if (slats >= 0 && slats < 222.8) {
                synchroOffset = 0;
                positionFactor = 0.43;
                positionOffset = 0;
            } else if (slats >= 222.8 && slats < 272.8) {
                synchroOffset = 18;
                positionFactor = 1.8;
                positionOffset = 7.71;
            } else if (slats >= 272.8 && slats < 346) {
                synchroOffset = 22;
                positionFactor = 1.44;
                positionOffset = 14.92;
            }

            const value = (slats * synchroFactor - synchroOffset) * positionFactor + positionOffset;
            const x = xFactor * value + 15.2;
            const y = yFactor * value + 195.3;
            this.slatsPath.set(`M ${x},${y} a 0.2 0.2 0 0 1 -1.3 -1.9 l 1.4 -0.7 z`);
            this.slatsLinePath.set(`M 15.2 195.4 L ${x},${y}`);

            if (this.configClean && slats > 6.1) {
                this.slatsTargetPos.set(0);
            } else if ((this.config1 || this.config2) && (slats < 209.9 || slats > 234.6)) {
                this.slatsTargetPos.set(1);
            } else if ((this.config3 || this.configFull) && (slats < 327.2 || slats > 339.5)) {
                this.slatsTargetPos.set(2);
            } else {
                this.slatsTargetPos.set(null);
            }
        });

        sub.on('flapsPosition').whenChanged().handle((s) => {
            const flaps = s.valueOr(0);

            this.flapsOut = flaps > 73.1;

            const xFactor = 0.87;
            const yFactor = 0.365;
            const synchroFactor = 0.22;
            const synchroConstant = 15.88;

            let synchroOffset = 0;
            let positionFactor = 0;
            let positionOffset = 0;
            if (flaps >= 0 && flaps < 120.5) {
                synchroOffset = 0;
                positionFactor = 0.97;
                positionOffset = 0;
            } else if (flaps >= 120.5 && flaps < 145.5) {
                synchroOffset = 10.63;
                positionFactor = 1.4;
                positionOffset = 10.34;
            } else if (flaps >= 145.5 && flaps < 168.3) {
                synchroOffset = 16.3;
                positionFactor = 1.62;
                positionOffset = 18.27;
            } else if (flaps >= 168.3 && flaps < 355) {
                synchroOffset = 21.19;
                positionFactor = 0.43;
                positionOffset = 26.21;
            }

            const value = Math.max((flaps * synchroFactor - synchroConstant - synchroOffset) * positionFactor + positionOffset, 0);
            const x = xFactor * value + 31.8;
            const y = yFactor * value + 193.1;
            this.flapsPath.set(`M${x},${y} v 2.6 h 3.9 z`);
            this.flapsLinePath.set(`M 31.8 193.1 L ${x},${y}`);

            if ((this.configClean || this.flaps1AutoRetract) && flaps > 73.1) {
                this.flapsTargetPos.set(0);
            } else if (this.config1 && !this.flaps1AutoRetract && (flaps < 113.1 || flaps > 122.2)) {
                this.flapsTargetPos.set(1);
            } else if (this.config2 && (flaps < 140.4 || flaps > 149.5)) {
                this.flapsTargetPos.set(2);
            } else if (this.config3 && (flaps < 163.1 || flaps > 172.2)) {
                this.flapsTargetPos.set(3);
            } else if (this.configFull && (flaps < 246.8 || flaps > 257.2)) {
                this.flapsTargetPos.set(4);
            } else {
                this.flapsTargetPos.set(null);
            }
        });

        sub.on('realTime').handle((_t) => {
            const inMotion = this.flapsTargetPos.get() !== null || this.slatsTargetPos.get() !== null;
            this.targetVisible.set((this.slatsOut || this.flapsOut || !this.configClean) ? 'visible' : 'hidden');
            this.flapSlatIndexClass.set((this.slatsOut || this.flapsOut || !this.configClean) ? 'NormalStroke Green CornerRound' : 'NormalStroke White CornerRound');
            this.targetClass.set(inMotion ? 'FontMedium Cyan MiddleAlign' : 'FontMedium Green MiddleAlign');
            this.targetBoxVisible.set(inMotion ? 'visible' : 'hidden');
        });
    }

    render(): VNode {
        return (
            <g>
                <g visibility={this.targetVisible}>
                    <path d={circlePath(0.8, 14.1, 194.5)} class="NormalStroke Stroke Fill Cyan" visibility={this.slatsTargetPos.map((i) => (i == 0 ? 'visible' : 'hidden'))} />
                    <path d={circlePath(0.8, 9.6, 195.4)} class={this.slatsTargetPos.map((i) => (i == 1 ? 'NormalStroke Stroke Fill Cyan' : 'NormalStroke White'))} />
                    <path d={circlePath(0.8, 5, 196.4)} class={this.slatsTargetPos.map((i) => (i == 2 ? 'NormalStroke Stroke Fill Cyan' : 'NormalStroke White'))} />

                    <path d="M 32.3 193.7 v 1.7 h 1.9 z" class="Fill Stroke NormalStroke Cyan CornerRound" visibility={this.flapsTargetPos.map((i) => (i == 0 ? 'visible' : 'hidden'))} />
                    <path d="M 39.9 196.8 v 1.7 h 1.9 z" class={this.flapsTargetPos.map((i) => (i == 1 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound'))} />
                    <path d="M 47.3 199.9 v 1.7 h 1.9 z" class={this.flapsTargetPos.map((i) => (i == 2 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound'))} />
                    <path d="M 54.7 203 v 1.7 h 1.9 z" class={this.flapsTargetPos.map((i) => (i == 3 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound'))} />
                    <path d="M 62.1 206.1 v 1.7 h 1.9 z" class={this.flapsTargetPos.map((i) => (i == 4 ? 'Fill Stroke NormalStroke Cyan CornerRound' : 'Fill Stroke NormalStroke White CornerRound'))} />

                    <text x={23.7} y={202.3} class={this.targetClass}>{this.targetText}</text>
                    <path visibility={this.targetBoxVisible} class="NormalStroke Cyan CornerRound" d="M 15.4 196.8 v 6.2 h 16.2 v -6.2 z" />
                    <text x={3.8} y={191.1} class="FontSmall White">S</text>
                    <text x={47.2} y={210.8} class="FontSmall White">F</text>
                </g>
                <text class="Green FontSmallest" x={0} y={190} visibility={this.alphaLockEngaged.map((v) => (v ? 'visible' : 'hidden'))}>A LOCK</text>

                <path class={this.flapSlatIndexClass} d={this.slatsPath} />
                <path class={this.flapSlatIndexClass} d={this.slatsLinePath} />

                <path class={this.flapSlatIndexClass} d={this.flapsPath} />
                <path class={this.flapSlatIndexClass} d={this.flapsLinePath} />

                <path class="NormalStroke White CornerRound" d="M 15.2 195.5 h 12.4 l 4.1 0.2 l -0.1 -2.6 l -4 -0.9 l -2 -0.3 l -3 -0.1 l -3.5 0.1 l -3.8 0.8 z" />
            </g>
        );
    }
}

// THS and gear indications waiting for systems implementations
class GearIndicator extends DisplayComponent<{ bus: EventBus }> {
    render(): VNode {
        return (
            <g>
                <path class="NormalStroke Green CornerRound" d="M 18.4 204.3 h 10 l -5 5.5 z M 20.9 204.3 v 2.6 M 23.4 204.3 v 5.5 M 25.9 204.3 v 2.6" />
            </g>
        );
    }
}

class PitchTrimIndicator extends DisplayComponent<{ bus: EventBus }> {
    render(): VNode {
        return (
            <>
                <g>
                    <text x={68.7} y={186.5} class="FontSmallest White">T.O THS FOR</text>
                    <text x={101} y={186.5} class="FontIntermediate White">42.6</text>
                    <text x={115} y={186.5} class="FontSmallest Cyan">%</text>
                    <image xlinkHref="/Images/TRIM_INDICATOR.png" x={106} y={158.6} width={49} height={52} />
                </g>
            </>
        );
    }
}

class Limitations extends DisplayComponent<{}> {
    render(): VNode {
        return (
            <g>
                <text x={76} y={184} class="FontIntermediate Amber">LIMITATIONS NOT AVAIL</text>
            </g>
        );
    }
}

class Memos extends DisplayComponent<{}> {
    render(): VNode {
        return (
            <g>
                <text x={12} y={170} class="FontIntermediate Amber">MEMO NOT AVAIL</text>
            </g>
        );
    }
}
