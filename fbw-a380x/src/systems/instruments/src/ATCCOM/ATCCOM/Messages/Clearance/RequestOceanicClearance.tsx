import React, { FC } from 'react';
import { TextBox } from '../../../Components/Textbox';
import { MessageElement } from '../../Elements/MessageElement';
import { MessageVisualizationProps } from '../Registry';

export const RequestOceanicClearance: FC<MessageVisualizationProps> = ({ x = 0, y = 0, onDelete }) => {
  // const updateValue = (value: string, boxIndex: number): boolean => {
  //   return false;
  // };

  return (
    <>
      <path stroke="#eee" fill="none" strokeWidth={1} d="m 70 28 h -60 v 700 h 538 v -700 h -85" />
      <MessageElement x={x} y={y} drawSeperator={false} onDelete={onDelete} />
      <text x={150} y={37} fontSize={22} fill="white">
        OCEANIC REQUEST
      </text>
      <text x={30} y={80} fontSize={22} fill="white">
        REQUEST WILL BE SENT TO
      </text>
      <text x={35} y={128} fontSize={22} fill="white">
        OCEANIC CENTER
      </text>
      <TextBox x={245} y={100} maxLength={4} height={42} width={120} onSubmit={(value) => updateValue(value, 0)} />

      <text x={40} y={234} fontSize={22} fill="white">
        ENTRY POINT
      </text>
      <TextBox x={205} y={206} maxLength={5} height={42} width={338} onSubmit={(value) => updateValue(value, 1)} />
      <text x={150} y={284} fontSize={22} fill="white">
        ETA
      </text>
      <TextBox x={205} y={256} maxLength={4} height={42} width={120} onSubmit={(value) => updateValue(value, 2)} />
      <text x={135} y={334} fontSize={22} fill="white">
        MACH
      </text>
      <TextBox x={205} y={306} maxLength={2} height={42} width={120} onSubmit={(value) => updateValue(value, 3)} />
      <text x={123} y={384} fontSize={22} fill="white">
        LEVEL
      </text>
      <TextBox x={205} y={356} maxLength={3} height={42} width={120} onSubmit={(value) => updateValue(value, 4)} />

      <text x={90} y={720} fontSize={22} fill="white">
        (NO NOTIFICATION REQUIRED)
      </text>
      <path stroke="#eee" fill="none" strokeWidth={1} d="m 0 739 h 570 z" />
    </>
  );
};
