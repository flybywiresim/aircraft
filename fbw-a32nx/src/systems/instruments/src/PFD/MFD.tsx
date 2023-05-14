/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/style.scss';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import { Navigator, NavigatorPage } from 'instruments/src/PFD/MFD-common/Navigator';
import { CustomMouseCursor } from 'instruments/src/PFD/MFD-common/CustomMouseCursor';
import { MFDFMSPerf } from 'instruments/src/PFD/pages/FMS/PERF';
import { Ping } from 'instruments/src/PFD/pages/Ping';
import { MFDSimvars } from './shared/MFDSimvarPublisher';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface MFDProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

export interface ActiveUriInformation {
    uri: string;
    sys: string;
    category: string;
    page: string;
}

export interface MFDComponentProps extends ComponentProps {
    bus: EventBus;
    active: Subscribable<ActiveUriInformation>;
    navigateTo(uri: string): void;
}

export class MFDComponent extends DisplayComponent<MFDProps> {
    private displayBrightness = Subject.create(0);

    private displayPowered = Subject.create(false);

    private activeUri = Subject.create<ActiveUriInformation>({
        uri: 'fms/active/perf',
        sys: 'fms',
        category: 'active',
        page: 'perf',
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
                    <NavigatorPage uri="fms/active/perf" component={<MFDFMSPerf bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                    <NavigatorPage uri="ping" component={<Ping bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />} />
                </Navigator>
                <CustomMouseCursor ref={this.mouseCursorRef} />
            </div>
        );
    }
}
