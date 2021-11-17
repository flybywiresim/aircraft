/* eslint-disable max-classes-per-file */
import { Arinc429Word } from '@shared/arinc429';
import React from 'react';

export const calculateHorizonOffsetFromPitch = (pitch: number) => {
    if (pitch > -5 && pitch <= 20) {
        return pitch * 1.8;
    } if (pitch > 20 && pitch <= 30) {
        return -0.04 * pitch ** 2 + 3.4 * pitch - 16;
    } if (pitch > 30) {
        return 20 + pitch;
    } if (pitch < -5 && pitch >= -15) {
        return 0.04 * pitch ** 2 + 2.2 * pitch + 1;
    }
    return pitch - 8;
};

export const calculateVerticalOffsetFromRoll = (roll: number) => {
    let offset = 0;

    if (Math.abs(roll) > 60) {
        offset = Math.max(0, 41 - 35.87 / Math.sin(Math.abs(roll) / 180 * Math.PI));
    }
    return offset;
};

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

interface HorizontalTapeProps {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    graduationElementFunction: (elementHeading: number, offset: number) => JSX.Element;
    bugs: [(offset: number) => JSX.Element, number][];
    heading: Arinc429Word;
    yOffset?: number;
}

export const HorizontalTape = ({ displayRange, valueSpacing, distanceSpacing, graduationElementFunction, bugs, heading, yOffset = 0 }: HorizontalTapeProps) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing);

    let leftmostHeading = Math.round((heading.value - displayRange) / valueSpacing) * valueSpacing;
    if (leftmostHeading < heading.value - displayRange) {
        leftmostHeading += valueSpacing;
    }

    const graduationElements: JSX.Element[] = [];
    const bugElements: JSX.Element[] = [];

    for (let i = 0; i < numTicks; i++) {
        const elementHeading = leftmostHeading + i * valueSpacing;
        const offset = elementHeading * distanceSpacing / valueSpacing;
        graduationElements.push(graduationElementFunction(elementHeading, offset));
    }

    bugs.forEach((currentElement) => {
        const angleToZero = getSmallestAngle(heading.value, 0);
        const smallestAngle = getSmallestAngle(currentElement[1], 0);
        let offset = currentElement[1];
        if (Math.abs(angleToZero) < 90 && Math.abs(smallestAngle) < 90) {
            if (angleToZero > 0 && smallestAngle < 0) {
                offset = currentElement[1] - 360;
            } else if (angleToZero < 0 && smallestAngle > 0) {
                offset = currentElement[1] + 360;
            }
        }

        offset *= distanceSpacing / valueSpacing;
        bugElements.push(currentElement[0](offset));
    });

    return (
        <g transform={`translate(${-heading.value * distanceSpacing / valueSpacing} ${yOffset})`}>
            {graduationElements}
            {bugElements}
        </g>
    );
};

interface VerticalTapeProps {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    graduationElementFunction: (elementHeading: number, offset: number) => JSX.Element | null;
    bugs: [(offset: number) => JSX.Element, number][];
    tapeValue: number;
    lowerLimit?: number;
    upperLimit?: number;
}

export const VerticalTape = ({
    displayRange, valueSpacing, distanceSpacing, graduationElementFunction, bugs, tapeValue,
    lowerLimit = -Infinity, upperLimit = Infinity,
}: VerticalTapeProps) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing);

    const clampedValue = Math.max(Math.min(tapeValue, upperLimit), lowerLimit);

    let lowestValue = Math.max(Math.round((clampedValue - displayRange) / valueSpacing) * valueSpacing, lowerLimit);
    if (lowestValue < tapeValue - displayRange) {
        lowestValue += valueSpacing;
    }

    const graduationElements: JSX.Element[] = [];
    const bugElements: JSX.Element[] = [];

    for (let i = 0; i < numTicks; i++) {
        const elementValue = lowestValue + i * valueSpacing;
        if (elementValue <= upperLimit) {
            const offset = -elementValue * distanceSpacing / valueSpacing;
            const element = graduationElementFunction(elementValue, offset);
            if (element) {
                graduationElements.push(element);
            }
        }
    }

    bugs.forEach((currentElement) => {
        const value = currentElement[1];
        const offset = -value * distanceSpacing / valueSpacing;
        bugElements.push(currentElement[0](offset));
    });

    return (
        <g transform={`translate(0 ${clampedValue * distanceSpacing / valueSpacing})`}>
            {graduationElements}
            {bugElements}
        </g>
    );
};

export const BarberpoleIndicator = (
    tapeValue: number, border: number, isLowerBorder: boolean, displayRange: number,
    element: (offset: number) => JSX.Element, elementSize: number,
) => {
    const Elements: [(offset: number) => JSX.Element, number][] = [];

    const sign = isLowerBorder ? 1 : -1;
    const isInRange = isLowerBorder ? border <= tapeValue + displayRange : border >= tapeValue - displayRange;
    if (!isInRange) {
        return Elements;
    }
    const numElements = Math.ceil((border + sign * tapeValue - sign * (displayRange + 2)) / elementSize);
    for (let i = 0; i < numElements; i++) {
        const elementValue = border + sign * elementSize * i;
        Elements.push([element, elementValue]);
    }

    return Elements;
};

export const SmoothSin = (origin: number, destination: number, smoothFactor: number, dTime: number) => {
    if (origin === undefined) {
        return destination;
    }
    if (Math.abs(destination - origin) < Number.EPSILON) {
        return destination;
    }
    const delta = destination - origin;
    let result = origin + delta * Math.sin(Math.min(smoothFactor * dTime, 1.0) * Math.PI / 2.0);
    if ((origin < destination && result > destination) || (origin > destination && result < destination)) {
        result = destination;
    }
    return result;
};

export class LagFilter {
    private PreviousInput: number;

    private PreviousOutput: number;

    private TimeConstant: number;

    constructor(timeConstant: number) {
        this.PreviousInput = 0;
        this.PreviousOutput = 0;

        this.TimeConstant = timeConstant;
    }

    reset() {
        this.PreviousInput = 0;
        this.PreviousOutput = 0;
    }

    /**
     *
     * @param input Input to filter
     * @param deltaTime in seconds
     * @returns {number} Filtered output
     */
    step(input: number, deltaTime: number): number {
        const filteredInput = !Number.isNaN(input) ? input : 0;

        const scaledDeltaTime = deltaTime * this.TimeConstant;
        const sum0 = scaledDeltaTime + 2;

        const output = (filteredInput + this.PreviousInput) * scaledDeltaTime / sum0
            + (2 - scaledDeltaTime) / sum0 * this.PreviousOutput;

        this.PreviousInput = filteredInput;
        if (Number.isFinite(output)) {
            this.PreviousOutput = output;
            return output;
        }
        return 0;
    }
}

export class RateLimiter {
    private PreviousOutput: number;

    private RisingRate: number;

    private FallingRate: number;

    constructor(risingRate: number, fallingRate: number) {
        this.PreviousOutput = 0;

        this.RisingRate = risingRate;
        this.FallingRate = fallingRate;
    }

    step(input: number, deltaTime: number) {
        const filteredInput = !Number.isNaN(input) ? input : 0;

        const subInput = filteredInput - this.PreviousOutput;

        const scaledUpper = deltaTime * this.RisingRate;
        const scaledLower = deltaTime * this.FallingRate;

        const output = this.PreviousOutput + Math.max(Math.min(scaledUpper, subInput), scaledLower);
        this.PreviousOutput = output;
        return output;
    }
}
