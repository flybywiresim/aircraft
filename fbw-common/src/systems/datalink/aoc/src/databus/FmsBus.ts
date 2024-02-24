//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, AtisType, AtsuMessage, FreetextMessage, WeatherMessage } from '../../../common/src';

export interface AocFmsMessages {
  aocResetData: boolean;

  aocRequestSentToGround: number;
  aocWeatherResponse: { requestId: number; data: [AtsuStatusCodes, WeatherMessage] };

  aocSystemStatus: AtsuStatusCodes;
  aocTransmissionResponse: { requestId: number; status: AtsuStatusCodes };

  aocResynchronizeWeatherMessage: WeatherMessage;
  aocResynchronizeFreetextMessage: FreetextMessage;
  aocPrintMessage: AtsuMessage;
  aocDeleteMessage: number;
}

export interface FmsAocMessages {
  aocSendFreetextMessage: { message: FreetextMessage; requestId: number };
  aocRequestAtis: { icao: string; type: AtisType; requestId: number };
  aocRequestWeather: { icaos: string[]; requestMetar: boolean; requestId: number };
  aocRegisterWeatherMessages: WeatherMessage[];
  aocRegisterFreetextMessages: FreetextMessage[];
  aocMessageRead: number;
  aocRemoveMessage: number;
}
