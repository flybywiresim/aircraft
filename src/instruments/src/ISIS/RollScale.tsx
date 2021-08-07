import React from 'react';

type RollScaleTickProps = {
    angle: number,
    radius: number
}

const RollScaleTick: React.FC<RollScaleTickProps> = ({ radius, angle }) => {
    const tickLength = 20;

    const sine = Math.sin(angle * Math.PI / 180);
    const cosine = Math.cos(angle * Math.PI / 180);

    const x = 256 + radius * sine;
    const y = 256 - radius * cosine;
    const dx = tickLength * sine;
    const dy = -tickLength * cosine;

    return (<path id={`AngleMarker-${angle}`} className="white-line" d={`M${x} ${y} l${dx} ${dy}`} />);
};

export const RollScale: React.FC = React.memo(() => {
    const markerAngles = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];

    const radiusForMarkers = 138;

    const dx = radiusForMarkers * Math.sin(30 * Math.PI / 180);
    const dy = radiusForMarkers * Math.cos(30 * Math.PI / 180);

    return (
        <g id="RollScale">
            <path className="white-line" d={`M ${256 - dx} ${256 - dy} a ${radiusForMarkers} ${radiusForMarkers} 0 0 1 ${2 * dx} 0`} />
            <g>
                {markerAngles.map((angle) => (<RollScaleTick radius={radiusForMarkers} angle={angle} />))}
            </g>
            <path className="FillYellow StrokeYellow" d="M 256 116 l 10 -18 h-20z" />
        </g>
    );
});
