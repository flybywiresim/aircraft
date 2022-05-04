import { FSComponent, DisplayComponent, Subject, Subscribable, VNode, EventBus, MappedSubject } from 'msfssdk';
import { FmsVars } from '../../MsfsAvionicsCommon/providers/FmsDataPublisher';

export interface CrossTrackErrorProps {
    bus: EventBus,
    x: number,
    y: number,
    isPlanMode: Subscribable<boolean>,
}

export class CrossTrackError extends DisplayComponent<CrossTrackErrorProps> {
    private readonly crossTrackText = Subject.create('');

    private readonly crossTrackX = Subject.create(0);

    private readonly crossTrackAnchor = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<FmsVars>();

        sub.on('crossTrackError').whenChanged().handle((crossTrackError) => {
            const x = this.props.x;

            let crossTrackText = '';
            let crossTrackAnchor = 'start';
            let crossTrackX = x;
            const crossTrackAbs = Math.min(99.9, Math.abs(crossTrackError));

            if (crossTrackAbs >= 0.1) {
                crossTrackText = crossTrackAbs.toFixed(1);
                if (crossTrackError < 0) {
                    crossTrackText += 'R';
                    crossTrackAnchor = 'start';
                    crossTrackX = x + 34;
                } else {
                    crossTrackText += 'L';
                    crossTrackAnchor = 'end';
                    crossTrackX = x - 38;
                }
            }

            this.crossTrackText.set(crossTrackText);
            this.crossTrackAnchor.set(crossTrackAnchor);
            this.crossTrackX.set(crossTrackX);
        });
    }

    render(): VNode | null {
        return (
            <text
                x={MappedSubject.create(([isPlanMode, crossTrackX]) => (isPlanMode ? this.props.x : crossTrackX), this.props.isPlanMode, this.crossTrackX)}
                y={this.props.y}
                textAnchor={MappedSubject.create(([isPlanMode, crossTrackAnchor]) => (isPlanMode ? 'start' : crossTrackAnchor), this.props.isPlanMode, this.crossTrackAnchor)}
                class="Green shadow FontSmall"
            >
                {this.crossTrackText}
            </text>
        );
    }
}
