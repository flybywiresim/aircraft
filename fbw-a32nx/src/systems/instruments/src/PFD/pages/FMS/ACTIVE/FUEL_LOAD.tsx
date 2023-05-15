/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Header } from 'instruments/src/PFD/MFD-common/Header';
import { Footer } from 'instruments/src/PFD/MFD-common/Footer';

interface MfdFmsActiveFuelLoadProps extends MfdComponentProps {
}

export class MfdFmsActiveFuelLoad extends DisplayComponent<MfdFmsActiveFuelLoadProps> {
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <>
                <Header bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
                <ActivePageTitleBar activePage={Subject.create('ACTIVE/FUEL & LOAD')} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer" />
                {/* end page content */}
                <Footer bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
