import React from 'react';

export const AirplaneSymbol: React.FC = () => {
    const wingWidth = 52;
    const spaceBetween = 32;
    const longHeight = 15;
    const thickness = 10;
    const strokeWidth = 3;
    const yStart = 270 - (thickness + strokeWidth) / 2;

    return (
        <g>
            <path
                strokeWidth={strokeWidth}
                stroke="yellow"
                fill="black"
                d={`M${256 - wingWidth - spaceBetween} ${yStart}h${wingWidth}v${longHeight}h${-thickness}v${-5}h${-wingWidth + thickness}z`}
            />
            <path strokeWidth={strokeWidth} stroke="yellow" fill="black" d={`M${256 - thickness / 2} ${yStart} h${thickness} v${thickness} h${-thickness}z`} />
            <path
                strokeWidth={strokeWidth}
                stroke="yellow"
                fill="black"
                d={`M${256 + wingWidth + spaceBetween} ${yStart}h${-wingWidth}v${longHeight}h${thickness}v${-5}h${wingWidth - thickness}z`}
            />
        </g>
    );
};
