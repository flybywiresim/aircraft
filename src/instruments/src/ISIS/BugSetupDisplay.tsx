import React, { useState } from 'react';
import { Bug } from './Bug';

type BugSetupDisplayProps = {
    selectedIndex: number
    bugs: Bug[];
}

export const BugSetupDisplay: React.FC<BugSetupDisplayProps> = ({ selectedIndex, bugs }) => (
    <g id="BugDisplay" fontSize={32} stroke="white" strokeWidth={3} fill="white">
        <text x={40} y={55} className="TextCyan">EXIT↑</text>
        <text x={256} y={53} textAnchor="middle">BUGS</text>
        <text textAnchor="middle" x={150} y={100}>SPD</text>
        <text textAnchor="middle" x={325} y={100}>ALT</text>
        <text fontSize={16} x={196} y={126}>(+)</text>
        <text fontSize={16} x={106} y={180}>(-)</text>
        <path fill="none" d="M150 136 v225 h176 v-225z" />
        <g>
            <OffText x={30} y={150} isVisible={!bugs[5].isActive} />
            <BugBox x={150} y={150} value={bugs[5].value} isSelected={selectedIndex === 5} numDigits={3} />
        </g>
        <g>
            <OffText x={30} y={225} isVisible={!bugs[4].isActive} />
            <BugBox x={150} y={225} value={bugs[4].value} isSelected={selectedIndex === 4} numDigits={3} />
        </g>
        <g>
            <OffText x={30} y={300} isVisible={!bugs[3].isActive} />
            <BugBox x={150} y={300} value={bugs[3].value} isSelected={selectedIndex === 3} numDigits={3} />
        </g>
        <g>
            <OffText x={30} y={375} isVisible={!bugs[2].isActive} />
            <BugBox x={150} y={375} value={bugs[2].value} isSelected={selectedIndex === 2} numDigits={3} />
        </g>
        <g>
            <OffText x={400} y={225} isVisible={!bugs[0].isActive} />
            <BugBox x={325} y={225} value={bugs[0].value} isSelected={selectedIndex === 0} numDigits={5} />
        </g>
        <g>
            <OffText x={400} y={300} isVisible={!bugs[1].isActive} />
            <BugBox x={325} y={300} value={bugs[1].value} isSelected={selectedIndex === 1} numDigits={5} />
        </g>
        <text x={150} y={450} className="TextCyan">SET/SELECT→</text>
    </g>
);

type BugBoxProps = {
    x: number;
    y: number;
    value: number;
    isSelected?: boolean;
    numDigits: number;
}

export const BugBox: React.FC<BugBoxProps> = ({ x, y, value, isSelected = false, numDigits }) => {
    const padding = 0;
    const strokeWidth = 2;

    const width = numDigits * 25 + 2 * padding;
    const height = 36 + 2 * (padding + strokeWidth);

    return (
        <g>
            <rect className={`FillBackground${isSelected ? ' BlinkInfinite' : ''}`} x={x - width / 2} y={y - 36 - padding + strokeWidth} width={width} height={height} />
            <text x={x} y={y} textAnchor="middle">{value.toString().padStart(numDigits, '0')}</text>
        </g>
    );
};

type OffTextProps = {
    x: number;
    y: number;
    isVisible?: boolean;
}

export const OffText: React.FC<OffTextProps> = ({ x, y, isVisible = false }) => (
    <>
        {isVisible && <text x={x} y={y}>OFF</text>}
    </>
);
