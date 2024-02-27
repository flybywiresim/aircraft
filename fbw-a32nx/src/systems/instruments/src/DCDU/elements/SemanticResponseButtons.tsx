// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { AtsuMessageComStatus, CpdlcMessage, UplinkMessageInterpretation } from '@datalink/common';
import { Button } from './Button';

type SemanticResponseButtonsProps = {
  message: CpdlcMessage;
  reachedEndOfMessage: boolean;
  dataIncomplete: boolean;
  messageUnderModification: boolean;
  invertResponse: (message: number) => void;
  modifyResponse: (message: number) => void;
  sendMessage: (message: number) => void;
  closeMessage: (message: number) => void;
};

export const SemanticResponseButtons: React.FC<SemanticResponseButtonsProps> = ({
  message,
  reachedEndOfMessage,
  dataIncomplete,
  messageUnderModification,
  invertResponse,
  modifyResponse,
  sendMessage,
  closeMessage,
}) => {
  const showAnswers =
    !message.Response ||
    (message.Response.ComStatus !== AtsuMessageComStatus.Sending &&
      message.Response.ComStatus !== AtsuMessageComStatus.Sent);
  const buttonsBlocked =
    message.Response?.ComStatus === AtsuMessageComStatus.Sending ||
    messageUnderModification ||
    reachedEndOfMessage === false;

  const clicked = (index: string): void => {
    if (message.UniqueMessageID === -1 || buttonsBlocked) {
      return;
    }

    if (showAnswers) {
      if (index === 'L1') {
        invertResponse(message.UniqueMessageID);
      } else if (index === 'R1') {
        modifyResponse(message.UniqueMessageID);
      } else if (index === 'R2' && message.Response) {
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
          {UplinkMessageInterpretation.HasNegativeResponse(message) && (
            <>
              <Button
                messageId={message.UniqueMessageID}
                index="L1"
                content="CANNOT"
                active={!buttonsBlocked}
                onClick={clicked}
              />
            </>
          )}
          {UplinkMessageInterpretation.IsModifiable(message) && (
            <>
              <Button
                messageId={message.UniqueMessageID}
                index="R1"
                content="MODIFY"
                active={!buttonsBlocked}
                onClick={clicked}
              />
            </>
          )}
          <Button
            messageId={message.UniqueMessageID}
            index="R2"
            content="SEND"
            active={!dataIncomplete && !buttonsBlocked}
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
