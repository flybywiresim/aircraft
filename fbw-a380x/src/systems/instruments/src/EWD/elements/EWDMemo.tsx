import FormattedFwcText from '../../Common/EWDMessageParser';
import EWDMessages from '../../Common/EWDMessages';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

interface EWDMemoProps {
    x: number,
    y: number,
    active: boolean,
    side: 'LEFT' | 'RIGHT',
}

export const EWDMemo: React.FC<EWDMemoProps> = ({ x, y, active, side }) => {
    const [line1] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_1`, 'number', 500);
    const [line2] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_2`, 'number', 500);
    const [line3] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_3`, 'number', 500);
    const [line4] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_4`, 'number', 500);
    const [line5] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_5`, 'number', 500);
    const [line6] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_6`, 'number', 500);
    const [line7] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_7`, 'number', 500);
    const [line8] = useSimVar(`L:A32NX_EWD_LOWER_${side}_LINE_8`, 'number', 500);
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

    const numMemos = side === 'LEFT' ? 0 : [line1, line2, line3, line4, line5, line6, line7, line8].filter(Boolean).length;

    return (
        <g id={`EWDMemo${side}`} className={active ? 'Show' : 'Hide'}>

            <path className={numMemos > 0 ? 'WhiteLine' : 'Hide'} d={`M ${x - 10},${y - 23} l 0,${6 + (numMemos * 30)}`} />
            <FormattedFwcText x={x} y={y} message={message} />

        </g>
    );
};

export default EWDMemo;
