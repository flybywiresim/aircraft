//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
    AtsuStatusCodes,
    AtisType,
    AtsuMessage,
    FreetextMessage,
    WeatherMessage,
    FlightPlanMessage,
    NotamMessage,
    FlightPerformanceMessage,
    FlightFuelMessage,
    FlightWeightsMessage,
} from '@datalink/common';

export interface AocDatalinkMessages {
    aocResetData: boolean;

    aocRequestSentToGround: number;
    aocWeatherResponse: { requestId: number; data: [AtsuStatusCodes, WeatherMessage] };

    aocSystemStatus: AtsuStatusCodes;
    aocTransmissionResponse: { requestId: number; status: AtsuStatusCodes };

    aocReceivedFlightPlan: { requestId: number; data: FlightPlanMessage };
    aocReceivedNotams: { requestId: number; data: NotamMessage[] };
    aocReceivedPerformance: { requestId: number; data: FlightPerformanceMessage };
    aocReceivedFuel: { requestId: number; data: FlightFuelMessage };
    aocReceivedWeights: { requestId: number; data: FlightWeightsMessage };
    aocResynchronizeWeatherMessage: WeatherMessage;
    aocResynchronizeFreetextMessage: FreetextMessage;

    aocPrintMessage: AtsuMessage;
    aocDeleteMessage: number;
}

export interface DatalinkAocMessages {
    aocSendFreetextMessage: { message: FreetextMessage; requestId: number };

    aocRequestAtis: { icao: string; type: AtisType; requestId: number };
    aocRequestWeather: { icaos: string[]; requestMetar: boolean; requestId: number };
    aocRequestFlightPlan: number;
    aocRequestNotams: number;
    aocRequestPerformance: number;
    aocRequestFuel: number;
    aocRequestWeights: number;

    aocRegisterWeatherMessages: WeatherMessage[];
    aocRegisterFreetextMessages: FreetextMessage[];

    aocMessageRead: number;
    aocRemoveMessage: number;
}
