import { DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { NDSimvars } from '../../NDSimvarPublisher';
import { getSmallestAngle } from '../../../PFD/PFDUtils';

export interface SelectedHeadingBugProps {
    rotationOffset: Subscribable<number>,
    bus: EventBus,
}

export class SelectedHeadingBug extends DisplayComponent<SelectedHeadingBugProps> {
    private readonly bugRef = FSComponent.createRef<SVGGElement>();

    private readonly textRef = FSComponent.createRef<SVGTextElement>();

    private readonly diffSubject = Subject.create(0);

    private readonly headingWord = Subject.create<Arinc429Word>(Arinc429Word.empty());

    private readonly selected = Subject.create(0);

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

            if (Math.abs(diff) <= 40) {
                this.bugRef.instance.style.visibility = 'visible';
                this.textRef.instance.style.visibility = 'hidden';
            } else {
                this.bugRef.instance.style.visibility = 'hidden';
                this.textRef.instance.style.visibility = 'visible';
            }
        } else {
            this.bugRef.instance.style.visibility = 'hidden';
            this.textRef.instance.style.visibility = 'hidden';
        }
    }

    render(): VNode | null {
        return (
            <>
                <g ref={this.bugRef} transform={this.diffSubject.map((diff) => `rotate(${diff} 384 620)`)}>
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
                    ref={this.textRef}
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
