/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/common.scss';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';

import { CustomMouseCursor } from 'instruments/src/PFD/MFD-common/CustomMouseCursor';
import { MFDActivePerf } from 'instruments/src/PFD/MFDActivePerf';
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

    private displayPowered = Subject.create(false);

    private mouseCursorRef = FSComponent.createRef<CustomMouseCursor>();

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
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value === 1);
        });

        this.oansRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });
    }

    render(): VNode {
        return (
            <div class="mfd-main" ref={this.oansRef}>
                <MFDActivePerf bus={this.props.bus} />
                <CustomMouseCursor ref={this.mouseCursorRef} />
            </div>
        );
    }
}
