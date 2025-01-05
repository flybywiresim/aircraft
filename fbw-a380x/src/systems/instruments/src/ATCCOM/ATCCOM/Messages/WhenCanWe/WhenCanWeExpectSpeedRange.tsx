import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const WhenCanWeExpectSpeedRange: FC<MessageVisualizationProps> = ({
  x = 0,
  y = 0,
  index,
  messageElements,
  onDelete,
}) => {
  const updateSpeed = (value: string, boxIndex: number): boolean => {
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
        messageElements[index].message = CpdlcMessagesDownlink.DM50[1].deepCopy();
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

  let fromPrefix: string | undefined = undefined;
  let fromSuffix: string | undefined = undefined;
  let toPrefix: string | undefined = undefined;
  let toSuffix: string | undefined = undefined;
  if (messageElements[index].message !== undefined) {
    if (messageElements[index].message?.Content[0].Value.startsWith('M')) {
      fromPrefix = 'M';
    } else if (messageElements[index].message?.Content[0].Value.length !== 0) {
      fromSuffix = 'KT';
    }

    if (messageElements[index].message?.Content[1].Value.startsWith('M')) {
      toPrefix = 'M';
    } else if (messageElements[index].message?.Content[1].Value.length !== 0) {
      toSuffix = 'KT';
    }
  }

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          WHEN CAN WE EXPECT SPD/MACH
        </text>
      </Layer>
      <Layer>
        <text x={107} fontSize={22} fill="white">
          FROM
        </text>
        <TextBox
          x={180}
          y={-28}
          maxLength={3}
          height={42}
          width={160}
          prefix={fromPrefix}
          suffix={fromSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateSpeed(value, 0)}
        />
      </Layer>
      <Layer>
        <text x={134} fontSize={22} fill="white">
          TO
        </text>
        <TextBox
          x={180}
          y={-28}
          maxLength={3}
          height={42}
          width={160}
          prefix={toPrefix}
          suffix={toSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateSpeed(value, 1)}
        />
      </Layer>
    </MessageElement>
  );
};
