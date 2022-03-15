import React, { FC } from 'react';
import Valve from './Valve';

interface EngineBleedProps {
    x: number,
    y: number,
    engine: 1 | 2,
}

export const EngineBleed: FC<EngineBleedProps> = ({ x, y, engine }) => {
    console.log(`engine is ${engine}`);

    return (
        <g id={`bleed-${engine}`}>

            {/* Air Cond shape and labels */}
            <path className="GreyStroke Stroke1" d={`M ${x},${y} l -47,10 l 0,123 l 14,0`} />
            <path className="GreyStroke Stroke1" d={`M ${x - 47},${y + 64} l 14,0`} />

            <path className="GreyStroke Stroke1" d={`M ${x},${y} l +47,10 l 0,123 l -14,0`} />
            <path className="GreyStroke Stroke1" d={`M ${x + 47},${y + 64} l -14,0`} />

            <text x={x - 56} y={y + 64} className="White Standard End">C</text>
            <text x={x + 58} y={y + 64} className="White Standard">H</text>
            <text x={x - 55} y={y + 132} className="White Standard End">LO</text>
            <text x={x + 61} y={y + 132} className="White Standard">HI</text>

            <Valve x={x} y={y + 150} radius={15} css="GreenLine" position={"V"} />

            {/* Engine Bleed temp */}
            <path className="GreyStroke Stroke2" d={`M ${x},${y + 247} l -27,0 l 0,54 l 54,0 l 0,-54 l -27,0`} />

            <Valve x={x} y={y + 355} radius={15} css="GreenLine" position={"V"} />

            <text x={x + 2} y={y + 433} className="White Center Standard">IP</text>
            <Valve x={engine === 1 ? x + 47 : x - 47} y={y + 398} radius={15} css="GreenLine" position={"H"} />
            <text x={engine === 1 ? x + 95 : x - 90} y={y + 433} className="White Center Standard">HP</text>
        </g>
    );
};
