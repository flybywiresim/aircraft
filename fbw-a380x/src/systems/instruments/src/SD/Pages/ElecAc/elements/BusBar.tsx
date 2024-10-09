import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { TransformerRectifier } from './TransformerRectifier';

export enum AcElecBus {
  Ac1Bus = 1,
  Ac2Bus = 2,
  Ac3Bus = 3,
  Ac4Bus = 4,
  AcEssBus = 5,
  AcEmerBus = 6,
}

interface BusBarProps {
  x: number;
  y: number;
  bus: AcElecBus;
}

export const BusBar: FC<BusBarProps> = ({ x, y, bus }) => {
  const isNormalBus = bus <= 4;

  let busName: string;
  if (isNormalBus) {
    busName = `AC ${bus}`;
  } else if (bus === AcElecBus.AcEssBus) {
    busName = 'AC ESS';
  } else {
    busName = 'AC EMER';
  }

  const lVarName = bus === AcElecBus.AcEssBus ? 'ESS_SHED' : 'ESS';

  const [dcBusPowered] = useSimVar(`L:A32NX_ELEC_AC_${isNormalBus ? bus : lVarName}_BUS_IS_POWERED`, 'bool', 500);

  const boxPath = isNormalBus ? 'M 0,0 l 0,34 l 106,0 l 0,-34 z' : 'M 0,0 l 0,37 l 138,0 l 0,-37 z';

  let trXPosition: number;
  if (bus === AcElecBus.Ac2Bus || bus === AcElecBus.Ac3Bus) {
    trXPosition = 13;
  } else if (bus === AcElecBus.Ac4Bus) {
    trXPosition = 92;
  } else {
    trXPosition = 103;
  }

  return (
    <g id={`electrical-busbar-${bus}`} transform={`translate(${x} ${y})`}>
      <path className="LightGrey GreyFill SW1 LS1" d={boxPath} />
      {isNormalBus && (
        <text className={`F30 ${dcBusPowered ? 'Green' : 'Amber'}`} x={20} y={29}>
          AC
        </text>
      )}
      <text
        className={`${isNormalBus ? 'F35' : 'F29'} ${dcBusPowered ? 'Green' : 'Amber'} ${isNormalBus ? '' : 'MiddleAlign'} LS1 WS-10`}
        x={isNormalBus ? 67 : 70}
        y={isNormalBus ? 30 : 22}
      >
        {isNormalBus ? bus : busName}
      </text>
      {!(bus === AcElecBus.Ac1Bus || bus === AcElecBus.AcEmerBus) && (
        <TransformerRectifier x={trXPosition} y={-19} bus={bus} />
      )}
    </g>
  );
};
