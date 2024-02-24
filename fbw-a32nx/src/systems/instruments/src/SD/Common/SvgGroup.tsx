// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

interface SvgGroupProps {
  x: number;
  y: number;
  rotation?: number | string;
  className?: string;
}
export const SvgGroup: React.FC<SvgGroupProps> = ({ x, y, rotation, children, className }) => (
  <g transform={`translate(${x},${y}) rotate(${rotation ?? 0})`} className={className}>
    {children}
  </g>
);
