/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/MFD/pages/common/style.scss';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import { FmsHeader } from 'instruments/src/MFD/pages/common/FmsHeader';
import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';
import { MfdFmsActivePerf } from 'instruments/src/MFD/pages/FMS/PERF';
import { MfdFmsActiveInit } from 'instruments/src/MFD/pages/FMS/INIT';

import { MfdNotFound } from 'instruments/src/MFD/pages/FMS/NOT_FOUND';
import { FcuBkupHeader } from 'instruments/src/MFD/pages/common/FcuBkupHeader';
import { SurvHeader } from 'instruments/src/MFD/pages/common/SurvHeader';
import { AtccomHeader } from 'instruments/src/MFD/pages/common/AtccomHeader';
import { MfdSimvars } from './shared/MFDSimvarPublisher';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a380x-mfd')[0].getAttribute('url');
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
    extra?: string;
}

export interface MfdComponentProps extends ComponentProps {
    bus: EventBus;
    activeUri: Subscribable<ActiveUriInformation>;
    navigateTo(uri: string): void;
}

export class MfdComponent extends DisplayComponent<MfdProps> {
    private displayBrightness = Subject.create(0);

    private displayPowered = Subject.create(false);

    private activeFmsSource = Subject.create<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>('FMS 1');

    private activeUri = Subject.create<ActiveUriInformation>({
        uri: 'fms/active/init',
        sys: 'fms',
        category: 'active',
        page: 'init',
        extra: '',
    });

    private navigationStack: string[] = [];

    private mouseCursorRef = FSComponent.createRef<MouseCursor>();

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private activePageRef = FSComponent.createRef<HTMLDivElement>();

    private activePage: VNode = null;

    private activeHeaderRef = FSComponent.createRef<HTMLDivElement>();

    private activeHeader: VNode = null;

    // Necessary to enable mouse interaction
    get isInteractive(): boolean {
        return true;
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const isCaptainSide = getDisplayIndex() === 1;

        this.activeFmsSource.set(isCaptainSide ? 'FMS 1' : 'FMS 2');

        const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value);
        });

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });

        // Navigate to initial page
        this.navigateTo('fms/active/init');
    }

    public parseUri(uri: string) : ActiveUriInformation {
        const uriParts = uri.split('/');
        return {
            uri,
            sys: uriParts[0],
            category: uriParts[1],
            page: uriParts[2],
            extra: uriParts.slice(3).join('/'),
        };
    }

    /**
     * Navigate to MFD page.
     * @param uri The URI to navigate to. Format: sys/category/page, e.g. fms/active/init represents ACTIVE/INIT page from the FMS.
     * In theory, one can use anything after a third slash for intra-page deep linking: fms/active/f-pln/dep could link to the F-PLN's departure page.
     */
    private navigateTo(uri: string) {
        console.info(`Navigate to ${uri}`);
        this.navigationStack.push(uri);
        const parsedUri = this.parseUri(uri);
        this.activeUri.set(parsedUri);

        // Remove and destroy old header
        while (this.activeHeaderRef.getOrDefault().firstChild) {
            this.activeHeaderRef.getOrDefault().removeChild(this.activeHeaderRef.getOrDefault().firstChild);
        }
        if (this.activeHeader && this.activeHeader.instance instanceof DisplayComponent) {
            this.activeHeader.instance.destroy();
        }

        // Remove and destroy old MFD page
        while (this.activePageRef.getOrDefault().firstChild) {
            this.activePageRef.getOrDefault().removeChild(this.activePageRef.getOrDefault().firstChild);
        }
        if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
            this.activePage.instance.destroy();
        }

        // Different systems use different navigation bars
        switch (parsedUri.sys) {
        case 'fms':
            this.activeHeader = (
                <FmsHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    activeUri={this.activeUri}
                    navigateTo={(uri) => this.navigateTo(uri)}
                />
            );
            break;
        case 'atccom':
            this.activeHeader = (
                <AtccomHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    activeUri={this.activeUri}
                    navigateTo={(uri) => this.navigateTo(uri)}
                />
            );
            break;
        case 'surv':
            this.activeHeader = (
                <SurvHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    activeUri={this.activeUri}
                    navigateTo={(uri) => this.navigateTo(uri)}
                />
            );
            break;
        case 'fcubkup':
            this.activeHeader = (
                <FcuBkupHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    activeUri={this.activeUri}
                    navigateTo={(uri) => this.navigateTo(uri)}
                />
            );
            break;

        default:
            this.activeHeader = (
                <FmsHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    activeUri={this.activeUri}
                    navigateTo={(uri) => this.navigateTo(uri)}
                />
            );
            break;
        }

        // Mapping from URL to page component
        switch (`${parsedUri.sys}/${parsedUri.category}/${parsedUri.page}`) {
        case 'fms/active/perf':
            this.activePage = <MfdFmsActivePerf bus={this.props.bus} activeUri={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        case 'fms/active/init':
            this.activePage = <MfdFmsActiveInit bus={this.props.bus} activeUri={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;

        default:
            this.activePage = <MfdNotFound bus={this.props.bus} activeUri={this.activeUri} navigateTo={(uri) => this.navigateTo(uri)} />;
            break;
        }
        FSComponent.render(this.activeHeader, this.activeHeaderRef.getOrDefault());
        FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
    }

    render(): VNode {
        return (
            <DisplayUnit bus={this.props.bus} normDmc={1} brightness={this.displayBrightness} powered={this.displayPowered}>
                <div class="mfd-main" ref={this.topRef}>
                    <div ref={this.activeHeaderRef} />
                    <div ref={this.activePageRef} class="MFDNavigatorContainer" />
                    <MouseCursor side={Subject.create('CPT')} ref={this.mouseCursorRef} />
                </div>
            </DisplayUnit>
        );
    }
}
