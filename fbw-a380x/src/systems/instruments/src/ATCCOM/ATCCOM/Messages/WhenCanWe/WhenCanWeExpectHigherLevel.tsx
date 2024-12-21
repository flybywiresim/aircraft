import React, { FC } from 'react';
import { CpdlcMessagesDownlink } from '@atsu/messages/CpdlcMessageElements';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { MessageVisualizationProps } from '../Registry';

export const WhenCanWeExpectHigherLevel: FC<MessageVisualizationProps> = ({
  x = 0,
  y = 0,
  index,
  messageElements,
  onDelete,
}) => {
  if (messageElements[index].message === undefined) {
    messageElements[index].message = CpdlcMessagesDownlink.DM53[1].deepCopy();
    messageElements[index].readyToSend = true;
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
          HIGHER LEVEL
        </text>
      </Layer>
    </MessageElement>
  );
};
