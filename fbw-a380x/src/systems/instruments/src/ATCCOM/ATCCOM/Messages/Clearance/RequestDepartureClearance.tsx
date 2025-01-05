import React, { FC } from 'react';
import { TextBox } from '../../../Components/Textbox';
import { MessageElement } from '../../Elements/MessageElement';
import { MessageVisualizationProps } from '../Registry';

export const RequestDepartureClearance: FC<MessageVisualizationProps> = ({ x = 0, y = 0, onDelete }) => {
  // const updateValue = (value: string, boxIndex: number): boolean => {
  //   return false;
  // };

  return (
    <>
      <path stroke="#eee" fill="none" strokeWidth={1} d="m 70 28 h -60 v 700 h 538 v -700 h -85" />
      <MessageElement x={x} y={y} drawSeperator={false} onDelete={onDelete} />
      <text x={140} y={37} fontSize={22} fill="white">
        DEPARTURE REQUEST
      </text>
      <text x={30} y={80} fontSize={22} fill="white">
        REQUEST WILL BE SENT TO
      </text>
      <text x={30} y={128} fontSize={22} fill="white">
        DEPARTURE ARPT
      </text>
      <TextBox x={245} y={100} maxLength={4} height={42} width={120} onSubmit={(value) => updateValue(value, 0)} />
      <text x={167} y={176} fontSize={22} fill="white">
        GATE
      </text>
      <TextBox
        x={245}
        y={148}
        maxLength={4}
        placeholder=" "
        height={42}
        width={120}
        onSubmit={(value) => updateValue(value, 1)}
      />
      <text x={70} y={224} fontSize={22} fill="white">
        D-ATIS CODE
      </text>
      <TextBox x={245} y={196} maxLength={1} height={42} width={120} onSubmit={(value) => updateValue(value, 2)} />

      <text x={98} y={296} fontSize={22} fill="white">
        ACFT CODE
      </text>
      <TextBox x={245} y={268} maxLength={4} height={42} width={120} onSubmit={(value) => updateValue(value, 3)} />
      <text x={71} y={368} fontSize={22} fill="white">
        DESTINATION
      </text>
      <TextBox x={245} y={340} maxLength={4} height={42} width={120} onSubmit={(value) => updateValue(value, 4)} />

      <text x={90} y={720} fontSize={22} fill="white">
        (NO NOTIFICATION REQUIRED)
      </text>
      <path stroke="#eee" fill="none" strokeWidth={1} d="m 0 739 h 570 z" />
    </>
  );
};
