/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Footer } from 'instruments/src/PFD/MFD-common/Footer';

interface MfdFmsActiveWindProps extends MfdComponentProps {
}

export class MfdFmsActiveWind extends DisplayComponent<MfdFmsActiveWindProps> {
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
                <ActivePageTitleBar activePage="ACTIVE/WIND" tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer" />
                {/* end page content */}
                <Footer bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
