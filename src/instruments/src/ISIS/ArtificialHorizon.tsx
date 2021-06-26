import React, { } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { PitchScale } from './PitchScale';

export const ArtificialHorizon: React.FC<{ maskWidth: number }> = ({ maskWidth }) => {
    const [pitch] = useSimVar('PLANE PITCH DEGREES', 'degrees');
    const [roll] = useSimVar('PLANE BANK DEGREES', 'degrees');

    const pitchDegPixels = (512 - 2 * maskWidth) / 35;

    const pitchShift = -pitch * pitchDegPixels;

    return (
        <g>
            <clipPath id="clip-ahi">
                <rect x={maskWidth} y={maskWidth} width={512 - 2 * maskWidth} height={512 - 2 * maskWidth} />
            </clipPath>
            <g clipPath="url(#clip-ahi)">
                <g id="horizon" transform={`rotate(${roll} 256 256) translate(0 ${pitchShift})`}>
                    <rect x={-256} y={-256} width={1024} height={512} className="sky" />
                    <rect x={-256} y={256} width={1024} height={512} className="earth" />
                    <PitchScale pitchDegPixels={pitchDegPixels} />
                </g>
            </g>
        </g>
    );
};
