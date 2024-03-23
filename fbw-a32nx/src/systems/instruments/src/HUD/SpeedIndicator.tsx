// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, NodeReference, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';

import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { VerticalTape } from './VerticalTape';
import { SimplaneValues } from './shared/SimplaneValueProvider';
import { Arinc429Values } from './shared/ArincValueProvider';

const ValueSpacing = 10;
const DistanceSpacing = 35.12;
const DisplayRange = 42;

class V1BugElement extends DisplayComponent<{ bus: ArincEventBus }> {
    private offsetSub = Subject.create('translate3d(0px, 0px, 0px)');

    private visibilitySub = Subject.create('hidden');

    private flightPhase = 0;

    private v1Speed = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getSubscriber<HUDSimvars>();

        pf.on('v1').whenChanged().handle((g) => {
            this.v1Speed = g;
            this.getV1Offset();
            this.getV1Visibility();
        });

        pf.on('fwcFlightPhase').whenChanged().handle((g) => {
            this.flightPhase = g;
            this.getV1Visibility();
        });
    }

    private getV1Offset() {
        const offset = -this.v1Speed * DistanceSpacing / ValueSpacing;
        this.offsetSub.set(`transform:translate3d(0px, ${offset}px, 0px)`);
    }

    private getV1Visibility() {
        if (this.flightPhase <= 4 && this.v1Speed !== 0) {
            this.visibilitySub.set('visible');
        } else {
            this.visibilitySub.set('hidden');
        }
    }

    render(): VNode {
        return (
            <g id="V1BugGroup" style={this.offsetSub} visibility={this.visibilitySub}>
                <path class="ThickStroke Green" d="m131 384h15" />
                <text class="FontLarge MiddleAlign Green" x="162" y="372.9">1</text>
            </g>
        );
    }
}

class VRBugElement extends DisplayComponent<{bus: ArincEventBus}> {
    private offsetSub = Subject.create('');

    private visibilitySub = Subject.create('hidden');

    private flightPhase = 0;

    private vrSpeed = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getSubscriber<HUDSimvars>();

        pf.on('vr').whenChanged().handle((g) => {
            this.vrSpeed = g;
            this.getVrOffset();
            this.getVrVisibility();
        });

        pf.on('fwcFlightPhase').whenChanged().handle((g) => {
            this.flightPhase = g;
            this.getVrVisibility();
        });
    }

    private getVrOffset() {
        const offset = -this.vrSpeed * DistanceSpacing / ValueSpacing;
        this.offsetSub.set(`translate(0 ${offset})`);
    }

    private getVrVisibility() {
        if (this.flightPhase <= 4 && this.vrSpeed !== 0) {
            this.visibilitySub.set('visible');
        } else {
            this.visibilitySub.set('hidden');
        }
    }

    render(): VNode {
        return (
            <circle
                visibility={this.visibilitySub}
                transform={this.offsetSub}
                id="RotateSpeedMarker"
                class="NormalStroke Green"
                cx="137"
                cy="384"
                r="5.5"
            />
        );
    }
}

interface AirspeedIndicatorProps {
    airspeedAcc?: number;
    FWCFlightPhase?: number;
    altitude?: Arinc429WordData;
    VLs?: number;
    VMax?: number;
    showBars?: boolean;
    bus: ArincEventBus;
    instrument: BaseInstrument;
}

export class AirspeedIndicator extends DisplayComponent<AirspeedIndicatorProps> {
    private speedSub = Subject.create<number>(0);

    private speedTapeElements: NodeReference<SVGGElement> = FSComponent.createRef();

    private failedGroup: NodeReference<SVGGElement> = FSComponent.createRef();

    private showBarsRef = FSComponent.createRef<SVGGElement>();

    private vfeNext = FSComponent.createRef<SVGPathElement>();

    private barTimeout= 0;

    private onGround = Subject.create(true);

    private airSpeed = new Arinc429Word(0);

    private leftMainGearCompressed: boolean;

    private rightMainGearCompressed: boolean;

    private pathSub = Subject.create('');

    private setOutline() {
        let airspeedValue: number;
        if (this.airSpeed.isFailureWarning() || (this.airSpeed.isNoComputedData() && !this.onGround.get())) {
            airspeedValue = NaN;
        } else if (this.airSpeed.isNoComputedData()) {
            airspeedValue = 30;
        } else {
            airspeedValue = this.airSpeed.value;
        }
        this.speedSub.set(airspeedValue);

        if (Number.isNaN(airspeedValue)) {
            this.speedTapeElements.instance.classList.add('HiddenElement');
            this.failedGroup.instance.classList.remove('HiddenElement');
        } else {
            this.speedTapeElements.instance.classList.remove('HiddenElement');
            this.failedGroup.instance.classList.add('HiddenElement');
        }

        const length = 42.9 + Math.max(Math.max(Math.min(Number.isNaN(airspeedValue) ? 100 : airspeedValue, 72.1), 30) - 30, 0);
        this.pathSub.set(`m19.031 38.086v${length}`);
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        pf.on('vFeNext').withArinc429Precision(2).handle((vfe) => {
            if (vfe.isNormalOperation()) {
                const offset = -vfe.value * DistanceSpacing / ValueSpacing;
                this.vfeNext.instance.classList.remove('HiddenElement');
                this.vfeNext.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
            } else {
                this.vfeNext.instance.classList.add('HiddenElement');
            }
        });

        pf.on('speedAr').withArinc429Precision(3).handle((airSpeed) => {
            this.airSpeed = airSpeed;
            this.setOutline();
        });

        pf.on('leftMainGearCompressed').whenChanged().handle((g) => {
            this.leftMainGearCompressed = g;
            this.onGround.set(this.rightMainGearCompressed || g);
            this.setOutline();
        });

        pf.on('rightMainGearCompressed').whenChanged().handle((g) => {
            this.rightMainGearCompressed = g;
            this.onGround.set(this.leftMainGearCompressed || g);
            this.setOutline();
        });

        // showBars replacement
        this.onGround.sub((g) => {
            if (g) {
                this.showBarsRef.instance.style.display = 'none';
                clearTimeout(this.barTimeout);
            } else {
                this.barTimeout = setTimeout(() => {
                    this.showBarsRef.instance.style.display = 'block';
                }, 10000) as unknown as number;
            }
            this.setOutline();
        });
    }

    render(): VNode {
        return (

            <>
                <g id="FailedGroup" ref={this.failedGroup} class="HiddenElement">

                    <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
                    <text id="SpeedFailText" class="Blink9Seconds FontLargest EndAlign Red" x="17.756115" y="83.386398">SPD</text>
                    <path id="SpeedTapeOutlineRight" class="NormalStroke Red" d={this.pathSub} />

                </g>

                <g id="SpeedTapeElementsGroup" ref={this.speedTapeElements}>
                    {/* <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" /> */}
                    {/* Outline */}
                    <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m132.219 234.874v297" />
                    <VerticalTape
                        tapeValue={this.speedSub}
                        lowerLimit={30}
                        upperLimit={660}
                        valueSpacing={ValueSpacing}
                        displayRange={DisplayRange + 6}
                        distanceSpacing={DistanceSpacing}
                        type="speed"
                    >

                        <V1BugElement bus={this.props.bus} />
                        <VRBugElement bus={this.props.bus} />
                        <FlapsSpeedPointBugs bus={this.props.bus} />
                        <path id="VFeNextMarker" ref={this.vfeNext} class="NormalStroke Amber" d="m19.031 81.34h-2.8709m0-1.0079h2.8709" />
                        <VProtBug bus={this.props.bus} />

                    </VerticalTape>

                    <VMaxBar bus={this.props.bus} />
                    <VAlphaProtBar bus={this.props.bus} />
                    <VStallWarnBar bus={this.props.bus} />
                    <g ref={this.showBarsRef}>
                        <VLsBar bus={this.props.bus} />
                    </g>
                    <VAlphaLimBar bus={this.props.bus} />
                    <SpeedTrendArrow airspeed={this.speedSub} instrument={this.props.instrument} bus={this.props.bus} />

                    <V1Offtape bus={this.props.bus} />
                </g>

            </>
        );
    }
}

class FlapsSpeedPointBugs extends DisplayComponent<{bus: ArincEventBus}> {
    private greenDotBug = FSComponent.createRef<SVGGElement>();

    private flapsBug = FSComponent.createRef<SVGGElement>();

    private slatBug = FSComponent.createRef<SVGGElement>();

    render(): VNode {
        return (
            <>
                <g id="GreenDotSpeedMarker" ref={this.greenDotBug} style="transform:translate3d(0px, 0px,0px)">
                    {/* <path class="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" /> */}
                    <circle class="NormalStroke Green" cx="134.25" cy="384" r="5.5" />
                    {/* <path class="NormalStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" /> */}
                </g>
                <g id="FlapsSlatsBug" ref={this.flapsBug} style="transform: translate3d(0px, 0px,0px)">
                    <path class="ThickStroke Green" d="m137 384h18.18" />
                    <text class="FontLarge MiddleAlign Green" x="177.41" y="384">F</text>
                </g>
                <g id="FlapsSlatsBug" ref={this.slatBug} style="transform: translate3d(0px, 0px,0px)">
                    <path class="ThickStroke Green" d="m137 384h18.18" />
                    <text class="FontLarge MiddleAlign Green" x="177.41" y="384">S</text>
                </g>
            </>
        );
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('vMan').withArinc429Precision(2)
            .handle((gd) => {
                if (gd.isNormalOperation()) {
                    this.greenDotBug.instance.style.visibility = 'visible';
                    this.greenDotBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(gd.value)}px, 0px`;
                } else {
                    this.greenDotBug.instance.style.visibility = 'hidden';
                }
            });
        sub.on('v4').withArinc429Precision(2)
            .handle((sls) => {
                if (sls.isNormalOperation()) {
                    this.slatBug.instance.style.visibility = 'visible';
                    this.slatBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(sls.value)}px, 0px`;
                } else {
                    this.slatBug.instance.style.visibility = 'hidden';
                }
            });
        sub.on('v3').withArinc429Precision(2)
            .handle((fs) => {
                if (fs.isNormalOperation()) {
                    this.flapsBug.instance.style.visibility = 'visible';
                    this.flapsBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(fs.value)}px, 0px`;
                } else {
                    this.flapsBug.instance.style.visibility = 'hidden';
                }
            });
    }
}

const getSpeedTapeOffset = (speed: number): number => -speed * DistanceSpacing / ValueSpacing;

export class AirspeedIndicatorOfftape extends DisplayComponent<{ bus: ArincEventBus }> {
    private lowerRef = FSComponent.createRef<SVGGElement>();

    private offTapeRef = FSComponent.createRef<SVGGElement>();

    private offTapeFailedRef = FSComponent.createRef<SVGGElement>();

    private decelRef = FSComponent.createRef<SVGTextElement>();

    private spdLimFlagRef = FSComponent.createRef<SVGTextElement>();

    private onGround = true;

    private leftMainGearCompressed = true;

    private rightMainGearCompressed = true;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('leftMainGearCompressed').whenChanged().handle((g) => {
            this.leftMainGearCompressed = g;
            this.onGround = this.rightMainGearCompressed || g;
        });

        sub.on('rightMainGearCompressed').whenChanged().handle((g) => {
            this.rightMainGearCompressed = g;
            this.onGround = this.leftMainGearCompressed || g;
        });

        sub.on('speedAr').withArinc429Precision(2).handle((speed) => {
            let airspeedValue: number;
            if (speed.isFailureWarning() || (speed.isNoComputedData() && !this.onGround)) {
                airspeedValue = NaN;
            } else if (speed.isNoComputedData()) {
                airspeedValue = 30;
            } else {
                airspeedValue = speed.value;
            }
            if (Number.isNaN(airspeedValue)) {
                this.offTapeRef.instance.classList.add('HiddenElement');
                this.offTapeFailedRef.instance.classList.remove('HiddenElement');
            } else {
                this.offTapeRef.instance.classList.remove('HiddenElement');
                this.offTapeFailedRef.instance.classList.add('HiddenElement');

                const clampedSpeed = Math.max(Math.min(airspeedValue, 660), 30);
                const showLower = clampedSpeed > 72;

                if (showLower) {
                    this.lowerRef.instance.setAttribute('visibility', 'visible');
                } else {
                    this.lowerRef.instance.setAttribute('visibility', 'hidden');
                }
            }
        });

        sub.on('autoBrakeDecel').whenChanged().handle((a) => {
            if (a) {
                this.decelRef.instance.style.visibility = 'visible';
            } else {
                this.decelRef.instance.style.visibility = 'hidden';
            }
        });

        sub.on('facToUse').whenChanged().handle((a) => {
            if (a === 0) {
                this.spdLimFlagRef.instance.style.visibility = 'visible';
            } else {
                this.spdLimFlagRef.instance.style.visibility = 'hidden';
            }
        });
    }

    render(): VNode {
        return (
            <>
                {/* <g id="OfftapeFailedGroup" ref={this.offTapeFailedRef}>
                    <path id="SpeedTapeOutlineUpper" class="NormalStroke Red" d="m1.9058 38.086h21.859" />
                    <path id="SpeedTapeOutlineLower" class="NormalStroke Red" d="m1.9058 123.56h21.859" />
                </g> */}
                <g id="SpeedOfftapeGroup" ref={this.offTapeRef}>
                    <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m72 235h77" />
                    <SpeedTarget bus={this.props.bus} />
                    <text id="AutoBrkDecel" ref={this.decelRef} class="FontMedium EndAlign Green" x="149" y="546.5">DECEL</text>
                    <path class="Fill Green SmallOutline" d="m 64,383 v 2 h 10 v -2 z" />
                    <path class="Fill Green SmallOutline" d="m 120.29043,382.65332 v 2.59187 l 19.44819,0.0209 9.2616,4.32658 v -10.84205 l -9.2616,3.90316 z" />
                    <path id="SpeedTapeOutlineLower" ref={this.lowerRef} class="NormalStroke Green" d="m72 531.500h77" />
                    <g ref={this.spdLimFlagRef}>
                        <text id="SpdLimFailTextUpper" x="161" y="497" class="FontMedium EndAlign Green Blink9Seconds">SPD</text>
                        <text id="SpdLimFailTextLower" x="161" y="522" class="FontMedium EndAlign Green Blink9Seconds">LIM</text>
                    </g>
                </g>
            </>

        );
    }
}

class SpeedTrendArrow extends DisplayComponent<{ airspeed: Subscribable<number>, instrument: BaseInstrument, bus: ArincEventBus }> {
    private refElement = FSComponent.createRef<SVGGElement>();

    private arrowBaseRef = FSComponent.createRef<SVGPathElement>();

    private arrowHeadRef = FSComponent.createRef<SVGPathElement>();

    private offset = Subject.create<string>('');

    private pathString = Subject.create<string>('');

    private vCTrend = new Arinc429Word(0);

    private vCTrendHysteresis = false;

    private handleVCTrend(): void {
        if (Math.abs(this.vCTrend.value) < 1) {
            this.vCTrendHysteresis = false;
        } else if (Math.abs(this.vCTrend.value) > 2) {
            this.vCTrendHysteresis = true;
        }

        if (!this.vCTrendHysteresis || !this.vCTrend.isNormalOperation()) {
            this.refElement.instance.style.visibility = 'hidden';
        } else {
            this.refElement.instance.style.visibility = 'visible';
            let pathString;
            const sign = Math.sign(this.vCTrend.value);

            const offset = -this.vCTrend.value * DistanceSpacing / ValueSpacing;
            const neutralPos = 384;
            if (sign > 0) {
                pathString = `m119 ${neutralPos + offset} l -4.5 9 M119 ${neutralPos + offset} l 4.5 9`;
            } else {
                pathString = `m119 ${neutralPos + offset} l 4.5 -9 M119 ${neutralPos + offset} l -4.5 -9`;
            }

            this.offset.set(`m119 384v${offset.toFixed(10)}`);

            this.pathString.set(pathString);
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<Arinc429Values>();

        sub.on('vCTrend').withArinc429Precision(2).handle((word) => {
            this.vCTrend = word;

            this.handleVCTrend();
        });
    }

    render(): VNode | null {
        return (
            <g id="SpeedTrendArrow" ref={this.refElement}>
                <path id="SpeedTrendArrowBase" ref={this.arrowBaseRef} class="NormalStroke Green" d={this.offset} />
                <path id="SpeedTrendArrowHead" ref={this.arrowHeadRef} class="NormalStroke Green" d={this.pathString} />
            </g>
        );
    }
}

class VLsBar extends DisplayComponent<{ bus: ArincEventBus }> {
    private vlsPath = Subject.create<string>('');

    private vlsVisbility = Subject.create<string>('hidden');

    private vAlphaProt = new Arinc429Word(0);

    private vStallWarn = new Arinc429Word(0);

    private airSpeed= new Arinc429Word(0);

    private vls = new Arinc429Word(0);

    private fcdc1DiscreteWord1 = new Arinc429Word(0);

    private fcdc2DiscreteWord1 = new Arinc429Word(0);

    private setVlsPath() {
        if (this.vls.isNormalOperation()) {
            this.vlsVisbility.set('visible');

            const normalLawActive = this.fcdc1DiscreteWord1.getBitValueOr(11, false) || this.fcdc2DiscreteWord1.getBitValueOr(11, false);

            const VLsPos = (this.airSpeed.value - this.vls.value) * DistanceSpacing / ValueSpacing + 384;
            const offset = (this.vls.value - (normalLawActive ? this.vAlphaProt.valueOr(0) : this.vStallWarn.valueOr(0))) * DistanceSpacing / ValueSpacing;

            this.vlsPath.set(`m132.25 ${VLsPos}h 6.23v${offset}`);
        } else {
            this.vlsVisbility.set('hidden');
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & ClockEvents>();

        sub.on('vAlphaProt').withArinc429Precision(2).handle((a) => {
            this.vAlphaProt = a;
            this.setVlsPath();
        });

        sub.on('vStallWarn').withArinc429Precision(2).handle((a) => {
            this.vStallWarn = a;
            this.setVlsPath();
        });

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.airSpeed = s;
            this.setVlsPath();
        });

        sub.on('vLs').withArinc429Precision(2).handle((vls) => {
            this.vls = vls;
            this.setVlsPath();
        });

        sub.on('fcdc1DiscreteWord1').handle((word) => {
            this.fcdc1DiscreteWord1 = word;
            this.setVlsPath();
        });

        sub.on('fcdc2DiscreteWord1').handle((word) => {
            this.fcdc2DiscreteWord1 = word;
            this.setVlsPath();
        });
    }

    render(): VNode {
        return <path id="VLsIndicator" class="NormalStroke Green" d={this.vlsPath} visibility={this.vlsVisbility} />;
    }
}

class VAlphaLimBar extends DisplayComponent<{ bus: ArincEventBus }> {
    private VAlimIndicator = FSComponent.createRef<SVGPathElement>();

    private airSpeed = new Arinc429Word(0);

    private vAlphaLim = new Arinc429Word(0);

    private fcdc1DiscreteWord1 = new Arinc429Word(0);

    private fcdc2DiscreteWord1 = new Arinc429Word(0);

    private setAlphaLimBarPath() {
        const normalLawActive = this.fcdc1DiscreteWord1.getBitValueOr(11, false) || this.fcdc2DiscreteWord1.getBitValueOr(11, false);
        if (this.vAlphaLim.value - this.airSpeed.value < -DisplayRange || this.vAlphaLim.isFailureWarning() || this.vAlphaLim.isNoComputedData() || !normalLawActive) {
            this.VAlimIndicator.instance.style.visibility = 'hidden';
        } else {
            this.VAlimIndicator.instance.style.visibility = 'visible';

            const delta = this.airSpeed.value - DisplayRange - this.vAlphaLim.value;
            const offset = delta * DistanceSpacing / ValueSpacing;

            this.VAlimIndicator.instance.setAttribute('d', `m132.219 531 h10.8v${offset}h-10.8z`);
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.airSpeed = s;
            this.setAlphaLimBarPath();
        });

        sub.on('vAlphaMax').handle((al) => {
            this.vAlphaLim = al;
            this.setAlphaLimBarPath();
        });

        sub.on('fcdc1DiscreteWord1').handle((word) => {
            this.fcdc1DiscreteWord1 = word;
            this.setAlphaLimBarPath();
        });

        sub.on('fcdc2DiscreteWord1').handle((word) => {
            this.fcdc2DiscreteWord1 = word;
            this.setAlphaLimBarPath();
        });
    }

    render(): VNode {
        return <path ref={this.VAlimIndicator} id="VAlimIndicator" class="Fill Green" />;
    }
}

class VAlphaProtBar extends DisplayComponent<{ bus: ArincEventBus }> {
    private VAprotIndicator = FSComponent.createRef<SVGPathElement>();

    private airSpeed = new Arinc429Word(0);

    private vAlphaProt = new Arinc429Word(0);

    private fcdc1DiscreteWord1 = new Arinc429Word(0);

    private fcdc2DiscreteWord1 = new Arinc429Word(0);

    private setAlphaProtBarPath() {
        const normalLawActive = this.fcdc1DiscreteWord1.getBitValueOr(11, false) || this.fcdc2DiscreteWord1.getBitValueOr(11, false);
        if (this.airSpeed.value - this.vAlphaProt.value > DisplayRange || this.vAlphaProt.isFailureWarning() || this.vAlphaProt.isNoComputedData() || !normalLawActive) {
            this.VAprotIndicator.instance.style.visibility = 'hidden';
        } else {
            this.VAprotIndicator.instance.style.visibility = 'visible';

            const delta = Math.max(this.airSpeed.value - this.vAlphaProt.value, -DisplayRange);
            const offset = delta * DistanceSpacing / ValueSpacing;

            this.VAprotIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.airSpeed = s;
            this.setAlphaProtBarPath();
        });

        sub.on('vAlphaProt').withArinc429Precision(2).handle((word) => {
            this.vAlphaProt = word;
            this.setAlphaProtBarPath();
        });

        sub.on('fcdc1DiscreteWord1').handle((word) => {
            this.fcdc1DiscreteWord1 = word;
            this.setAlphaProtBarPath();
        });

        sub.on('fcdc2DiscreteWord1').handle((word) => {
            this.fcdc2DiscreteWord1 = word;
            this.setAlphaProtBarPath();
        });
    }

    render(): VNode {
        return (
            <path
                id="VAlphaProtBarberpole"
                ref={this.VAprotIndicator}
                class="BarGreen"
                // eslint-disable-next-line max-len
                d="m 132.2575,654.23504 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-8.85669 v 4.58106 m 0,-13.43775 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71368 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71368 v 4.58105 m -8.85154,4.27564 v -4.27564 h 8.85154 v 4.27564 z m 0,-30.8454 h 8.85154 v 4.27563 h -8.85154 z m 8.85154,13.13232 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71338 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 0,-17.71338 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,0 v 4.58106 m 0,-13.43775 v 4.58106 m 0,-13.43775 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71368 v 4.58105 m -8.85154,4.27564 v -4.27564 h 8.85154 v 4.27564 z m 8.85154,-17.71369 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 0,-30.8454 h 8.85154 v 4.27564 h -8.85154 z m 8.85154,13.13233 v 4.58105 m -8.85154,4.27564 v -4.27564 h 8.85154 v 4.27564 z m 8.85154,-17.71338 v 4.58105 m -8.85154,4.27564 v -4.27564 h 8.85154 v 4.27564 z m 0,-17.71338 v -4.27564 h 8.85154 v 4.27564 z m 8.85154,0 v 4.58105 m 0,-13.43774 v 4.58105 m 0,-13.43774 v 4.58105 m -8.85154,4.27564 v -4.27564 h 8.85154 v 4.27564 z m 8.85154,-17.71369 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71368 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 0,-30.8454 h 8.85154 v 4.27563 h -8.85154 z m 8.85154,13.13232 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71338 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 0,-17.71338 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,0 v 4.58106 m 0,-13.43775 v 4.58106 m 0,-13.43775 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71368 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71368 v 4.58105 m -8.85154,4.27564 v -4.27564 h 8.85154 v 4.27564 z m 0,-30.8454 h 8.85154 v 4.27563 h -8.85154 z m 8.85154,13.13232 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,-17.71338 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 0,-17.71338 v -4.27563 h 8.85154 v 4.27563 z m 8.85154,0 v 4.58106 m 0,-13.43775 v 4.58106 m 0,-13.43775 v 4.58106 m -8.85154,4.27563 v -4.27563 h 8.85154 v 4.27563 z m 5.98364,-13.13232 h 2.86802 v 4.27563 h -8.85154 v -4.27563 z"
            />
        );
    }
}

class VMaxBar extends DisplayComponent<{ bus: ArincEventBus }> {
    private VMaxIndicator = FSComponent.createRef<SVGPathElement>();

    private airSpeed = new Arinc429Word(0);

    private vMax = new Arinc429Word(0);

    private setVMaxBarPath() {
        if (this.airSpeed.value - this.vMax.value < -DisplayRange || !this.vMax.isNormalOperation()) {
            this.VMaxIndicator.instance.style.visibility = 'hidden';
        } else {
            this.VMaxIndicator.instance.style.visibility = 'visible';

            const delta = Math.min(this.airSpeed.value - this.vMax.value, DisplayRange);
            const offset = delta * DistanceSpacing / ValueSpacing;

            this.VMaxIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.airSpeed = s;
            this.setVMaxBarPath();
        });

        sub.on('vMax').withArinc429Precision(2).handle((v) => {
            this.vMax = v;
            this.setVMaxBarPath();
        });
    }

    render(): VNode {
        return (
            <path
                id="OverspeedBarberpole"
                ref={this.VMaxIndicator}
                class="BarGreen"
                // eslint-disable-next-line max-len
                d="m 142.80702,93.30442 v -9.16137 m -10.56464,-8.45661 v 8.45661 h 10.56464 v -8.45661 z m 10.56464,35.23527 v -9.16137 m 0,26.77971 v -9.16138 m 0,26.77972 V 136.997 m 0,26.77973 v -9.16138 m 0,-43.69189 h -10.56464 v 8.45697 h 10.56464 z m 0,43.69189 v -8.45696 h -10.56464 v 8.45696 z m 0,-26.0753 v 8.45695 h -10.56464 v -8.45695 z M 132.24238,93.30478 v 8.4566 h 10.56464 v -8.4566 z m 10.56464,88.08993 v -9.16139 m 0,26.77972 v -9.16137 m 0,26.77971 V 207.47 m 0,26.77972 v -9.16137 m 0,-43.69189 h -10.56464 v 8.45695 h 10.56464 z m 0,43.69189 v -8.45697 h -10.56464 v 8.45697 z m 0,-26.07531 V 207.47 h -10.56464 v -8.45696 z m -10.56464,-35.23527 v 8.4566 h 10.56464 v -8.4566 z m 10.56464,88.08993 v -9.16138 m 0,26.77973 v -9.1614 m 0,26.77972 v -9.16138 m 0,26.77973 v -9.16138 m 0,-43.69188 h -10.56464 v 8.45694 h 10.56464 z m 0,43.69188 v -8.45697 h -10.56464 v 8.45697 z m 0,-26.07529 v 8.45694 h -10.56464 v -8.45694 z m -10.56464,-35.23529 v 8.45661 h 10.56464 v -8.45661 z m 10.56464,88.08995 v -9.16139 m 0,26.77972 v -9.16138 m 0,26.77972 v -9.16137 m 0,26.7797 v -9.16139 m -10.56464,17.61835 h 10.56464 v -8.45696 h -10.56464 z m 10.56464,-61.31127 h -10.56464 v 8.45696 h 10.56464 z m 0,43.69188 v -8.45695 h -10.56464 v 8.45695 z m 0,-26.07529 v 8.45697 h -10.56464 v -8.45697 z m -10.56464,-35.23527 v 8.4566 h 10.56464 v -8.4566 z"
            />
        );
    }
}

class VStallWarnBar extends DisplayComponent<{ bus: ArincEventBus }> {
    private VStallWarnIndicator = FSComponent.createRef<SVGPathElement>();

    private airSpeed = new Arinc429Word(0);

    private vStallWarn = new Arinc429Word(0);

    private fcdc1DiscreteWord1 = new Arinc429Word(0);

    private fcdc2DiscreteWord1 = new Arinc429Word(0);

    private setVStallWarnBarPath() {
        const normalLawActive = this.fcdc1DiscreteWord1.getBitValueOr(11, false) || this.fcdc2DiscreteWord1.getBitValueOr(11, false);
        if (this.airSpeed.value - this.vStallWarn.value > DisplayRange || this.vStallWarn.isFailureWarning() || this.vStallWarn.isNoComputedData() || normalLawActive) {
            this.VStallWarnIndicator.instance.style.visibility = 'hidden';
        } else {
            this.VStallWarnIndicator.instance.style.visibility = 'visible';

            const delta = Math.max(this.airSpeed.value - this.vStallWarn.value, -DisplayRange);
            const offset = delta * DistanceSpacing / ValueSpacing;

            this.VStallWarnIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.airSpeed = s;
            this.setVStallWarnBarPath();
        });

        sub.on('vStallWarn').withArinc429Precision(2).handle((v) => {
            this.vStallWarn = v;
            this.setVStallWarnBarPath();
        });

        sub.on('fcdc1DiscreteWord1').handle((word) => {
            this.fcdc1DiscreteWord1 = word;
            this.setVStallWarnBarPath();
        });

        sub.on('fcdc2DiscreteWord1').handle((word) => {
            this.fcdc2DiscreteWord1 = word;
            this.setVStallWarnBarPath();
        });
    }

    render(): VNode {
        return (
            <path
                id="StallWarnBarberpole"
                ref={this.VStallWarnIndicator}
                class="BarGreen"
                // eslint-disable-next-line max-len
                d="m 143.05662,401.76198 v -9.19517 m -10.6036,-8.4878 v 8.4878 h 10.6036 v -8.4878 z m 10.6036,35.36526 v -9.19518 m 0,26.87851 v -9.19518 m 0,26.87852 v -9.19518 m 0,26.87852 v -9.19518 m 0,-43.85309 h -10.6036 v 8.48817 h 10.6036 z m 0,43.85309 v -8.4878 h -10.6036 v 8.4878 z m 0,-26.1715 v 8.48816 h -10.6036 v -8.48816 z m -10.6036,-35.36527 v 8.48781 h 10.6036 v -8.48781 z m 10.6036,88.41494 v -9.19518 m 0,26.87852 v -9.19519 m 0,26.87852 v -9.19517 m 0,26.8785 v -9.19517 m 0,-43.85307 h -10.6036 v 8.48781 h 10.6036 z m 0,43.85307 v -8.48816 h -10.6036 v 8.48816 z m 0,-26.17149 v 8.48816 h -10.6036 v -8.48816 z m -10.6036,-35.36528 v 8.48782 h 10.6036 v -8.48782 z m 10.6036,88.41494 v -9.19518 m 0,26.87851 v -9.19516 m 0,26.8785 v -9.19517 m 0,26.87852 v -9.19518 m 0,-43.85308 h -10.6036 v 8.48815 h 10.6036 z m 0,43.85308 v -8.48817 h -10.6036 v 8.48817 z m 0,-26.17151 v 8.48817 h -10.6036 v -8.48817 z m -10.6036,-35.36526 v 8.48779 h 10.6036 v -8.48779 z m 10.6036,88.41493 v -9.19518 m 0,26.87852 v -9.19517 m 0,26.87852 v -9.19518 m 0,26.87851 v -9.19518 m -10.6036,17.68332 h 10.6036 v -8.48814 h -10.6036 z m 10.6036,-61.53746 h -10.6036 v 8.48781 h 10.6036 z m 0,43.85307 v -8.48779 h -10.6036 v 8.48779 z m 0,-26.17148 v 8.48816 h -10.6036 v -8.48816 z m -10.6036,-35.36527 v 8.4878 h 10.6036 v -8.4878 z"
            />
        );
    }
}

class V1Offtape extends DisplayComponent<{ bus: ArincEventBus }> {
    private v1TextRef = FSComponent.createRef<SVGTextElement>();

    private v1Speed = 0;

    onAfterRender() {
        const sub = this.props.bus.getSubscriber<HUDSimvars>();

        sub.on('speed').handle((s) => {
            const speed = new Arinc429Word(s);
            if (this.v1Speed - speed.value > DisplayRange) {
                this.v1TextRef.instance.style.visibility = 'visible';
            } else {
                this.v1TextRef.instance.style.visibility = 'hidden';
            }
        });

        sub.on('v1').whenChanged().handle((v1) => {
            this.v1Speed = v1;
            this.v1TextRef.instance.textContent = Math.round(v1).toString();
        });

        sub.on('fwcFlightPhase').whenChanged().handle((p) => {
            if (p <= 4) {
                this.v1TextRef.instance.style.visibility = 'visible';
            } else {
                this.v1TextRef.instance.style.visibility = 'hidden';
            }
        });
    }

    render() {
        return (
            <text ref={this.v1TextRef} id="V1SpeedText" class="FontMedium Green" x="151" y="260">0</text>
        );
    }
}

interface SpeedStateInfo {
    targetSpeed: number;
    managedTargetSpeed: number;
    holdValue: number;
    isSpeedManaged: boolean;
    isMach: boolean;
    speed: Arinc429WordData;

  }

class SpeedTarget extends DisplayComponent <{ bus: ArincEventBus }> {
    private upperBoundRef = FSComponent.createRef<SVGTextElement>();

    private lowerBoundRef = FSComponent.createRef<SVGTextElement>();

    private speedTargetRef = FSComponent.createRef<SVGPathElement>();

    private currentVisible: NodeReference<SVGElement> = this.upperBoundRef;

    private textSub = Subject.create('0');

    private decelActive = false;

    private needsUpdate = true;

    private speedState: SpeedStateInfo = {
        speed: new Arinc429Word(0),
        targetSpeed: 100,
        managedTargetSpeed: 100,
        holdValue: 100,
        isSpeedManaged: false,
        isMach: false,
    }

    // private handleManagedSpeed() {
    //     if (this.speedState.isSpeedManaged) {
    //         this.currentVisible.instance.classList.replace('Cyan', 'Magenta');
    //         const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
    //         this.textSub.set(text);
    //     } else {
    //         this.currentVisible.instance.classList.replace('Magenta', 'Cyan');
    //         const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
    //         this.textSub.set(text);
    //     }
    // }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.needsUpdate = true;

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values>();

        sub.on('isSelectedSpeed').whenChanged().handle((s) => {
            this.speedState.isSpeedManaged = !s;
            this.needsUpdate = true;
        });

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.speedState.speed = s;

            this.needsUpdate = true;
        });

        sub.on('holdValue').whenChanged().handle((s) => {
            this.speedState.holdValue = s;
            this.needsUpdate = true;
        });

        sub.on('machActive').whenChanged().handle((s) => {
            this.speedState.isMach = s;
            this.needsUpdate = true;
        });

        sub.on('targetSpeedManaged').whenChanged().handle((s) => {
            this.speedState.managedTargetSpeed = s;
            this.needsUpdate = true;
        });

        sub.on('autoBrakeDecel').whenChanged().handle((a) => {
            this.decelActive = a;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle(this.onFrameUpdate.bind(this));
    }

    private onFrameUpdate(_realTime: number): void {
        if (this.needsUpdate === true) {
            this.needsUpdate = false;

            this.determineTargetSpeed();
            const inRange = this.handleLowerUpperBound();
            // this.handleManagedSpeed();

            if (inRange) {
                const multiplier = 100;
                const currentValueAtPrecision = Math.round(this.speedState.speed.value * multiplier) / multiplier;
                const offset = (currentValueAtPrecision - (this.speedState.isSpeedManaged
                    ? this.speedState.managedTargetSpeed : this.speedState.targetSpeed)) * DistanceSpacing / ValueSpacing;
                this.speedTargetRef.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
            } else {
                const text = Math.round(this.speedState.isSpeedManaged ? this.speedState.managedTargetSpeed : this.speedState.targetSpeed).toString().padStart(3, '0');
                this.textSub.set(text);
            }
        }
    }

    private determineTargetSpeed() {
        const isSelected = !this.speedState.isSpeedManaged;
        if (isSelected) {
            if (this.speedState.isMach) {
                const holdValue = this.speedState.holdValue;
                this.speedState.targetSpeed = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', holdValue === null ? undefined : holdValue);
            } else {
                this.speedState.targetSpeed = this.speedState.holdValue;
            }
        }
    }

    private handleLowerUpperBound(): boolean {
        let inRange = false;

        const currentTargetSpeed = this.speedState.isSpeedManaged ? this.speedState.managedTargetSpeed : this.speedState.targetSpeed;
        if (Math.abs(this.speedState.speed.value - currentTargetSpeed) > DisplayRange && !this.decelActive) {
            // this.upperBoundRef.instance.style.visibility = 'visible';
            this.lowerBoundRef.instance.style.visibility = 'visible';
            this.speedTargetRef.instance.style.visibility = 'hidden';
            // this.currentVisible = this.lowerBoundRef;
        } else if (Math.abs(this.speedState.speed.value - currentTargetSpeed) < DisplayRange) {
            this.lowerBoundRef.instance.style.visibility = 'hidden';
            // this.upperBoundRef.instance.style.visibility = 'hidden';
            this.speedTargetRef.instance.style.visibility = 'visible';
            // this.currentVisible = this.speedTargetRef;
            inRange = true;
        } else {
            this.lowerBoundRef.instance.style.visibility = 'hidden';
            // this.upperBoundRef.instance.style.visibility = 'hidden';
            this.speedTargetRef.instance.style.visibility = 'hidden';
        }
        return inRange;
    }

    render(): VNode {
        return (
            <>
                {/* <text ref={this.upperBoundRef} id="SelectedSpeedLowerText" class="FontSmallest EndAlign Cyan" x="148.680" y="128.27917">{this.textSub}</text> */}
                <g ref={this.lowerBoundRef}><text id="SelectedSpeedLowerText" class="FontSmallest EndAlign Green" x="148.680" y="234.874">{this.textSub}</text></g>
                <path ref={this.speedTargetRef} class="NormalStroke CornerRound Green" style="transform: translate3d(0px, 0px, 0px)" d="m131 381 21 -11  0 28 -21 -11" />
                <SpeedMargins bus={this.props.bus} />
            </>
        );
    }
}

class SpeedMargins extends DisplayComponent<{ bus: ArincEventBus }> {
    private shouldShowMargins = false;

    private currentSpeed = Subject.create(Arinc429Word.empty());

    private upperSpeedMarginVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private lowerSpeedMarginVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private upperMarginTransform = Subject.create('translate(0 0)');

    private lowerMarginTransform = Subject.create('translate(0 0)');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        const sub = this.props.bus.getArincSubscriber<Arinc429Values & FmsVars>();

        sub.on('showSpeedMargins').whenChanged().handle((active) => this.shouldShowMargins = active);

        sub.on('speedAr').withArinc429Precision(2).handle((s) => this.currentSpeed.set(s));

        sub.on('upperSpeedMargin').handle(this.updateMargin(this.upperSpeedMarginVisibility, this.upperMarginTransform));
        sub.on('lowerSpeedMargin').handle(this.updateMargin(this.lowerSpeedMarginVisibility, this.lowerMarginTransform));
    }

    render(): VNode {
        return (
            <g id="SpeedMargins">
                <path
                    id="UpperSpeedMargin"
                    class="Fill Magenta"
                    d="m19.7 80.5 h 5.3577 v 0.7 h-5.3577 z"
                    visibility={this.upperSpeedMarginVisibility}
                    transform={this.upperMarginTransform}
                />
                <path
                    id="LowerSpeedMargin"
                    class="Fill Magenta"
                    d="m19.7 80.5 h 5.3577 v 0.7 h-5.3577 z"
                    visibility={this.lowerSpeedMarginVisibility}
                    transform={this.lowerMarginTransform}
                />
            </g>
        );
    }

    private updateMargin(visibility: Subject<'visible' | 'hidden'>, transform: Subject<string>) {
        return (speed: number) => {
            const shouldForceHideMargins = !this.shouldShowMargins || !this.currentSpeed.get().isNormalOperation();
            const marginIsVisible = visibility.get() === 'visible';

            if (shouldForceHideMargins) {
                if (marginIsVisible) {
                    visibility.set('hidden');
                }

                return;
            }

            const isInRange = Math.abs(this.currentSpeed.get().value - speed) < DisplayRange;
            if (isInRange) {
                const offset = (Math.round(100 * (this.currentSpeed.get().value - speed) * DistanceSpacing / ValueSpacing) / 100).toFixed(2);
                transform.set(`translate(0 ${offset})`);
            }

            if (isInRange !== marginIsVisible) {
                visibility.set(isInRange ? 'visible' : 'hidden');
            }
        };
    }
}

export class MachNumber extends DisplayComponent<{bus: ArincEventBus}> {
    private machTextSub = Subject.create('');

    private failedRef = FSComponent.createRef<SVGTextElement>();

    private showMach = false;

    private onGround = false;

    private leftMainGearCompressed = true;

    private rightMainGearCompressed = true;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars>();

        sub.on('machAr').handle((mach) => {
            if (!mach.isNormalOperation() && !this.onGround) {
                this.machTextSub.set('');
                this.failedRef.instance.style.display = 'inline';
                return;
            }
            this.failedRef.instance.style.display = 'none';
            const machPermille = Math.round(mach.valueOr(0) * 1000) * 0.001;
            if (this.showMach && machPermille < 0.45) {
                this.showMach = false;
                this.machTextSub.set('');
            } else if (!this.showMach && machPermille > 0.5) {
                this.showMach = true;
            }
            if (this.showMach) {
                this.machTextSub.set(`${machPermille}`);
            }
        });

        sub.on('leftMainGearCompressed').whenChanged().handle((g) => {
            this.leftMainGearCompressed = g;
            this.onGround = this.rightMainGearCompressed || g;
        });

        sub.on('rightMainGearCompressed').whenChanged().handle((g) => {
            this.rightMainGearCompressed = g;
            this.onGround = this.leftMainGearCompressed || g;
        });
    }

    render(): VNode {
        return (
            <>
                <text ref={this.failedRef} id="MachFailText" class="Blink9Seconds FontLargest StartAlign Red" x="5.4257932" y="136.88908">MACH</text>
                <text id="CurrentMachText" class="FontLargest StartAlign Green" x="85.5" y="560">{this.machTextSub}</text>
            </>
        );
    }
}

class VProtBug extends DisplayComponent<{bus: ArincEventBus}> {
    private vProtBug = FSComponent.createRef<SVGGElement>();

    private fcdcWord1 = new Arinc429Word(0);

    private Vmax = new Arinc429Word(0);

    private handleVProtBugDisplay() {
        const showVProt = this.Vmax.value > 240 && this.Vmax.isNormalOperation();
        const offset = -(this.Vmax.value + 6) * DistanceSpacing / ValueSpacing;

        const isNormalLawActive = this.fcdcWord1.getBitValue(11) && !this.fcdcWord1.isFailureWarning();

        if (showVProt && isNormalLawActive) {
            this.vProtBug.instance.style.display = 'block';
            this.vProtBug.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        } else {
            this.vProtBug.instance.style.display = 'none';
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

        sub.on('vMax').whenChanged().handle((vm) => {
            this.Vmax = vm;

            this.handleVProtBugDisplay();
        });

        sub.on('fcdcDiscreteWord1').whenChanged().handle((word) => {
            this.fcdcWord1 = word;

            this.handleVProtBugDisplay();
        });
    }

    render(): VNode {
        return (
            <g id="SpeedProtSymbol" ref={this.vProtBug} style="display: none">
                {/* <path class="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" /> */}
                <path class="ThickStroke Green" d="m108 385.5 h12m0 -3 h-12" />
            </g>
        );
    }
}
