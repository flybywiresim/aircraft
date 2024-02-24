//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  AtisType,
  AtsuStatusCodes,
  CpdlcMessage,
  DclMessage,
  FreetextMessage,
  OclMessage,
  WeatherMessage,
} from '../../../common/src';

export interface AtcAocRouterMessages {
  // streams to send several messages
  routerSendFreetextMessage: { requestId: number; message: FreetextMessage; force: boolean };
  routerSendCpdlcMessage: { requestId: number; message: CpdlcMessage; force: boolean };
  routerSendDclMessage: { requestId: number; message: DclMessage; force: boolean };
  routerSendOclMessage: { requestId: number; message: OclMessage; force: boolean };
  routerSendMessageResponse: { requestId: number; status: AtsuStatusCodes };

  // streams to request specific data
  routerRequestAtis: { requestId: number; icao: string; type: AtisType };
  routerRequestMetar: { requestId: number; icaos: string[] };
  routerRequestTaf: { requestId: number; icaos: string[] };
  routerRequestSent: number;
  routerReceivedWeather: { requestId: number; response: [AtsuStatusCodes, WeatherMessage] };
}

export interface RouterAtcAocMessages {
  // streams to read specific messages
  routerReceivedFreetextMessage: FreetextMessage;
  routerReceivedCpdlcMessage: CpdlcMessage;
}
