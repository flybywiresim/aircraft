import React, { FC } from 'react';
import { AtsuStatusCodes } from '@atsu/AtsuStatusCodes';
import { FansMode } from '@atsu/com/FutureAirNavigationSystem';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { InputValidation } from '@atsu/InputValidation';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { TextBox } from '../../../Components/Textbox';
import { MessageVisualizationProps } from '../Registry';

export const RequestClimb: FC<MessageVisualizationProps> = ({
  x = 0,
  y = 0,
  mode,
  index,
  messageElements,
  onDelete,
}) => {
  const updateValue = (value: string, boxIndex: number): boolean => {
    if (value === '') {
      if (boxIndex === 0) {
        if (messageElements[index].message?.TypeId === 'DM9') {
          messageElements[index].message.Content[0].Value = '';
        } else {
          messageElements[index].message.Content[1].Value = '';
        }
        messageElements[index].readyToSend = false;
      } else if (messageElements[index].message?.TypeId !== 'DM9') {
        const newMessage = CpdlcMessagesDownlink.DM9[1].deepCopy();
        newMessage.Content[0].Value = messageElements[index].message.Content[1].Value;
        messageElements[index].message = newMessage;
      }

      return true;
    }

    if (boxIndex === 0) {
      const status = InputValidation.validateScratchpadAltitude(value);

      if (status === AtsuStatusCodes.Ok) {
        if (messageElements[index].message === undefined || messageElements[index].message?.TypeId === 'DM9') {
          messageElements[index].message = CpdlcMessagesDownlink.DM9[1].deepCopy();
          messageElements[index].message.Content[0].Value = InputValidation.formatScratchpadAltitude(value);
        } else {
          messageElements[index].message.Content[1].Value = InputValidation.formatScratchpadAltitude(value);
        }
        messageElements[index].readyToSend = true;
      } else {
        // TODO scratchpad error
      }

      return status === AtsuStatusCodes.Ok;
    }

    const validWaypoint = InputValidation.validateScratchpadWaypoint(value);
    const validTime = InputValidation.validateScratchpadTime(value);
    // TODO validate entries
    if (
      validWaypoint === AtsuStatusCodes.Ok &&
      (messageElements[index].message === undefined || messageElements[index].message?.TypeId !== 'DM11')
    ) {
      const newMessage = CpdlcMessagesDownlink.DM11[1].deepCopy();
      newMessage.Content[1].Value = messageElements[index].message.Content[0].Value;
      messageElements[index].message = newMessage;
    } else if (
      validTime === AtsuStatusCodes.Ok &&
      (messageElements[index].message === undefined || messageElements[index].message?.TypeId !== 'DM13')
    ) {
      const newMessage = CpdlcMessagesDownlink.DM13[1].deepCopy();
      newMessage.Content[1].Value = messageElements[index].message.Content[0].Value;
      messageElements[index].message = newMessage;
    } else if (validWaypoint !== AtsuStatusCodes.Ok && validTime !== AtsuStatusCodes.Ok) {
      return false;
    }

    if (validWaypoint) {
      messageElements[index].message.Content[0].Value = value;
    } else {
      messageElements[index].message.Content[0].Value = value;
    }

    return true;
  };

  let requestedLevel: string | undefined = undefined;
  let altitudeSuffix: string | undefined = undefined;
  let isFlightlevel = false;
  if (messageElements[index].message !== undefined) {
    if (messageElements[index].message?.TypeId === 'DM9') {
      requestedLevel = messageElements[index].message?.Content[0].Value;
    } else {
      requestedLevel = messageElements[index].message?.Content[1].Value;
    }
  }

  isFlightlevel = requestedLevel !== undefined && requestedLevel.startsWith('FL');
  if (!isFlightlevel && requestedLevel !== undefined && requestedLevel !== '') {
    altitudeSuffix = requestedLevel.endsWith('FT') ? 'FT' : 'M';
  }

  return (
    <MessageElement x={x} y={y} onDelete={onDelete}>
      <Layer>
        <text x={10} fontSize={22} fill="white">
          REQUEST CLB TO
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
          onSubmit={(value) => updateValue(value, 0)}
        />
      </Layer>
      {mode === FansMode.FansA && (
        <Layer>
          <text x={176} fontSize={22} fill="white">
            AT
          </text>
          <TextBox
            x={220}
            y={-28}
            placeholder=" "
            maxLength={10}
            height={42}
            width={337}
            onSubmit={(value) => updateValue(value, 1)}
            disabled={requestedLevel === undefined}
            disabledBackgroundColor="black"
            resetValueIfDisabled
          />
        </Layer>
      )}
    </MessageElement>
  );
};
