import { FSComponent, DisplayComponent, EventBus, Subject, Subscribable, VNode } from 'msfssdk';
import { Arinc429Register } from '@shared/arinc429';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { NDSimvars } from '../NDSimvarPublisher';
import { getSmallestAngle } from '../../PFD/PFDUtils';

export interface TrackBugProps {
    bus: EventBus,
    isUsingTrackUpMode: Subscribable<boolean>,
}

export class TrackBug extends DisplayComponent<TrackBugProps> {
    private readonly headingWord = Arinc429Register.empty();

    private readonly trackWord =Arinc429Register.empty();

    private readonly diffSubject = Subject.create(0);

    private readonly bugShown = Subject.create(false);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<DmcEvents & NDSimvars>();

        sub.on('heading').whenChanged().handle((v) => {
            this.headingWord.set(v);
            this.handleDisplay();
        });

        sub.on('track').whenChanged().handle((v) => {
            this.trackWord.set(v);
            this.handleDisplay();
        });
    }

    private handleDisplay() {
        const headingValid = this.headingWord.isNormalOperation();
        const trackValid = this.trackWord.isNormalOperation();

        if (headingValid && trackValid) {
            let diff;
            if (this.props.isUsingTrackUpMode.get()) {
                diff = 0;
            } else {
                diff = getSmallestAngle(this.trackWord.value, this.headingWord.value);
            }

            this.bugShown.set(diff <= 40);
            this.diffSubject.set(diff);
        } else {
            this.bugShown.set(false);
        }
    }

    render(): VNode | null {
        return (
            <g
                visibility={this.bugShown.map((v) => (v ? 'inherit' : 'hidden'))}
                transform={this.diffSubject.map((diff) => `rotate(${diff} 384 620)`)}
            >
                <path
                    d="M384,128 L378,138 L384,148 L390,138 L384,128"
                    class="rounded shadow"
                    stroke-width={4.5}
                />
                <path
                    d="M384,128 L378,138 L384,148 L390,138 L384,128"
                    class="rounded Green"
                    stroke-width={3}
                />
            </g>
        );
    }
}
