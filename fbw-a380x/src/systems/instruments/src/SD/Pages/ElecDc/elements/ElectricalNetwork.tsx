import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import IndicationBox from './IndicationBox';
import BusBar from './BusBar';

interface ElectricalNetworkProps {
    x: number,
    y: number,
    network: string,
    AC: number,
}

const ElectricalNetwork: FC<ElectricalNetworkProps> = ({ x, y, network, AC }) => {
    // const sdacDatum = true;
    // TODO: Modify ACBusBar when bus 3 and 4 are available
    const [ACBusBar] = useSimVar(`L:A32NX_ELEC_AC_${AC > 2 ? AC - 2 : AC}_BUS_IS_POWERED`, 'bool', 500);

    let yposTR = y + 384;
    let xposTR = x - 12;

    if (AC > 2) {
        // yposTR = y + 386;
        xposTR = x + 6;
    } else if (AC === 1) {
        yposTR = y + 329;
        xposTR = x - 22;
    }

    return (
        <g id={`electrical-network-${network}}`}>
            {/* Battery */}
            <IndicationBox x={x} y={y} TR='BAT' network={network} />
            {/* Busbar */}
            <BusBar x={x} y={y} network={network} />
            {/* TR to BusBar */}
            <g id={`tr-to-busbar-${network}`} className={ACBusBar ? 'Show' : 'Hide'}>
                <path className='Green SW2' d={`M ${xposTR + 56},${yposTR} l 0,-${network === 'ESS' ? '125' : '78'}`} />
            </g>
            {/* TR */}
            <IndicationBox x={xposTR} y={yposTR} TR='TR' network={network} />
            <Triangle x={xposTR + 56} y={yposTR + 111} colour={ACBusBar ? 'White' : 'Amber'} fill={0} orientation={0} scale={1} />
            <text className={`F25 ${ACBusBar ? 'White' : 'Amber'} EndAlign`} x={xposTR + 60} y={yposTR + 150}>AC</text>
            <text className={`F25 ${ACBusBar ? 'White' : 'Amber'}`} x={xposTR + 68} y={yposTR + 150}>{`${AC}`}</text>
        </g>
    );
};

export default ElectricalNetwork;
