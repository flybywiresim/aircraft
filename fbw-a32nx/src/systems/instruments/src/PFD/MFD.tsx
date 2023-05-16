/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/style.scss';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import { Header } from 'instruments/src/PFD/MFD-common/Header';
import { CustomMouseCursor } from 'instruments/src/PFD/MFD-common/CustomMouseCursor';
import { MfdFmsActivePerf } from 'instruments/src/PFD/pages/FMS/ACTIVE/PERF';
import { MfdFmsActiveFpln } from 'instruments/src/PFD/pages/FMS/ACTIVE/F-PLN';
import { MfdFmsActiveFuelLoad } from 'instruments/src/PFD/pages/FMS/ACTIVE/FUEL_LOAD';
import { MfdFmsActiveWind } from 'instruments/src/PFD/pages/FMS/ACTIVE/WIND';
import { MfdFmsActiveInit } from 'instruments/src/PFD/pages/FMS/ACTIVE/INIT';
import { MfdFmsPositionNavaids } from 'instruments/src/PFD/pages/FMS/POSITION/NAVAIDS';

import { MfdNotFound } from 'instruments/src/PFD/pages/FMS/NOT_FOUND';
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

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private activePageRef = FSComponent.createRef<HTMLDivElement>();

    private activePage: VNode = null;

    private activeHeaderRef = FSComponent.createRef<HTMLDivElement>();

    private activeHeader: VNode = null;

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

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });

        this.navigateTo('fms/active/init');
    }

    public navigateTo(uri: string) {
        const uriParts = uri.split('/');
        this.activeUri.set({
            uri,
            sys: uriParts[0],
            category: uriParts[1],
            page: uriParts[2],
        });

        // Delete old header
        while (this.activeHeaderRef.getOrDefault().firstChild) {
            this.activeHeaderRef.getOrDefault().removeChild(this.activeHeaderRef.getOrDefault().firstChild);
        }
        if (this.activeHeader && this.activeHeader.instance instanceof DisplayComponent<MfdComponentProps>) {
            this.activeHeader.instance.destroy();
        }

        // Delete old page
        while (this.activePageRef.getOrDefault().firstChild) {
            this.activePageRef.getOrDefault().removeChild(this.activePageRef.getOrDefault().firstChild);
        }
        if (this.activePage && this.activePage.instance instanceof DisplayComponent<MfdComponentProps>) {
            this.activePage.instance.destroy();
        }

        switch (uriParts[0]) {
        case 'fms':
            this.activeHeader = <Header bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'atccom':
            this.activeHeader = <div />;
            break;
        case 'surv':
            this.activeHeader = <div />;
            break;
        case 'fcubkup':
            this.activeHeader = <div />;
            break;

        default:
            this.activeHeader = <Header bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        }

        switch (uri) {
        case 'fms/active/f-pln':
            this.activePage = <MfdFmsActiveFpln bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'fms/active/perf':
            this.activePage = <MfdFmsActivePerf bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'fms/active/fuel-load':
            this.activePage = <MfdFmsActiveFuelLoad bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'fms/active/wind':
            this.activePage = <MfdFmsActiveWind bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'fms/active/init':
            this.activePage = <MfdFmsActiveInit bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'fms/position/navaids':
            this.activePage = <MfdFmsPositionNavaids bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'surv/controls':
            this.activePage = <MfdFmsActiveInit bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'surv/status-switching':
            this.activePage = <MfdFmsActiveInit bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;

        default:
            this.activePage = <MfdNotFound bus={this.props.bus} active={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        }
        FSComponent.render(this.activeHeader, this.activeHeaderRef.getOrDefault());
        FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
    }

    render(): VNode {
        return (
            <div class="mfd-main" ref={this.topRef}>
                <div ref={this.activeHeaderRef} />
                <div ref={this.activePageRef} class="MFDNavigatorContainer" />
                <CustomMouseCursor ref={this.mouseCursorRef} />
            </div>
        );
    }
}
