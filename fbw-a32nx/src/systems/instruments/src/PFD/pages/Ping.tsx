import { DisplayComponent, VNode, FSComponent, ClockEvents } from '@microsoft/msfs-sdk';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';

export class Ping extends DisplayComponent<MfdComponentProps> {
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents>();

        sub.on('realTime').whenChanged().handle((val) => {
            console.log(val);
        });
    }

    render(): VNode {
        return (
            <>
            </>
        );
    }
}
