import React from 'react';

type RollScaleProps = {

}

export const RollScale: React.FC<RollScaleProps> = () => {
    const markerAngles = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];

    const radiusForMarkers = 138;

    const tickLength = 20;
    const dx = radiusForMarkers * Math.sin(30 * Math.PI / 180);
    const dy = radiusForMarkers * Math.cos(30 * Math.PI / 180);

    const createTick = (markerAngle: number) => {
        const sine = Math.sin(markerAngle * Math.PI / 180);
        const cosine = Math.cos(markerAngle * Math.PI / 180);

        const x = 256 + radiusForMarkers * sine;
        const y = 256 - radiusForMarkers * cosine;
        const dx = tickLength * sine;
        const dy = -tickLength * cosine;

        return (<path id={`AngleMarker-${markerAngle}`} className="white-line" d={`M${x} ${y} l${dx} ${dy}`} />);
    };

    return (
        <g id="RollScale">
            <path className="white-line" d={`M ${256 - dx} ${256 - dy} a ${radiusForMarkers} ${radiusForMarkers} 0 0 1 ${2 * dx} 0`} />
            <g>
                {markerAngles.map(createTick)}
            </g>
            <path strokeWidth={3} className="FillYellow StrokeYellow" d="M 256 116 l 10 -18 h-20z" />
        </g>
    );
};
