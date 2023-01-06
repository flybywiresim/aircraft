// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { EWDSimvars } from './shared/EWDSimvarPublisher';
import { UpperDisplay } from './UpperDisplay';

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
            <DisplayUnit bus={this.props.bus} brightness={this.ewdPotentiometer} powered={this.acEssBus}>
                <svg class="ewd-svg" version="1.1" viewBox="0 0 768 768" xmlns="http://www.w3.org/2000/svg">
                    <UpperDisplay bus={this.props.bus} />
                    <line class="Separator" x1="4" y1="520" x2="444" y2="520" strokeLinecap="round" />
                    <line class="Separator" x1="522" y1="520" x2="764" y2="520" strokeLinecap="round" />

                    <line class="Separator" x1="484" y1="540" x2="484" y2="730" strokeLinecap="round" />
                </svg>
            </DisplayUnit>
        );
    }
}
