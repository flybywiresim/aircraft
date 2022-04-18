import { FSComponent, DisplayComponent, Subscribable, VNode } from 'msfssdk';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

const PLANE_X_OFFSET = -41;
const PLANE_Y_OFFSET = 0;

export class Airplane extends DisplayComponent<{ available: Subscribable<boolean>, x: number, y: number, rotation: Subscribable<Degrees> }> {
    render(): VNode | null {
        return (
            <Layer x={this.props.x + PLANE_X_OFFSET} y={this.props.y + PLANE_Y_OFFSET}>
                <g visibility={this.props.available.map((it) => (it ? 'visible' : 'hidden'))} transform={this.props.rotation.map((rotation) => `rotate(${rotation})`)}>
                    <path
                        class="shadow"
                        strokeWidth={6.5}
                        strokeLinecap="round"
                        d="M 0, 0 h 82 m -41, -29.5 v 70.25 m -11.5, -9.75 h 23.5"
                    />
                    <path
                        class="Yellow"
                        strokeWidth={5}
                        strokeLinecap="round"
                        d="M 0, 0 h 82 m -41, -29.5 v 70.25 m -11.5, -9.75 h 23.5"
                    />
                </g>
            </Layer>
        );
    }
}
