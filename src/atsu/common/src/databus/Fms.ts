import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import { FansMode } from '@atsu/common/com/FutureAirNavigationSystem';
import {
    AtisMessage,
    AtisType,
    AtsuMessage,
    CpdlcMessage,
    DclMessage,
    FreetextMessage,
    OclMessage,
    WeatherMessage,
} from '@atsu/common/messages';
import { PositionReportData } from '@atsu/common/types';
import { Waypoint } from '@atsu/common/index';

export interface AtsuFmsRegisterMessages<T> {
    requestId: number;
    messages: T[];
}

export interface FmsRouteData {
    lastWaypoint: Waypoint;
    activeWaypoint: Waypoint;
    nextWaypoint: Waypoint;
    destination: Waypoint;
}

export interface AtsuFmsMessages {
    // flight plan synchronizations from FMS to ATSU
    routeData: FmsRouteData;

    // requests and synchronizations from FMS to ATSU
    // expect 'requestAtsuStatusCode' responses
    sendFreetextMessage: { message: FreetextMessage; requestId: number };
    remoteStationAvailable: { station: string; requestId: number };
    atcLogon: { station: string; requestId: number };
    atcLogoff: number;
    connectToNetworks: { callsign: string; requestId: number };
    requestAtcAtis: { icao: string; type: AtisType; requestId: number };
    // expect 'genericRequestResponse' responses
    activateAtisAutoUpdate: { icao: string; type: AtisType; requestId: number };
    deactivateAtisAutoUpdate: { icao: string; requestId: number };
    togglePrintAtisReportsPrint: number;
    setMaxUplinkDelay: { delay: number; requestId: number };
    toggleAutomaticPositionReport: number;
    // expect 'requestSentToGround' response as soon as request is sent and 'atisResponse'/'weatherResponse' as final answer
    requestAocAtis: { icao: string; type: AtisType; requestId: number };
    requestWeather: { icaos: string[]; requestMetar: boolean; requestId: number };
    // expect 'positionReport' response
    requestPositionReport: number;
    // fire & forget messages
    registerAtisMessages: AtisMessage[];
    registerCpdlcMessages: CpdlcMessage[];
    registerDclMessages: DclMessage[];
    registerOclMessages: OclMessage[];
    registerWeatherMessages: WeatherMessage[];
    updateMessage: CpdlcMessage;
    messageRead: number;
    removeMessage: number;
    cleanupAtcMessages: boolean;
    resetAtisAutoUpdate: boolean;

    // responses from ATSU to FMS for requests
    genericRequestResponse: number;
    requestAtsuStatusCode: { requestId: number; code: AtsuStatusCodes };
    requestSentToGround: number;
    weatherResponse: { requestId: number; data: [AtsuStatusCodes, WeatherMessage] };
    positionReport: { requestId: number; data: PositionReportData };

    // requests from ATSU to FMS
    atsuSystemStatus: AtsuStatusCodes;
    messageModify: CpdlcMessage;
    printMessage: AtsuMessage;

    // synchronization stream from ATSU to FMS
    activeAtisAutoUpdates: string[];
    atcAtisReports: AtisMessage[];
    printAtisReportsPrint: boolean;
    atcStationStatus: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean };
    monitoredMessages: CpdlcMessage[];
    maxUplinkDelay: number;
    automaticPositionReportActive: boolean;

    resynchronizeAocWeatherMessage: WeatherMessage;
    resynchronizeFreetextMessage: FreetextMessage;
    resynchronizeCpdlcMessage: CpdlcMessage;
    resynchronizeDclMessage: DclMessage;
    resynchronizeOclMessage: OclMessage;
    deleteMessage: number;
}
