/* eslint-disable jsx-a11y/label-has-associated-control */

import { ClockEvents, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Header } from 'instruments/src/PFD/MFD-common/Header';
import { Footer } from 'instruments/src/PFD/MFD-common/Footer';

interface MfdFmsActiveInitProps extends MfdComponentProps {
}

export class MfdFmsActiveInit extends DisplayComponent<MfdFmsActiveInitProps> {
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents>();

        sub.on('realTime').whenChanged().handle((val) => {
            // console.log(val);
        });
    }

    render(): VNode {
        return (
            <>
                <Header bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
                <ActivePageTitleBar activePage={Subject.create('ACTIVE/INIT')} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer" />
                {/* end page content */}
                <Footer bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
