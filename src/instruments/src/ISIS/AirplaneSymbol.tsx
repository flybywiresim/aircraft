import React from 'react';

export const AirplaneSymbol: React.FC = () => {
    const wingWidth = 52;
    const spaceBetween = 32;
    const longHeight = 15;
    const thickness = 10;
    const yStart = 269 - thickness / 2;

    return (
        <g strokeWidth={3}>
            <path
                className="StrokeYellow FillBackground"
                d={`M${256 - wingWidth - spaceBetween} ${yStart}h${wingWidth}v${longHeight}h${-thickness}v${-5}h${-wingWidth + thickness}z`}
            />
            <path className="StrokeYellow FillBackground" d={`M${256 - thickness / 2} ${yStart} h${thickness} v${thickness} h${-thickness}z`} />
            <path
                className="StrokeYellow FillBackground"
                d={`M${256 + wingWidth + spaceBetween} ${yStart}h${-wingWidth}v${longHeight}h${thickness}v${-5}h${wingWidth - thickness}z`}
            />
        </g>
    );
};
