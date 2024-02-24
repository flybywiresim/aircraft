// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { LagFilter } from './ISISUtils';

const SideslipIndicatorFilter = new LagFilter(0.8);

const SideslipIndicator: React.FC = () => {
  const maxDeflection = 30;

  const [latAcc] = useSimVar('ACCELERATION BODY X', 'G Force', 500);
  const accInG = Math.min(0.3, Math.max(-0.3, latAcc.toFixed(2)));
  const sideslipIndicatorIndexOffset = SideslipIndicatorFilter.step((-accInG * maxDeflection) / 0.3, 500 / 1000);

  return (
    <path
      id="SideSlipIndicator"
      className="StrokeWhite FillBackground"
      transform={`translate(${sideslipIndicatorIndexOffset} 0)`}
      d="M 246 149 h 20 l 5 9 h -30 z"
    />
  );
};

export const RollIndex: React.FC = () => (
  <g id="RollIndex">
    <rect x={-256} y={-256} width={1024} height={409} className="sky" />
    <path className="StrokeWhite FillBackground" d="M256 131 l10 18 h-20z" />
    <SideslipIndicator />
  </g>
);
