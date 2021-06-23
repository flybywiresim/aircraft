import { useInteractionEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useState, useEffect } from 'react';
import { AltitudeIndicator } from './AltitudeIndicator';
import { LandingSystem } from './LandingSystem';
import { MachIndicator } from './MachIndicator';
import { PitchScale } from './PitchScale';
import { PressureIndicator } from './PressureIndicator';

export const ArtificialHorizon: React.FC = () => {
    const [alt] = useSimVar('INDICATED ALTITUDE:2', 'feet');
    const [pitch] = useSimVar('PLANE PITCH DEGREES', 'degrees');
    const [roll] = useSimVar('PLANE BANK DEGREES', 'degrees');
    const [heading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees');
    const [lsActive, setLsActive] = useState(false);
    useInteractionEvent('A32NX_ISIS_LS_PRESSED', () => setLsActive(!lsActive));

    const maskWidth = 108;
    const pitchDegPixels = (512 - 2 * maskWidth) / 35;

    const pitchShift = -pitch * pitchDegPixels;

    return (
        <g transform="rotateX(0deg)">
            <clipPath id="clip-ahi">
                <rect x={maskWidth} y={maskWidth} width={512 - 2 * maskWidth} height={512 - 2 * maskWidth} />
            </clipPath>
            <g clipPath="url(#clip-ahi)">
                <g id="horizon" transform={`rotate(${roll} 256 256) translate(0 ${pitchShift})`}>
                    <rect x={-256} y={-256} width={1024} height={512} className="sky" />
                    <rect x={-256} y={256} width={1024} height={512} className="earth" />
                    <line x1={-256} x2={768} y1={256} y2={256} strokeWidth={4} stroke="white" />
                    <PitchScale pitchDegPixels={pitchDegPixels} />
                </g>
            </g>
            <g id="fixedOverlay">
                {/* What is this? */}
                {/* <rect x={360} y={232} width={512 - 360} height={48} fill="black" /> */}
                <path d="M32,8 L32,504" fill="white" stroke="white" strokeWidth={4} />
                <path d="M480,8 L480,504" fill="white" stroke="white" strokeWidth={4} />
                <AltitudeIndicator altitude={Math.floor(alt)} MDA={200} />
                {/* Speed tape arrow background */}
                <rect x={maskWidth} y={236} width={34} height={40} fill="black" />
                {/* Speed tape arrow */}
                <path
                    d={`M${maskWidth},256 L${maskWidth + 34},236 L${maskWidth + 34},276 L${maskWidth},256`}
                    fill="yellow"
                />
                { lsActive && <LandingSystem /> }
                <PressureIndicator />
                <MachIndicator />
            </g>
        </g>

    );
};
