import { FSComponent, DisplayComponent, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { ArincEventBus } from 'instruments/src/MsfsAvionicsCommon/ArincEventBus';
import { EfisNdMode } from '@shared/NavigationDisplay';
import { NDSimvars } from '../../NDSimvarPublisher';
import { getSmallestAngle } from '../../../PFD/PFDUtils';
import { Arinc429ConsumerSubject } from '../../../MsfsAvionicsCommon/Arinc429ConsumerSubject';

export interface SelectedHeadingBugProps {
    bus: ArincEventBus,
    rotationOffset: Subscribable<number>,
    mode: Subscribable<EfisNdMode>,
}

export class SelectedHeadingBug extends DisplayComponent<SelectedHeadingBugProps> {
    private readonly diffSubject = Subject.create(0);

    private readonly headingWord = Arinc429ConsumerSubject.create(null);

    private readonly selected = Subject.create(0);

    // eslint-disable-next-line
    private readonly bugShown = MappedSubject.create(([headingWord, selected, diff, mode]) => {
        if (!headingWord.isNormalOperation()) {
            return false;
        }

        if (selected < 0) {
            return false;
        }

        if (mode === EfisNdMode.ROSE_ILS || mode === EfisNdMode.ROSE_NAV || mode === EfisNdMode.ROSE_VOR) {
            return true;
        }

        if (mode === EfisNdMode.PLAN) {
            return false;
        }

        return diff <= 48;
    }, this.headingWord, this.selected, this.diffSubject, this.props.mode);

    // eslint-disable-next-line
    private readonly textShown = MappedSubject.create(([headingWord, selected, diff, mode]) => {
        if (!headingWord.isNormalOperation()) {
            return false;
        }

        if (selected < 0) {
            return false;
        }

        if (mode === EfisNdMode.ROSE_ILS || mode === EfisNdMode.ROSE_NAV || mode === EfisNdMode.ROSE_VOR) {
            return false;
        }

        if (mode === EfisNdMode.PLAN) {
            return false;
        }

        return Math.abs(diff) > 48;
    }, this.headingWord, this.selected, this.diffSubject, this.props.mode);

    private readonly transformSubject = MappedSubject.create(([diff, ndMode]) => {
        return `rotate(${diff} 384 ${ndMode === EfisNdMode.ARC ? 620 : 384})`;
    }, this.diffSubject, this.props.mode);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<DmcEvents & NDSimvars>();

        sub.on('selectedHeading').whenChanged().handle((v) => {
            this.selected.set(v);
            this.handleDisplay();
        });

        this.headingWord.setConsumer(sub.on('heading').withArinc429Precision(2));

        this.headingWord.sub((_v) => this.handleDisplay(), true);
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
                    transform={this.transformSubject}
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
