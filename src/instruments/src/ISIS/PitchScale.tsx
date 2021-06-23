import React from 'react';

export const PitchScale: React.FC<{ pitchDegPixels: number }> = ({ pitchDegPixels }) => {
    const markers = Array();
    for (let d = -30; d <= 30; d += 10) {
        if (d === 0) {
            continue;
        }
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <g>
                <text x={220} y={y} fontSize={32} fill="white" textAnchor="end" alignmentBaseline="middle">{Math.abs(d).toFixed(0)}</text>
                <line x1={232} x2={280} y1={y} y2={y} stroke="white" strokeWidth={4} />
            </g>,
        );
    }

    for (let d = -25; d <= 25; d += 10) {
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <line x1={242} x2={270} y1={y} y2={y} stroke="white" strokeWidth={4} />,
        );
    }

    for (let d = -27.5; d <= 22.5; d += 10) {
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <line x1={248} x2={264} y1={y} y2={y} stroke="white" strokeWidth={4} />,
        );
    }

    for (let d = -22.5; d <= 27.5; d += 10) {
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <line x1={248} x2={264} y1={y} y2={y} stroke="white" strokeWidth={4} />,
        );
    }

    return markers;
};
