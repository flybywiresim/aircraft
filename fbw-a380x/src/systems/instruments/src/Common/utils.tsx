import React, { forwardRef, PropsWithChildren } from 'react';
import { Position, TwoDimensionalSize } from './types';

export type LayerProps = PropsWithChildren<Position & Partial<TwoDimensionalSize> & React.SVGProps<SVGGElement>>;

export const Layer = forwardRef<SVGGElement, LayerProps>((props, ref) => (
  <g ref={ref} transform={`translate(${props.x}, ${props.y})`} {...props}>
    {props.children}
  </g>
));

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
