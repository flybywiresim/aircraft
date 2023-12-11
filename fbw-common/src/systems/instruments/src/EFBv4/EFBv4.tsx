import {
    ComponentProps,
    DisplayComponent,
    EventBus,
    FSComponent,
    Subject,
    VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import './Assets/Theme.css';
import './Assets/Slider.scss';
import './Assets/bi-icons.css';

import { Navbar } from './Components/Navbar';
import { PageEnum } from './shared/common';
import { MainPage } from './Pages/Pages';
import { Statusbar } from './Components/Statusbar';

interface EfbProps extends ComponentProps {
    bus: EventBus;
}

export class EFBv4 extends DisplayComponent<EfbProps> {
    private readonly currentPage = Subject.create(PageEnum.MainPage.Dashboard);

    onAfterRender(node: VNode): void {
        SimVar.SetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number', 0.99);
    }

    render(): VNode {
        return (
            <div class="h-screen w-screen bg-theme-body">
                <div class="flex h-full w-full flex-row">
                    <Statusbar bus={this.props.bus} />
                    <Navbar activePage={this.currentPage} />
                    <MainPage activePage={this.currentPage} />
                </div>
            </div>
        );
    }
}
