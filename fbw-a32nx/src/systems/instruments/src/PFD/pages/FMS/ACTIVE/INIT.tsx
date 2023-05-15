/* eslint-disable jsx-a11y/label-has-associated-control */

import { ClockEvents, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Footer } from 'instruments/src/PFD/MFD-common/Footer';

interface MfdFmsActiveInitProps extends MfdComponentProps {
}

export class MfdFmsActiveInit extends DisplayComponent<MfdFmsActiveInitProps> {
    private subs = [] as Subscription[];

    private thisNode?: VNode;

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.thisNode = node;

        const sub = this.props.bus.getSubscriber<ClockEvents>();

        this.subs.push(sub.on('realTime').whenChanged().handle((val) => {
            console.log(val); // This stops when destroy() is called
        }));
    }

    public destroy(): void {
        FSComponent.shallowDestroy(this.thisNode);

        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage="ACTIVE/INIT" tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer" />
                {/* end page content */}
                <Footer bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
