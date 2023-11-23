import { Position, CargoDoorProps } from '@instruments/common/types';
import React from 'react';

const CargoDoor: React.FC<Position & CargoDoorProps> = ({ x, y, label, width, height, engineRunning }) => {
    const doorOpen = false;
    const validSDAC = true;

    let cargoDoorMessage = '';
    if (
        (doorOpen && (engineRunning || label === 'AVNCS'))
        || !validSDAC
    ) {
        cargoDoorMessage = label === 'AVNCS' ? `${label} ----` : `--${label}`;
    }

    return (
        <g id={`${label}-door`}>
            <rect x={x} y={y} width={width} height={height} rx="4" className={!validSDAC || doorOpen ? 'Amber SW2' : 'Green SW2'} />
            <rect x={x + 3} y={y + 3} width={width - 6} height={height - 6} rx="4" className={!validSDAC || doorOpen ? 'Amber SW2 AmberFill' : 'Green SW2 BackgroundFill'} />
            <text x={label === 'AVNCS' ? x - 160 : x + 35} y={label === 'AVNCS' ? y + 18 : y + 20} className={`${!validSDAC ? 'White' : 'AmberFill'} F24`}>{cargoDoorMessage}</text>
        </g>
    );
};

export default CargoDoor;
