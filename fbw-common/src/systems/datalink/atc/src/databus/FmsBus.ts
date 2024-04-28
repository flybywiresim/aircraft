//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  AtsuStatusCodes,
  FansMode,
  AtisMessage,
  AtisType,
  AtsuMessage,
  CpdlcMessage,
  DclMessage,
  OclMessage,
  PositionReportData,
  Waypoint,
} from '../../../common/src';

export interface FmsRouteData {
  lastWaypoint: Waypoint;
  activeWaypoint: Waypoint;
  nextWaypoint: Waypoint;
  destination: Waypoint;
}

export interface AtcFmsMessages {
  // data management control
  atcResetData: boolean;

  // responses from ATSU to FMS for requests
  atcGenericRequestResponse: number;
  atcRequestAtsuStatusCode: { requestId: number; code: AtsuStatusCodes };
  atcPositionReport: { requestId: number; data: PositionReportData };

  // requests from ATSU to FMS
  atcSystemStatus: AtsuStatusCodes;
  atcMessageModify: CpdlcMessage;
  atcPrintMessage: AtsuMessage;

  // synchronization stream from ATSU to FMS
  atcActiveAtisAutoUpdates: string[];
  atcAtisReports: AtisMessage[];
  atcPrintAtisReportsPrint: boolean;
  atcStationStatus: {
    current: string;
    next: string;
    notificationTime: number;
    mode: FansMode;
    logonInProgress: boolean;
  };
  atcMonitoredMessages: CpdlcMessage[];
  atcMaxUplinkDelay: number;
  atcAutomaticPositionReportActive: boolean;

  atcResynchronizeCpdlcMessage: CpdlcMessage;
  atcResynchronizeDclMessage: DclMessage;
  atcResynchronizeOclMessage: OclMessage;
  atcDeleteMessage: number;
}

export interface FmsAtcMessages {
  // flight plan synchronizations from FMS to ATC
  atcRouteData: FmsRouteData;

  // requests and synchronizations from FMS to ATC
  // expect 'atcRequestAtsuStatusCode' responses
  atcLogon: { station: string; requestId: number };
  atcLogoff: number;
  atcRequestAtis: { icao: string; type: AtisType; requestId: number };
  // expect 'atcGenericRequestResponse' responses
  atcActivateAtisAutoUpdate: { icao: string; type: AtisType; requestId: number };
  atcDeactivateAtisAutoUpdate: { icao: string; requestId: number };
  atcTogglePrintAtisReportsPrint: number;
  atcSetMaxUplinkDelay: { delay: number; requestId: number };
  atcToggleAutomaticPositionReport: number;
  // expect 'atcPositionReport' response
  atcRequestPositionReport: number;
  // fire & forget messages
  atcRegisterCpdlcMessages: CpdlcMessage[];
  atcRegisterDclMessages: DclMessage[];
  atcRegisterOclMessages: OclMessage[];
  atcUpdateMessage: CpdlcMessage;
  atcMessageRead: number;
  atcRemoveMessage: number;
  atcCleanupMessages: boolean;
  atcResetAtisAutoUpdate: boolean;
}
