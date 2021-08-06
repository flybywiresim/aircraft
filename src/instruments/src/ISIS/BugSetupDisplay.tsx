import React from 'react';
import { Bug } from './Bug';

type BugSetupDisplayProps = {
    selectedIndex: number,
    bugs: Bug[]
}

export const BugSetupDisplay: React.FC<BugSetupDisplayProps> = ({ selectedIndex, bugs }) => (
    <g id="BugDisplay" className="TextWhite NoFill FontLarge">
        <text x={40} y={55} className="TextCyan">EXIT↑</text>
        <text x={256} y={53} textAnchor="middle" className="TextWhite">BUGS</text>
        <text x={150} y={100} textAnchor="middle" className="TextWhite">SPD</text>
        <text x={325} y={100} textAnchor="middle" className="TextWhite">ALT</text>
        <text fontSize={16} x={196} y={126} className="TextWhite">(+)</text>
        <text fontSize={16} x={106} y={180} className="TextWhite">(-)</text>
        <path fill="none" stroke="white" d="M150 136 v225 h176 v-225z" />
        <g>
            {!bugs[5].isActive && <text x={30} y={150} className="TextWhite">OFF</text>}
            <BugBox x={150} y={150} value={bugs[5].value} isSelected={selectedIndex === 5} numDigits={3} />
        </g>
        <g>
            {!bugs[4].isActive && <text x={30} y={225} className="TextWhite">OFF</text>}
            <BugBox x={150} y={225} value={bugs[4].value} isSelected={selectedIndex === 4} numDigits={3} />
        </g>
        <g>
            {!bugs[3].isActive && <text x={30} y={300} className="TextWhite">OFF</text>}
            <BugBox x={150} y={300} value={bugs[3].value} isSelected={selectedIndex === 3} numDigits={3} />
        </g>
        <g>
            {!bugs[2].isActive && <text x={30} y={375} className="TextWhite">OFF</text>}
            <BugBox x={150} y={375} value={bugs[2].value} isSelected={selectedIndex === 2} numDigits={3} />
        </g>
        <g>
            {!bugs[0].isActive && <text x={400} y={225} className="TextWhite">OFF</text>}
            <BugBox x={325} y={225} value={bugs[0].value} isSelected={selectedIndex === 0} numDigits={5} />
        </g>
        <g>
            {!bugs[1].isActive && <text x={400} y={300} className="TextWhite">OFF</text>}
            <BugBox x={325} y={300} value={bugs[1].value} isSelected={selectedIndex === 1} numDigits={5} />
        </g>
        <text x={150} y={450} className="TextCyan">SET/SELECT→</text>
    </g>
);

type BugBoxProps = {
    x: number,
    y: number,
    value: number,
    numDigits: number,
    isSelected?: boolean
}

export const BugBox: React.FC<BugBoxProps> = ({ x, y, value, numDigits, isSelected = false }) => {
    const width = numDigits * 25;

    return (
        <g id="BugBox">
            <rect className={`StrokeWhite FillBackground${isSelected ? ' BlinkInfinite' : ''}`} x={x - width / 2} y={y - 34} width={width} height={40} />
            <text x={x} y={y} textAnchor="middle" className="TextWhite">{value.toString().padStart(numDigits, '0')}</text>
        </g>
    );
};
