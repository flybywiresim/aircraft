import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessageElement, CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestOffset: FC<MessageVisualizationProps> = ({ x = 0, y = 0, index, messageElements, onDelete }) => {
  const updateValue = (value: string, boxIndex: number): boolean => {
    if (value === '') {
      if (
        boxIndex === 0 &&
        (messageElements[index].message?.TypeId === 'DM16' || messageElements[index].message?.TypeId === 'DM16')
      ) {
        if (messageElements[index].message?.Content[0].Value === '') {
          messageElements[index].message = undefined;
        } else {
          messageElements[index].message.Content[1].Value = '';
        }
        messageElements[index].readyToSend = false;
      } else if (boxIndex === 1 && messageElements[index].message !== undefined) {
        const newMessage = CpdlcMessagesDownlink.DM15[1].deepCopy();
        newMessage.Content[0].Value = messageElements[index].message?.Content[1].Value || '';
        newMessage.Content[1].Value = messageElements[index].message?.Content[2].Value || '';
        messageElements[index].message = newMessage;
        messageElements[index].readyToSend = newMessage.Content[0].Value !== '';
      } else {
        messageElements[index].message = undefined;
        messageElements[index].readyToSend = false;
      }

      return true;
    }

    if (boxIndex === 0) {
      const status = InputValidation.validateScratchpadOffset(value);
      if (status === AtsuStatusCodes.Ok) {
        const formattedValue = InputValidation.expandLateralOffset(value).split(' ');
        if (messageElements[index].message === undefined) {
          messageElements[index].message = CpdlcMessagesDownlink.DM15[1].deepCopy();
          messageElements[index].message.Content[0].Value = formattedValue[0];
          messageElements[index].message.Content[1].Value = formattedValue[1];
        } else if (
          messageElements[index].message?.TypeId === 'DM16' ||
          messageElements[index].message?.TypeId === 'DM16'
        ) {
          messageElements[index].message.Content[1].Value = formattedValue[0];
          messageElements[index].message.Content[2].Value = formattedValue[1];
        } else {
          messageElements[index].message.Content[0].Value = formattedValue[0];
          messageElements[index].message.Content[1].Value = formattedValue[1];
        }
      }

      return status === AtsuStatusCodes.Ok;
    }

    const status = InputValidation.validateScratchpadWaypoint(value);
    if (status === AtsuStatusCodes.Ok) {
      let newMessage: CpdlcMessageElement | undefined = undefined;
      if (InputValidation.validateScratchpadTime(value) === AtsuStatusCodes.Ok) {
        if (messageElements[index].message === undefined || messageElements[index].message?.TypeId !== 'DM17') {
          newMessage = CpdlcMessagesDownlink.DM17[1].deepCopy();
        }
      } else if (messageElements[index].message === undefined || messageElements[index].message?.TypeId !== 'DM16') {
        newMessage = CpdlcMessagesDownlink.DM16[1].deepCopy();
      }

      if (newMessage !== undefined) {
        if (messageElements[index].message !== undefined) {
          const offsetStart = messageElements[index].message?.TypeId === 'DM15' ? 0 : 1;
          newMessage.Content[1].Value = messageElements[index].message?.Content[offsetStart].Value || '';
          newMessage.Content[2].Value = messageElements[index].message?.Content[offsetStart + 1].Value || '';
        }

        messageElements[index].message = newMessage;
      }
      messageElements[index].message.Content[0].Value = value;
      messageElements[index].readyToSend = messageElements[index].message?.Content[1].Value !== '';
    } else {
      // TODO scratchpad error
    }

    return status === AtsuStatusCodes.Ok;
  };

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          REQUEST OFFSET
        </text>
        <TextBox x={215} y={-28} maxLength={3} height={42} width={220} onSubmit={(value) => updateValue(value, 0)} />
      </Layer>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          OF ROUTE
        </text>
        <text x={175} fontSize={22} fill="white">
          AT
        </text>
        <TextBox
          x={215}
          y={-28}
          placeholder=" "
          maxLength={10}
          height={42}
          width={343}
          onSubmit={(value) => updateValue(value, 1)}
        />
      </Layer>
      <Layer>
        <text x={208} fontSize={22} fill="white">
          (POSITION OR TIME)
        </text>
      </Layer>
    </MessageElement>
  );
};
