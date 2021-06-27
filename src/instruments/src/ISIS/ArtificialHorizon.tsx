import React, { } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { PitchScale } from './PitchScale';

const Sky: React.FC = () => <rect x={-256} y={-256} width={1024} height={512} className="sky" />;
const Earth: React.FC = () => <rect x={-256} y={256} width={1024} height={512} className="earth" />;

export const ArtificialHorizon: React.FC<{ maskWidth: number }> = ({ maskWidth }) => {
    const [pitch] = useSimVar('PLANE PITCH DEGREES', 'degrees');
    const [roll] = useSimVar('PLANE BANK DEGREES', 'degrees');

    const pitchDegPixels = (512 - 2 * maskWidth) / 35;

    const pitchShift = -pitch * pitchDegPixels;

    return (
        <g id="ArtificialHorizon">
            <g id="horizon" transform={`rotate(${roll} 256 256) translate(0 ${pitchShift})`}>
                <Sky />
                <Earth />
                <PitchScale pitchDegPixels={pitchDegPixels} />
            </g>
            <path id="Mask" className="mask" d="M 0 0 h 512 v 512 h -512 z M 108 130.5 c 50 -30 246 -30 296 0 v 251 c -50 30 -246 30 -296 0 z" />
        </g>
    );
};
