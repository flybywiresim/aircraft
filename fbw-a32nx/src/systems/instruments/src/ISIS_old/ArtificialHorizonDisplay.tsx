import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

import { AltitudeIndicator } from './AltitudeIndicator';
import { LandingSystem } from './LandingSystem';
import { MachIndicator } from './MachIndicator';
import { PressureIndicator } from './PressureIndicator';
import { ArtificialHorizon } from './ArtificialHorizon';
import { AirspeedIndicator } from './AirspeedIndicator';
import { AirplaneSymbol } from './AirplaneSymbol';
import { Bug, BugType } from './Bug';

type ArtificialHorizonDisplayProps = {
    indicatedAirspeed: number,
    bugs: Bug[]
}

export const ArtificialHorizonDisplay: React.FC<ArtificialHorizonDisplayProps> = ({ indicatedAirspeed, bugs }) => {
    const [alt] = useSimVar('INDICATED ALTITUDE:2', 'feet');
    const [mda] = useSimVar('L:A32NX_MINIMUM_DESCENT_ALTITUDE', 'feet');

    return (
        <g id="ArtificialHorizonDisplay">
            <ArtificialHorizon />
            <AirspeedIndicator indicatedAirspeed={indicatedAirspeed} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.SPD)} />
            <AltitudeIndicator altitude={Math.floor(alt)} mda={mda} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.ALT)} />
            <AirplaneSymbol />
            <LandingSystem />
            <PressureIndicator />
            <MachIndicator />
        </g>
    );
};
