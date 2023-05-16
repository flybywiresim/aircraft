/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Header } from 'instruments/src/PFD/MFD-common/Header';
import { Footer } from 'instruments/src/PFD/MFD-common/Footer';

interface MfdSurvStatusSwitchingProps extends MfdComponentProps {
}

export class MfdSurvStatusSwitching extends DisplayComponent<MfdSurvStatusSwitchingProps> {
    private subs = [] as Subscription[];

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    public destroy(): void {
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                <Header bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
                <ActivePageTitleBar activePage="STATUS & SWITCHING" tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer" />
                {/* end page content */}
                <Footer bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
