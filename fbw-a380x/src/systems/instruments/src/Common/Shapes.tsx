import React from 'react';

type TriangleProps = {
  x: number;
  y: number;
  colour: string;
  fill: number;
  orientation: number;
  scale?: number;
};

export const Triangle = ({ x, y, colour, fill, orientation, scale = 1 }: TriangleProps) => {
  // x,y marks the top of the triangle
  // You can rotate this 0, 90, -90 degrees
  const polyPoints = `${scale * 8},${2 * scale * 7} 0,0 ${-(scale * 8)},${2 * scale * 7}`;
  const transformation = `translate(${x} ${y}) rotate(${orientation} 0 0)`;
  let classSelector = `${colour} Line`;
  if (fill === 1) {
    classSelector += ` Fill ${colour}`;
  } else {
    classSelector += ' NoFill';
  }

  return <polygon className={classSelector} points={polyPoints} transform={transformation} />;
};
