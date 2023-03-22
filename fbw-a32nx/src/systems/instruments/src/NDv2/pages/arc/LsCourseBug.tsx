import { FSComponent, DisplayComponent, EventBus, MappedSubject, Subject, Subscribable, VNode } from 'msfssdk';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { NDSimvars } from '../../NDSimvarPublisher';
import { getSmallestAngle } from '../../../PFD/PFDUtils';
import { Arinc429RegisterSubject } from '../../../MsfsAvionicsCommon/Arinc429RegisterSubject';

export interface LsCourseBugProps {
    bus: EventBus,
    rotationOffset: Subscribable<number>,
}

export class LsCourseBug extends DisplayComponent<LsCourseBugProps> {
    private readonly diffSubject = Subject.create(0);

    private readonly headingWord = Arinc429RegisterSubject.createEmpty();

    private readonly ilsCourse = Subject.create(0);

    private readonly bugShown = MappedSubject.create(([headingWord, ils, diff]) => {
        if (!headingWord.isNormalOperation()) {
            return false;
        }

        if (ils < 0) {
            return false;
        }

        return diff < 48;
    }, this.headingWord, this.ilsCourse, this.diffSubject);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<DmcEvents & NDSimvars>();

        sub.on('heading').whenChanged().handle((v) => {
            this.headingWord.setWord(v);
            this.handleDisplay();
        });

        sub.on('ilsCourse').whenChanged().handle((v) => {
            this.ilsCourse.set(v);
            this.handleDisplay();
        });
    }

    private handleDisplay() {
        const headingValid = this.headingWord.get().isNormalOperation();

        if (headingValid) {
            const diff = getSmallestAngle(this.ilsCourse.get(), this.headingWord.get().value);

            this.diffSubject.set(diff + this.props.rotationOffset.get());
        }
    }

    render(): VNode | null {
        return (
            <>
                <g
                    visibility={this.bugShown.map((v) => (v ? '' : 'hidden'))}
                    transform={this.diffSubject.map((diff) => `rotate(${diff} 384 620)`)}
                >

                    <line x1={376} y1={114} x2={392} y2={114} class="rounded shadow" stroke-width={2.5} />
                    <line x1={384} y1={122} x2={384} y2={74} class="rounded shadow" stroke-width={2.5} />

                    <line x1={376} y1={114} x2={392} y2={114} class="rounded Magenta" stroke-width={2.5} />
                    <line x1={384} y1={122} x2={384} y2={74} class="rounded Magenta" stroke-width={2.5} />
                </g>
            </>
        );
    }
}
