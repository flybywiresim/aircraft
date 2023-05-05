import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { PitchScale } from 'instruments/src/ISIS/PitchScale';
import { RollIndex } from 'instruments/src/ISIS/RollIndex';
import { RollScale } from 'instruments/src/ISIS/RollScale';
import { ISISSimvars } from './shared/ISISSimvarPublisher';
/* import { PitchScale } from './PitchScale';
import { RollScale } from './RollScale';
import { RollIndex } from './RollIndex';
import { Att10sFlag } from './Att10sFlag'; */

export class ArtificialHorizon extends DisplayComponent<{bus: EventBus}> {
    private pitchRef = FSComponent.createRef<SVGGElement>();

    private rollRef = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ISISSimvars>();

        const pitchDegPixels = 7.4;

        sub.on('pitch').atFrequency(10).handle((pitch) => {
            const pitchShift = -pitch * pitchDegPixels;

            this.pitchRef.instance.style.transform = `translate3d(0px, ${pitchShift}px, 0px)`;
        });

        sub.on('roll').atFrequency(10).handle((roll) => {
            this.rollRef.instance.setAttribute('transform', `rotate(${roll} 256 256)`);
        });
    }

    render(): VNode {
        return (
        /*        <Att10sFlag> */
            <g id="ArtificialHorizon">
                <g id="RollGroup" ref={this.rollRef}>
                    <g id="PitchGroup" ref={this.pitchRef}>
                        <rect id="Sky" x={-256} y={-498} width={1024} height={768} class="sky" />
                        <rect id="Earth" x={-256} y={270} width={1024} height={768} class="earth" />
                        <PitchScale />
                    </g>
                    <RollIndex bus={this.props.bus} />
                    <rect x={-256} y={400} width={1024} height={396} class="earth" />
                </g>
                <RollScale />
                <path id="Mask" class="mask" d="M 0 0 h 512 v 512 h -512 z M 108 120.5 c 50 -30 246 -30 296 0 v 271 c -50 30 -246 30 -296 0 z" />
            </g>
        /*   </Att10sFlag> */
        );
    }
}
