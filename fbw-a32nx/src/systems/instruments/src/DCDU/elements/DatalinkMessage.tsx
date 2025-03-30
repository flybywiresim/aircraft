// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import {
  AtsuMessageComStatus,
  AtsuMessageDirection,
  AtsuMessageSerializationFormat,
  CpdlcMessage,
  CpdlcMessageMonitoringState,
  MailboxStatusMessage,
} from '@datalink/common';
import { MessageVisualization } from './MessageVisualization';

type DatalinkMessageProps = {
  messages: CpdlcMessage[];
  updateSystemStatusMessage: (status: MailboxStatusMessage) => void;
  reachedEndOfMessage: (uid: number, reachedEnd: boolean) => void;
};

export const DatalinkMessage: React.FC<DatalinkMessageProps> = ({
  messages,
  updateSystemStatusMessage,
  reachedEndOfMessage,
}) => {
  // define the correct background color
  let backgroundColor: [number, number, number] = [0, 0, 0];
  if (messages[0].Direction === AtsuMessageDirection.Downlink) {
    if (messages[0].ComStatus === AtsuMessageComStatus.Sent || messages[0].ComStatus === AtsuMessageComStatus.Sending) {
      backgroundColor = [0, 255, 0];
    } else {
      backgroundColor = [0, 255, 255];
    }
  } else if (messages[0].SemanticResponseRequired) {
    if (
      messages[0].Response?.ComStatus === AtsuMessageComStatus.Sent ||
      messages[0].Response?.ComStatus === AtsuMessageComStatus.Sending
    ) {
      backgroundColor = [0, 255, 0];
    } else {
      backgroundColor = [0, 255, 255];
    }
  }

  // check if highlight is needed
  let ignoreHighlight = false;
  if (messages[0].Direction === AtsuMessageDirection.Downlink) {
    ignoreHighlight = true;
  } else if (messages[0].Response?.ComStatus === AtsuMessageComStatus.Sending) {
    ignoreHighlight = true;
  } else if (
    messages[0].Response?.ComStatus === AtsuMessageComStatus.Sent &&
    messages[0].Response?.Message !== 'STANDBY'
  ) {
    ignoreHighlight = true;
  }

  // define the text color
  const messageIsReminder =
    !messages[0].SemanticResponseRequired && messages[0].MessageMonitoring === CpdlcMessageMonitoringState.Finished;
  let messageClass = 'message-content';
  if (messages[0].Direction === AtsuMessageDirection.Downlink) {
    messageClass += ' message-content-other message-content-out';
  } else if (ignoreHighlight && !messageIsReminder) {
    messageClass += ' message-content-sent';
  } else {
    messageClass += ' message-content-other message-content-in';
  }

  // create the message content
  let content = '';
  const watchdogIndices: number[] = [];
  let messageSeperatorLine: number | undefined = undefined;
  if (messages[0].MessageMonitoring === CpdlcMessageMonitoringState.Finished) {
    content = `_____REMINDER MSG ${messages[0].Timestamp.mailboxTimestamp()}\n`;
    messageSeperatorLine = 1;

    if (messages[0].SemanticResponseRequired) {
      content += `${messages[0].Response.serialize(AtsuMessageSerializationFormat.Mailbox)}\n`;
    } else {
      messages.forEach((message) => {
        if (message.Content.length === 0 && message.Message !== '') {
          content += `${message.Message}\n`;
        } else {
          content += `${message.serialize(AtsuMessageSerializationFormat.Mailbox)}\n`;
        }
      });
    }

    content = content.replace(/@/g, '');
  } else {
    let offset = 0;

    messages.forEach((message) => {
      if (message.Content.length === 0 && message.Message !== '') {
        content += `${message.Message}\n`;
        offset += message.Message.split(' ').length;
      } else {
        if (messages[0].MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
          message.Content.forEach((element) => {
            element.Content.forEach((value) => {
              if (value.Monitoring) {
                watchdogIndices.push(offset + value.IndexStart);
              }
            });
          });
        }

        const text = message.serialize(AtsuMessageSerializationFormat.Mailbox);
        offset += text.split(' ').length;
        content += `${text}\n`;
      }
    });

    if (messages[0].SemanticResponseRequired && messages[0].Response) {
      messageSeperatorLine = content.split('\n').length;
      content += '------------------------------\n';
      content += `${messages[0].Response.serialize(AtsuMessageSerializationFormat.Mailbox)}//\n`;
    }
  }

  // remove the last newline
  if (content.length !== 0 && content[content.length - 1] === '\n') {
    content = content.slice(0, -1);
  }

  if (messages[0].Content[0]?.Urgent) {
    content = `_____***HIGH PRIORITY***\n${content}`;
    if (messageSeperatorLine !== undefined) {
      messageSeperatorLine += 1;
    }
  }

  return (
    <g>
      <MessageVisualization
        messageUid={messages.length !== 0 ? messages[0].UniqueMessageID : -1}
        message={content}
        seperatorLine={messageSeperatorLine}
        backgroundColor={backgroundColor}
        messageIsReminder={messageIsReminder}
        keepNewlines
        ignoreHighlight={ignoreHighlight}
        cssClass={messageClass}
        yStart={720}
        deltaY={240}
        watchdogIndices={watchdogIndices}
        updateSystemStatusMessage={updateSystemStatusMessage}
        reachedEndOfMessage={reachedEndOfMessage}
      />
    </g>
  );
};
