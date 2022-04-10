import { useSimVar } from '@instruments/common/simVars';
import React, { useState } from 'react';
import HydReservoir from './HydReservoir';
import HydEngValve from './HydEngValve';
import HydEngPump from './HydEngPump';
import { Triangle } from '../../../Common/Shapes';

interface HydSysProps {
    title: string,
    pressure: number,
    hydLevel: number,
    x: number,
    y: number,
    fireValve: number,
    pumpPBStatus: number,
    yellowElectricPumpStatus: number
}

const HydSys = ({ title, pressure, hydLevel, x, y, fireValve, pumpPBStatus, yellowElectricPumpStatus } : HydSysProps) => {
    const [hydLevelLow, setHydLevelLow] = useState(false);
    const lowPressure = 1450;
    const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

    const [greenPumpActive] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_ACTIVE', 'boolean', 500);
    const [yellowPumpActive] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_ACTIVE', 'boolean', 500);
    const [bluePumpActive] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_ACTIVE', 'boolean', 500);

    const [greenPumpLowPressure] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'boolean', 500);
    const [yellowPumpLowPressure] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'boolean', 500);
    const [bluePumpLowPressure] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_LOW_PRESS', 'boolean', 500);

    function checkPumpLowPressure(pump) {
        switch (pump) {
        case 'GREEN':
            return greenPumpLowPressure || !greenPumpActive;
        case 'BLUE':
            return bluePumpLowPressure || !bluePumpActive;
        case 'YELLOW':
            return yellowPumpLowPressure || !yellowPumpActive;
        default:
            return 1;
        }
    }

    const pumpDetectLowPressure = checkPumpLowPressure(title);

    const hydLevelBoolean = (value: boolean) => {
        setHydLevelLow(value);
    };

    return (
        <>
            <Triangle x={x} y={y} colour={pressureNearest50 <= lowPressure ? 'Amber' : 'Green'} fill={0} orientation={0} />
            <text className={`Title ${pressureNearest50 <= lowPressure ? 'FillAmber' : 'FillWhite'}`} x={x} y={y + 43}>{title}</text>
            <text className={`Pressure ${pressureNearest50 <= lowPressure ? 'FillAmber' : 'FillGreen'}`} x={x} y={y + 75}>{pressureNearest50}</text>

            {/* The colour of these lines will be affected by the yellow electric pump */}
            <line className={pressureNearest50 <= lowPressure ? 'AmberLine' : 'GreenLine'} x1={x} y1={y + 126} x2={x} y2={y + 83} />
            <line
                className={pressureNearest50 <= lowPressure
                 || (pumpDetectLowPressure && title === 'GREEN')
                 || (pumpDetectLowPressure && !yellowElectricPumpStatus && title === 'YELLOW') ? 'AmberLine' : 'GreenLine'}
                x1={x}
                y1={y + 181}
                x2={x}
                y2={y + 125}
            />
            <line className={pressureNearest50 <= lowPressure || (pumpDetectLowPressure && title !== 'BLUE') ? 'AmberLine' : 'GreenLine'} x1={x} y1={y + 221} x2={x} y2={y + 180} />

            <HydEngPump
                system={title}
                pumpOn={pumpPBStatus}
                x={x}
                y={y + 290}
                hydLevelLow={hydLevelLow}
                fireValve={fireValve}
                pumpDetectLowPressure={pumpDetectLowPressure}
                pressure={pressureNearest50}
            />
            <HydEngValve system={title} x={x} y={y + 290} fireValve={fireValve} hydLevelLow={hydLevelLow} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} y={495} fluidLevel={hydLevel} setHydLevel={hydLevelBoolean} />
        </>
    );
};

export default HydSys;
