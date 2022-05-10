import { FSComponent, DisplayComponent, EventBus, MappedSubject, Subject, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { NDSimvars } from '../../NDSimvarPublisher';
import { getSmallestAngle } from '../../../PFD/PFDUtils';

export interface SelectedHeadingBugProps {
    bus: EventBus,
    rotationOffset: Subscribable<number>,
    visible: Subscribable<boolean>,
}

export class SelectedHeadingBug extends DisplayComponent<SelectedHeadingBugProps> {
    private readonly diffSubject = Subject.create(0);

    private readonly headingWord = Subject.create<Arinc429Word>(Arinc429Word.empty());

    private readonly selected = Subject.create(0);

    // eslint-disable-next-line
    private readonly bugShown = MappedSubject.create(([visible, headingWord, diff]) => {
        if (!visible || !headingWord.isNormalOperation()) {
            return false;
        }

        return diff <= 40;
    }, this.props.visible, this.headingWord, this.diffSubject);

    // eslint-disable-next-line
    private readonly textShown = MappedSubject.create(([visible, headingWord, diff]) => {
        if (!visible || !headingWord.isNormalOperation()) {
            return false;
        }

        return diff > 40;
    }, this.props.visible, this.headingWord, this.diffSubject);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDSimvars>();

        sub.on('selectedHeading').whenChanged().handle((v) => {
            this.selected.set(v);
            this.handleDisplay();
        });

        sub.on('heading').whenChanged().handle((v) => {
            const decoded = new Arinc429Word(v);
            this.headingWord.set(decoded);
            this.handleDisplay();
        });
    }

    private handleDisplay() {
        const headingValid = this.headingWord.get().isNormalOperation();

        if (headingValid) {
            const diff = getSmallestAngle(this.selected.get(), this.headingWord.get().value);

            this.diffSubject.set(diff + this.props.rotationOffset.get());
        }
    }

    render(): VNode | null {
        return (
            <>
                <g
                    visibility={this.bugShown.map((v) => (v ? 'visible' : 'hidden'))}
                    transform={this.diffSubject.map((diff) => `rotate(${diff} 384 620)`)}
                >
                    <path
                        d="M382,126 L370,99 L398,99 L386,126"
                        class="shadow rounded"
                        strokeWidth={3.5}
                    />
                    <path
                        d="M382,126 L370,99 L398,99 L386,126"
                        class="Cyan rounded"
                        strokeWidth={3}
                    />
                </g>

                <text
                    visibility={this.textShown.map((v) => (v ? 'visible' : 'hidden'))}
                    x={384}
                    y={60}
                    textAnchor="middle"
                    transform={this.diffSubject.map((diff) => `rotate(${(diff) < 0 ? -38 : 38} 384 620)`)}
                    class="Cyan shadow"
                    fontSize={22}
                >
                    {this.selected.map((selected) => (
                        `${Math.round(selected).toString().padStart(3, '0')}`
                    ))}
                </text>
            </>
        );
    }
}
