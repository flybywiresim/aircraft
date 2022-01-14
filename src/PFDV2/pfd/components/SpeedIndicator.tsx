import { ClockEvents, DisplayComponent, EventBus, FSComponent, NodeReference, Subject, Subscribable, VNode } from 'msfssdk';
import { LagFilter, RateLimiter, SmoothSin } from './PFDUtils';
import { PFDSimvars } from '../shared/PFDSimvarPublisher';
import { Arinc429Word } from '../shared/arinc429';
import { VerticalTape } from './NewVerticalTape';
import { SimplaneValues } from '../shared/SimplaneValueProvider';
import { Arinc429Values } from '../shared/ArincValueProvider';

const ValueSpacing = 10;
const DistanceSpacing = 10;
const DisplayRange = 42;
/*
const GraduationElement = (speed: number, offset: number) => {
    if (speed < 30) {
        return null;
    }

    let text = '';
    if (speed % 20 === 0) {
        text = Math.abs(speed).toString().padStart(3, '0');
    }

    return (
        <g transform={`translate(0 ${offset})`}>
            <path class="NormalStroke White" d="m19.031 80.818h-2.8206" />
            <text class="FontMedium MiddleAlign White" x="8.0348943" y="82.936722">{text}</text>
        </g>
    );
};
 */
class V1BugElement extends DisplayComponent<{bus: EventBus}> {
    private offsetSub = Subject.create('translate3d(0px, 0px, 0px)');

    private visibilitySub = Subject.create('hidden');

    private flightPhase = 0;

    private v1Speed = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getSubscriber<PFDSimvars>();

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
                <path class="NormalStroke Cyan" d="m16.613 80.82h5.4899" />
                <text class="FontLarge MiddleAlign Cyan" x="26.205544" y="82.96">1</text>
            </g>
        );
    }
}

class VRBugElement extends DisplayComponent<{bus: EventBus}> {
    private offsetSub = Subject.create('');

    private visibilitySub = Subject.create('hidden');

    private flightPhase = 0;

    private vrSpeed = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getSubscriber<PFDSimvars>();

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
            <path
                visibility={this.visibilitySub}
                transform={this.offsetSub}
                id="RotateSpeedMarker"
                class="NormalStroke Cyan"
                d="m21.549 80.82a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z"
            />
        );
    }
}

/* const GreenDotBugElement = (offset: number) => (
    <g id="GreenDotSpeedMarker" transform={`translate(0 ${offset})`}>
        <path class="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
        <path class="ThickStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
    </g>
);

const FlapRetractBugElement = (offset: number) => (
    <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
        <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
        <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">F</text>
    </g>
);

const SlatRetractBugElement = (offset: number) => (
    <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
        <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
        <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">S</text>
    </g>
);

const VFENextBugElement = (offset: number) => (
    <path id="VFeNextMarker" transform={`translate(0 ${offset})`} class="NormalStroke Amber" d="m19.031 81.34h-2.8709m0-1.0079h2.8709" />
);

const VProtBug = (offset: number) => (
    <g id="SpeedProtSymbol" transform={`translate(0 ${offset})`}>
        <path class="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
        <path class="NormalStroke Green" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
        <path style={{ display: 'none' }} class="NormalStroke Amber" d="m14.615 79.915 1.7808 1.7818m-1.7808 0 1.7808-1.7818" />
    </g>
); */

interface AirspeedIndicatorProps {
    airspeedAcc?: number;
    FWCFlightPhase?: number;
    altitude?: Arinc429Word;
    VLs?: number;
    VMax?: number;
    showBars?: boolean;
    bus: EventBus;
    instrument: BaseInstrument;
}

export class AirspeedIndicator extends DisplayComponent<AirspeedIndicatorProps> {
    private speedSub = Subject.create<number>(0);

    private speedTapeOutlineRef: NodeReference<SVGPathElement> = FSComponent.createRef();

    private speedTapeElements: NodeReference<SVGGElement> = FSComponent.createRef();

    private failedGroup: NodeReference<SVGGElement> = FSComponent.createRef();

    private alphaProtRef: NodeReference<SVGGElement>[] = [];

    private vMaxRef: NodeReference<SVGPathElement>[] = [];

    private showBarsRef = FSComponent.createRef<SVGGElement>();

    private barberPoleRef = FSComponent.createRef<SVGGElement>();

    private vfeNext = FSComponent.createRef<SVGPathElement>();

    private altitude = new Arinc429Word(0);

    private flapHandleIndex = 0;

    private lastAlphaProtSub = Subject.create(0);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

        pf.on('vfeNext').whenChanged().handle((vfe) => {
            if (this.altitude.value < 15000 && this.flapHandleIndex < 4) {
                const offset = -vfe * DistanceSpacing / ValueSpacing;
                this.vfeNext.instance.classList.remove('HideLocDiamond');
                this.vfeNext.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
            } else {
                this.vfeNext.instance.classList.add('HideLocDiamond');
            }
        });

        pf.on('altitudeAr').handle((a) => {
            this.altitude = a;
            if (this.altitude.isNormalOperation() && this.altitude.value < 15000 && this.flapHandleIndex < 4) {
                this.vfeNext.instance.classList.remove('HideLocDiamond');
            } else {
                this.vfeNext.instance.classList.add('HideLocDiamond');
            }
        });

        pf.on('flapHandleIndex').whenChanged().handle((a) => {
            this.flapHandleIndex = a;
            if (this.altitude.isNormalOperation() && this.altitude.value < 15000 && this.flapHandleIndex < 4) {
                this.vfeNext.instance.classList.remove('HideLocDiamond');
            } else {
                this.vfeNext.instance.classList.add('HideLocDiamond');
            }
        });

        pf.on('speedAr').handle((airSpeed) => {
            this.speedSub.set(airSpeed.value);

            if (!airSpeed.isNormalOperation()) {
                this.speedTapeElements.instance.classList.add('HideLocDiamond');
                this.failedGroup.instance.classList.remove('HideLocDiamond');
            } else {
                this.speedTapeElements.instance.classList.remove('HideLocDiamond');
                this.failedGroup.instance.classList.add('HideLocDiamond');
            }

            const length = 42.9 + Math.max(Math.max(Math.min(airSpeed.value, 72.1), 30) - 30, 0);
            this.speedTapeOutlineRef.instance.setAttribute('d', `m19.031 38.086v${length}`);
        });

        pf.on('alpha_prot').handle((a) => {
            this.alphaProtRef.forEach((el, index) => {
                const elementValue = a + -1 * 2.923 * index;
                const offset = -elementValue * DistanceSpacing / ValueSpacing;
                el.instance.setAttribute('transform', `translate(0 ${offset})`);
            });

            this.lastAlphaProtSub.set(a);
        });

        pf.on('vMax').handle((vMax) => {
            this.vMaxRef.forEach((el, index) => {
                const elementValue = vMax + 5.040 * index;
                const offset = -elementValue * DistanceSpacing / ValueSpacing;
                el.instance.setAttribute('transform', `translate(0 ${offset})`);
            });
        });

        // showBars replacement
        pf.on('onGround').whenChanged().handle((g) => {
            if (g === 1) {
                this.showBarsRef.instance.setAttribute('style', 'display:none');
                this.barberPoleRef.instance.setAttribute('style', 'display:none');
            } else {
                setTimeout(() => {
                    this.showBarsRef.instance.setAttribute('style', 'display:block');
                    this.barberPoleRef.instance.setAttribute('style', 'display:block');
                }, 10000);
            }
        });
    }

    private createAlphaProtBarberPole() {
        let i = 0;
        const group: SVGGElement[] = [];
        for (i; i < 10; i++) {
            const apref = FSComponent.createRef<SVGGElement>();
            group.push(
                <g ref={apref}>
                    <path class="BarAmber" d="m21.952 82.254v1.5119m-0.94654-2.923h0.94654v1.4111h-2.9213v-1.4111z" />
                    );
                </g>,
            );
            this.alphaProtRef.push(apref);
        }
        return group;
    }

    private createVMaxBarberPole() {
        let i = 0;
        const path: SVGGElement[] = [];
        for (i; i < 10; i++) {
            const vMaxRef = FSComponent.createRef<SVGPathElement>();
            path.push(
                <path ref={vMaxRef} class="BarRed" d="m22.053 78.381v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022z" />,
            );
            this.vMaxRef.push(vMaxRef);
        }
        return path;
    }

    render(): VNode {
        const length = 42.9 + Math.max(Math.max(Math.min(100, 72.1), 30) - 30, 0);
        return (

            <>
                <g id="FailedGroup" ref={this.failedGroup} class="HideLocDiamond">

                    <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
                    <text id="SpeedFailText" class="Blink9Seconds FontLargest EndAlign Red" x="17.756115" y="83.386398">SPD</text>
                    <path id="SpeedTapeOutlineRight" ref={this.speedTapeOutlineRef} class="NormalStroke Red" d={`m19.031 38.086v${length}`} />

                </g>

                <g id="SpeedTapeElementsGroup" ref={this.speedTapeElements}>
                    <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
                    {/* Outline */}
                    <path id="SpeedTapeOutlineRight" ref={this.speedTapeOutlineRef} class="NormalStroke White" d={`m19.031 38.086v${length}`} />
                    <VerticalTape
                        tapeValue={this.speedSub}
                        bugs={[]}
                        lowerLimit={30}
                        upperLimit={660}
                        valueSpacing={ValueSpacing}
                        displayRange={DisplayRange + 6}
                        distanceSpacing={DistanceSpacing}
                        type="speed"
                    >

                        <g ref={this.barberPoleRef}>
                            {this.createVMaxBarberPole()}
                            {this.createAlphaProtBarberPole()}
                        </g>
                        <V1BugElement bus={this.props.bus} />
                        <VRBugElement bus={this.props.bus} />
                        <FlapsSpeedPointBugs bus={this.props.bus} />
                        <path id="VFeNextMarker" ref={this.vfeNext} class="NormalStroke Amber" d="m19.031 81.34h-2.8709m0-1.0079h2.8709" />
                        <VProtBug bus={this.props.bus} />

                    </VerticalTape>

                    <g ref={this.showBarsRef}>
                        <VLsBar airspeed={this.speedSub} VAlphaProt={this.lastAlphaProtSub} />
                        <VAlphaLimBar airspeed={this.speedSub} />
                    </g>

                    <SpeedTrendArrow airspeed={this.speedSub} instrument={this.props.instrument} />

                    <V1Offtape bus={this.props.bus} />
                </g>

            </>
        );
    }
}

class FlapsSpeedPointBugs extends DisplayComponent<{bus: EventBus}> {
    private greenDotBug = FSComponent.createRef<SVGGElement>();

    private flapsBug = FSComponent.createRef<SVGGElement>();

    private slatBug = FSComponent.createRef<SVGGElement>();

    render(): VNode {
        return (
            <>
                <g id="GreenDotSpeedMarker" ref={this.greenDotBug} style="transform:translate3d(0px, 0px,0px)">
                    <path class="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
                    <path class="ThickStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
                </g>
                <g id="FlapsSlatsBug" ref={this.flapsBug} style="transform: translate3d(0px, 0px,0px)">
                    <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
                    <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">F</text>
                </g>
                <g id="FlapsSlatsBug" ref={this.slatBug} style="transform: translate3d(0px, 0px,0px)">
                    <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
                    <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">S</text>
                </g>
            </>
        );
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        sub.on('flapHandleIndex').whenChanged().handle((f) => {
            if (f === 0) {
                this.greenDotBug.instance.style.visibility = 'visible';
                this.flapsBug.instance.style.visibility = 'hidden';
                this.slatBug.instance.style.visibility = 'hidden';
            } else if (f === 1) {
                this.greenDotBug.instance.style.visibility = 'hidden';
                this.flapsBug.instance.style.visibility = 'hidden';
                this.slatBug.instance.style.visibility = 'visible';
            } else if (f === 2 || f === 3) {
                this.greenDotBug.instance.style.visibility = 'hidden';
                this.flapsBug.instance.style.visibility = 'visible';
                this.slatBug.instance.style.visibility = 'hidden';
            } else {
                this.greenDotBug.instance.style.visibility = 'hidden';
                this.flapsBug.instance.style.visibility = 'hidden';
                this.slatBug.instance.style.visibility = 'hidden';
            }
        });

        sub.on('greenDotSpeed').whenChanged()
            .handle((gd) => {
                this.greenDotBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(gd)}px, 0px`;
            });
        sub.on('slatSpeed').whenChanged()
            .handle((sls) => {
                this.slatBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(sls)}px, 0px`;
            });
        sub.on('fSpeed').whenChanged()
            .handle((fs) => {
                this.flapsBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(fs)}px, 0px`;
            });
    }
}

const getSpeedTapeOffset = (speed: number): number => -speed * DistanceSpacing / ValueSpacing;

export class AirspeedIndicatorOfftape extends DisplayComponent<{ bus: EventBus }> {
    private lowerRef = FSComponent.createRef<SVGGElement>();

    private offTapeRef = FSComponent.createRef<SVGGElement>();

    private offTapeFailedRef = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const subscriber = this.props.bus.getSubscriber<PFDSimvars>();

        subscriber.on('speed').handle((s) => {
            const newVal = new Arinc429Word(s);

            if (!newVal.isNormalOperation()) {
                this.offTapeRef.instance.classList.add('HideLocDiamond');
                this.offTapeFailedRef.instance.classList.remove('HideLocDiamond');
            } else {
                this.offTapeRef.instance.classList.remove('HideLocDiamond');
                this.offTapeFailedRef.instance.classList.add('HideLocDiamond');

                const clampedSpeed = Math.max(Math.min(newVal.value, 660), 30);
                const showLower = clampedSpeed > 72;

                if (showLower) {
                    this.lowerRef.instance.setAttribute('visibility', 'visible');
                } else {
                    this.lowerRef.instance.setAttribute('visibility', 'hidden');
                }
            }
        });
    }

    render(): VNode {
        // const clampedTargetSpeed = Math.max(Math.min(targetSpeed, 660), 30);
        return (
            <>
                <g id="OfftapeFailedGroup" ref={this.offTapeFailedRef}>
                    <path id="SpeedTapeOutlineUpper" class="NormalStroke Red" d="m1.9058 38.086h21.859" />
                    <path id="SpeedTapeOutlineLower" class="NormalStroke Red" d="m1.9058 123.56h21.859" />
                </g>
                <g id="SpeedOfftapeGroup" ref={this.offTapeRef}>
                    <path id="SpeedTapeOutlineUpper" class="NormalStroke White" d="m1.9058 38.086h21.859" />
                    <SpeedTarget bus={this.props.bus} />
                    <path class="Fill Yellow SmallOutline" d="m13.994 80.46v0.7257h6.5478l3.1228 1.1491v-3.0238l-3.1228 1.1491z" />
                    <path class="Fill Yellow SmallOutline" d="m0.092604 81.185v-0.7257h2.0147v0.7257z" />
                    <path id="SpeedTapeOutlineLower" ref={this.lowerRef} class="NormalStroke White" d="m1.9058 123.56h21.859" />
                </g>
            </>

        );
    }
}

class SpeedTrendArrow extends DisplayComponent<{ airspeed: Subscribable<number>, instrument: BaseInstrument }> {
    private refElement = FSComponent.createRef<SVGGElement>();

    private arrowBaseRef = FSComponent.createRef<SVGPathElement>();

    private arrowHeadRef = FSComponent.createRef<SVGPathElement>();

    private offset = Subject.create<string>('');

    private pathString = Subject.create<string>('');

    private lagFilter = new LagFilter(1.6);

    private airspeedAccRateLimiter = new RateLimiter(1.2, -1.2);

    private previousAirspeed = 0;

    private previousTime = (new Date() as any).appTime();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.airspeed.sub((newValue) => {
            const currentTime = (new Date() as any).appTime();
            const deltaTime = this.props.instrument.deltaTime;// (currentTime - this.previousTime);

            // const clamped = newValue.isNormalOperation() ? Math.max(newValue.value, 30) : NaN;
            const clamped = Math.max(newValue, 30);
            const airspeedAcc = (clamped - this.previousAirspeed) / deltaTime * 1000;
            this.previousAirspeed = clamped;

            let filteredAirspeedAcc = this.lagFilter.step(airspeedAcc, deltaTime / 1000);
            filteredAirspeedAcc = this.airspeedAccRateLimiter.step(filteredAirspeedAcc, deltaTime / 1000);
            // const airspeedAcc = this.lagFilter.step(newValue.value, deltaTime);
            // console.log(filteredAirspeedAcc);
            const targetSpeed = filteredAirspeedAcc * 10;
            const sign = Math.sign(filteredAirspeedAcc);

            const offset = -targetSpeed * DistanceSpacing / ValueSpacing;

            let pathString;
            const neutralPos = 80.823;
            if (sign > 0) {
                pathString = `m15.455 ${neutralPos + offset} l -1.2531 2.4607 M15.455 ${neutralPos + offset} l 1.2531 2.4607`;
            } else {
                pathString = `m15.455 ${neutralPos + offset} l 1.2531 -2.4607 M15.455 ${neutralPos + offset} l -1.2531 -2.4607`;
            }

            this.offset.set(`m15.455 80.823v${offset.toFixed(10)}`);

            this.pathString.set(pathString);

            if (Math.abs(targetSpeed) < 1) {
                this.refElement.instance.setAttribute('visibility', 'hidden');
                // this.arrowBaseRef.instance.setAttribute('d', `m15.455 80.823v${offset}`)
                // this.arrowHeadRef.instance.setAttribute('d', pathString)
            } else {
                this.refElement.instance.setAttribute('visibility', 'visible');
            }

            this.previousTime = currentTime;
        });
    }

    render(): VNode | null {
        return (
            <g id="SpeedTrendArrow" ref={this.refElement}>
                <path id="SpeedTrendArrowBase" ref={this.arrowBaseRef} class="NormalStroke Yellow" d={this.offset} />
                <path id="SpeedTrendArrowHead" ref={this.arrowHeadRef} class="NormalStroke Yellow" d={this.pathString} />
            </g>
        );
    }
}

class VLsBar extends DisplayComponent<{ VAlphaProt:Subscribable<number>, airspeed: Subscribable<number> }> {
    private previousTime = (new Date() as any).appTime();

    private lastVls = 0;

    private vlsPath = Subject.create<string>('');

    private lastVAlphaProt: number = 0;

    private lastAirSpeed =0;

    private smoothSpeeds = (vlsDestination: number) => {
        const currentTime = (new Date() as any).appTime();
        const deltaTime = currentTime - this.previousTime;

        const seconds = deltaTime / 1000;
        this.lastVls = SmoothSin(this.lastVls, vlsDestination, 0.5, seconds);
        return this.lastVls;
    };

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.VAlphaProt.sub((alpha) => {
            this.lastVAlphaProt = alpha;

            const airSpeed = this.lastAirSpeed;

            const VLs = this.smoothSpeeds(SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number'));

            const VLsPos = (airSpeed - VLs) * DistanceSpacing / ValueSpacing + 80.818;
            const offset = (VLs - this.lastVAlphaProt) * DistanceSpacing / ValueSpacing;

            this.vlsPath.set(`m19.031 ${VLsPos}h 1.9748v${offset}`);
        });

        this.props.airspeed.sub((airSpeed) => {
            this.lastAirSpeed = airSpeed;

            const VLs = this.smoothSpeeds(SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number'));

            const VLsPos = (airSpeed - VLs) * DistanceSpacing / ValueSpacing + 80.818;
            const offset = (VLs - this.lastVAlphaProt) * DistanceSpacing / ValueSpacing;

            this.vlsPath.set(`m19.031 ${VLsPos}h 1.9748v${offset}`);
        });

        /*     if (VLs - airspeed < -DisplayRange) {
            return null;
        }
     */
    }

    render(): VNode {
        return <path id="VLsIndicator" class="NormalStroke Amber" d={this.vlsPath} />;
    }
}

class VAlphaLimBar extends DisplayComponent<{ airspeed: Subscribable<number> }> {
    private offsetPath = Subject.create<string>('');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.airspeed.sub((airSpeed) => {
            const VAlphalim = SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX', 'number');

            if (VAlphalim - airSpeed < -DisplayRange) {
                return null;
            }

            const delta = airSpeed - DisplayRange - VAlphalim;
            const offset = delta * DistanceSpacing / ValueSpacing;

            this.offsetPath.set(`m19.031 123.56h3.425v${offset}h-3.425z`);
        });
    }

    render(): VNode {
        return <path id="VAlimIndicator" class="Fill Red" d={this.offsetPath} />;
    }
}

class V1Offtape extends DisplayComponent<{ bus: EventBus }> {
    private v1TextRef = FSComponent.createRef<SVGTextElement>();

    private v1Speed = 0;

    onAfterRender() {
        const sub = this.props.bus.getSubscriber<PFDSimvars>();

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
            <text ref={this.v1TextRef} id="V1SpeedText" class="FontTiny Cyan" x="21.271021" y="43.23">0</text>
        );
    }
}

interface SpeedStateInfo {
    targetSpeed: number;
    managedTargetSpeed: number;
    holdValue: number;
    isSpeedManaged: boolean;
    isMach: boolean;
    speed: Arinc429Word;

  }

class SpeedTarget extends DisplayComponent <{ bus: EventBus }> {
    private upperBoundRef = FSComponent.createRef<SVGTextElement>();

    private lowerBoundRef = FSComponent.createRef<SVGTextElement>();

    private speedTargetRef = FSComponent.createRef<SVGPathElement>();

    private currentVisible: NodeReference<SVGElement> = this.upperBoundRef;

    private textSub = Subject.create('0');

    private needsUpdate = true;

    private speedState: SpeedStateInfo = {
        speed: new Arinc429Word(0),
        targetSpeed: 100,
        managedTargetSpeed: 100,
        holdValue: 100,
        isSpeedManaged: false,
        isMach: false,
    }

    private handleManagedSpeed() {
        if (this.speedState.isSpeedManaged) {
            this.currentVisible.instance.classList.replace('Cyan', 'Magenta');
            const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
            this.textSub.set(text);
        } else {
            this.currentVisible.instance.classList.replace('Magenta', 'Cyan');
            const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
            this.textSub.set(text);
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.needsUpdate = true;

        const sub = this.props.bus.getSubscriber<PFDSimvars & SimplaneValues & ClockEvents>();

        sub.on('isSelectedSpeed').whenChanged().handle((s) => {
            this.speedState.isSpeedManaged = !s;
            this.needsUpdate = true;
        });

        sub.on('speed').handle((s) => {
            this.speedState.speed.assign(s);

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

        sub.on('realTime').handle(this.onFrameUpdate.bind(this));
    }

    private onFrameUpdate(_realTime: number): void {
        if (this.needsUpdate === true) {
            this.needsUpdate = false;

            this.determineTargetSpeed();
            const inRange = this.handleLowerUpperBound();
            this.handleManagedSpeed();

            if (inRange) {
                const multiplier = Math.pow(10, 2);
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
        if (this.speedState.speed.value - currentTargetSpeed > DisplayRange) {
            this.upperBoundRef.instance.style.visibility = 'visible';
            this.lowerBoundRef.instance.style.visibility = 'hidden';
            this.speedTargetRef.instance.style.visibility = 'hidden';
            this.currentVisible = this.upperBoundRef;
        } else if (this.speedState.speed.value - currentTargetSpeed < -DisplayRange) {
            this.lowerBoundRef.instance.style.visibility = 'visible';
            this.upperBoundRef.instance.style.visibility = 'hidden';
            this.speedTargetRef.instance.style.visibility = 'hidden';
            this.currentVisible = this.lowerBoundRef;
        } else {
            this.lowerBoundRef.instance.style.visibility = 'hidden';
            this.upperBoundRef.instance.style.visibility = 'hidden';
            this.speedTargetRef.instance.style.visibility = 'visible';
            this.currentVisible = this.speedTargetRef;
            inRange = true;
        }
        return inRange;
    }

    render(): VNode {
        return (
            <>
                <text ref={this.upperBoundRef} id="SelectedSpeedLowerText" class="FontSmallest EndAlign Cyan" x="24.078989" y="128.27917">{this.textSub}</text>
                <text ref={this.lowerBoundRef} id="SelectedSpeedLowerText" class="FontSmallest EndAlign Cyan" x="24.113895" y="36.670692">{this.textSub}</text>
                <path ref={this.speedTargetRef} class="NormalStroke CornerRound Cyan" style="transform: translate3d(0px, 0px, 0px)" d="m19.274 81.895 5.3577 1.9512v-6.0476l-5.3577 1.9512" />
            </>
        );
    }
}

/*  private createBugs(): [] {

    const ValphaMax = getSimVar('L:A32NX_SPEEDS_ALPHA_MAX', 'number');

    const bugs: [(offset: number) => JSX.Element, number][] = [];

    //VMAX
    bugs.push(...BarberpoleIndicator(airspeed, VMax, true, DisplayRange, VMaxBar, 5.040));

    //VPROT
    const showVProt = VMax > 240;
    if (showVProt) {
        bugs.push([VProtBug, VMax + 6]);
    }

    const clampedSpeed = Math.max(Math.min(airspeed, 660), 30);

    // IDK maybe sub on altitude
    if (altitude.isNormalOperation() && altitude.value < 15000 && flapsHandleIndex < 4) {
        const VFENext = getSimVar('L:A32NX_SPEEDS_VFEN', 'number');
        bugs.push([VFENextBugElement, VFENext]);
    }
    return bugs;

} */

export class MachNumber extends DisplayComponent<{bus: EventBus}> {
    private machTextSub = Subject.create('');

    private failedRef = FSComponent.createRef<SVGTextElement>();

    private showMach = false;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<Arinc429Values>();

        sub.on('machAr').handle((mach) => {
            if (!mach.isNormalOperation()) {
                this.machTextSub.set('');
                this.failedRef.instance.style.display = 'inline';
                return;
            }
            this.failedRef.instance.style.display = 'none';
            const machPermille = Math.round(mach.valueOr(0) * 1000);
            if (this.showMach && machPermille < 450) {
                this.showMach = false;
                this.machTextSub.set('');
            } else if (!this.showMach && machPermille > 500) {
                this.showMach = true;
            }
            if (this.showMach) {
                this.machTextSub.set(`.${machPermille}`);
            }
        });
    }

    render(): VNode {
        return (
            <>
                <text ref={this.failedRef} id="MachFailText" class="Blink9Seconds FontLargest StartAlign Red" x="5.4257932" y="136.88908">MACH</text>
                <text id="CurrentMachText" class="FontLargest StartAlign Green" x="5.566751" y="137.03004">{this.machTextSub}</text>
            </>
        );
    }
}

class VProtBug extends DisplayComponent<{bus: EventBus}> {
    private vMaxBug = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        sub.on('vMax').whenChanged().handle((vm) => {
            const showVProt = vm > 240;
            const offset = -(vm + 6) * DistanceSpacing / ValueSpacing;

            if (showVProt) {
                this.vMaxBug.instance.classList.remove('HideLocDiamond');
                this.vMaxBug.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
            } else {
                this.vMaxBug.instance.classList.add('HideLocDiamond');
            }
        });
    }

    render(): VNode {
        return (
            <g id="SpeedProtSymbol" ref={this.vMaxBug}>
                <path class="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
                <path class="NormalStroke Green" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
                <path style="display: none" class="NormalStroke Amber" d="m14.615 79.915 1.7808 1.7818m-1.7808 0 1.7808-1.7818" />
            </g>
        );
    }
}
