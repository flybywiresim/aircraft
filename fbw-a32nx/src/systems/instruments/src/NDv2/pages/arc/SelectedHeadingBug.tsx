import { FSComponent, DisplayComponent, EventBus, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { NDSimvars } from '../../NDSimvarPublisher';
import { getSmallestAngle } from '../../../PFD/PFDUtils';
import { Arinc429RegisterSubject } from '../../../MsfsAvionicsCommon/Arinc429RegisterSubject';
import { Arinc429ConsumerSubject } from '../../../MsfsAvionicsCommon/Arinc429ConsumerSubject';

export interface SelectedHeadingBugProps {
    bus: EventBus,
    rotationOffset: Subscribable<number>,
}

export class SelectedHeadingBug extends DisplayComponent<SelectedHeadingBugProps> {
    private readonly diffSubject = Subject.create(0);

    private readonly headingWord = Arinc429ConsumerSubject.create(null);

    private readonly selected = Subject.create(0);

    // eslint-disable-next-line
    private readonly bugShown = MappedSubject.create(([headingWord, selected, diff]) => {
        if (!headingWord.isNormalOperation()) {
            return false;
        }

        if (selected < 0) {
            return false;
        }

        return diff <= 40;
    }, this.headingWord, this.selected, this.diffSubject);

    // eslint-disable-next-line
    private readonly textShown = MappedSubject.create(([headingWord, selected, diff]) => {
        if (!headingWord.isNormalOperation()) {
            return false;
        }

        if (selected < 0) {
            return false;
        }

        return diff > 40;
    }, this.headingWord, this.selected, this.diffSubject);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<DmcEvents & NDSimvars>();

        sub.on('selectedHeading').whenChanged().handle((v) => {
            this.selected.set(v);
            this.handleDisplay();
        });

        this.headingWord.setConsumer(sub.on('heading'));
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
                    visibility={this.bugShown.map((v) => (v ? 'inherit' : 'hidden'))}
                    transform={this.diffSubject.map((diff) => `rotate(${diff} 384 620)`)}
                >
                    <path
                        d="M382,126 L370,99 L398,99 L386,126"
                        class="rounded shadow"
                        stroke-width={3.5}
                    />
                    <path
                        d="M382,126 L370,99 L398,99 L386,126"
                        class="rounded Cyan"
                        stroke-width={3}
                    />
                </g>

                <text
                    visibility={this.textShown.map((v) => (v ? 'inherit' : 'hidden'))}
                    x={384}
                    y={60}
                    text-anchor="middle"
                    transform={this.diffSubject.map((diff) => `rotate(${(diff) < 0 ? -38 : 38} 384 620)`)}
                    class="shadow Cyan"
                    font-size={22}
                >
                    {this.selected.map((selected) => (
                        `${Math.round(selected).toString().padStart(3, '0')}`
                    ))}
                </text>
            </>
        );
    }
}
