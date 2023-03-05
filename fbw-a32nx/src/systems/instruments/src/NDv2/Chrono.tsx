import { FSComponent, DisplayComponent, Subject, VNode, ComponentProps, EventBus } from 'msfssdk';
import { NDControlEvents } from './NDControlEvents';
import { NDSimvars } from './NDSimvarPublisher';

/**
 * Computes time delta out of absolute env time and previous
 * time debounced on time shift.
 */
export const debouncedTimeDelta = (
    absTimeSeconds: number,
    prevTimeSeconds: number,
): number => {
    const diff = Math.max(absTimeSeconds - prevTimeSeconds, 0);
    // 60s detects forward time-shift
    return diff < 60 ? diff : 0;
};

enum ChronoState {
    Hidden,
    Running,
    Stopped,
}

export interface ChronoProps extends ComponentProps {
    bus: EventBus,
}

export class Chrono extends DisplayComponent<ChronoProps> {
    private readonly state = Subject.create(ChronoState.Hidden);

    private readonly previousTime = Subject.create(0);

    private readonly absTime = Subject.create(0);

    private readonly elapsedTime = Subject.create(0);

    private readonly displayedTime = this.elapsedTime.map((seconds) => {
        if (seconds >= 3600) {
            return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}H${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}'`;
        }
        return `${Math.floor(seconds / 60).toString().padStart(2, '0')}'${Math.floor(seconds % 60).toString().padStart(2, '0')}"`;
    });

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const subs = this.props.bus.getSubscriber<NDControlEvents & NDSimvars>();

        subs.on('chrono_pushed').handle(() => {
            switch (this.state.get()) {
            case ChronoState.Hidden:
                this.previousTime.set(this.absTime.get());
                this.elapsedTime.set(0);
                this.state.set(ChronoState.Running);
                break;
            case ChronoState.Running:
                this.state.set(ChronoState.Stopped);
                break;
            case ChronoState.Stopped:
                this.state.set(ChronoState.Hidden);
                break;
            default:
            }
        });

        subs.on('absoluteTime').whenChangedBy(1).handle((absTime) => {
            this.absTime.set(absTime);

            if (this.state.get() === ChronoState.Running) {
                const elapsedTime = this.elapsedTime.get();
                const prevTime = this.previousTime.get();

                this.elapsedTime.set(
                    Math.min(359940, elapsedTime + debouncedTimeDelta(absTime, prevTime)),
                );
            }

            this.previousTime.set(absTime);
        });
    }

    render(): VNode | null {
        return (
            <g class="chrono" visibility={this.state.map((state) => (state === ChronoState.Hidden ? 'hidden' : 'inherit'))}>
                <rect x={0} y={632} width={104} height={30} class="Grey Fill" />
                <text x={8} y={652} font-size={24} class="Green">{this.displayedTime}</text>
            </g>
        );
    }
}
