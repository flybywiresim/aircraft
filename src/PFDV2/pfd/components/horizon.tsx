import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { Arinc429Word } from '../shared/arinc429';

import {
    calculateHorizonOffsetFromPitch,
    calculateVerticalOffsetFromRoll,
    HorizontalTape,
    LagFilter,
} from './PFDUtils';
import { PFDSimvars } from '../shared/PFDSimvarPublisher';
import { Arinc429Values } from '../shared/ArincValueProvider';
import { getSmallestAngle } from '../shared/utils';

const DisplayRange = 35;
const DistanceSpacing = 15;
const ValueSpacing = 10;

export class HeadingBug extends DisplayComponent<{offset: number}> {
    render(): VNode | null {
        return (
            <g id="HorizonHeadingBug" transform={`translate(${this.props.offset} 0)`}>
                <path class="ThickOutline" d="m68.906 80.823v-9.0213" />
                <path class="ThickStroke Cyan" d="m68.906 80.823v-9.0213" />
            </g>
        );
    }
}

interface HorizonProps {
    bus: EventBus;
    instrument: BaseInstrument;
    heading: Arinc429Word;
    isOnGround: boolean;
    radioAlt: number;
    decisionHeight: number;
    selectedHeading: number;
    FDActive: boolean;
    isAttExcessive: boolean;
}

export class Horizon extends DisplayComponent<HorizonProps> {
    private pitchGroupRef = FSComponent.createRef<SVGGElement>();

    private rollGroupRef = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const apfd = this.props.bus.getSubscriber<Arinc429Values>();

        apfd.on('pitchAr').handle((pitch) => {
            const multiplier = Math.pow(10, 2);
            const currentValueAtPrecision = Math.round(pitch.value * multiplier) / multiplier;
            if (pitch.isNormalOperation()) {
                this.pitchGroupRef.instance.style.display = 'block';

                this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(-currentValueAtPrecision)}px, 0px)`;
            } else {
                this.pitchGroupRef.instance.style.display = 'none';
            }
        });

        apfd.on('rollAr').handle((roll) => {
            const multiplier = Math.pow(10, 3);
            const currentValueAtPrecision = Math.round(roll.value * multiplier) / multiplier;
            if (roll.isNormalOperation()) {
                this.rollGroupRef.instance.style.display = 'block';

                this.rollGroupRef.instance.setAttribute('transform', `rotate(${currentValueAtPrecision} 68.814 80.730)`);
            } else {
                this.rollGroupRef.instance.style.display = 'none';
            }
        });
    }

    render(): VNode {
        /*   const yOffset = Math.max(Math.min(calculateHorizonOffsetFromPitch(-this.props.pitch.value), 31.563), -31.563); */

        const bugs: [number][] = [];
        if (!Number.isNaN(this.props.selectedHeading) && !this.props.FDActive) {
            bugs.push([this.props.selectedHeading]);
        }

        return (
            <g id="RollGroup" ref={this.rollGroupRef} style="display:none">
                <g id="PitchGroup" ref={this.pitchGroupRef}>
                    <path d="m23.906 80.823v-160h90v160z" class="SkyFill" />
                    <path d="m113.91 223.82h-90v-143h90z" class="EarthFill" />

                    {/* If you're wondering why some paths have an "h0" appended, it's to work around a
                rendering bug in webkit, where paths with only one line is rendered blurry. */}

                    <g class="NormalStroke White">
                        <path d="m66.406 85.323h5h0" />
                        <path d="m64.406 89.823h9h0" />
                        <path d="m66.406 94.073h5h0" />
                        <path d="m59.406 97.823h19h0" />
                        <path d="m64.406 103.82h9h0" />
                        <path d="m59.406 108.82h19h0" />
                        <path d="m55.906 118.82h26h0" />
                        <path d="m52.906 138.82h32h0" />
                        <path d="m47.906 168.82h42h0" />
                        <path d="m66.406 76.323h5h0" />
                        <path d="m64.406 71.823h9h0" />
                        <path d="m66.406 67.323h5h0" />
                        <path d="m59.406 62.823h19h0" />
                        <path d="m66.406 58.323h5h0" />
                        <path d="m64.406 53.823h9h0" />
                        <path d="m66.406 49.323h5h0" />
                        <path d="m59.406 44.823h19h0" />
                        <path d="m66.406 40.573h5h0" />
                        <path d="m64.406 36.823h9h0" />
                        <path d="m66.406 33.573h5h0" />
                        <path d="m55.906 30.823h26h0" />
                        <path d="m52.906 10.823h32h0" />
                        <path d="m47.906-19.177h42h0" />
                    </g>

                    <g id="PitchProtUpper" class="NormalStroke Green">
                        <path d="m51.506 31.523h4m-4-1.4h4" />
                        <path d="m86.306 31.523h-4m4-1.4h-4" />
                    </g>
                    <g id="PitchProtLostUpper" style="display: none" class="NormalStroke Amber">
                        <path d="m52.699 30.116 1.4142 1.4142m-1.4142 0 1.4142-1.4142" />
                        <path d="m85.114 31.53-1.4142-1.4142m1.4142 0-1.4142 1.4142" />
                    </g>
                    <g id="PitchProtLower" class="NormalStroke Green">
                        <path d="m59.946 104.52h4m-4-1.4h4" />
                        <path d="m77.867 104.52h-4m4-1.4h-4" />
                    </g>
                    <g id="PitchProtLostLower" style="display: none" class="NormalStroke Amber">
                        <path d="m61.199 103.12 1.4142 1.4142m-1.4142 0 1.4142-1.4142" />
                        <path d="m76.614 104.53-1.4142-1.4142m1.4142 0-1.4142 1.4142" />
                    </g>

                    <path d="m68.906 121.82-8.0829 14h2.8868l5.1962-9 5.1962 9h2.8868z" class="NormalStroke Red" />
                    <path d="m57.359 163.82 11.547-20 11.547 20h-4.0414l-7.5056-13-7.5056 13z" class="NormalStroke Red" />
                    <path d="m71.906 185.32v3.5h15l-18-18-18 18h15v-3.5h-6.5l9.5-9.5 9.5 9.5z" class="NormalStroke Red" />
                    <path d="m60.824 13.823h2.8868l5.1962 9 5.1962-9h2.8868l-8.0829 14z" class="NormalStroke Red" />
                    <path d="m61.401-13.177h-4.0414l11.547 20 11.547-20h-4.0414l-7.5056 13z" class="NormalStroke Red" />
                    <path d="m68.906-26.177-9.5-9.5h6.5v-3.5h-15l18 18 18-18h-15v3.5h6.5z" class="NormalStroke Red" />

                    <TailstrikeIndicator bus={this.props.bus} />

                    <path d="m23.906 80.823h90h0" class="NormalOutline" />
                    <path d="m23.906 80.823h90h0" class="NormalStroke White" />

                    <g class="FontSmall White Fill EndAlign">
                        <text x="55.729935" y="64.812828">10</text>
                        <text x="88.618317" y="64.812714">10</text>
                        <text x="54.710766" y="46.931034">20</text>
                        <text x="89.564583" y="46.930969">20</text>
                        <text x="50.867237" y="32.910896">30</text>
                        <text x="93.408119" y="32.910839">30</text>
                        <text x="48.308414" y="12.690886">50</text>
                        <text x="96.054962" y="12.690853">50</text>
                        <text x="43.050652" y="-17.138285">80</text>
                        <text x="101.48304" y="-17.138248">80</text>
                        <text x="55.781109" y="99.81395">10</text>
                        <text x="88.669487" y="99.813919">10</text>
                        <text x="54.645519" y="110.8641">20</text>
                        <text x="89.892426" y="110.86408">20</text>
                        <text x="51.001217" y="120.96314">30</text>
                        <text x="93.280037" y="120.96311">30</text>
                        <text x="48.220913" y="140.69778">50</text>
                        <text x="96.090324" y="140.69786">50</text>
                        <text x="43.125065" y="170.80962">80</text>
                        <text x="101.38947" y="170.80959">80</text>
                    </g>
                </g>
                <path d="m40.952 49.249v-20.562h55.908v20.562z" class="NormalOutline SkyFill" />
                <path d="m40.952 49.249v-20.562h55.908v20.562z" class="NormalStroke White" />
                {/* Headingtape 2 */ }

                <SideslipIndicator bus={this.props.bus} instrument={this.props.instrument} />
                <RisingGround bus={this.props.bus} />
                <HorizontalTape
                    type="horizon"
                    bus={this.props.bus}
                    bugs={bugs}
                    displayRange={DisplayRange}
                    valueSpacing={ValueSpacing}
                    distanceSpacing={DistanceSpacing}
                />

                {/*    {this.props.heading.isNormalOperation()
                && (
                    <HorizontalTape
                        //graduationElementFunction={TickFunction}
                        bugs={bugs}
                        yOffset={yOffset}
                        displayRange={DisplayRange}
                        distanceSpacing={DistanceSpacing}
                        valueSpacing={ValueSpacing}
                        heading={this.props.heading}
                    />
                )} */}
                {/*                 {!this.props.isAttExcessive&&  */}
                <RadioAltAndDH bus={this.props.bus} />
                {/* {!this.props.isAttExcessive */}
                <FlightPathVector bus={this.props.bus} />
            </g>
        );
    }
}

class FlightPathVector extends DisplayComponent<{bus: EventBus}> {
    private isActive = false;

    private roll = new Arinc429Word(0);

    private pitch = new Arinc429Word(0);

    private bird = FSComponent.createRef<SVGGElement>();

    private wings = FSComponent.createRef<SVGGElement>();

    private birdPath = FSComponent.createRef<SVGGElement>();

    private birdPathWings = FSComponent.createRef<SVGGElement>();

    private aoa = 0;

    private groundTrack = 0;

    private groundHeading = 0;

    private activeVerticalMode = 0;

    private activeLateralMode = 0;

    private FDPitchOrder = 0;

    private FDRollOrder = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();
        const arSub = this.props.bus.getSubscriber<Arinc429Values>();

        sub.on('trkFpaActive').handle((a) => {
            this.isActive = a;
            if (this.isActive) {
                this.bird.instance.style.visibility = 'visible';
                this.birdPath.instance.style.visibility = 'visible';
            } else {
                this.bird.instance.style.visibility = 'hidden';
                this.birdPath.instance.style.visibility = 'hidden';
            }
        });

        sub.on('groundTrackTrue').handle((gt) => {
            this.groundTrack = gt;
            this.moveBird();
        });

        sub.on('groundHeadingTrue').handle((gh) => {
            this.groundHeading = gh;
            this.moveBird();
        });

        sub.on('aoa').handle((aoa) => {
            this.aoa = aoa;
            this.moveBird();
        });

        sub.on('activeVerticalMode').whenChanged().handle((vm) => {
            this.activeLateralMode = vm;
            this.handlePath();
        });

        sub.on('activeLateralMode').whenChanged().handle((lm) => {
            this.activeLateralMode = lm;
            this.handlePath();
        });

        sub.on('fdPitch').whenChanged().handle((fdp) => {
            this.FDPitchOrder = fdp;
            this.moveBird();
        });

        sub.on('fdBank').handle((fdr) => {
            this.FDRollOrder = fdr;
            const FDRollOffset = (this.FDRollOrder - this.roll.value) * 0.77;

            this.birdPathWings.instance.style.transform = `rotate(${FDRollOffset} 15.5 15.5)`;

            this.moveBird();
        });

        arSub.on('rollAr').handle((r) => {
            this.roll = r;
            this.wings.instance.style.transform = `rotate(${-this.roll.value} 15.5 15.5)`;
        });

        arSub.on('pitchAr').handle((p) => {
            this.pitch = p;
            this.moveBird();
        });
    }

    private handlePath() {
        const showLateralFD = this.activeLateralMode !== 0 && this.activeLateralMode !== 34 && this.activeLateralMode !== 40;
        const showVerticalFD = this.activeVerticalMode !== 0 && this.activeVerticalMode !== 34;
        if (!showVerticalFD && !showLateralFD) {
            this.birdPath.instance.style.visibility = 'hidden';
        } else {
            this.birdPath.instance.style.visibility = 'visible';
        }
    }

    private moveBird() {
        if (this.isActive) {
            const FPA = this.pitch.value - (Math.cos(this.roll.value * Math.PI / 180) * this.aoa);
            const DA = getSmallestAngle(this.groundTrack, this.groundHeading);

            const xOffset = Math.max(Math.min(DA, 21), -21) * DistanceSpacing / ValueSpacing;
            const yOffset = calculateHorizonOffsetFromPitch(this.pitch.value) - calculateHorizonOffsetFromPitch(FPA);
            const yOffsetPath = calculateHorizonOffsetFromPitch(this.pitch.value) - calculateHorizonOffsetFromPitch(FPA) + (this.FDPitchOrder) * 0.44;

            this.bird.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
            this.birdPath.instance.style.transform = `translate3d(${xOffset}px, ${yOffsetPath}px, 0px)`;
        }
    }

    render(): VNode {
        return (
            <>
                <g ref={this.bird}>
                    <svg x="53.4" y="65.3" width="31px" height="31px" version="1.1" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
                        <g ref={this.wings}>
                            <path
                                class="NormalOutline"
                                // eslint-disable-next-line max-len
                                d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
                            />
                            <path class="ThickOutline" d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199" />
                            <path
                                class="NormalStroke Green"
                                // eslint-disable-next-line max-len
                                d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
                            />
                            <path class="ThickStroke Green" d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199" />
                        </g>

                    </svg>
                </g>
                <g ref={this.birdPath}>
                    <svg x="53.4" y="65.3" width="31px" height="31px" version="1.1" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
                        <g ref={this.birdPathWings} class="CornerRound">
                            <path
                                class="NormalOutline"
                                // eslint-disable-next-line max-len
                                d="m16.507 15.501a1.0074 1.008 0 1 0-2.0147 0 1.0074 1.008 0 1 0 2.0147 0zm7.5551 0 6.5478-1.5119v3.0238l-6.5478-1.5119m-17.125 0-6.5478-1.5119v3.0238l6.5478-1.5119h17.125"
                            />
                            <path
                                class="NormalStroke Green"
                                // eslint-disable-next-line max-len
                                d="m16.507 15.501a1.0074 1.008 0 1 0-2.0147 0 1.0074 1.008 0 1 0 2.0147 0zm7.5551 0 6.5478-1.5119v3.0238l-6.5478-1.5119m-17.125 0-6.5478-1.5119v3.0238l6.5478-1.5119h17.125"
                            />
                        </g>
                    </svg>
                </g>
            </>
        );
    }
}

class TailstrikeIndicator extends DisplayComponent<{bus: EventBus}> {
    private tailStrike = FSComponent.createRef<SVGPathElement>();

    private needsUpdate = false;

    private tailStrikeConditions = {
        altitude: 0,
        speed: 0,
        tla1: 0,
        tla2: 0,
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents>();

        sub.on('radio_alt').handle((ra) => {
            this.tailStrikeConditions.altitude = ra;
            this.needsUpdate = true;
        });

        sub.on('altitudeAr').handle((a) => {
            this.tailStrikeConditions.altitude = a.value;
            this.needsUpdate = true;
        });

        sub.on('tla1').whenChanged().handle((tla) => {
            this.tailStrikeConditions.tla1 = tla;
            this.needsUpdate = true;
        });
        sub.on('tla2').whenChanged().handle((tla) => {
            this.tailStrikeConditions.tla2 = tla;
            this.needsUpdate = true;
        });

        sub.on('speedAr').whenChanged().handle((speed) => {
            this.tailStrikeConditions.speed = speed.value;
            this.needsUpdate = true;
        });

        sub.on('realTime').onlyAfter(2).handle(this.hideShow.bind(this));
    }

    private hideShow(_time: number) {
        if (this.tailStrikeConditions.altitude > 400 || this.tailStrikeConditions.speed < 50 || this.tailStrikeConditions.tla1 >= 35 || this.tailStrikeConditions.tla2 >= 35) {
            this.tailStrike.instance.style.display = 'none';
        } else {
            this.tailStrike.instance.style.display = 'inline';
        }
    }

    render(): VNode {
        return (
            <path ref={this.tailStrike} id="TailstrikeWarning" d="m72.682 50.223h2.9368l-6.7128 8-6.7128-8h2.9368l3.7759 4.5z" class="NormalStroke Amber" />
        );
    }
    // should also not be displayed when thrust levers are at or above FLX/MCT, but I don't know if there is a simvar
    // for that
    /*  if (getSimVar('PLANE ALT ABOVE GROUND MINUS CG', 'feet') > 400
        || getSimVar('AIRSPEED INDICATED', 'knots') < 50
        || getSimVar('L:A32NX_AUTOTHRUST_TLA:1', 'number') >= 35
        || getSimVar('L:A32NX_AUTOTHRUST_TLA:2', 'number') >= 35) {
        return null;
    } */
}

class RadioAltAndDH extends DisplayComponent<{ bus: EventBus }> {
    private visibilitySub = Subject.create('visible');

    private offsetSub = Subject.create('');

    private radioAltClassSub = Subject.create('');

    private dhClassSub = Subject.create('');

    private dhVisibilitySub = Subject.create('hidden');

    private textSub = Subject.create('');

    private roll = new Arinc429Word(0);

    private dh = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        const asub = this.props.bus.getSubscriber<Arinc429Values>();

        asub.on('rollAr').handle((roll) => {
            this.roll = roll;
        });

        sub.on('dh').handle((dh) => {
            this.dh = dh;
        });

        sub.on('radio_alt').handle((ra) => {
            if (ra > 2500) {
                this.visibilitySub.set('hidden');
            } else {
                this.visibilitySub.set('visible');

                const verticalOffset = calculateVerticalOffsetFromRoll(this.roll.value);

                this.offsetSub.set(`translate(0 ${-verticalOffset})`);

                const size = (ra > 400 ? 'FontLarge' : 'FontLargest');
                const DHValid = this.dh >= 0;
                const color = (ra > 400 || (ra > this.dh + 100 && DHValid) ? 'Green' : 'Amber');

                this.radioAltClassSub.set(`${size} ${color} MiddleAlign TextOutline`);

                let text = '';

                if (ra < 5) {
                    text = Math.round(ra).toString();
                } else if (ra <= 50) {
                    text = (Math.round(ra / 5) * 5).toString();
                } else if (ra > 50 || (ra > this.dh + 100 && DHValid)) {
                    text = (Math.round(ra / 10) * 10).toString();
                }
                this.textSub.set(text);

                if (ra <= this.dh) {
                    this.dhClassSub.set('FontLargest Amber EndAlign Blink9Seconds TextOutline');
                    this.dhVisibilitySub.set('visible');
                } else {
                    this.dhClassSub.set('FontLargest Amber EndAlign');
                    this.dhVisibilitySub.set('hidden');
                }
            }
        });
    }

    render(): VNode {
        return (
            <g visibility={this.visibilitySub} id="DHAndRAGroup" transform={this.offsetSub}>
                <text id="AttDHText" x="73.511879" y="113.19068" visibility={this.dhVisibilitySub} class={this.dhClassSub}>DH</text>
                <text id="RadioAlt" x="69.202454" y="119.76205" class={this.radioAltClassSub}>{this.textSub}</text>
            </g>
        );
    }
}

interface SideslipIndicatorProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

class SideslipIndicator extends DisplayComponent<SideslipIndicatorProps> {
    private sideslipIndicatorFilter = new LagFilter(0.8);

    private classNameSub = Subject.create('Yellow');

    private rollTriangleSub = Subject.create('');

    private slideSlipSub = Subject.create('');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<Arinc429Values>();

        sub.on('rollAr').handle((roll) => {
            const verticalOffset = calculateVerticalOffsetFromRoll(roll.value);
            const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'number');
            let offset = 0;
            if (isOnGround) {
                // on ground, lateral g is indicated. max 0.3g, max deflection is 15mm
                const latAcc = SimVar.GetSimVarValue('ACCELERATION BODY X', 'G Force');
                const accInG = Math.min(0.3, Math.max(-0.3, latAcc));
                offset = -accInG * 15 / 0.3;
            } else {
                const beta = SimVar.GetSimVarValue('INCIDENCE BETA', 'degrees');
                const betaTarget = SimVar.GetSimVarValue('L:A32NX_BETA_TARGET', 'Number');
                offset = Math.max(Math.min(beta - betaTarget, 15), -15);
            }

            const betaTargetActive = SimVar.GetSimVarValue('L:A32NX_BETA_TARGET_ACTIVE', 'Number') === 1;
            const SIIndexOffset = this.sideslipIndicatorFilter.step(offset, this.props.instrument.deltaTime / 1000);

            this.rollTriangleSub.set(`translate(0 ${verticalOffset})`);
            this.classNameSub.set(`${betaTargetActive ? 'Cyan' : 'Yellow'}`);
            this.slideSlipSub.set(`translate(${SIIndexOffset} 0)`);
        });
    }

    render(): VNode {
        return (
            <g id="RollTriangleGroup" transform={this.rollTriangleSub} class="NormalStroke Yellow CornerRound">
                <path d="m66.074 43.983 2.8604-4.2333 2.8604 4.2333z" />
                <path
                    id="SideSlipIndicator"
                    transform={this.slideSlipSub}
                    d="m73.974 47.208-1.4983-2.2175h-7.0828l-1.4983 2.2175z"
                />
            </g>
        );
    }
}

class RisingGround extends DisplayComponent<{ bus: EventBus }> {
    private lastRadioAlt = 0;

    private lastPitch = new Arinc429Word(0);

    private transformStringSub = Subject.create('');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        const asub = this.props.bus.getSubscriber<Arinc429Values>();

        asub.on('pitchAr').handle((pitch) => {
            this.lastPitch = pitch;

            const targetPitch = -0.1 * this.lastRadioAlt;

            const targetOffset = Math.max(Math.min(calculateHorizonOffsetFromPitch((-pitch.value) - targetPitch) - 31.563, 0), -63.093);
            this.transformStringSub.set(`translate(0 ${targetOffset})`);
        });

        sub.on('radio_alt').handle((p) => {
            const radio_alt = p;
            this.lastRadioAlt = radio_alt;

            const targetPitch = -0.1 * radio_alt;

            const targetOffset = Math.max(Math.min(calculateHorizonOffsetFromPitch((-this.lastPitch.value) - targetPitch) - 31.563, 0), -63.093);
            this.transformStringSub.set(`translate(0 ${targetOffset})`);
        });
    }

    render(): VNode {
        return (
            <g id="HorizonGroundRectangle" transform={this.transformStringSub}>
                <path d="m113.95 157.74h-90.08v-45.357h90.08z" class="NormalOutline EarthFill" />
                <path d="m113.95 157.74h-90.08v-45.357h90.08z" class="NormalStroke White" />
            </g>
        );
    }
}
