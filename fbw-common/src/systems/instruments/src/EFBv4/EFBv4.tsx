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
import { PageNumber } from './shared/common';
import { MainPage } from './Pages/Pages';

interface EfbProps extends ComponentProps {
    bus: EventBus;
}

export class EFBv4 extends DisplayComponent<EfbProps> {
    private readonly currentPage = Subject.create(PageNumber.Dashboard);

    onAfterRender(node: VNode): void {
        SimVar.SetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number', 0.99);
    }

    render(): VNode {
        return (
            <div class="h-screen w-screen bg-theme-body">
                <div class="flex h-full w-full flex-row">
                    <div class="fixed z-30 flex h-10 w-full items-center justify-between bg-theme-statusbar px-6 text-lg font-medium leading-none text-theme-text" />
                    <Navbar activePage={this.currentPage} />
                    <MainPage activePage={this.currentPage} />
                </div>
            </div>
        );
    }
}
