import React, { useState } from 'react';
import { useInteractionEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';

import { AltitudeIndicator } from './AltitudeIndicator';
import { LandingSystem } from './LandingSystem';
import { MachIndicator } from './MachIndicator';
import { PressureIndicator } from './PressureIndicator';
import { ArtificialHorizon } from './ArtificialHorizon';
import { AirspeedIndicator } from './AirspeedIndicator';
import { AirplaneSymbol } from './AirplaneSymbol';
import { Bug, BugType } from './Bug';

type Props = {
    indicatedAirspeed: number;
    bugs: Bug[];
}

export const ArtificialHorizonDisplay: React.FC<Props> = ({ indicatedAirspeed, bugs }) => {
    const [alt] = useSimVar('INDICATED ALTITUDE:2', 'feet');

    const [heading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees');
    const [lsActive, setLsActive] = useState(false);
    useInteractionEvent('A32NX_ISIS_LS_PRESSED', () => setLsActive(!lsActive));

    const maskWidth = 108;

    return (
        <g>
            <ArtificialHorizon maskWidth={maskWidth} />
            <g id="fixedOverlay">
                {/* <path d="M32,8 L32,504" fill="white" stroke="white" strokeWidth={4} />
                <path d="M480,8 L480,504" fill="white" stroke="white" strokeWidth={4} />
                <path d="M0,108 L512,108" fill="white" stroke="white" strokeWidth={4} />
                <path d="M0,404 L512,404" fill="white" stroke="white" strokeWidth={4} /> */}
                <AirspeedIndicator maskWidth={maskWidth} indicatedAirspeed={indicatedAirspeed} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.SPD)} />
                <AltitudeIndicator maskWidth={maskWidth} altitude={Math.floor(alt)} mda={200} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.ALT)} />
                <AirplaneSymbol />
                { lsActive && <LandingSystem /> }
                <PressureIndicator />
                <MachIndicator />
            </g>
        </g>
    );
};
