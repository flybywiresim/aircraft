import { FSComponent, DisplayComponent, VNode, Subject, EventBus } from 'msfssdk';
import { Layer } from '../../../MsfsAvionicsCommon/Layer';
import { VorSimVars } from '../../../MsfsAvionicsCommon/providers/VorBusPublisher';

export interface IlsInfoIndicatorProps {
    bus: EventBus,
    index: 1 | 2,
}

export class IlsInfoIndicator extends DisplayComponent<IlsInfoIndicatorProps> {
    private readonly ilsIdent = Subject.create('');

    private readonly ilsFrequency = Subject.create(-1);

    private readonly locCourse = Subject.create(-1);

    private readonly locAvailable = Subject.create(false);

    private readonly frequencyIntTextSub = Subject.create('');

    private readonly frequencyDecimalTextSub = Subject.create('');

    private readonly courseTextSub = Subject.create('');

    private readonly tuningModeTextSub = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const subs = this.props.bus.getSubscriber<VorSimVars>();

        // TODO select correct MMR

        subs.on('nav3Ident').whenChanged().handle((value) => {
            this.ilsIdent.set(value);
        });

        subs.on('nav3Frequency').whenChanged().handle((value) => {
            this.ilsFrequency.set(value);
        });

        subs.on('nav3Localizer').whenChanged().handle((value) => {
            this.locCourse.set(value);
        });

        subs.on('localizerValid').whenChanged().handle((value) => {
            this.locAvailable.set(value);
        });

        this.ilsFrequency.sub((frequency) => {
            const [int, dec] = frequency.toFixed(2).split('.', 2);

            this.frequencyIntTextSub.set(int);
            this.frequencyDecimalTextSub.set(dec);
        }, true);

        this.locCourse.sub((course) => {
            this.courseTextSub.set(course > 0 ? Math.round(course).toString().padStart(3, '0') : '---');
        }, true);
    }

    private readonly visibilityFn = (v) => (v ? 'inherit' : 'hidden');

    render(): VNode | null {
        return (
            <Layer x={748} y={28}>
                <text x={-102} y={0} font-size={25} class="White" text-anchor="end">
                    ILS
                    {this.props.index.toString()}
                </text>

                <g visibility={this.locAvailable.map(this.visibilityFn)}>
                    <text x={0} y={0} font-size={25} class="White" text-anchor="end">
                        {this.frequencyIntTextSub}
                        <tspan font-size={20}>
                            .
                            {this.frequencyDecimalTextSub}
                        </tspan>
                    </text>
                </g>

                <text x={-56} y={30} font-size={25} class="White" text-anchor="end">CRS</text>
                <text x={20} y={30} font-size={25} text-anchor="end">
                    <tspan class="Magenta">{this.courseTextSub}</tspan>
                    <tspan class="Cyan">&deg;</tspan>
                </text>

                <g visibility={this.ilsFrequency.map((v) => v > 0).map(this.visibilityFn)}>
                    <text x={-80} y={58} font-size={20} class="Magenta" text-anchor="end" text-decoration="underline">
                        {this.tuningModeTextSub}
                    </text>
                </g>

                <text x={0} y={60} font-size={25} class="Magenta" text-anchor="end">
                    {this.ilsIdent}
                </text>
            </Layer>
        );
    }
}
