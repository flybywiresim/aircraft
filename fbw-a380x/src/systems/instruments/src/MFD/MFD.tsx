/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/MFD/pages/common/style.scss';

import {
    ClockEvents,
    ComponentProps,
    DisplayComponent,
    EventBus,
    FSComponent,
    HEvent,
    Subject,
    VNode,
} from '@microsoft/msfs-sdk';
import { DatabaseItem, Waypoint } from '@flybywiresim/fbw-sdk';

import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';

import { MfdMsgList } from 'instruments/src/MFD/pages/FMS/MfdMsgList';
import { ActiveUriInformation, MfdUiService } from 'instruments/src/MFD/pages/common/MfdUiService';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { MfdFmsFplnDuplicateNames } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnDuplicateNames';
import { headerForSystem, pageForUrl } from 'instruments/src/MFD/MfdPageDirectory';
import { DisplayInterface } from '@fmgc/flightplanning/new/interface/DisplayInterface';
import { FmsErrorType } from '@fmgc/FmsError';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { MfdSimvars } from './shared/MFDSimvarPublisher';

// Import for pages

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a380x-mfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface AbstractMfdPageProps extends ComponentProps {
    pageTitle?: string;
    bus: EventBus;
    mfd: DisplayInterface & MfdDisplayInterface;
    fmcService: FmcServiceInterface;
}

interface MfdComponentProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
    fmcService: FmcServiceInterface;
    captOrFo: 'CAPT' | 'FO';
}

// TODO integrate in fmgc's DisplayInterface
export interface MfdDisplayInterface {
    get uiService(): MfdUiService;

    openMessageList(): void;
}

export class MfdComponent extends DisplayComponent<MfdComponentProps> implements DisplayInterface, MfdDisplayInterface {
    #uiService = new MfdUiService(this.props.captOrFo);

    get uiService() {
        return this.#uiService;
    }

    private displayBrightness = Subject.create(0);

    private displayPowered = Subject.create(false);

    private activeFmsSource = Subject.create<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>('FMS 1');

    private mouseCursorRef = FSComponent.createRef<MouseCursor>();

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private activePageRef = FSComponent.createRef<HTMLDivElement>();

    private activePage: VNode | null = null;

    private activeHeaderRef = FSComponent.createRef<HTMLDivElement>();

    private activeHeader: VNode | null = null;

    private messageListOpened = Subject.create<boolean>(false);

    private duplicateNamesOpened = Subject.create<boolean>(false);

    private duplicateNamesRef = FSComponent.createRef<MfdFmsFplnDuplicateNames>();

    // Necessary to enable mouse interaction
    get isInteractive(): boolean {
        return true;
    }

    public openMessageList() {
        this.messageListOpened.set(true);
    }

    /**
     * Called when a flight plan uplink is in progress
     */
    onUplinkInProgress() {
        this.props.fmcService.master?.onUplinkInProgress();
    }

    /**
         * Called when a flight plan uplink is done
         */
    onUplinkDone() {
        this.props.fmcService.master?.onUplinkDone();
    }

    /**
         * Calling this function with a message should display the message in the FMS' message area,
         * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
         * into the appropriate message for the UI
         *
         * @param errorType the message to show
         */
    showFmsErrorMessage(errorType: FmsErrorType) {
        this.props.fmcService.master?.showFmsErrorMessage(errorType);
    }

    /**
         * Calling this function with an array of items should display a UI allowing the user to
         * select the right item from a list of duplicates, and return the one chosen by the user or
         * `undefined` if the operation is cancelled.
         *
         * @param items the items to de-duplicate
         *
         * @returns the chosen item
         */
    async deduplicateFacilities<T extends DatabaseItem<any>>(items: T[]): Promise<T | undefined> {
        if (items.length > 1) {
            this.duplicateNamesOpened.set(true);
            const result = await this.duplicateNamesRef.instance.deduplicateFacilities(items);
            this.duplicateNamesOpened.set(false);

            return result;
        }
        return items[0];
    }

    /**
         * Calling this function should show a UI allowing the pilot to create a new waypoint with the ident
         * provided
         *
         * @param ident the identifier the waypoint should have
         *
         * @returns the created waypoint, or `undefined` if the operation is cancelled
         */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createNewWaypoint(ident: string): Promise<Waypoint | undefined> {
        // TODO navigate to DATA/NAVAID --> PILOT STORED NAVAIDS --> NEW NAVAID
        return undefined;
    }

    /**
     * Checks whether a waypoint is currently in use
     * @param waypoint the waypoint to look for
     */
    async isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
        return this.props.fmcService.master?.isWaypointInUse(waypoint) ?? false;
    }

    public async onAfterRender(node: VNode): Promise<void> {
        super.onAfterRender(node);

        const db = new NavigationDatabase(NavigationDatabaseBackend.Msfs);
        NavigationDatabaseService.activeDatabase = db;

        const hEventSub = this.props.bus.getSubscriber<HEvent>();
        hEventSub.on('hEvent').handle((eventName) => {
            this.props.fmcService.master?.acInterface.onEvent(eventName);
        });
        // const isCaptainSide = getDisplayIndex() === 2;
        const isCaptainSide = this.props.captOrFo === 'CAPT';

        const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value);
        });

        sub.on('fmsDataKnob').whenChanged().handle((val) => {
            switch (val) {
            case 0:
                this.activeFmsSource.set('FMS 2');
                break;
            case 1:
                this.activeFmsSource.set(isCaptainSide ? 'FMS 1' : 'FMS 2');
                break;
            case 2:
                this.activeFmsSource.set('FMS 1');
                break;
            default: this.activeFmsSource.set('FMS 1-C');
            }
        });

        // Note: This should be done with H events instead, and in a more intelligent way (sides L/R as well). Can't get H events running rn though.
        sub.on('kccuDir').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/f-pln-direct-to');
            }
        });

        sub.on('kccuPerf').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/perf');
            }
        });

        sub.on('kccuInit').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/init');
            }
        });

        sub.on('kccuNavaid').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/position/navaids');
            }
        });

        sub.on('kccuFpln').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/f-pln/top');
            }
        });

        sub.on('kccuDest').whenChanged().handle((value) => {
            if (value === 1) {
                this.uiService.navigateTo('fms/active/f-pln/dest');
            }
        });

        this.uiService.activeUri.sub((uri) => {
            this.activeUriChanged(uri);
        });

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.getOrDefault()?.updatePosition(ev.clientX, ev.clientY);
        });

        // Navigate to initial page
        // this.uiService.navigateTo('fms/data/status');
    }

    private activeUriChanged(uri: ActiveUriInformation) {
        if (!this.props.fmcService.master) {
            return;
        }

        // Remove and destroy old header
        if (this.activeHeaderRef.getOrDefault()) {
            while (this.activeHeaderRef.instance.firstChild) {
                this.activeHeaderRef.instance.removeChild(this.activeHeaderRef.instance.firstChild);
            }
        }

        if (this.activeHeader && this.activeHeader.instance instanceof DisplayComponent) {
            this.activeHeader.instance.destroy();
        }

        // Remove and destroy old MFD page
        if (this.activePageRef.getOrDefault()) {
            while (this.activePageRef.instance.firstChild) {
                this.activePageRef.instance.removeChild(this.activePageRef.instance.firstChild);
            }
        }
        if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
            this.activePage.instance.destroy();
        }

        // Different systems use different navigation bars
        this.activeHeader = headerForSystem(uri.sys, this.props.bus, this.props.fmcService.master.fmgc.data.atcCallsign, this.activeFmsSource, this.uiService);

        // Mapping from URL to page component
        this.activePage = pageForUrl(`${uri.sys}/${uri.category}/${uri.page}`, this.props.bus, this, this.props.fmcService);

        FSComponent.render(this.activeHeader, this.activeHeaderRef.getOrDefault());
        FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());

        SimVar.SetSimVarValue(`L:A380X_MFD_${this.props.captOrFo === 'CAPT' ? 'L' : 'R'}_ACTIVE_PAGE`, 'string', uri.uri);
    }

    fmcChanged() {
        // TODO we'll see
    }

    render(): VNode {
        return (
            <CdsDisplayUnit bus={this.props.bus} displayUnitId={this.props.captOrFo === 'CAPT' ? DisplayUnitID.CaptMfd : DisplayUnitID.FoMfd}>
                <div class="mfd-main" ref={this.topRef}>
                    <div ref={this.activeHeaderRef} />
                    <MfdMsgList
                        visible={this.messageListOpened}
                        bus={this.props.bus}
                        fmcService={this.props.fmcService}
                    />
                    <MfdFmsFplnDuplicateNames
                        ref={this.duplicateNamesRef}
                        visible={this.duplicateNamesOpened}
                        fmcService={this.props.fmcService}
                    />
                    <div ref={this.activePageRef} class="mfd-navigator-container" />
                    <MouseCursor isDoubleScreenMfd side={Subject.create(this.props.captOrFo)} ref={this.mouseCursorRef} />
                </div>
            </CdsDisplayUnit>
        );
    }
}
