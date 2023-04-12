/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/common.scss';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';

import { OANS } from 'instruments/src/PFD/OANS';
import { MFDSimvars } from './shared/MFDSimvarPublisher';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface MFDProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

export class MFDComponent extends DisplayComponent<MFDProps> {
    private displayBrightness = Subject.create(0);

    private displayFailed = Subject.create(false);

    private displayPowered = Subject.create(false);

    private testSubject = Subject.create(0);

    private oansRef = FSComponent.createRef<HTMLDivElement>();

    get isInteractive(): boolean {
        return true;
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const isCaptainSide = getDisplayIndex() === 1;

        const sub = this.props.bus.getSubscriber<ClockEvents & MFDSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);

            if (this.displayBrightness.get() > 0 && this.displayBrightness.get() < 0.3) {
                this.testSubject.set(0);
            } else if (this.displayBrightness.get() >= 0.3 && this.displayBrightness.get() < 0.7) {
                this.testSubject.set(1);
            } else {
                this.testSubject.set(2);
            }
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value === 1);
        });
    }

    render(): VNode {
        return (
            <div class="mfd-main" id="test_1233" ref={this.oansRef}>
                <OANS bus={this.props.bus} />
            </div>
        );
    }
}
