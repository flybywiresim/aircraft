import React from 'react';

const ExcessivePitchAttitudeArrows: React.FC = () => (
    <g id="ExcessivePitchArrows">
        <path d="M198 -258 h 46 v 12 h -16 l 28 28 l 28 -28 h -16 v -12 h 46 l -58 58z" strokeWidth={2} className="StrokeRed NoFill" />
        <path d="M216 -162 h 16 l 24 42 l 24 -42 h 16 l -40 70z" strokeWidth={2} className="StrokeRed NoFill" />
        <path d="M220 -66 h12 l24 42 l24 -42 h12 l-35.5 62z" strokeWidth={2} className="StrokeRed NoFill" />
        <path d="M220 578 h12 l24 -42 l24 42 h12 l-35.5 -62z" strokeWidth={2} className="StrokeRed NoFill" />
        <path d="M216 674 h 16 l 24 -42 l 24 42 h 16 l -40 -70z" strokeWidth={2} className="StrokeRed NoFill" />
        <path d="M198 770 h 46 v -12 h -16 l 28 -28 l 28 28 h -16 v 12 h 46 l -58 -58z" strokeWidth={2} className="StrokeRed NoFill" />
    </g>
);

type Props = {
    pitchDegPixels: number;
}

export const PitchScale: React.FC<Props> = ({ pitchDegPixels }) => {
    const markers: React.ReactElement[] = [];
    for (let d = -30; d <= 30; d += 10) {
        if (d === 0) {
            markers.push(
                <line x1={-256} x2={768} y1={256} y2={256} strokeWidth={4} stroke="white" />,
            );

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

    return (
        <g id="PitchScale">
            {markers}
            <ExcessivePitchAttitudeArrows />
        </g>
    );
};
