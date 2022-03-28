import FormattedFwcText from '@instruments/common/EWDMessageParser';
import EWDMessages from '@instruments/common/EWDMessages';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

interface LowerLeftDisplayProps {
    x: number,
    y: number,
}

export const LowerLeftDisplay: React.FC<LowerLeftDisplayProps> = ({ x, y }) => {
    const [line1] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_1', 'number', 500);
    const [line2] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_2', 'number', 500);
    const [line3] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_3', 'number', 500);
    const [line4] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_4', 'number', 500);
    const [line5] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_5', 'number', 500);
    const [line6] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_6', 'number', 500);
    const [line7] = useSimVar('L:A32NX_EWD_LOWER_LEFT_LINE_7', 'number', 500);
    const message = [
        EWDMessages[padEWDCode(line1)],
        EWDMessages[padEWDCode(line2)],
        EWDMessages[padEWDCode(line3)],
        EWDMessages[padEWDCode(line4)],
        EWDMessages[padEWDCode(line5)],
        EWDMessages[padEWDCode(line6)],
        EWDMessages[padEWDCode(line7)],
    ].join('\r');

    return (
        <g id="LowerLeftDisplay">

            <FormattedFwcText x={x} y={y} message={message} />

        </g>
    );
};

export default LowerLeftDisplay;
