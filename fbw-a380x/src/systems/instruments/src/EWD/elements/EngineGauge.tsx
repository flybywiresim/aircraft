import { EngineNumber, FadecActive, n1Degraded, Position } from '@instruments/common/types';
import React from 'react';
import ThrustGauge from './ThrustGauge';
import EGT from './EGT';
import N1 from './N1';
import IgnitionBorder from './IgnitionBorder';

export const EngineGauge: React.FC<Position & EngineNumber & FadecActive & n1Degraded> = ({ x, y, engine, active, n1Degraded }) => (
    <g id={`Engine-Gauge-${engine}`}>
        <IgnitionBorder x={x} y={y} engine={engine} active={active} />
        <ThrustGauge x={x + 2} y={y - 3} engine={engine} active={active} n1Degraded={n1Degraded} />
        <N1 x={x} y={y + 65} engine={engine} active={active} n1Degraded={n1Degraded} />
        <EGT x={x + 4} y={y + 212} engine={engine} active={active} />
    </g>
);
