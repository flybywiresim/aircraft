import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestLevel: FC<MessageVisualizationProps> = ({ x = 0, y = 0, index, messageElements, onDelete }) => {
  const updateValue = (value: string): boolean => {
    if (value === '') {
      messageElements[index].message = undefined;
      messageElements[index].readyToSend = false;
      return true;
    }

    const status = InputValidation.validateScratchpadAltitude(value);
    if (status === AtsuStatusCodes.Ok) {
      messageElements[index].message = CpdlcMessagesDownlink.DM6[1].deepCopy();
      messageElements[index].message.Content[0].Value = InputValidation.formatScratchpadAltitude(value);
      messageElements[index].readyToSend = true;
    } else {
      // TODO scratchpad error
    }

    return status === AtsuStatusCodes.Ok;
  };

  let altitudeSuffix: string | undefined = undefined;
  let isFlightlevel = false;
  if (messageElements[index].message !== undefined) {
    isFlightlevel = messageElements[index].message?.Content[0].Value.startsWith('FL') || false;
    if (!isFlightlevel) {
      altitudeSuffix = messageElements[index].message?.Content[0].Value.endsWith('FT') ? 'FT' : 'M';
    }
  }

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          REQUEST ALT/FL
        </text>
        <TextBox
          x={220}
          y={-28}
          maxLength={5}
          height={42}
          width={240}
          prefix={isFlightlevel ? 'FL' : undefined}
          suffix={altitudeSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateValue(value)}
        />
      </Layer>
    </MessageElement>
  );
};
