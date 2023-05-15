/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/style.scss';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import { Navigator, NavigatorPage } from 'instruments/src/PFD/MFD-common/Navigator';
import { CustomMouseCursor } from 'instruments/src/PFD/MFD-common/CustomMouseCursor';
import { MfdFmsActivePerf } from 'instruments/src/PFD/pages/FMS/ACTIVE/PERF';
import { Ping } from 'instruments/src/PFD/pages/Ping';
import { MfdFmsActiveFpln } from 'instruments/src/PFD/pages/FMS/ACTIVE/F-PLN';
import { MfdFmsActiveFuelLoad } from 'instruments/src/PFD/pages/FMS/ACTIVE/FUEL_LOAD';
import { MfdFmsActiveWind } from 'instruments/src/PFD/pages/FMS/ACTIVE/WIND';
import { MfdFmsActiveInit } from 'instruments/src/PFD/pages/FMS/ACTIVE/INIT';
import { MfdFmsPositionNavaids } from 'instruments/src/PFD/pages/FMS/POSITION/NAVAIDS';

import { MFDSimvars } from './shared/MFDSimvarPublisher';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface MfdProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

export interface ActiveUriInformation {
    uri: string;
    sys: string;
    category: string;
    page: string;
}

export interface MfdComponentProps extends ComponentProps {
    bus: EventBus;
    active: Subscribable<ActiveUriInformation>;
    navigateTo(uri: string): void;
}

export class MFDComponent extends DisplayComponent<MfdProps> {
    private displayBrightness = Subject.create(0);

    private displayPowered = Subject.create(false);

    private activeUri = Subject.create<ActiveUriInformation>({
        uri: 'fms/active/init',
        sys: 'fms',
        category: 'active',
        page: 'init',
    });

    private mouseCursorRef = FSComponent.createRef<CustomMouseCursor>();

    private oansRef = FSComponent.createRef<HTMLDivElement>();

    get isInteractive(): boolean {
        return true;
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const isCaptainSide = getDisplayIndex() === 1;

        const sub = this.props.bus.getSubscriber<ClockEvents & MFDSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value === 1);
        });

        this.oansRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });
    }

    public navigateTo(uri: string) {
        const uriParts = uri.split('/');
        this.activeUri.set({
            uri,
            sys: uriParts[0],
            category: uriParts[1],
            page: uriParts[2],
        });
    }

    render(): VNode {
        return (
            <div class="mfd-main" ref={this.oansRef}>
                <Navigator active={this.activeUri}>
                    <NavigatorPage uri="fms/active/f-pln" component={<MfdFmsActiveFpln bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="fms/active/perf" component={<MfdFmsActivePerf bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="fms/active/fuel-load" component={<MfdFmsActiveFuelLoad bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="fms/active/wind" component={<MfdFmsActiveWind bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="fms/active/init" component={<MfdFmsActiveInit bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="fms/position/navaids" component={<MfdFmsPositionNavaids bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="surv/controls" component={<MfdFmsActiveInit bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="surv/status-switching" component={<MfdFmsActiveInit bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="ping" component={<Ping bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                </Navigator>
                <CustomMouseCursor ref={this.mouseCursorRef} />
            </div>
        );
    }
}
