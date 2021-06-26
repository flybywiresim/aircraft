import React from 'react';

export const AirplaneSymbol: React.FC = () => {
    const wingWidth = 50;
    const spaceBetween = 32;
    const longHeight = 20;
    const thickness = 10;
    const strokeWidth = 3;
    const yStart = 256 - (thickness + strokeWidth) / 2;

    return (
        <g>
            <path
                strokeWidth={strokeWidth}
                stroke="yellow"
                fill="black"
                d={`M${256 - wingWidth - spaceBetween} ${yStart}h${wingWidth}v${longHeight}h${-thickness}v${-thickness}h${-wingWidth + thickness}z`}
            />
            <path strokeWidth={strokeWidth} stroke="yellow" fill="black" d={`M${256 - thickness / 2} ${yStart} h${thickness} v${thickness} h${-thickness}z`} />
            <path
                strokeWidth={strokeWidth}
                stroke="yellow"
                fill="black"
                d={`M${256 + wingWidth + spaceBetween} ${yStart}h${-wingWidth}v${longHeight}h${thickness}v${-thickness}h${wingWidth - thickness}z`}
            />
        </g>
    );
};
