import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

import '../../../../index.scss';

const LITERS_PER_GALLON = 3.785411784;

type ReservoirProps = {
    x: number;
    y: number;
    side: 'GREEN' | 'YELLOW';
};
export const Reservoir = ({ x, y, side }: ReservoirProps) => {
    const height = 166;
    const width = 19;
    const fallbackNormalFilling = 40;
    const normalFillingFault = false;

    const normalFillingRange = 50;

    const isLeftSide = side === 'GREEN';

    const [levelGallon] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_LEVEL`, 'gallon', 1000);
    const level = levelGallon * LITERS_PER_GALLON;
    const [lowLevel] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_LEVEL_IS_LOW`, 'boolean', 1000);

    // TODO: Figure out
    const reservoirCapacityInLiters = 50;
    const litersToPixels = (liters: number) => liters * height / reservoirCapacityInLiters;

    return (
        <g transform={`translate(${x} ${y})`}>
            <path d={`M 0, 0 v ${height} h 17 m 2 -36 v -56 m 0 -37 v -37`} className='White NoFill SW2 LineRound' />
            <path d='m 9 -37 v 202' className={`${lowLevel ? 'Amber' : 'Green'} SW4`} />
            <path d={`m 9 ${isLeftSide ? -12 : -13} h ${isLeftSide ? 157 : -155} v -66`} className={`${lowLevel ? 'Amber' : 'Green'} NoFill SW4`} />

            <rect
                x={0.5}
                y={height - litersToPixels(level)}
                height={litersToPixels(level)}
                width={width - 1}
                className={`${lowLevel ? 'Amber' : 'Green'} Fill`}
            />
            <rect
                x={width + 1}
                y={height - litersToPixels(normalFillingRange) - 17}
                width={7}
                height={15}
                className={normalFillingFault ? 'White Fill' : 'Green Fill'}
            />
            <rect
                x={width + 1}
                y={height - litersToPixels(normalFillingRange)}
                width={7}
                height={15}
                className={normalFillingFault ? 'White Fill' : 'Green Fill'}
            />
            {normalFillingFault
                && <path className='Amber SW2' d={`M ${width - 0.5} ${height - litersToPixels(fallbackNormalFilling) - 4} l 8 8 m 0 -8 l -8 8`} />}
            <rect x={width} y={height - 34} width={6} height={34} className='Amber Fill' />

            <ReservoirFailIndications x={isLeftSide ? 64 : -64} y={height - 80} side={side} />
        </g>
    );
};

type ReservoirFailIndicationsProps = {
    x: number;
    y: number;
    side: 'GREEN' | 'YELLOW';
}
const ReservoirFailIndications = ({ x, y, side }: ReservoirFailIndicationsProps) => {
    const [lowAirPress] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_AIR_PRESSURE_IS_LOW`, 'boolean', 1000);
    const [ovht] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_OVHT`, 'boolean', 1000);

    return (
        <g className='hyd-reservoir-fail'>
            {lowAirPress && <text x={x} y={y} textAnchor='middle' className='Amber F19'>AIR</text>}
            {lowAirPress && <text x={x} y={y + 1 * 21} textAnchor='middle' className='Amber F19'>PRESS</text>}
            {lowAirPress && <text x={x} y={y + 2 * 21} textAnchor='middle' className='Amber F19'>LOW</text>}
            {false && <text x={x} y={y + 66} textAnchor='middle' className='Amber F19'>TEMP HI</text>}
            {ovht && <text x={x} y={y + 66} textAnchor='middle' className='Amber F19'>OVHT</text>}
        </g>
    );
};
