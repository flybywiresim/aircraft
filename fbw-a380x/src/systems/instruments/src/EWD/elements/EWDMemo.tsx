import FormattedFwcText from '@instruments/common/EWDMessageParser';
import EWDMessages from '@instruments/common/EWDMessages';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

interface EWDMemoProps {
    x: number,
    y: number,
    active: boolean,
}

export const EWDMemo: React.FC<EWDMemoProps> = ({ x, y, active }) => {
    const [line1] = useSimVar('L:A380X_EWD_RIGHT_LINE_1', 'number', 500);
    const [line2] = useSimVar('L:A380X_EWD_RIGHT_LINE_2', 'number', 500);
    const [line3] = useSimVar('L:A380X_EWD_RIGHT_LINE_3', 'number', 500);
    const [line4] = useSimVar('L:A380X_EWD_RIGHT_LINE_4', 'number', 500);
    const [line5] = useSimVar('L:A380X_EWD_RIGHT_LINE_5', 'number', 500);
    const [line6] = useSimVar('L:A380X_EWD_RIGHT_LINE_6', 'number', 500);
    const [line7] = useSimVar('L:A380X_EWD_RIGHT_LINE_7', 'number', 500);
    const [line8] = useSimVar('L:A380X_EWD_RIGHT_LINE_8', 'number', 500);
    const message = [
        EWDMessages[padEWDCode(line1)],
        EWDMessages[padEWDCode(line2)],
        EWDMessages[padEWDCode(line3)],
        EWDMessages[padEWDCode(line4)],
        EWDMessages[padEWDCode(line5)],
        EWDMessages[padEWDCode(line6)],
        EWDMessages[padEWDCode(line7)],
        EWDMessages[padEWDCode(line8)],
    ].join('\r');

    const numMemos = [line1, line2, line3, line4, line5, line6, line7, line8].filter(Boolean).length;

    return (
        <g id="EWDMemo" className={active ? 'Show' : 'Hide'}>

            <path className={numMemos > 0 ? 'WhiteLine' : 'Hide'} d={`M ${x - 10},${y - 23} l 0,${6 + (numMemos * 30)}`} />
            <FormattedFwcText x={x} y={y} message={message} />

        </g>
    );
};

export default EWDMemo;
