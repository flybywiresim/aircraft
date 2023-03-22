import { FSComponent, DisplayComponent, VNode, Subject, EventBus, MappedSubject } from 'msfssdk';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { Layer } from '../../MsfsAvionicsCommon/Layer';
import { AdirsSimVars } from '../../MsfsAvionicsCommon/SimVarTypes';
import { NDControlEvents } from '../NDControlEvents';
import { Arinc429RegisterSubject } from '../../MsfsAvionicsCommon/Arinc429RegisterSubject';

const PLANE_X_OFFSET = -41;
const PLANE_Y_OFFSET = 0;

export class Airplane extends DisplayComponent<{ bus: EventBus }> {
    private readonly headingWord = Arinc429RegisterSubject.createEmpty();

    private readonly headingWordValid = this.headingWord.map((it) => it.isNormalOperation());

    private readonly showPlane = Subject.create(false);

    private readonly planeVisibility = MappedSubject.create(([headingValid, showPlane]) => headingValid && showPlane, this.headingWordValid, this.showPlane);

    private readonly circleVisibility = MappedSubject.create(([headingValid, showPlane]) => !headingValid && showPlane, this.headingWordValid, this.showPlane);

    private readonly x = Subject.create(0);

    private readonly y = Subject.create(0);

    private readonly rotation = Subject.create(0);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<AdirsSimVars & DmcEvents & NDControlEvents>();

        sub.on('heading').whenChanged().handle((v) => this.headingWord.setWord(v));

        sub.on('set_show_plane').handle((show) => {
            this.showPlane.set(show);
        });

        sub.on('set_plane_x').handle((x) => {
            this.x.set(x);
        });

        sub.on('set_plane_y').handle((y) => {
            this.y.set(y);
        });

        sub.on('set_plane_rotation').handle((rotation) => {
            this.rotation.set(rotation);
        });
    }

    render(): VNode | null {
        return (
            <Layer
                x={this.x.map((x) => x + PLANE_X_OFFSET)}
                y={this.y.map((y) => y + PLANE_Y_OFFSET)}
            >
                <g visibility={this.planeVisibility.map((it) => (it ? 'inherit' : 'hidden'))} transform={this.rotation.map((rotation) => `rotate(${rotation} ${-PLANE_X_OFFSET} 0)`)}>
                    <path
                        class="shadow"
                        stroke-width={8}
                        strokeLinecap="round"
                        d="M 0, 0 h 82 m -41, -29.5 v 70.25 m -11.5, -9.75 h 23.5"
                    />
                    <path
                        class="Yellow"
                        stroke-width={5}
                        strokeLinecap="round"
                        d="M 0, 0 h 82 m -41, -29.5 v 70.25 m -11.5, -9.75 h 23.5"
                    />
                </g>

                <circle
                    class="Red"
                    stroke-width={2}
                    visibility={this.circleVisibility.map((it) => (it ? 'inherit' : 'hidden'))}
                    cx={-PLANE_X_OFFSET}
                    cy={-PLANE_Y_OFFSET}
                    r={9}
                />
            </Layer>
        );
    }
}
