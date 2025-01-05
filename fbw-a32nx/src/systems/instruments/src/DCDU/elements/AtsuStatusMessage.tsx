// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MailboxStatusMessage } from '@datalink/common';
import React from 'react';

type AtsuStatusMessageProps = {
  visibleMessage: MailboxStatusMessage;
  systemMessage: MailboxStatusMessage;
};

const translateStatusMessage = (status: MailboxStatusMessage) => {
  switch (status) {
    case MailboxStatusMessage.AnswerRequired:
      return 'ANSWER MSG';
    case MailboxStatusMessage.CommunicationFault:
      return 'COM FAULT';
    case MailboxStatusMessage.CommunicationNotAvailable:
      return 'COM NOT AVAIL';
    case MailboxStatusMessage.CommunicationNotInitialized:
      return 'COM NOT INIT';
    case MailboxStatusMessage.MaximumDownlinkMessages:
      return 'FILE FULL';
    case MailboxStatusMessage.LinkLost:
      return 'LINK LOST';
    case MailboxStatusMessage.FlightplanLoadFailed:
      return 'LOAD FAILED';
    case MailboxStatusMessage.FlightplanLoadPartial:
      return 'LOAD PARTIAL';
    case MailboxStatusMessage.FlightplanLoadingUnavailable:
      return 'LOAD UNAVAIL';
    case MailboxStatusMessage.MonitoringFailed:
      return 'MONIT FAILED';
    case MailboxStatusMessage.MonitoringLost:
      return 'MONIT LOST';
    case MailboxStatusMessage.MonitoringUnavailable:
      return 'MONIT UNAVAIL';
    case MailboxStatusMessage.NoAtcReply:
      return 'NO ATC REPLY';
    case MailboxStatusMessage.OverflowClosed:
      return 'OVERFLW CLOSED';
    case MailboxStatusMessage.PrintFailed:
      return 'PRINT FAILED';
    case MailboxStatusMessage.PriorityMessage:
      return 'PRIORITY MSG';
    case MailboxStatusMessage.SendFailed:
      return 'SEND FAILED';
    case MailboxStatusMessage.FlightplanLoadSecondary:
      return 'LOAD SEC OK';
    case MailboxStatusMessage.FlightplanLoadingSecondary:
      return 'LOADING SEC';
    case MailboxStatusMessage.FmsDisplayForText:
      return 'MCDU FOR TEXT';
    case MailboxStatusMessage.FmsDisplayForModification:
      return 'MCDU FOR MODIF';
    case MailboxStatusMessage.MonitoringCancelled:
      return 'MONIT CNCLD';
    case MailboxStatusMessage.Monitoring:
      return 'MONITORING';
    case MailboxStatusMessage.NoFmData:
      return 'NO FM DATA';
    case MailboxStatusMessage.NoMoreMessages:
      return 'NO MORE MSG';
    case MailboxStatusMessage.NoMorePages:
      return 'NO MORE PGE';
    case MailboxStatusMessage.PartialFmgsData:
      return 'PARTIAL DATA';
    case MailboxStatusMessage.Printing:
      return 'PRINTING';
    case MailboxStatusMessage.RecallMode:
      return 'RECALL MODE';
    case MailboxStatusMessage.RecallEmpty:
      return (
        <>
          <tspan>RECALL EMPTY</tspan>
          <tspan x="50%" dy={200}>
            CONSULT MSG RECORD
          </tspan>
        </>
      );
    case MailboxStatusMessage.Reminder:
      return 'REMINDER';
    case MailboxStatusMessage.Sending:
      return 'SENDING';
    case MailboxStatusMessage.Sent:
      return 'SENT';
    case MailboxStatusMessage.WaitFmData:
      return 'WAIT FM DATA';
    case MailboxStatusMessage.NoMessage:
    default:
      return '';
  }
};

export const AtsuStatusMessage: React.FC<AtsuStatusMessageProps> = ({ visibleMessage, systemMessage }) => {
  if (visibleMessage === MailboxStatusMessage.NoMessage && systemMessage === MailboxStatusMessage.NoMessage) {
    return <></>;
  }

  let textFill = 'rgb(255,255,255)';
  if (systemMessage !== MailboxStatusMessage.NoMessage) {
    if (systemMessage <= MailboxStatusMessage.SendFailed) {
      textFill = 'rgb(255,191,0)';
    }
  } else if (visibleMessage !== MailboxStatusMessage.NoMessage) {
    if (visibleMessage <= MailboxStatusMessage.SendFailed) {
      textFill = 'rgb(255,191,0)';
    }
  }

  return (
    <>
      <g>
        <text className="status-atsu" fill={textFill} x="50%" y="2160">
          {translateStatusMessage(systemMessage !== MailboxStatusMessage.NoMessage ? systemMessage : visibleMessage)}
        </text>
      </g>
    </>
  );
};
