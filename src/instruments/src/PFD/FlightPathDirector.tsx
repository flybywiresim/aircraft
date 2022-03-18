import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { getDisplayIndex } from './PFD';
import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

const DistanceSpacing = 15;
const ValueSpacing = 10;

interface FlightPathVectorData {
    roll: Arinc429Word;
    pitch: Arinc429Word;
    fpa: Arinc429Word;
    da: Arinc429Word;
    activeVerticalMode: number;
    activeLateralMode: number;
    fdRoll: number;
    fdPitch: number;
    fdActive: boolean;
}

export class FlightPathDirector extends DisplayComponent<{bus: EventBus, isAttExcessive: Subscribable<boolean>}> {
    private data: FlightPathVectorData = {
        roll: new Arinc429Word(0),
        pitch: new Arinc429Word(0),
        fpa: new Arinc429Word(0),
        da: new Arinc429Word(0),
        fdPitch: 0,
        fdRoll: 0,
        fdActive: true,
        activeLateralMode: 0,
        activeVerticalMode: 0,
    }

    private isTrkFpaActive = false;

    private needsUpdate = false;

    private isVisible = false;

    private birdPath = FSComponent.createRef<SVGGElement>();

    private birdPathWings = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents>();

        sub.on('fd1Active').whenChanged().handle((fd) => {
            if (getDisplayIndex() === 1) {
                this.data.fdActive = fd;
                this.needsUpdate = true;
            }
        });

        sub.on('fd2Active').whenChanged().handle((fd) => {
            if (getDisplayIndex() === 2) {
                this.data.fdActive = fd;
                this.needsUpdate = true;
            }
        });
        sub.on('trkFpaActive').whenChanged().handle((a) => {
            this.isTrkFpaActive = a;
            this.needsUpdate = true;
        });

        sub.on('fpa').handle((fpa) => {
            this.data.fpa = fpa;
            this.needsUpdate = true;
        });

        sub.on('da').handle((da) => {
            this.data.da = da;
            this.needsUpdate = true;
        });

        sub.on('activeVerticalMode').whenChanged().handle((vm) => {
            this.data.activeLateralMode = vm;
            this.needsUpdate = true;
        });

        sub.on('activeLateralMode').whenChanged().handle((lm) => {
            this.data.activeLateralMode = lm;
            this.needsUpdate = true;
        });

        sub.on('fdPitch').handle((fdp) => {
            this.data.fdPitch = fdp;
            this.needsUpdate = true;
        });

        sub.on('fdBank').handle((fdr) => {
            this.data.fdRoll = fdr;
            this.needsUpdate = true;
        });

        sub.on('rollAr').handle((r) => {
            this.data.roll = r;
            this.needsUpdate = true;
        });

        sub.on('pitchAr').handle((p) => {
            this.data.pitch = p;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle((_t) => {
            this.handlePath();
            if (this.needsUpdate && this.isVisible) {
                this.moveBird();
            }
        });

        this.props.isAttExcessive.sub((_a) => {
            this.needsUpdate = true;
        }, true);
    }

    private handlePath() {
        const showLateralFD = this.data.activeLateralMode !== 0 && this.data.activeLateralMode !== 34 && this.data.activeLateralMode !== 40;
        const showVerticalFD = this.data.activeVerticalMode !== 0 && this.data.activeVerticalMode !== 34;
        const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();

        if (!showVerticalFD && !showLateralFD || !this.isTrkFpaActive
            || !this.data.fdActive || !daAndFpaValid || this.props.isAttExcessive.get()) {
            this.birdPath.instance.style.visibility = 'hidden';
            this.isVisible = false;
        } else {
            this.birdPath.instance.style.visibility = 'visible';
            this.isVisible = true;
        }
    }

    private moveBird() {
        if (this.data.fdActive && this.isTrkFpaActive) {
            const FDRollOrder = this.data.fdRoll;
            const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
            const FDPitchOrder = this.data.fdPitch;
            const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 22.5), -22.5) * 1.9;

            const daLimConv = Math.max(Math.min(this.data.da.value, 21), -21) * DistanceSpacing / ValueSpacing;
            const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(-this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value));
            const rollCos = Math.cos(this.data.roll.value * Math.PI / 180);
            const rollSin = Math.sin(this.data.roll.value * Math.PI / 180);

            const FDRollOffset = FDRollOrderLim * 0.77;
            const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
            const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

            const xOffset = xOffsetFpv - FDPitchOrderLim * rollSin;
            const yOffset = yOffsetFpv + FDPitchOrderLim * rollCos;

            this.birdPath.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
            this.birdPathWings.instance.setAttribute('transform', `rotate(${FDRollOffset} 15.5 15.5)`);
        }
        this.needsUpdate = false;
    }

    render(): VNode {
        return (

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

        );
    }
}
