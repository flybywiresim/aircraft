import React, { FC } from 'react';
import { MessageElement } from '../../Elements/MessageElement';
import { MessageVisualizationProps } from '../Registry';

export const RequestITP: FC<MessageVisualizationProps> = ({ x = 0, y = 0, onDelete }) => (
  <>
    <path stroke="#eee" fill="none" strokeWidth={1} d="m 70 28 h -60 v 700 h 538 v -700 h -85" />
    <MessageElement x={x} y={y} drawSeperator={false} onDelete={onDelete} />
    <text x={197} y={37} fontSize={22} fill="white">
      ITP REQUEST
    </text>
    <text x={138} y={300} fontSize={22} fill="white">
      PREPARE ITP REQUEST
    </text>
    <text x={77} y={340} fontSize={22} fill="white">
      IN SURV / TRAFFIC / ITP PAGE
    </text>
    <path stroke="#eee" fill="none" strokeWidth={1} d="m 0 739 h 570 z" />
  </>
);
