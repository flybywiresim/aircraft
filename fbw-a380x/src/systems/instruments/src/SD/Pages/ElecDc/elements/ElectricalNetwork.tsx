import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { TransformerRectifier } from './TransformerRectifier';
import { Battery } from './Battery';
import { BusBar, DcElecBus } from './BusBar';
import { BatToBusWire } from './BatToBusWire';

interface ElectricalNetworkProps {
  x: number;
  y: number;
  bus: DcElecBus;
}

export const ElectricalNetwork: FC<ElectricalNetworkProps> = ({ x, y, bus }) => {
  let trContactorName: string;
  if (bus <= 2) {
    trContactorName = `990PU${bus}`;
  } else if (bus === DcElecBus.DcEssBus) {
    trContactorName = '6PE';
  } else {
    trContactorName = '7PU';
  }

  const [trContactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_${trContactorName}_IS_CLOSED`, 'bool', 500);

  let xposTR: number;
  let yposTR: number;
  let xposBus: number;
  let yposBus: number;
  if (bus === DcElecBus.Dc1Bus) {
    xposTR = -12;
    yposTR = 388;
    xposBus = -20;
    yposBus = 276;
  } else if (bus === DcElecBus.DcEssBus) {
    xposTR = -22;
    yposTR = 334;
    xposBus = -30;
    yposBus = 173;
  } else {
    xposTR = 8;
    yposTR = 388;
    xposBus = 0;
    yposBus = 276;
  }

  return (
    <g id={`electrical-network-${bus}`} transform={`translate(${x} ${y})`}>
      {/* Battery */}
      <Battery x={0} y={0} bus={bus} />
      {/* Busbar */}
      <BusBar x={xposBus} y={yposBus} bus={bus} />
      {/* BAT to Bus */}
      <BatToBusWire x={xposBus} y={yposBus} bus={bus} />
      {/* TR to BusBar */}
      <g id={`tr-to-busbar-${bus}`} className={trContactorClosed ? 'Show' : 'Hide'}>
        <path
          className="Green SW2"
          d={`M ${xposTR + 56},${yposTR} l 0,-${bus === DcElecBus.DcEssBus ? '127' : '78'}`}
        />
      </g>
      {/* TR */}
      <TransformerRectifier x={xposTR} y={yposTR} bus={bus} />
    </g>
  );
};
