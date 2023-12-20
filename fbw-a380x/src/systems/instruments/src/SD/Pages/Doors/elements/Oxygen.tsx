import { useSimVar } from '@instruments/common/simVars';
import { SdacActive, OnGround, Position } from '@instruments/common/types';
import React from 'react';

const Oxygen: React.FC<Position & SdacActive & OnGround> = ({ x, y, active, onGround }) => {
    const minCrewOxygenPressureForFlight = 1000; // TODO Find out what this is for a crew of 5
    const crewOxygenPressure = 1829;
    const ckptPressureAmber = !!(crewOxygenPressure < 350 || !active || (onGround && crewOxygenPressure < minCrewOxygenPressureForFlight));
    const crewOxygenPbAuto = useSimVar('L:PUSH_OVHD_OXYGEN_CREW', 'boolean', 500);

    const cabinOxygenPressure = 1854;
    const cabinPressureAmber = !!(crewOxygenPressure < 350 || !active || (onGround && crewOxygenPressure < minCrewOxygenPressureForFlight));
    const cabinOxygenPbAuto = useSimVar('L:PUSH_OVHD_OXYGEN_CREW', 'boolean', 500);

    return (
        <>
            <g id="crewOxygen">
                <text x={x} y={y} className={`F22 EndAlign ${!active || !crewOxygenPbAuto ? 'AmberFill' : 'White'}`}>CKPT</text>
                <text x={x + 88} y={y} className={`F25 EndAlign ${ckptPressureAmber ? 'AmberFill' : 'Green'}`}>{!active ? 'XX' : crewOxygenPressure}</text>
                <text x={x + 94} y={y} className="F22 Cyan">PSI</text>
                <text x={x + 130} y={y + 40} className={`${!active || !crewOxygenPbAuto ? 'F22 AmberFill EndAlign' : 'Hide'}`}>REGUL PR LO</text>
            </g>
            <path className="White SW2" d={`M${x - 24},${y + 60} l 124,0`} />
            <g id="cabinOxygen">
                <text x={x + 14} y={y + 125} className={`F22 EndAlign ${!active || !cabinOxygenPbAuto ? 'AmberFill' : 'White'}`}>CABIN</text>
                <text x={x + 88} y={y + 125} className={`F25 EndAlign ${cabinPressureAmber ? 'AmberFill' : 'Green'}`}>{!active ? 'XX' : cabinOxygenPressure}</text>
                <text x={x + 94} y={y + 125} className="F22 Cyan">PSI</text>
                <text x={x + 130} y={y + 165} className={`${!active || !cabinOxygenPbAuto ? 'F22 AmberFill EndAlign' : 'Hide'}`}>REGUL PR LO</text>
            </g>
        </>
    );
};

export default Oxygen;
