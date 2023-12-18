import {
    ComponentProps,
    DisplayComponent,
    EventBus,
    FSComponent,
    RenderPosition,
    Subject,
    VNode,
} from '@microsoft/msfs-sdk';

import { busContext } from './Contexts/EventBusContext';
import { flypadClientContext, initializeFlypadClientContext } from './Contexts/FlypadClientContext';

import { Navbar } from './Components/Navbar';
import { PageEnum } from './shared/common';
import { MainPage } from './Pages/Pages';
import { Statusbar } from './Components/Statusbar';
import { FlypadClient } from '../../../shared/src/flypad-server/FlypadClient';

import './style.scss';
import './Assets/Theme.css';
import './Assets/Slider.scss';
import './Assets/bi-icons.css';
import { FbwUserSettingsSaveManager } from './FbwUserSettings';

interface EfbProps extends ComponentProps {
}

export class EFBv4 extends DisplayComponent<EfbProps, [EventBus]> {
    public override contextType = [busContext] as const;

    private readonly renderRoot = FSComponent.createRef<HTMLDivElement>();

    private readonly renderRoot2 = FSComponent.createRef<HTMLDivElement>();

    private readonly currentPage = Subject.create(PageEnum.MainPage.Dashboard);

    private readonly isCharging = Subject.create(false);

    private readonly batteryLevel = Subject.create(100);

    private get bus() {
        return this.getContext(busContext).get();
    }

    onAfterRender(node: VNode): void {
        SimVar.SetSimVarValue('L:A32NX_EFB_BRIGHTNESS', 'number', 0.99);

        // Load user settings
        const settingsSaveManager = new FbwUserSettingsSaveManager(this.bus);

        const saveKey = `${SimVar.GetSimVarValue('ATC MODEL', 'string')}.profile.default`;

        settingsSaveManager.load(saveKey);
        settingsSaveManager.tryPortLegacyA32NXSettings();
        settingsSaveManager.startAutoSave(saveKey);

        const flypadClient = new FlypadClient(this.bus);

        initializeFlypadClientContext(flypadClient);

        FSComponent.render(
            <flypadClientContext.Provider value={new FlypadClient(this.bus)}>
                <div ref={this.renderRoot2} style={{ display: 'none' }} />
            </flypadClientContext.Provider>,
            this.renderRoot.instance,
        );

        FSComponent.render(
            <>
                <Statusbar
                    batteryLevel={this.batteryLevel}
                    isCharging={this.isCharging}
                />
                <Navbar activePage={this.currentPage} />
                <MainPage activePage={this.currentPage} />
            </>,
            this.renderRoot2.instance,
            RenderPosition.After,
        );
    }

    render(): VNode {
        return (
            <div class="h-screen w-screen bg-theme-body">
                <div ref={this.renderRoot} class="flex h-full w-full flex-row" />
            </div>
        );
    }
}
