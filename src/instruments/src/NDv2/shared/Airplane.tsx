import { FSComponent, DisplayComponent, Subscribable, VNode, Subject, EventBus } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { Layer } from '../../MsfsAvionicsCommon/Layer';
import { AdirsSimVars } from '../../MsfsAvionicsCommon/SimVarTypes';

const PLANE_X_OFFSET = -41;
const PLANE_Y_OFFSET = 0;

export class Airplane extends DisplayComponent<{ bus: EventBus, x: Subscribable<number>, y: Subscribable<number>, rotation: Subscribable<Degrees> }> {
    private readonly headingWord = Subject.create(Arinc429Word.empty());

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars>();

        sub.on('heading').whenChanged().handle((v) => this.headingWord.set(new Arinc429Word(v)));
    }

    render(): VNode | null {
        return (
            <Layer
                x={this.props.x.map((x) => x + PLANE_X_OFFSET)}
                y={this.props.y.map((y) => y + PLANE_Y_OFFSET)}
            >
                <g visibility={this.headingWord.map((it) => (it.isNormalOperation() ? 'inherit' : 'hidden'))} transform={this.props.rotation.map((rotation) => `rotate(${rotation})`)}>
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

                <circle
                    class="Red"
                    strokeWidth={2}
                    visibility={this.headingWord.map((it) => (it.isNormalOperation() ? 'hidden' : 'inherit'))}
                    cx={-PLANE_X_OFFSET}
                    cy={-PLANE_Y_OFFSET}
                    r={9}
                />
            </Layer>
        );
    }
}
