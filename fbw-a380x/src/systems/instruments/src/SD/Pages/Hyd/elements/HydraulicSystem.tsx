import React from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { Reservoir } from './Reservoir';
import { Engine } from 'instruments/src/SD/Pages/Hyd/elements/Engine';
import { useSimVar } from '@instruments/common/simVars';

type HydraulicSystemProps = {
    label: 'GREEN' | 'YELLOW';
};

export const HydraulicSystem = ({ label }: HydraulicSystemProps) => {
    const isLeftSide = label === 'GREEN';

    return (
        <g>
            <SystemLabel x={isLeftSide ? 38 : 500} y={isLeftSide ? 92 : 94} label={label} />

            <Engine x={isLeftSide ? 8 : 612} y={231} engineNumber={isLeftSide ? 1 : 4}/>

            <Engine x={isLeftSide ? 165 : 457} y={189} engineNumber={isLeftSide ? 2 : 3}/>

            <Reservoir x={isLeftSide ? 72 : 676} y={467} side={label} />
        </g>
    );
};

type SystemLabelProps = {
    x: number,
    y: number,
    label: 'GREEN' | 'YELLOW',
}
const SystemLabel = ({ x, y, label }: SystemLabelProps) => {
    const isGreen = label === 'GREEN';

    const [pressure] = useSimVar(`L:A32NX_HYD_${label}_SYSTEM_1_SECTION_PRESSURE`, 'psi', 1000);
    const [systemPressureSwitch] = useSimVar(`L:A32NX_HYD_${label}_SYSTEM_1_SECTION_PRESSURE_SWITCH`, 'boolean', 500);

    const color = pressure > 2900 ? 'Green' : 'Amber';
    const pressureSwitchColor = systemPressureSwitch ? 'Green' : 'Amber';

    return (
        <g transform={`translate(${x} ${y})`}>
            <Triangle x={114} y={-30} orientation={0} colour={pressureSwitchColor} fill={0} scale={1.35} />
            <rect x={0} y={0} width={228} height={isGreen ? 38 : 36} className={`${color} NoFill SW2`} />
            <text x={7} y={29} className={`${pressure > 2900 ? 'White' : 'Amber'} F23`}>{label}</text>
            <text
                x={isGreen ? 172 : 179}
                y={31}
                textAnchor='end'
                className={`${color} F30`}
            >
                {(Math.round(pressure / 100) * 100).toFixed(0)}
            </text>
            <text x={isGreen ? 175 : 181} y={29} className='Cyan F23'>PSI</text>

            <ElecPump x={isGreen ? 258 : -26} y={isGreen ? 4 : 3} label='A' side={label} />
            <ElecPump x={isGreen ? 258 : -26} y={isGreen ? 36 : 34} label='B' side={label} />
        </g>
    );
};

type ElecPumpProps = {
    x: number;
    y: number;
    label: 'A' | 'B';
    side: 'GREEN' | 'YELLOW'
};
const ElecPump = ({ x, y, label, side }: ElecPumpProps) => {
    const isGreen = side === 'GREEN';

    const [isElecPumpActive] = useSimVar(`L:A32NX_HYD_${side[0]}${label}_EPUMP_ACTIVE`, 'boolean', 1000);
    const [offPbIsAuto] = useSimVar(`L:A32NX_OVHD_HYD_EPUMP${side[0]}${label}_OFF_PB_IS_AUTO`, 'boolean', 1000);
    const [offPbHasFault] = useSimVar(`L:A32NX_OVHD_HYD_EPUMP${side[0]}${label}_OFF_PB_HAS_FAULT`, 'boolean', 1000);
    const isOverheat = false;

    let triangleColor = '';
    if (offPbIsAuto && !isElecPumpActive && !offPbHasFault) {
        triangleColor = 'White';
    } else if (!offPbIsAuto || offPbHasFault) {
        triangleColor = 'Amber';
    } else if (offPbIsAuto && isElecPumpActive && !offPbHasFault) {
        triangleColor = 'Green';
    }

    return (
        <g transform={`translate(${x} ${y})`}>
            <text x={isGreen ? 21 : -35} y={10} className={`F25 ${offPbHasFault || !offPbIsAuto ? 'Amber' : 'White'}`}>
                {label}
            </text>
            <Triangle x={0} y={0} orientation={isGreen ? -90 : 90} colour={triangleColor} fill={isElecPumpActive ? 1 : 0}/>
            {isOverheat && <text x={-14} y={label === 'A' ? -12 : 44} className='Amber F19'>OVHT</text>}
        </g>
    );
};
