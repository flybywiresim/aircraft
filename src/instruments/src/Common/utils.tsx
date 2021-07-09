import React from 'react';

export type LayerProps = { x: number, y: number }

export const Layer: React.FC<LayerProps> = ({ x = 0, y = 0, children }) => (
    <g transform={`translate(${x}, ${y})`}>
        {children}
    </g>
);

/**
 * Gets the smallest angle between two angles
 * @param angle1 First angle in degrees
 * @param angle2 Second angle in degrees
 * @returns {number} Smallest angle between angle1 and angle2 in degrees
 */
 export const getSmallestAngle = (angle1: number, angle2: number) : number => {
    let smallestAngle = angle1 - angle2;
    if (smallestAngle > 180) {
        smallestAngle -= 360;
    } else if (smallestAngle < -180) {
        smallestAngle += 360;
    }
    return smallestAngle;
};
