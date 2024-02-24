//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  CpdlcMessage,
  CpdlcMessageMonitoringState,
  AtsuMessageComStatus,
  AtsuTimestamp,
  UplinkMonitor,
  UplinkMessageInterpretation,
} from '../../../common/src';
import { Atc } from '../ATC';

export class UplinkMessageStateMachine {
  public static initialize(atc: Atc, message: CpdlcMessage): void {
    message.CloseAutomatically = !UplinkMessageInterpretation.MessageRemainsOnMailbox(message);

    if (UplinkMonitor.relevantMessage(message)) {
      message.MessageMonitoring = CpdlcMessageMonitoringState.Required;
      message.SemanticResponseRequired = false;
    } else {
      message.MessageMonitoring = CpdlcMessageMonitoringState.Ignored;
      message.SemanticResponseRequired = UplinkMessageInterpretation.SemanticAnswerRequired(message);
      if (message.SemanticResponseRequired) {
        UplinkMessageInterpretation.AppendSemanticAnswer(atc, true, message);
      }
    }
  }

  public static update(atc: Atc, message: CpdlcMessage, uiEvent: boolean, positive: boolean): void {
    if (positive) {
      if (message.MessageMonitoring === CpdlcMessageMonitoringState.Required) {
        message.MessageMonitoring = CpdlcMessageMonitoringState.Monitoring;
        atc.messageMonitoring.monitorMessage(message);
      } else if (!uiEvent && message.MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
        message.MessageMonitoring = CpdlcMessageMonitoringState.Finished;
        message.ReminderTimestamp = AtsuTimestamp.fromClock(atc.digitalInputs.UtcClock);
        message.SemanticResponseRequired = UplinkMessageInterpretation.SemanticAnswerRequired(message);
      }
    } else if (message.MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
      if (
        message.Response?.ComStatus === AtsuMessageComStatus.Sending ||
        message.Response?.ComStatus === AtsuMessageComStatus.Sent
      ) {
        message.MessageMonitoring = CpdlcMessageMonitoringState.Cancelled;
      } else {
        message.MessageMonitoring = CpdlcMessageMonitoringState.Required;
      }
      atc.messageMonitoring.removeMessage(message.UniqueMessageID);
    }

    if (message.SemanticResponseRequired) {
      UplinkMessageInterpretation.AppendSemanticAnswer(atc, positive, message);
    }
  }
}
