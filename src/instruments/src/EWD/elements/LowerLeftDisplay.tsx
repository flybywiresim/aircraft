import EWDMessageParser from '@instruments/common/EWDMessageParser';
import EWDMessages from '@instruments/common/EWDMessages';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

type LowerLeftDisplayProps = {
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

    // const message = mesgPool[5];
    // useEffect(() => {
    //     console.log(`Inside Lower Left Display and Line 1 is ${line1}`);
    //     console.log(padEWDCode(line1));
    // }, [line1]);

    return (
        <g id="LowerLeftDisplay">

            <EWDMessageParser x={x} y={y} message={message} />
            {/*
            <text
                x={x + 473}
                y={y - 22}
                fill="White"
                textAnchor="middle"
                className="EWDWarn White"
            >
                ADV
            </text>
            */}
            {/* Border for ADV
            <path
                className="WhiteLine"
                d={`M ${x + 446} ${y - 19} h 55 v -24 h -55 v 24`}
                strokeLinecap="round"
            />
            */}
            {/*
            <text x={x + 473} y={y + 185} className="White EWDWarn" textAnchor="middle">
                STS
            </text>
            */}
            {/* Border for STS
            <path
                className="WhiteLine"
                d={`M ${x + 446} ${y + 188} h 55 v -24 h -55 v 24`}
                strokeLinecap="round"
            />
            */}
            {/* Down arrow */}
            {/* <path
                d={`m ${x + 471} ${y + 164} h 5 v 18 h 5 l -7.5,11 l -7.5,-11 h 5 v -18`}
                style={{
                    fill: '#00ff00',
                    stroke: 'none',
                    // strokeWidth: 0.2,
                }}
            /> */}
        </g>
    );
};

export default LowerLeftDisplay;
