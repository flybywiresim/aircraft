import EWDMessageParser from '@instruments/common/EWDMessageParser';
import EWDMessages from '@instruments/common/EWDMessages';
import React from 'react';

type LowerLeftDisplayProps = {
    x: number,
    y: number,
}

export const LowerLeftDisplay: React.FC<LowerLeftDisplayProps> = ({ x, y }) => {
    const message = [EWDMessages[770064701], EWDMessages[770064702], EWDMessages[770064703]].join('\r');

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
            <path
                d={`m ${x + 471} ${y + 164} h 5 v 18 h 5 l -7.5,11 l -7.5,-11 h 5 v -18`}
                style={{
                    fill: '#00ff00',
                    stroke: 'none',
                    // strokeWidth: 0.2,
                }}
            />
        </g>
    );
};

export default LowerLeftDisplay;

export const mesgPool = [
    [
        '',
        '\x1b<4m\x1b4mFWS\x1bm FWC 1+2 FAULT',
        '\x1b<5m -MONITOR SYS',
        '\x1b<5m -MONITOR OVERHEAD PANEL',
    ].join('\r'),
    [
        "\x1b<2m\x1b4mELEC\x1bm \x1b'mEMER CONFIG\x1bm",
        '\x1b<5m PROC:GRVTY FUEL FEEDING',
        '\x1b<5m -FAC 1......OFF THEN ON',
        '',
        '',
        '\x1b<5m -BUS TIE............OFF',
        '\x1b<5m -GEN 1+2... OFF THEN ON',
    ].join('\r'),
    [
        '\x1b<4m\x1b4mNAV\x1bm \x1b<4mILS 2 FAULT\x1bm',
        '\x1b<4m    GPS2 FAULT',
        '\x1b<4m\x1b4mF/CTL\x1bm \x1b<4mELAC 1 FAULT\x1bm',
        '\x1b<5m -ELAC 1.....OFF THEN ON',
        '\x1b<7m   .IF UNSUCCESSFUL :',
        '\x1b<5m -ELAC 1.....OFF THEN ON',
        '\x1b<4m\x1b4mC/B\x1bm \x1b<4mTRIPPED REAR PNL J-M\x1bm',
    ].join('\r'),
    [
        '023456789012345678901234567',
        ' -2',
        ' -3',
        ' -4',
        ' -5',
        ' -6',
        ' -7',
        ' -8',
    ].join('\r'),
];
