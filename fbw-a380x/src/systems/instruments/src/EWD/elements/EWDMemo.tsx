import { EcamMemos } from '@instruments/common/EcamMessages';
import FormattedFwcText from '../../Common/EcamMessages/EWDMessageParser';
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
        EcamMemos[padEWDCode(line1)],
        EcamMemos[padEWDCode(line2)],
        EcamMemos[padEWDCode(line3)],
        EcamMemos[padEWDCode(line4)],
        EcamMemos[padEWDCode(line5)],
        EcamMemos[padEWDCode(line6)],
        EcamMemos[padEWDCode(line7)],
        EcamMemos[padEWDCode(line8)],
    ].join('\r');

    // Also count left side MEMOs for length of line
    let leftMemoCount = 0;
    if (side === 'RIGHT') {
        for (let i = 1; i < 9; i++) {
            const [lineX] = useSimVar(`L:A32NX_EWD_LOWER_LEFT_LINE_${i}`, 'number', 500);
            if (lineX) {
                leftMemoCount++;
            }
        }
    }

    const numMemos = side === 'LEFT' ? 0 : Math.max(leftMemoCount, [line1, line2, line3, line4, line5, line6, line7, line8].filter(Boolean).length);

    return (
        <g id={`EWDMemo${side}`} className={active ? 'Show' : 'Hide'}>

            <path className={numMemos > 0 ? 'WhiteLine' : 'Hide'} d={`M ${x - 10},${y - 23} l 0,${6 + (numMemos * 30)}`} />
            <FormattedFwcText x={x} y={y} message={message} />

        </g>
    );
};

export default EWDMemo;
