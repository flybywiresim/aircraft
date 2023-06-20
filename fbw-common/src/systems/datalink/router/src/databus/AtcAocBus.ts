//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
    AtisType,
    AtsuStatusCodes,
    CpdlcMessage,
    DclMessage,
    FlightFuelMessage,
    FlightPerformanceMessage,
    FlightPlanMessage,
    FlightWeightsMessage,
    FreetextMessage,
    NotamMessage,
    OclMessage,
    OutOffOnInMessage,
    WeatherMessage,
} from '@datalink/common';

export interface AtcAocRouterMessages {
    // some FBW specific channels
    routerUpdateFromTo: { from: string, to: string },

    // streams to send several messages
    routerSendFreetextMessage: { requestId: number, message: FreetextMessage, force: boolean };
    routerSendCpdlcMessage: { requestId: number, message: CpdlcMessage, force: boolean };
    routerSendDclMessage: { requestId: number, message: DclMessage, force: boolean };
    routerSendOclMessage: { requestId: number, message: OclMessage, force: boolean };
    routerSendOooiMessage: { requestId: number, message: OutOffOnInMessage, force: boolean };

    // streams to request specific data
    routerRequestFlightplan: { requestId: number };
    routerRequestNotams: { requestId: number };
    routerRequestPerformance: { requestId: number };
    routerRequestFuel: { requestId: number };
    routerRequestWeights: { requestId: number };
    routerRequestAtis: { requestId: number, icao: string, type: AtisType };
    routerRequestMetar: { requestId: number, icaos: string[] };
    routerRequestTaf: { requestId: number, icaos: string[] };
}

export interface RouterAtcAocMessages {
    // streams to read specific messages
    routerReceivedFreetextMessage: FreetextMessage;
    routerReceivedCpdlcMessage: CpdlcMessage;

    // responses for specific requests
    routerReceivedFlightplan: { requestId: number, response: [AtsuStatusCodes, FlightPlanMessage] };
    routerReceivedNotams: { requestId: number, response: [AtsuStatusCodes, NotamMessage[]] };
    routerReceivedPerformance: { requestId: number, response: [AtsuStatusCodes, FlightPerformanceMessage] };
    routerReceivedFuel: { requestId: number, response: [AtsuStatusCodes, FlightFuelMessage] };
    routerReceivedWeights: { requestId: number, response: [AtsuStatusCodes, FlightWeightsMessage] };
    routerReceivedWeather: { requestId: number, response: [AtsuStatusCodes, WeatherMessage] };
    routerSendMessageResponse: { requestId: number, status: AtsuStatusCodes };
    routerRequestSent: number;
}
