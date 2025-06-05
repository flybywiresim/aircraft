import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestWeatherDeviation: FC<MessageVisualizationProps> = ({
  x = 0,
  y = 0,
  index,
  messageElements,
  onDelete,
}) => {
  const updateValue = (value: string): boolean => {
    if (value === '') {
      messageElements[index].message = undefined;
      messageElements[index].readyToSend = false;
      return true;
    }

    const status = InputValidation.validateScratchpadOffset(value);
    if (status === AtsuStatusCodes.Ok) {
      messageElements[index].message = CpdlcMessagesDownlink.DM27[1].deepCopy();
      const formattedValue = InputValidation.formatScratchpadOffset(value);
      messageElements[index].message.Content[0].Value = formattedValue[0];
      messageElements[index].message.Content[1].Value = formattedValue[1];
      messageElements[index].readyToSend = true;
    } else {
      // TODO scratchpad error
    }

    return status === AtsuStatusCodes.Ok;
  };

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          REQUEST WX DEVIATION
        </text>
      </Layer>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          UP TO
        </text>
        <TextBox x={100} y={-28} maxLength={3} height={42} width={220} onSubmit={(value) => updateValue(value)} />
        <text x={340} fontSize={22} fill="white">
          OF ROUTE
        </text>
      </Layer>
    </MessageElement>
  );
};
