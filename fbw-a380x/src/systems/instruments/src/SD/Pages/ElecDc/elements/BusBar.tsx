import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';

interface BusBarProps {
    x: number,
    y: number,
    network: string,
}

const BusBar: FC<BusBarProps> = ({ x, y, network }) => {
    // const sdacDatum = true;
    // TODO: Add APU bus to DC electrical system
    const [DCBusBar] = useSimVar(`L:A32NX_ELEC_DC_${network}_BUS_IS_POWERED`, 'bool', 500);

    let yposBB = y + 276;
    let xposBB = x - 18;

    if (network === 'ESS') {
        yposBB -= 103;
        xposBB -= 10;
    } else if (['2', 'APU'].includes(network)) {
        xposBB += 20;
    }

    return (
        <g id={`electrical-busbar-${network}}`}>
            <path className='LightGrey GreyFill SW2' d={`M ${xposBB},${yposBB} l 0,30 l 126,0 l 0,-30 l -126,0`} />
            <text className={`F27 ${DCBusBar ? 'Green' : 'Amber'} Grey`} x={['1', '2'].includes(network) ? xposBB + 30 : xposBB + 8} y={yposBB + 25}>DC</text>
            <text
                className={`${['1', '2'].includes(network) ? 'F32' : 'F27'} ${DCBusBar ? 'Green' : 'Amber'}`}
                x={['1', '2'].includes(network) ? xposBB + 78 : xposBB + 64}
                y={['1', '2'].includes(network) ? yposBB + 26 : yposBB + 25}
            >
                {`${network}`}
            </text>
        </g>
    );
};

export default BusBar;
