/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/MFD/pages/common/style.scss';

import {
    ArraySubject,
    ClockEvents,
    ComponentProps,
    DisplayComponent,
    EventBus,
    FSComponent,
    SimVarValueType,
    Subject,
    VNode,
} from '@microsoft/msfs-sdk';

import { FmsHeader } from 'instruments/src/MFD/pages/common/FmsHeader';
import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';
import { MfdFmsPerf } from 'instruments/src/MFD/pages/FMS/PERF';
import { MfdFmsInit } from 'instruments/src/MFD/pages/FMS/INIT';

import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';

import { MfdNotFound } from 'instruments/src/MFD/pages/FMS/NOT_FOUND';
import { FcuBkupHeader } from 'instruments/src/MFD/pages/common/FcuBkupHeader';
import { SurvHeader } from 'instruments/src/MFD/pages/common/SurvHeader';
import { AtccomHeader } from 'instruments/src/MFD/pages/common/AtccomHeader';
import { MfdFmsFuelLoad } from 'instruments/src/MFD/pages/FMS/FUEL_LOAD';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/F-PLN';
import { MfdMsgList } from 'instruments/src/MFD/pages/FMS/MSG_LIST';
import { ActiveUriInformation, MfdUIService } from 'instruments/src/MFD/pages/common/UIService';
import { MfdFmsFplnDep } from 'instruments/src/MFD/pages/FMS/F-PLN/DEPARTURE';
import { MfdFmsFplnArr } from 'instruments/src/MFD/pages/FMS/F-PLN/ARRIVAL';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { Fmgc, GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FmgcFlightPhase } from '@shared/flightphase';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { FmcWinds, FmcWindVector } from '@fmgc/guidance/vnav/wind/types';
import { Coordinates, Feet } from 'msfs-geo';
import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { NavaidSelectionManager } from '@fmgc/navigation/NavaidSelectionManager';
import { LandingSystemSelectionManager } from '@fmgc/navigation/LandingSystemSelectionManager';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { MfdSimvars } from './shared/MFDSimvarPublisher';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a380x-mfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface AbstractMfdPageProps extends ComponentProps {
    pageTitle?: string;
    bus: EventBus;
    uiService: MfdUIService;
    flightPlanService: FlightPlanService;
}

interface MfdComponentProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}
export class MfdComponent extends DisplayComponent<MfdComponentProps> {
    private uiService = new MfdUIService();

    private flightPlanService = new FlightPlanService(this.props.bus);

    private fmgc: Fmgc = {
        getZeroFuelWeight(): number {
            return 300_000;
        },
        getFOB(): number {
            return 100_0000;
        },
        getV2Speed(): Knots {
            return 150;
        },
        getTropoPause(): Feet {
            return 36_000;
        },
        getManagedClimbSpeed(): Knots {
            return 250;
        },
        getManagedClimbSpeedMach(): Mach {
            return 0.78;
        },
        getAccelerationAltitude(): Feet {
            return 1_500;
        },
        getThrustReductionAltitude(): Feet {
            return 1_500;
        },
        getOriginTransitionAltitude(): Feet | undefined {
            return 1_500;
        },
        getCruiseAltitude(): Feet {
            return 32_000;
        },
        getFlightPhase(): FmgcFlightPhase {
            return FmgcFlightPhase.Preflight;
        },
        getManagedCruiseSpeed(): Knots {
            return 280;
        },
        getManagedCruiseSpeedMach(): Mach {
            return 0.8;
        },
        getClimbSpeedLimit(): SpeedLimit {
            return { speed: 250, underAltitude: 10_000 };
        },
        getDescentSpeedLimit(): SpeedLimit {
            return { speed: 250, underAltitude: 10_000 };
        },
        getPreSelectedClbSpeed(): Knots {
            return 250;
        },
        getPreSelectedCruiseSpeed(): Knots {
            return 280;
        },
        getPreSelectedDescentSpeed(): Knots {
            return 220;
        },
        getTakeoffFlapsSetting(): FlapConf | undefined {
            return FlapConf.CONF_1;
        },
        getManagedDescentSpeed(): Knots {
            return 220;
        },
        getManagedDescentSpeedMach(): Mach {
            return 0.5;
        },
        getApproachSpeed(): Knots {
            return 136;
        },
        getFlapRetractionSpeed(): Knots {
            return 141;
        },
        getSlatRetractionSpeed(): Knots {
            return 159;
        },
        getCleanSpeed(): Knots {
            return 135;
        },
        getTripWind(): number {
            return 0;
        },
        getWinds(): FmcWinds {
            return { climb: [], cruise: [], des: [], alternate: null };
        },
        getApproachWind(): FmcWindVector {
            return { speed: 0, direction: 0 };
        },
        getApproachQnh(): number {
            return 1013;
        },
        getApproachTemperature(): number {
            return 15;
        },
        getDestEFOB(useFob: boolean): number { // Metric tons
            return useFob ? 12 : 11;
        },
        getDepartureElevation(): Feet | null {
            return 100;
        },
        getDestinationElevation(): Feet {
            return 100;
        },
    }

    private guidanceController = new GuidanceController(this.fmgc, this.flightPlanService);

    private navigationProvider: NavigationProvider = {
        getEpe(): number {
            return 0.1;
        },
        getPpos(): Coordinates | null {
            const lat = SimVar.GetSimVarValue('PLANE LATITUDE', SimVarValueType.Degree);
            const long = SimVar.GetSimVarValue('PLANE LONGITUDE', SimVarValueType.Degree);

            return { lat, long };
        },
        getBaroCorrectedAltitude(): number | null {
            return 0;
        },
        getPressureAltitude(): number | null {
            return 0;
        },
        getRadioHeight(): number | null {
            return 0;
        },
    }

    private navaidSelectionManager = new NavaidSelectionManager(this.flightPlanService, this.navigationProvider);

    private landingSystemSelectionManager = new LandingSystemSelectionManager(this.flightPlanService, this.navigationProvider)

    private navaidTuner = new NavaidTuner(this.navigationProvider, this.navaidSelectionManager, this.landingSystemSelectionManager);

    private efisSymbols = new EfisSymbols(this.guidanceController, this.flightPlanService, this.navaidTuner);

    private displayBrightness = Subject.create(0);

    private displayPowered = Subject.create(false);

    private activeFmsSource = Subject.create<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>('FMS 1');

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

    private async initializeFlightPlans() {
        NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Msfs);
        await new Promise((r) => setTimeout(r, 1000));
        this.flightPlanService.createFlightPlans();

        await this.flightPlanService.newCityPair('EGLL', 'LFPG', 'EBBR');
    }

    public async onAfterRender(node: VNode): Promise<void> {
        super.onAfterRender(node);

        await this.initializeFlightPlans();
        this.navaidTuner.init();
        this.efisSymbols.init();
        this.guidanceController.init();

        let lastUpdateTime = Date.now();
        setInterval(() => {
            const now = Date.now();
            const dt = now - lastUpdateTime;

            this.navaidSelectionManager.update(dt);
            this.landingSystemSelectionManager.update(dt);
            this.navaidTuner.update(dt);
            this.efisSymbols.update(dt);
            this.guidanceController.update(dt);

            lastUpdateTime = now;
        }, 100);

        const isCaptainSide = getDisplayIndex() === 1;

        this.activeFmsSource.set(isCaptainSide ? 'FMS 1' : 'FMS 2');

        const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value);
        });

        this.uiService.activeUri.sub((uri) => this.activeUriChanged(uri));

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });

        // Navigate to initial page
        this.uiService.navigateTo('fms/active/init');
    }

    private activeUriChanged(uri: ActiveUriInformation) {
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
        switch (uri.sys) {
        case 'fms':
            this.activeHeader = (
                <FmsHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    uiService={this.uiService}
                    flightPlanService={this.flightPlanService}
                />
            );
            break;
        case 'atccom':
            this.activeHeader = (
                <AtccomHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    uiService={this.uiService}
                    flightPlanService={this.flightPlanService}
                />
            );
            break;
        case 'surv':
            this.activeHeader = (
                <SurvHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    uiService={this.uiService}
                    flightPlanService={this.flightPlanService}
                />
            );
            break;
        case 'fcubkup':
            this.activeHeader = (
                <FcuBkupHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    uiService={this.uiService}
                    flightPlanService={this.flightPlanService}
                />
            );
            break;

        default:
            this.activeHeader = (
                <FmsHeader
                    bus={this.props.bus}
                    callsign={Subject.create('FBW123')}
                    activeFmsSource={this.activeFmsSource}
                    uiService={this.uiService}
                    flightPlanService={this.flightPlanService}
                />
            );
            break;
        }

        // Mapping from URL to page component
        switch (`${uri.sys}/${uri.category}/${uri.page}`) {
        case 'fms/active/perf':
            this.activePage = <MfdFmsPerf pageTitle="PERF" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;
        case 'fms/active/init':
            this.activePage = <MfdFmsInit pageTitle="INIT" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;
        case 'fms/active/fuel-load':
            this.activePage = <MfdFmsFuelLoad pageTitle="FUEL&LOAD" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;
        case 'fms/active/f-pln':
            this.activePage = <MfdFmsFpln pageTitle="F-PLN" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;
        case 'fms/active/f-pln-departure':
            this.activePage = <MfdFmsFplnDep pageTitle="F-PLN/DEPARTURE" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;
        case 'fms/active/f-pln-arrival':
            this.activePage = <MfdFmsFplnArr pageTitle="F-PLN/ARRIVAL" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;

        default:
            this.activePage = <MfdNotFound pageTitle="NOT FOUND" bus={this.props.bus} uiService={this.uiService} flightPlanService={this.flightPlanService} />;
            break;
        }

        if (uri.page === 'msg-list') {
            this.activePage = (
                <MfdMsgList
                    // eslint-disable-next-line max-len
                    messages={ArraySubject.create(['CLOSE RTE REQUEST FIRST', 'RECEIVED POS T.O DATA NOT VALID', 'CONSTRAINTS ABOVE CRZ FL DELETED', 'NOT IN DATABASE', 'GPS PRIMARY', 'CHECK T.O DATA'])}
                    bus={this.props.bus}
                    uiService={this.uiService}
                    flightPlanService={this.flightPlanService}
                />
            );
        }

        FSComponent.render(this.activeHeader, this.activeHeaderRef.getOrDefault());
        FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
    }

    render(): VNode {
        return (
            <DisplayUnit bus={this.props.bus} normDmc={1} brightness={this.displayBrightness} powered={this.displayPowered}>
                <div class="mfd-main" ref={this.topRef}>
                    <div ref={this.activeHeaderRef} />
                    <div ref={this.activePageRef} class="mfd-navigator-container" />
                    <MouseCursor side={Subject.create('CPT')} ref={this.mouseCursorRef} />
                </div>
            </DisplayUnit>
        );
    }
}
