import { FSComponent, ComponentProps, DisplayComponent, EventBus, Subject, VNode } from 'msfssdk';
import { TuningMode } from '@fmgc/radionav';
import { Layer } from 'instruments/src/MsfsAvionicsCommon/Layer';
import { VorSimVars } from '../../../MsfsAvionicsCommon/providers/VorBusPublisher';

export interface VorInfoIndicatorProps extends ComponentProps {
    bus: EventBus,
    index: 1 | 2,
}

export class VorInfoIndicator extends DisplayComponent<VorInfoIndicatorProps> {
    private readonly vorIdent = Subject.create('');

    private readonly vorFrequency = Subject.create(-1);

    private readonly vorCourse = Subject.create(-1);

    private readonly vorTuningMode = Subject.create<TuningMode>(TuningMode.Manual);

    private readonly vorAvailable = Subject.create(false);

    private readonly frequencyIntTextSub = Subject.create('');

    private readonly frequencyDecimalTextSub = Subject.create('');

    private readonly courseTextSub = Subject.create('');

    private readonly tuningModeTextSub = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const subs = this.props.bus.getSubscriber<VorSimVars>();

        subs.on(`nav${this.props.index}Ident`).whenChanged().handle((value) => {
            this.vorIdent.set(value);
        });

        subs.on(`nav${this.props.index}Frequency`).whenChanged().handle((value) => {
            this.vorFrequency.set(value);
        });

        subs.on(`nav${this.props.index}Obs`).whenChanged().handle((value) => {
            this.vorCourse.set(value);
        });

        subs.on(`nav${this.props.index}TuningMode`).whenChanged().handle((value) => {
            this.vorTuningMode.set(value);
        });

        subs.on(`nav${this.props.index}Available`).whenChanged().handle((value) => {
            this.vorAvailable.set(value);
        });

        this.vorFrequency.sub((frequency) => {
            const [int, dec] = frequency.toFixed(2).split('.', 2);

            this.frequencyIntTextSub.set(int);
            this.frequencyDecimalTextSub.set(dec);
        });

        this.vorCourse.sub((course) => {
            this.courseTextSub.set(course > 0 ? Math.round(course).toString().padStart(3, '0') : '---');
        });
    }

    private readonly visibilityFn = (v) => (v ? 'inherit' : 'hidden');

    render(): VNode | null {
        return (
            <Layer x={748} y={28}>
                <text x={-102} y={0} font-size={25} class="White" text-anchor="end">
                    VOR
                    {this.props.index.toString()}
                </text>

                <g visibility={this.vorAvailable.map(this.visibilityFn)}>
                    <text x={0} y={0} font-size={25} class="White" text-anchor="end">
                        {this.frequencyIntTextSub}
                        <tspan font-size={20}>
                            .
                            {this.frequencyDecimalTextSub}
                        </tspan>
                    </text>
                </g>

                <text x={-56} y={30} font-size={25} class="White" text-anchor="end">CRS</text>
                <text x={20} y={30} font-size={25} class="Cyan" text-anchor="end">
                    {this.courseTextSub}
                    &deg;
                </text>

                <g visibility={this.vorFrequency.map((v) => v > 0).map(this.visibilityFn)}>
                    <text x={-80} y={58} font-size={20} class="White" text-anchor="end" textDecoration="underline">
                        {this.tuningModeTextSub}
                    </text>
                </g>

                <text x={0} y={60} font-size={25} class="White" text-anchor="end">
                    {this.vorIdent}
                </text>
            </Layer>
        );
    }
}
