import { EventBus, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

// Page imports
import { MfdFmsDataStatus } from 'instruments/src/MFD/pages/FMS/DATA/STATUS';
import { MfdFmsFplnAirways } from 'instruments/src/MFD/pages/FMS/F-PLN/AIRWAYS';
import { MfdFmsFplnArr } from 'instruments/src/MFD/pages/FMS/F-PLN/ARRIVAL';
import { MfdFmsFplnDep } from 'instruments/src/MFD/pages/FMS/F-PLN/DEPARTURE';
import { MfdFmsFplnDirectTo } from 'instruments/src/MFD/pages/FMS/F-PLN/DIRECT-TO';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/F-PLN';
import { MfdFmsFplnHold } from 'instruments/src/MFD/pages/FMS/F-PLN/HOLD';
import { MfdFmsFplnVertRev } from 'instruments/src/MFD/pages/FMS/F-PLN/VERT_REV';
import { MfdFmsFuelLoad } from 'instruments/src/MFD/pages/FMS/FUEL_LOAD';
import { MfdFmsInit } from 'instruments/src/MFD/pages/FMS/INIT';
import { MfdNotFound } from 'instruments/src/MFD/pages/FMS/NOT_FOUND';
import { MfdFmsPerf } from 'instruments/src/MFD/pages/FMS/PERF';
import { MfdFmsPositionIrs } from 'instruments/src/MFD/pages/FMS/POSITION/IRS';
import { MfdFmsPositionNavaids } from 'instruments/src/MFD/pages/FMS/POSITION/NAVAIDS';

// Header imports
import { AtccomHeader } from 'instruments/src/MFD/pages/common/AtccomHeader';
import { FcuBkupHeader } from 'instruments/src/MFD/pages/common/FcuBkupHeader';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/FlightManagementService';
import { FmsHeader } from 'instruments/src/MFD/pages/common/FmsHeader';
import { SurvHeader } from 'instruments/src/MFD/pages/common/SurvHeader';
import { MfdUIService } from 'instruments/src/MFD/pages/common/UIService';

export function pageForUrl(url: string, bus: EventBus, uiService: MfdUIService, fmService: MfdFlightManagementService): VNode {
    switch (url) {
    case 'fms/active/perf':
    case 'fms/sec1/perf':
    case 'fms/sec2/perf':
    case 'fms/sec3/perf':
        return (
            <MfdFmsPerf
                pageTitle="PERF"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/init':
    case 'fms/sec1/init':
    case 'fms/sec2/init':
    case 'fms/sec3/init':
        return (
            <MfdFmsInit
                pageTitle="INIT"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/fuel-load':
    case 'fms/sec1/fuel-load':
    case 'fms/sec2/fuel-load':
    case 'fms/sec3/fuel-load':
        return (
            <MfdFmsFuelLoad
                pageTitle="FUEL&LOAD"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln':
    case 'fms/sec1/f-pln':
    case 'fms/sec2/f-pln':
    case 'fms/sec3/f-pln':
        return (
            <MfdFmsFpln
                pageTitle="F-PLN"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln-airways':
    case 'fms/sec1/f-pln-airways':
    case 'fms/sec2/f-pln-airways':
    case 'fms/sec3/f-pln-airways':
        return (
            <MfdFmsFplnAirways
                pageTitle="F-PLN/AIRWAYS"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln-departure':
    case 'fms/sec1/f-pln-departure':
    case 'fms/sec2/f-pln-departure':
    case 'fms/sec3/f-pln-departure':
        return (
            <MfdFmsFplnDep
                pageTitle="F-PLN/DEPARTURE"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln-arrival':
    case 'fms/sec1/f-pln-arrival':
    case 'fms/sec2/f-pln-arrival':
    case 'fms/sec3/f-pln-arrival':
        return (
            <MfdFmsFplnArr
                pageTitle="F-PLN/ARRIVAL"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln-direct-to':
    case 'fms/sec1/f-pln-direct-to':
    case 'fms/sec2/f-pln-direct-to':
    case 'fms/sec3/f-pln-direct-to':
        return (
            <MfdFmsFplnDirectTo
                pageTitle="F-PLN/DIRECT-TO"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln-vert-rev':
    case 'fms/sec1/f-pln-vert-rev':
    case 'fms/sec2/f-pln-vert-rev':
    case 'fms/sec3/f-pln-vert-rev':
        return (
            <MfdFmsFplnVertRev
                pageTitle="F-PLN/VERT REV"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/active/f-pln-hold':
    case 'fms/sec1/f-pln-hold':
    case 'fms/sec2/f-pln-hold':
    case 'fms/sec3/f-pln-hold':
        return (
            <MfdFmsFplnHold
                pageTitle="F-PLN/HOLD"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/position/irs':
        return (
            <MfdFmsPositionIrs
                pageTitle="IRS"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/position/navaids':
        return (
            <MfdFmsPositionNavaids
                pageTitle="NAVAIDS"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fms/data/status':
        return (
            <MfdFmsDataStatus
                pageTitle="STATUS"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );

    default:
        return (
            <MfdNotFound
                pageTitle="NOT FOUND"
                bus={bus}
                uiService={uiService}
                fmService={fmService}
            />
        );
    }
}

export function headerForSystem(
    sys: string,
    bus: EventBus,
    atcCallsign: Subscribable<string>,
    activeFmsSource: Subscribable<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>,
    uiService: MfdUIService,
    fmService: MfdFlightManagementService,
): VNode {
    switch (sys) {
    case 'fms':
        return (
            <FmsHeader
                bus={bus}
                callsign={atcCallsign}
                activeFmsSource={activeFmsSource}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'atccom':
        return (
            <AtccomHeader
                bus={bus}
                callsign={atcCallsign}
                activeFmsSource={activeFmsSource}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'surv':
        return (
            <SurvHeader
                bus={bus}
                callsign={atcCallsign}
                activeFmsSource={activeFmsSource}
                uiService={uiService}
                fmService={fmService}
            />
        );
    case 'fcubkup':
        return (
            <FcuBkupHeader
                bus={bus}
                callsign={atcCallsign}
                activeFmsSource={activeFmsSource}
                uiService={uiService}
                fmService={fmService}
            />
        );
    default:
        return (
            <FmsHeader
                bus={bus}
                callsign={atcCallsign}
                activeFmsSource={activeFmsSource}
                uiService={uiService}
                fmService={fmService}
            />
        );
    }
}
