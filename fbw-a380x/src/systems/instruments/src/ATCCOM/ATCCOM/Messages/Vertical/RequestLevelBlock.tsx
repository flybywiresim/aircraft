import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestLevelBlock: FC<MessageVisualizationProps> = ({
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

    const valueStatus = InputValidation.validateScratchpadAltitude(value);
    if (valueStatus !== AtsuStatusCodes.Ok) {
      // TODO scratchpad error
      return false;
    }
    const formattedValue = InputValidation.formatScratchpadAltitude(value);

    if (messageElements[index].message === undefined) {
      messageElements[index].message = CpdlcMessagesDownlink.DM7[1].deepCopy();
      messageElements[index].message.Content[boxIndex].Value = formattedValue;
      return true;
    }

    let status = AtsuStatusCodes.Ok;
    if (otherIndex < boxIndex) {
      status = InputValidation.validateAltitudeRange(
        messageElements[index].message?.Content[otherIndex].Value || '',
        formattedValue,
      );
    } else {
      status = InputValidation.validateAltitudeRange(
        formattedValue,
        messageElements[index].message?.Content[otherIndex].Value || '',
      );
    }

    if (status === AtsuStatusCodes.Ok) {
      messageElements[index].message.Content[boxIndex].Value = formattedValue;
    } else {
      // TODO scratchpad error
    }

    messageElements[index].readyToSend =
      messageElements[index].message?.Content[0].Value !== '' &&
      messageElements[index].message?.Content[1].Value !== '';
    return status === AtsuStatusCodes.Ok;
  };

  let lowerAltitudeSuffix: string | undefined = undefined;
  let upperAltitudeSuffix: string | undefined = undefined;
  let lowerIsFlightlevel = false;
  let upperIsFlightlevel = false;

  if (messageElements[index].message !== undefined) {
    lowerIsFlightlevel = messageElements[index].message?.Content[0].Value.startsWith('FL') || false;
    if (!lowerIsFlightlevel && messageElements[index].message?.Content[0].Value !== '') {
      lowerAltitudeSuffix = messageElements[index].message?.Content[0].Value.endsWith('FT') ? 'FT' : 'M';
    }

    upperIsFlightlevel = messageElements[index].message?.Content[1].Value.startsWith('FL') || false;
    if (!upperIsFlightlevel && messageElements[index].message?.Content[1].Value !== '') {
      upperAltitudeSuffix = messageElements[index].message?.Content[1].Value.endsWith('FT') ? 'FT' : 'M';
    }
  }

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          REQUEST BLOCK
        </text>
        <TextBox
          x={205}
          y={-28}
          maxLength={5}
          height={42}
          width={240}
          prefix={lowerIsFlightlevel ? 'FL' : undefined}
          suffix={lowerAltitudeSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateValue(value, 0)}
        />
      </Layer>
      <Layer>
        <text x={160} fontSize={22} fill="white">
          TO
        </text>
        <TextBox
          x={205}
          y={-28}
          maxLength={5}
          height={42}
          width={240}
          prefix={upperIsFlightlevel ? 'FL' : undefined}
          suffix={upperAltitudeSuffix}
          textAnchor="middle"
          onSubmit={(value) => updateValue(value, 1)}
        />
      </Layer>
    </MessageElement>
  );
};
