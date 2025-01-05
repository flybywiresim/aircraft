// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { CpdlcMessage } from '@datalink/common';
import { Button } from './Button';

type CloseButtonsProps = {
  message: CpdlcMessage;
  closeMessage: (message: number) => void;
};

export const CloseButtons: React.FC<CloseButtonsProps> = ({ message, closeMessage }) => {
  const clicked = (index: string): void => {
    if (message.UniqueMessageID === -1) {
      return;
    }

    if (index === 'R2') {
      closeMessage(message.UniqueMessageID);
    }
  };

  return (
    <>
      <Button messageId={message.UniqueMessageID} index="R2" content="CLOSE" active onClick={clicked} />
    </>
  );
};
