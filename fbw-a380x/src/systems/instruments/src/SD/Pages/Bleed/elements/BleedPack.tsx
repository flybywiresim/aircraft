import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';

interface BleedPackProps {
    x: number,
    y: number,
    pack: number,
}

const BleedPack: FC<BleedPackProps> = ({ x, y, pack }) => {
    const [packFlowValveLeftOpen] = useSimVar(`L:A32NX_COND_PACK_${pack}_FLOW_VALVE_1_IS_OPEN`, 'bool', 500);
    const [packFlowValveRightOpen] = useSimVar(`L:A32NX_COND_PACK_${pack}_FLOW_VALVE_2_IS_OPEN`, 'bool', 500);
    // TODO: The pack should probably emit a status for this, rather than deriving it from the valve positions
    const isPackOperative = packFlowValveLeftOpen || packFlowValveRightOpen;

    const [packOutletTemperature] = useSimVar(`L:A32NX_PNEU_ENG_${pack}_PRECOOLER_OUTLET_TEMPERATURE`, 'celsius', 500);

    return (
        <g id={`BleedPack${pack}`}>
            <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d={`M${x + 56},${y - 21} l 0,-22`} />
            <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d={`M${x + 56},${y + 90} l 0,22`} />

            <path className="Grey SW2" d={`M ${x},${y} l -20,0 l 0,90 l 153,0 l 0,-90 l -20,0`} />
            <text x={x + 20} y={y} className={`F22 ${isPackOperative ? 'White' : 'Amber'}`}>PACK</text>
            <text x={x + 85} y={y} className={`F29 ${isPackOperative ? 'Green' : 'Amber'}`}>{pack}</text>

            <text x={x + 61} y={y + 57} className="F29 EndAlign Green">{Math.round(packOutletTemperature)}</text>
            <text x={x + 62} y={y + 57} className="Cyan F23">°C</text>

        </g>
    );
};

export default BleedPack;
