import { FSComponent, ComponentProps, DisplayComponent, VNode, Subject, EventBus, MappedSubject } from '@microsoft/msfs-sdk';
import { GenericVorEvents } from '../../types/GenericVorEvents';
import { Layer } from '../../../MsfsAvionicsCommon/Layer';

export interface GlideSlopeProps extends ComponentProps {
    bus: EventBus,
}

export class GlideSlope extends DisplayComponent<GlideSlopeProps> {
    private readonly gsAvailableSub = Subject.create(false);

    private readonly gsDeviationSub = Subject.create(-1);

    private readonly deviationPxSub = this.gsDeviationSub.map((deviation) => {
        return deviation / 0.8 * 128;
    });

    private readonly deviationUpperVisibleSub = MappedSubject.create(([available, deviationPx]) => {
        return available && deviationPx < 128;
    }, this.gsAvailableSub, this.deviationPxSub);

    private readonly deviationLowerVisibleSub = MappedSubject.create(([available, deviationPx]) => {
        return available && deviationPx > -128;
    }, this.gsAvailableSub, this.deviationPxSub);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const subs = this.props.bus.getSubscriber<GenericVorEvents>();

        // TODO select correct MMR

        subs.on('glideSlopeValid').whenChanged().handle((value) => {
            this.gsAvailableSub.set(value);
        });

        subs.on('glideSlopeDeviation').whenChanged().handle((value) => {
            this.gsDeviationSub.set(value);
        });
    }

    private readonly visibilityFn = (v) => (v ? 'inherit' : 'hidden');

    render(): VNode | null {
        return (
            <>
                <Layer x={750} y={384}>
                    <circle cx={0} cy={-128} r={4} stroke-width={2.5} class="White" />
                    <circle cx={0} cy={-64} r={4} stroke-width={2.5} class="White" />
                    <line x1={-12} x2={12} y1={0} y2={0} stroke-width={5} class="Yellow" />
                    <circle cx={0} cy={64} r={4} stroke-width={2.5} class="White" />
                    <circle cx={0} cy={128} r={4} stroke-width={2.5} class="White" />
                </Layer>

                <Layer x={750} y={384}>
                    <path
                        d="M10,0 L0,-16 L-10,0"
                        transform={this.deviationPxSub.map((deviationPx) => `translate(0 ${Math.max(-128, deviationPx)})`)}
                        class="Magenta rounded"
                        stroke-width={2.5}
                        visibility={this.deviationUpperVisibleSub.map(this.visibilityFn)}
                    />
                    <path
                        d="M-10,0 L0,16 L10,0"
                        transform={this.deviationPxSub.map((deviationPx) => `translate(0 ${Math.min(128, deviationPx)})`)}
                        class="Magenta rounded"
                        stroke-width={2.5}
                        visibility={this.deviationLowerVisibleSub.map(this.visibilityFn)}
                    />
                </Layer>
            </>
        );
    }
}
