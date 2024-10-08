import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestSpeed: FC<MessageVisualizationProps> = ({ x = 0, y = 0, index, messageElements, onDelete }) => {
  const updateValue = (value: string): boolean => {
    if (value === '') {
      messageElements[index].message = undefined;
      messageElements[index].readyToSend = false;
      return true;
    }

    const status = InputValidation.validateScratchpadSpeed(value);
    if (status === AtsuStatusCodes.Ok) {
      messageElements[index].message = CpdlcMessagesDownlink.DM18[1].deepCopy();
      messageElements[index].message.Content[0].Value = InputValidation.formatScratchpadSpeed(value);
      messageElements[index].readyToSend = true;
    } else {
      // TODO scratchpad error
    }

    return status === AtsuStatusCodes.Ok;
  };

  let prefix: string | undefined = undefined;
  let suffix: string | undefined = undefined;
  if (messageElements[index].message !== undefined) {
    if (messageElements[index].message?.Content[0].Value.startsWith('M')) {
      prefix = 'M';
    } else if (messageElements[index].message?.Content[0].Value.length !== 0) {
      suffix = 'KT';
    }
  }

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={95} fontSize={22} fill="white">
          REQUEST
        </text>
      </Layer>
      <Layer>
        <text x={83} fontSize={22} fill="white">
          SPD/MACH
        </text>
        <TextBox
          x={220}
          y={-28}
          maxLength={3}
          height={42}
          width={180}
          prefix={prefix}
          suffix={suffix}
          textAnchor="middle"
          onSubmit={(value) => updateValue(value)}
        />
      </Layer>
    </MessageElement>
  );
};
