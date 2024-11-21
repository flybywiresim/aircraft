//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DclMessage, OclMessage, CpdlcMessage } from '../messages';

export enum MailboxStatusMessage {
  NoMessage = -1,
  AnswerRequired = 0,
  CommunicationFault,
  CommunicationNotAvailable,
  CommunicationNotInitialized,
  MaximumDownlinkMessages,
  LinkLost,
  FlightplanLoadFailed,
  FlightplanLoadPartial,
  FlightplanLoadingUnavailable,
  MonitoringFailed,
  MonitoringLost,
  MonitoringUnavailable,
  NoAtcReply,
  OverflowClosed,
  PrintFailed,
  PriorityMessage,
  SendFailed = 16,
  FlightplanLoadSecondary,
  FlightplanLoadingSecondary,
  FmsDisplayForText,
  FmsDisplayForModification,
  MonitoringCancelled,
  Monitoring,
  NoFmData,
  NoMoreMessages,
  NoMorePages,
  PartialFmgsData,
  Printing,
  RecallMode,
  RecallEmpty,
  Reminder,
  Sending,
  Sent,
  WaitFmData,
}

export interface AtsuMailboxMessages {
  resetSystem: boolean;
  deleteMessage: number;
  closeMessage: number;
  readMessage: number;
  visibleMessage: number;
  invertSemanticResponse: number;
  recallMessage: boolean;
  updateMessageMonitoring: number;
  stopMessageMonitoring: number;
  uplinkResponse: { uid: number; responseId: number };
  downlinkTransmit: number;
  modifyMessage: number;
  printMessage: number;
  cpdlcMessages: CpdlcMessage[];
  dclMessages: DclMessage[];
  oclMessages: OclMessage[];
  logonMessage: string;
  systemStatus: MailboxStatusMessage;
  messageStatus: { uid: number; status: MailboxStatusMessage };
}
