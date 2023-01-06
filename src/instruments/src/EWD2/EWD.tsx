// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { EWDSimvars } from './shared/EWDSimvarPublisher';

import './style.scss';

interface EWDProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}
export class EWDComponent extends DisplayComponent<EWDProps> {
    private acEssBus = Subject.create(false);

    private ewdPotentiometer = Subject.create(0);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<EWDSimvars>();

        sub.on('acEssBus').whenChanged().handle((bus) => {
            this.acEssBus.set(bus);
        });

        sub.on('ewdPotentiometer').whenChanged().handle((pot) => {
            this.ewdPotentiometer.set(pot);
        });
    }

    render(): VNode {
        return (
            <DisplayUnit bus={this.props.bus} brightness={this.ewdPotentiometer} powered={this.acEssBus} />
        );
    }
}
