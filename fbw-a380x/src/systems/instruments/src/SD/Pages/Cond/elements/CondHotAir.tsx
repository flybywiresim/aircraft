import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';

import { Triangle } from '@instruments/common/Shapes';
import Valve from '@instruments/common/Valve';

interface CondHotAirProps {
    x: number,
    y: number,
    hotAir: number,
}

const CondHotAir: FC<CondHotAirProps> = ({ x, y, hotAir }) => {
    const [packValveOpen1] = useSimVar(`L:A32NX_PNEU_ENG_${hotAir + (hotAir === 1 ? 0 : 1)}_HP_VALVE_OPEN`, 'bool', 500);
    const [packValveOpen2] = useSimVar(`L:A32NX_PNEU_ENG_${hotAir + (hotAir === 1 ? 1 : 2)}_HP_VALVE_OPEN`, 'bool', 500);
    const anyPackValveOpen = packValveOpen1 || packValveOpen2;
    const [hotAirValveOpen] = useSimVar(`L:A32NX_COND_HOT_AIR_VALVE_${hotAir}_IS_OPEN`, 'bool', 500);

    return (
        <g id={`CondHotAir-${hotAir}`}>
            <path className={`${anyPackValveOpen ? 'Green' : 'Amber'} Line`} d={`M${x},${y} l 0,-30`} />
            <path className={`${hotAirValveOpen ? 'Green' : 'Amber'} Line`} d={`M${x},${y - 58} l 0,-16`} />
            <Triangle x={x} y={y - 90} colour={hotAirValveOpen ? 'Green' : 'Amber'} fill={0} orientation={0} scale={1.1} />
            <Valve x={x} y={y - 39} radius={17} css={`SW2 ${hotAirValveOpen ? 'Green' : 'Amber'}`} position={hotAirValveOpen ? 'V' : 'H'} sdacDatum />
        </g>
    )
}

export default CondHotAir;
