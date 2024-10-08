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
  // Total reservoir capacity is 120L.
  // Reservoir capacity is displayed up to 70L.
  const reservoirCapacityInLiters = 70;
  const litersToPixels = (liters: number) => (liters * height) / reservoirCapacityInLiters;

  // TODO should come from the HSMU and be computed from hyd temp, LEHGS filling etc.
  const normalFilling = 45;
  const fallbackNormalFilling = 40;
  const normalFillingFault = false;

  const isLeftSide = side === 'GREEN';

  const [levelGallon] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_LEVEL`, 'gallon', 1000);
  const level = Math.min(levelGallon * LITERS_PER_GALLON, 70);
  const [lowLevel] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_LEVEL_IS_LOW`, 'boolean', 1000);

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={0.5}
        y={height - litersToPixels(level)}
        height={litersToPixels(level)}
        width={width - 1}
        className={`${lowLevel ? 'Amber' : 'Green'} Fill`}
      />

      <path d={`M 0, 0 v ${height} h ${width} v -${height}`} className="White NoFill SW2 LineRound" />
      <path d="m 9 -37 v 202" className={`${lowLevel ? 'Amber' : 'Green'} SW4`} />
      <path
        d={`m 9 ${isLeftSide ? -12 : -13} h ${isLeftSide ? 157 : -155} v -66`}
        className={`${lowLevel ? 'Amber' : 'Green'} NoFill SW4`}
      />

      <rect
        x={width + 1}
        y={height - litersToPixels(normalFilling) - 16}
        width={7}
        height={15}
        className="Background SW3"
      />
      <rect
        x={width + 1}
        y={height - litersToPixels(normalFilling) - 16}
        width={7}
        height={15}
        className={normalFillingFault ? 'White Fill' : 'Green Fill'}
      />
      <rect
        x={width + 1}
        y={height - litersToPixels(normalFilling) + 1}
        width={7}
        height={15}
        className="Background SW3"
      />
      <rect
        x={width + 1}
        y={height - litersToPixels(normalFilling) + 1}
        width={7}
        height={15}
        className={normalFillingFault ? 'White Fill' : 'Green Fill'}
      />
      {normalFillingFault && (
        <path
          className="Amber SW2"
          d={`M ${width - 0.5} ${height - litersToPixels(fallbackNormalFilling) - 4} l 8 8 m 0 -8 l -8 8`}
        />
      )}

      <rect x={width} y={height - 33} width={6} height={33} className="Background SW3" />
      <rect x={width} y={height - 33} width={6} height={33} className="Amber Fill" />

      <ReservoirFailIndications side={side} />
    </g>
  );
};

type ReservoirFailIndicationsProps = {
  side: 'GREEN' | 'YELLOW';
};
const ReservoirFailIndications = ({ side }: ReservoirFailIndicationsProps) => {
  const isLeftSide = side === 'GREEN';

  const [lowAirPress] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_AIR_PRESSURE_IS_LOW`, 'boolean', 1000);
  const [ovht] = useSimVar(`L:A32NX_HYD_${side}_RESERVOIR_OVHT`, 'boolean', 1000);
  const tempHi = false;

  return (
    <g>
      <g className={lowAirPress ? '' : 'Hide'}>
        <text x={isLeftSide ? 70 : -50} y={72} className="Amber F24 MiddleAlign">
          AIR
        </text>
        <text x={isLeftSide ? 70 : -50} y={96} className="Amber F24 MiddleAlign">
          PRESS
        </text>
        <text x={isLeftSide ? 70 : -50} y={120} className="Amber F24 MiddleAlign">
          LOW
        </text>
      </g>
      <text x={isLeftSide ? 32 : -114} y={155} className={tempHi ? 'Amber F24 ' : 'Hide'}>
        TEMP HI
      </text>
      <text x={isLeftSide ? 32 : -70} y={155} className={ovht ? 'Amber F24' : 'Hide'}>
        OVHT
      </text>
    </g>
  );
};
