import { FSComponent, DisplayComponent, VNode, Subject, EventBus, ConsumerSubject, MappedSubject } from '@microsoft/msfs-sdk';
import { Layer } from '../../../MsfsAvionicsCommon/Layer';
import { VorSimVars } from '../../../MsfsAvionicsCommon/providers/VorBusPublisher';

export interface IlsInfoIndicatorProps {
    bus: EventBus,
    index: 3 | 4,
}

export class IlsInfoIndicator extends DisplayComponent<IlsInfoIndicatorProps> {
    private readonly ilsIdent = ConsumerSubject.create(null, '');

    private readonly ilsFrequency = ConsumerSubject.create(null, -1);

    private readonly locAvailable = ConsumerSubject.create(null, false);

    private readonly ilsCourse = ConsumerSubject.create(null, -1);

    private readonly ilsFrequencyValid = Subject.create(false);

    private readonly ilsCourseValid = Subject.create(false);

    private readonly frequencyIntTextSub = Subject.create('');

    private readonly frequencyDecimalTextSub = Subject.create('');

    private readonly courseTextSub = Subject.create('');

    private readonly tuningModeTextSub = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const subs = this.props.bus.getSubscriber<VorSimVars>();

        // TODO select correct MMR
        // Fixed now??

        this.ilsIdent.setConsumer(subs.on(`nav${this.props.index}Ident`).whenChanged());

        this.ilsFrequency.setConsumer(subs.on(`nav${this.props.index}Frequency`).whenChanged());

        this.ilsCourse.setConsumer(subs.on(`nav${this.props.index}Obs`).whenChanged());

        this.ilsFrequency.sub((freq) => this.ilsFrequencyValid.set(freq >= 108 && freq <= 112), true);
        this.ilsFrequencyValid.sub((valid) => this.ilsCourseValid.set(valid), true);

        MappedSubject.create(([freq, valid]) => {
            if (valid) {
                const [int, dec] = freq.toFixed(2).split('.', 2);

                this.frequencyIntTextSub.set(int);
                this.frequencyDecimalTextSub.set(dec);
            } else {
                this.frequencyIntTextSub.set('---');
                this.frequencyDecimalTextSub.set('--');
            }
        }, this.ilsFrequency, this.ilsFrequencyValid);

        this.ilsCourse.sub((course) => {
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
