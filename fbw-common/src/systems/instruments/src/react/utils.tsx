// @ts-strict-ignore
import React from 'react';

export type LayerProps = { x?: number; y?: number; id?: string; className?: string; visibility?: string };

export const Layer: React.FC<LayerProps> = ({ x = 0, y = 0, id, className, children, visibility = 'visible' }) => (
  <g transform={`translate(${x}, ${y})`} id={id} visibility={visibility} className={className}>
    {children}
  </g>
);

/**
 * Gets the smallest angle between two angles
 * @param angle1 First angle in degrees
 * @param angle2 Second angle in degrees
 * @returns {number} Smallest angle between angle1 and angle2 in degrees
 */
export const getSmallestAngle = (angle1: number, angle2: number): number => {
  let smallestAngle = angle1 - angle2;
  if (smallestAngle > 180) {
    smallestAngle -= 360;
  } else if (smallestAngle < -180) {
    smallestAngle += 360;
  }
  return smallestAngle;
};

export const isCaptainSide = (displayIndex: number | undefined) => displayIndex === 1;

export const getSupplier = (displayIndex: number | undefined, knobValue: number) => {
  const adirs3ToCaptain = 0;
  const adirs3ToFO = 2;

  if (isCaptainSide(displayIndex)) {
    return knobValue === adirs3ToCaptain ? 3 : 1;
  }
  return knobValue === adirs3ToFO ? 3 : 2;
};
