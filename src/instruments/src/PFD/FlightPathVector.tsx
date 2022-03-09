import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { getSmallestAngle } from './shared/utils';

const DistanceSpacing = 15;
const ValueSpacing = 10;

interface FlightPathVectorData {
    roll: Arinc429Word;
    pitch: Arinc429Word;
    track: Arinc429Word;
    heading: Arinc429Word;
    vs: Arinc429Word;
    gs: Arinc429Word;
}

export class FlightPathVector extends DisplayComponent<{bus: EventBus, isAttExcessive: Subscribable<boolean>}> {
    private bird = FSComponent.createRef<SVGGElement>();

    private isTrkFpaActive = false;

    private data: FlightPathVectorData = {
        roll: new Arinc429Word(0),
        pitch: new Arinc429Word(0),
        track: new Arinc429Word(0),
        heading: new Arinc429Word(0),
        vs: new Arinc429Word(0),
        gs: new Arinc429Word(0),
    }

    private needsUpdate = false;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents>();

        sub.on('trkFpaActive').whenChanged().handle((a) => {
            this.isTrkFpaActive = a;
            if (this.isTrkFpaActive && !this.props.isAttExcessive.get()) {
                this.moveBird();
                this.bird.instance.classList.remove('HiddenElement');
            } else {
                this.bird.instance.classList.add('HiddenElement');
            }
        });

        sub.on('groundTrackAr').handle((gt) => {
            this.data.track = gt;
            this.needsUpdate = true;
        });

        sub.on('headingAr').handle((gh) => {
            this.data.heading = gh;
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

        sub.on('vs').handle((vs) => {
            this.data.vs = vs;
            this.needsUpdate = true;
        });

        sub.on('gs').handle((gs) => {
            this.data.gs = gs;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle((_t) => {
            if (this.needsUpdate && this.isTrkFpaActive) {
                this.needsUpdate = false;
                this.moveBird();
            }
        });

        this.props.isAttExcessive.sub((a) => {
            if (this.isTrkFpaActive && !a) {
                this.bird.instance.classList.remove('HiddenElement');
            } else {
                this.bird.instance.classList.add('HiddenElement');
            }
        }, true);
    }

    private moveBird() {
        const FPA = Math.atan(this.data.vs.value / this.data.gs.value * 0.009875) * 180 / Math.PI;
        const DA = getSmallestAngle(this.data.track.value, this.data.heading.value);

        const daLimConv = Math.max(Math.min(DA, 21), -21) * DistanceSpacing / ValueSpacing;
        const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(-this.data.pitch.value) - calculateHorizonOffsetFromPitch(FPA));
        const rollCos = Math.cos(this.data.roll.value * Math.PI / 180);
        const rollSin = Math.sin(this.data.roll.value * Math.PI / 180);

        const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
        const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

        this.bird.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
    }

    render(): VNode {
        return (
            <g ref={this.bird} id="bird">
                <svg x="53.4" y="65.3" width="31px" height="31px" version="1.1" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
                    <g>
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
        );
    }
}
