// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MailboxStatusMessage } from '@datalink/common';
import React from 'react';
import { MessageVisualization } from './MessageVisualization';

type AtcStatusProps = {
  message: string;
};

export const AtcStatus: React.FC<AtcStatusProps> = ({ message }) => {
  let cssClass = 'atc-info ';
  if (message.includes('CURRENT')) {
    cssClass += 'atc-info-active';
  } else {
    cssClass += 'atc-info-standby';
  }

  const reachedEndOfMessageSink = (_uid: number, _reachedEnd: boolean): void => {};
  const systemStatusSink = (_status: MailboxStatusMessage): void => {};

  return (
    <>
      <MessageVisualization
        message={message}
        messageUid={-1}
        messageIsReminder={false}
        backgroundColor={[0, 0, 0]}
        ignoreHighlight={false}
        cssClass={cssClass}
        yStart={800}
        deltaY={240}
        updateSystemStatusMessage={systemStatusSink}
        reachedEndOfMessage={reachedEndOfMessageSink}
      />
    </>
  );
};
