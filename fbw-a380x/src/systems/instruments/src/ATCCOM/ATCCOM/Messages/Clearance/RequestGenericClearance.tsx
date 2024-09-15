import React, { FC } from 'react';
import { Layer } from '../../../Components/Layer';
import { MessageElement } from '../../Elements/MessageElement';
import { MessageVisualizationProps } from '../Registry';

// TODO make ATSU a singleton with access to the scratchpad
// TODO get current station from ATSU
export const RequestGenericClearance: FC<MessageVisualizationProps> = ({ x = 0, y = 0, onDelete }) => (
  <MessageElement x={x} y={y} onDelete={onDelete}>
    <Layer>
      <text x={30} fontSize={22} fill="white">
        REQUEST CLEARANCE
      </text>
    </Layer>
    <Layer>
      <text x={15} fontSize={22} fill="white">
        WILL BE SENT TO ATC: ----
      </text>
    </Layer>
  </MessageElement>
);
