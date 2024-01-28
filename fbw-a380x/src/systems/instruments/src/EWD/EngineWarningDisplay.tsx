import React, { useState } from 'react';
import { LegacyCdsDisplayUnit, DisplayUnitID } from '@instruments/common/LegacyCdsDisplayUnit';
import { useSimVar } from '@instruments/common/simVars';
import { EngineGauge } from './elements/EngineGauge';
import ThrustRatingMode from './elements/ThrustRatingMode';
import PseudoFWC from './elements/PseudoFWC';
import EWDMemo from './elements/EWDMemo';
// import { Checklist } from './elements/Checklist';

import '../index.scss';

export const EngineWarningDisplay: React.FC = () => {
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'Enum', 1000);
    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500); // TODO: Update with correct SimVars
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500); // TODO: Update with correct SimVars
    const [engine3State] = useSimVar('L:A32NX_ENGINE_STATE:3', 'enum', 500); // TODO: Update with correct SimVars
    const [engine4State] = useSimVar('L:A32NX_ENGINE_STATE:4', 'enum', 500); // TODO: Update with correct SimVars
    const engineState = [engine1State, engine2State, engine3State, engine3State, engine4State];
    const engineRunning = engineState.some((value) => value > 0); // TODO Implement FADEC SimVars once available

    const engineRunningOrIgnitionOn = !!(engSelectorPosition === 2 || engineRunning);

    const [n1Degraded] = useState([false, false, false, false]);
    const displayMemo = true;

    return (
        <LegacyCdsDisplayUnit displayUnitId={DisplayUnitID.Ewd}>
            <ThrustRatingMode x={330} y={30} active={engineRunningOrIgnitionOn} />

            <EngineGauge x={93} y={126} engine={1} active={engineRunningOrIgnitionOn} n1Degraded={n1Degraded[0]} />
            <EngineGauge x={262} y={126} engine={2} active={engineRunningOrIgnitionOn} n1Degraded={n1Degraded[1]} />
            <EngineGauge x={497} y={126} engine={3} active={engineRunningOrIgnitionOn} n1Degraded={n1Degraded[2]} />
            <EngineGauge x={668} y={126} engine={4} active={engineRunningOrIgnitionOn} n1Degraded={n1Degraded[3]} />

            <text x={386} y={121} className="White F26 Center">THR</text>
            <text x={386} y={142} className="Cyan F20 Center">%</text>

            {/* N1 */}

            <text x={386} y={220} className="White F26 Center">N1</text>
            <text x={386} y={243} className="Cyan F20 Center">%</text>

            <path className={`LightGreyLine ${n1Degraded[0] || n1Degraded[1] || !engineRunningOrIgnitionOn ? 'Hide' : 'Show'}`} d={`m ${171} 228 l 24 -2`} />
            <path className={`LightGreyLine ${n1Degraded[1] || !engineRunningOrIgnitionOn ? 'Hide' : 'Show'}`} d={`m ${335} 216 l 20 -2`} />
            <path className={`LightGreyLine ${n1Degraded[2] || !engineRunningOrIgnitionOn ? 'Hide' : 'Show'}`} d={`m ${416} 216 l 20 2`} />
            <path className={`LightGreyLine ${n1Degraded[2] || n1Degraded[3] || !engineRunningOrIgnitionOn ? 'Hide' : 'Show'}`} d={`m ${576} 226 l 24 2`} />

            {/* EGT */}

            <text x={384} y={316} className="White F26 Center">EGT</text>
            <text x={384} y={339} className="Cyan F20 Center">&deg;C</text>

            <path stroke="#8c8c8c" strokeWidth={4} d="m 8 375 h 750" />

            {/* <text fontSize="25px" x={47} y={435} fill="white">BEFORE START</text>
            <path stroke="white" strokeWidth={2} d="m 49 436.3 h 193" /> */}

            {/* <Checklist x={47} y={467} /> */}
            <EWDMemo x={395} y={414} active={displayMemo} />
            <PseudoFWC />
        </LegacyCdsDisplayUnit>
    );
};
