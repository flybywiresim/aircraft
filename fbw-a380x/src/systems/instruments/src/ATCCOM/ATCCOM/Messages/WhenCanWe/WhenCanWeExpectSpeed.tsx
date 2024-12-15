import React, { FC } from 'react';
import { InputValidation } from '@atsu/InputValidation';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const WhenCanWeExpectSpeed: FC<MessageVisualizationProps> = ({
  x = 0,
  y = 0,
  index,
  messageElements,
  onDelete,
}) => {
  const updateSpeed = (value: string): boolean => {
    if (value === '') {
      messageElements[index].message = undefined;
      messageElements[index].readyToSend = false;
      return true;
    }

    const status = InputValidation.validateScratchpadSpeed(value);
    if (status === AtsuStatusCodes.Ok) {
      messageElements[index].message = CpdlcMessagesDownlink.DM49[1].deepCopy();
      messageElements[index].message.Content[0].Value = InputValidation.formatScratchpadSpeed(value);
      messageElements[index].readyToSend = true;
    } else {
      // TODO set error message
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
        <text x={10} fontSize={22} fill="white">
          WHEN CAN WE EXPECT
        </text>
      </Layer>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          SPD/MACH
        </text>
        <TextBox
          x={150}
          y={-28}
          maxLength={3}
          height={42}
          width={160}
          prefix={prefix}
          suffix={suffix}
          textAnchor="middle"
          onSubmit={(value) => updateSpeed(value)}
        />
      </Layer>
    </MessageElement>
  );
};
