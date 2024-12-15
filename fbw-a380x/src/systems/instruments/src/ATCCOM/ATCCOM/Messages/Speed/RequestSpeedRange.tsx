import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestSpeedRange: FC<MessageVisualizationProps> = ({
  x = 0,
  y = 0,
  index,
  messageElements,
  onDelete,
}) => {
  const updateValue = (value: string, boxIndex: number): boolean => {
    const otherIndex = (boxIndex + 1) % 2;

    if (value === '') {
      messageElements[index].readyToSend = false;
      if (
        messageElements[index].message !== undefined &&
        messageElements[index].message?.Content[otherIndex].Value !== ''
      ) {
        messageElements[index].message.Content[boxIndex].Value = '';
      } else {
        messageElements[index].message = undefined;
      }
      return true;
    }

    if (
      messageElements[index].message === undefined ||
      messageElements[index].message?.Content[otherIndex].Value === ''
    ) {
      const status = InputValidation.validateScratchpadSpeed(value);
      if (status === AtsuStatusCodes.Ok) {
        messageElements[index].message = CpdlcMessagesDownlink.DM19[1].deepCopy();
        messageElements[index].message.Content[boxIndex].Value = InputValidation.formatScratchpadSpeed(value);
      } else {
        // TODO error message
      }
      return status === AtsuStatusCodes.Ok;
    }

    if (messageElements[index].message?.Content[otherIndex].Value !== '') {
      let speedRangeString = '';
      if (otherIndex < boxIndex) {
        speedRangeString = `${messageElements[index].message?.Content[otherIndex].Value}/${value}`;
      } else {
        speedRangeString = `${value}/${messageElements[index].message?.Content[otherIndex].Value}`;
      }

      const status = InputValidation.validateScratchpadSpeedRanges(speedRangeString)[0];
      if (status === AtsuStatusCodes.Ok) {
        messageElements[index].message.Content[boxIndex].Value = InputValidation.formatScratchpadSpeed(value);
      } else {
        // TODO error message
      }

      messageElements[index].readyToSend =
        messageElements[index].message?.Content[0].Value !== '' &&
        messageElements[index].message?.Content[1].Value !== '';
      return status === AtsuStatusCodes.Ok;
    }

    return false;
  };

  let lowerPrefix: string | undefined = undefined;
  let lowerSuffix: string | undefined = undefined;
  let upperPrefix: string | undefined = undefined;
  let upperSuffix: string | undefined = undefined;
  if (messageElements[index].message !== undefined) {
    if (messageElements[index].message?.Content[0].Value.startsWith('M')) {
      lowerPrefix = 'M';
    } else if (messageElements[index].message?.Content[0].Value.length !== 0) {
      lowerSuffix = 'KT';
    }

    if (messageElements[index].message?.Content[1].Value.startsWith('M')) {
      upperPrefix = 'M';
    } else if (messageElements[index].message?.Content[1].Value.length !== 0) {
      upperSuffix = 'KT';
    }
  }

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={75} fontSize={22} fill="white">
          REQUEST SPD/MACH
        </text>
      </Layer>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          FROM
        </text>
        <TextBox
          x={80}
          y={-28}
          maxLength={3}
          height={42}
          width={170}
          prefix={lowerPrefix}
          suffix={lowerSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateValue(value, 0)}
        />
      </Layer>
      <Layer>
        <text x={37} fontSize={22} fill="white">
          TO
        </text>
        <TextBox
          x={80}
          y={-28}
          maxLength={3}
          height={42}
          width={170}
          prefix={upperPrefix}
          suffix={upperSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateValue(value, 1)}
        />
      </Layer>
    </MessageElement>
  );
};
