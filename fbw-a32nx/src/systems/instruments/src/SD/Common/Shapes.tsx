// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

type TriangleProps = {
  x: number;
  y: number;
  colour: string;
  fill: number;
  orientation: number;
  scale?: number;
  hidden?: boolean;
};

export const Triangle = ({ x, y, colour, fill, orientation, scale = 1, hidden = false }: TriangleProps) => {
  // x,y marks the top of the triangle
  // You can rotate this 0, 90, -90 degrees
  const polyPoints = `${x + scale * 9},${y + 2 * scale * 9} ${x},${y} ${x - scale * 9},${y + 2 * scale * 9}`;
  const transformation = `rotate(${orientation} ${x} ${y})`;
  let classSelector = `${colour}Line`;
  if (fill === 1) {
    classSelector += ` Fill${colour}`;
  }
  if (hidden) {
    classSelector += ' Hide';
  }

  return <polygon className={classSelector} points={polyPoints} transform={transformation} />;
};
