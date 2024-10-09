import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { useSimVar } from '@instruments/common/simVars';
import { AcElecBus } from './BusBar';

interface TransformerRectifierProps {
  x: number;
  y: number;
  bus: AcElecBus;
}

export const TransformerRectifier: FC<TransformerRectifierProps> = ({ x, y, bus }) => {
  const trFault = false;

  let trName: string;
  let busName: string;
  if (bus === AcElecBus.Ac2Bus) {
    trName = '1';
    busName = '2';
  } else if (bus === AcElecBus.Ac3Bus) {
    trName = '2';
    busName = '3';
  } else if (bus === AcElecBus.Ac4Bus) {
    trName = 'APU';
    busName = '4';
  } else {
    trName = 'ESS';
    // TODO Should be ESS
    busName = 'ESS_SHED';
  }

  const [acBusPowered] = useSimVar(`L:A32NX_ELEC_AC_${busName}_BUS_IS_POWERED`, 'bool', 500);

  const doubleLine = bus > 3;

  return (
    <g id={`tr-${trName}-indication`} transform={`translate(${x} ${y})`}>
      <text
        x={doubleLine ? 2 : 21}
        y={doubleLine ? -35 : -11}
        className={`F26 ${trFault || !acBusPowered ? 'Amber' : 'White'} LS1 MiddleAlign`}
      >
        {trName}
      </text>

      <text
        x={doubleLine ? 1 : -11}
        y={-11}
        className={`F26 ${trFault || !acBusPowered ? 'Amber' : 'White'} LS1 MiddleAlign`}
      >
        TR
      </text>

      <Triangle x={0} y={0} colour={trFault || !acBusPowered ? 'Amber' : 'White'} fill={0} orientation={0} scale={1} />
    </g>
  );
};
