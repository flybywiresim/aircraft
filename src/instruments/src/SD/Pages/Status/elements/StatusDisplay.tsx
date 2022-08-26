import EWDMessages from '@instruments/common/EWDMessages';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';
import FormattedFwcText from './FormattedFwcText';
import padCode from './PadCode';

interface DisplayProps {
    x: number,
    y: number,
    side: string,
}

export const StatusDisplay: React.FC<DisplayProps> = ({ x, y, side }) => {
    const [line1] = useSimVar(`L:A32NX_STATUS_${side}_LINE_1`, 'number', 500);
    const [line2] = useSimVar(`L:A32NX_STATUS_${side}_LINE_2`, 'number', 500);
    const [line3] = useSimVar(`L:A32NX_STATUS_${side}_LINE_3`, 'number', 500);
    const [line4] = useSimVar(`L:A32NX_STATUS_${side}_LINE_4`, 'number', 500);
    const [line5] = useSimVar(`L:A32NX_STATUS_${side}_LINE_5`, 'number', 500);
    const [line6] = useSimVar(`L:A32NX_STATUS_${side}_LINE_6`, 'number', 500);
    const [line7] = useSimVar(`L:A32NX_STATUS_${side}_LINE_7`, 'number', 500);
    const [line8] = useSimVar(`L:A32NX_STATUS_${side}_LINE_8`, 'number', 500);
    const [line9] = useSimVar(`L:A32NX_STATUS_${side}_LINE_9`, 'number', 500);
    const [line10] = useSimVar(`L:A32NX_STATUS_${side}_LINE_10`, 'number', 500);
    const [line11] = useSimVar(`L:A32NX_STATUS_${side}_LINE_11`, 'number', 500);
    const [line12] = useSimVar(`L:A32NX_STATUS_${side}_LINE_12`, 'number', 500);
    const [line13] = useSimVar(`L:A32NX_STATUS_${side}_LINE_13`, 'number', 500);
    const [line14] = useSimVar(`L:A32NX_STATUS_${side}_LINE_14`, 'number', 500);
    const [line15] = useSimVar(`L:A32NX_STATUS_${side}_LINE_15`, 'number', 500);
    const [line16] = useSimVar(`L:A32NX_STATUS_${side}_LINE_16`, 'number', 500);
    const [line17] = useSimVar(`L:A32NX_STATUS_${side}_LINE_17`, 'number', 500);
    const [line18] = useSimVar(`L:A32NX_STATUS_${side}_LINE_18`, 'number', 500);

    const lineNumbers = [line1, line2, line3, line4, line5, line6, line7, line8, line9, line10, line11, line12, line13, line14, line15, line16, line17, line18];

    const message = lineNumbers.map((line) => EWDMessages[padCode(line)]).join('\r');

    return (
        <g id={`StatusDisplay${side}`}>

            <FormattedFwcText x={x} y={y} message={message} />

        </g>
    );
};

export default StatusDisplay;
