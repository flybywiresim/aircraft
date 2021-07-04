import React, { useState } from 'react';
import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';

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
    const [mda] = useSimVar('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');

    const [lsActive] = useInteractionSimVar('L:A32NX_ISIS_LS_ACTIVE', 'Boolean', 'H:A32NX_ISIS_LS_PRESSED');

    const maskWidth = 108;

    return (
        <g id="ArtificialHorizonDisplay">
            <ArtificialHorizon maskWidth={maskWidth} />
            <AirspeedIndicator maskWidth={maskWidth} indicatedAirspeed={indicatedAirspeed} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.SPD)} />
            <AltitudeIndicator maskWidth={maskWidth} altitude={Math.floor(alt)} mda={mda} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.ALT)} />
            <AirplaneSymbol />
            { lsActive && <LandingSystem /> }
            <PressureIndicator />
            <MachIndicator />
        </g>
    );
};
