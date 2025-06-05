import React, { FC } from 'react';
import { BusBar, AcElecBus } from './BusBar';
import { EngineGenerator } from './EngineGenerator';
import { ExternalPower } from './ExternalPower';

interface ElectricalNetworkProps {
  x: number;
  y: number;
  bus: AcElecBus;
}

export const ElectricalNetwork: FC<ElectricalNetworkProps> = ({ x, y, bus }) => (
  <g id={`electrical-network-${bus}`} transform={`translate(${x} ${y})`}>
    {/* Busbar */}
    <BusBar x={0} y={0} bus={bus} />
    {/* External Power */}
    <ExternalPower x={bus <= 2 ? -30 : 60} y={106} bus={bus} />
    {/* Engine Generator */}
    <EngineGenerator x={14} y={199} bus={bus} />
  </g>
);
