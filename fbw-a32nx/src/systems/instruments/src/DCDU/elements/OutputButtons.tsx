// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { AtsuMessageComStatus, CpdlcMessage } from '@datalink/common';
import { Button } from './Button';

type OutputButtonsProps = {
  message: CpdlcMessage;
  reachedEndOfMessage: boolean;
  sendMessage: (message: number) => void;
  deleteMessage: (message: number) => void;
  closeMessage: (message: number) => void;
};

export const OutputButtons: React.FC<OutputButtonsProps> = ({
  message,
  reachedEndOfMessage,
  sendMessage,
  deleteMessage,
  closeMessage,
}) => {
  const buttonsBlocked = message.ComStatus === AtsuMessageComStatus.Sending || reachedEndOfMessage === false;

  // define the rules for the visualization of the buttons
  let showAnswers = false;

  if (message.ComStatus === AtsuMessageComStatus.Open || message.ComStatus === AtsuMessageComStatus.Failed) {
    showAnswers = true;
  }

  const clicked = (index: string): void => {
    if (message.UniqueMessageID === -1) {
      return;
    }

    if (showAnswers) {
      if (index === 'L1') {
        deleteMessage(message.UniqueMessageID);
      } else if (index === 'R2') {
        sendMessage(message.UniqueMessageID);
      }
    } else if (index === 'R2') {
      closeMessage(message.UniqueMessageID);
    }
  };

  return (
    <>
      {showAnswers && (
        <>
          <Button
            messageId={message.UniqueMessageID}
            index="L1"
            content="CANCEL"
            active={!buttonsBlocked}
            onClick={clicked}
          />
          <Button
            messageId={message.UniqueMessageID}
            index="R2"
            content="SEND"
            active={!buttonsBlocked}
            onClick={clicked}
          />
        </>
      )}
      {!showAnswers && (
        <Button
          messageId={message.UniqueMessageID}
          index="R2"
          content="CLOSE"
          active={!buttonsBlocked}
          onClick={clicked}
        />
      )}
    </>
  );
};
