import React from 'react';
import { Bug } from './Bug';
import { BugSetupDisplay } from './BugSetupDisplay';

export const calculateVerticalOffsetFromRoll = (roll: number) => {
    let offset = 0;

    if (Math.abs(roll) > 60) {
        offset = Math.max(0, 41 - 35.87 / Math.sin(Math.abs(roll) / 180 * Math.PI));
    }
    return offset;
};

export class LagFilter {
    private PreviousInput: number = 0;

    private PreviousOutput: number = 0;

    private TimeConstant: number;

    constructor(timeConstant: number) {
        this.TimeConstant = timeConstant;
    }

    reset(): void {
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
        const scaledDeltaTime = deltaTime * this.TimeConstant;
        const sum0 = scaledDeltaTime + 2;

        const output = (input + this.PreviousInput) * scaledDeltaTime / sum0
            + (2 - scaledDeltaTime) / sum0 * this.PreviousOutput;

        this.PreviousInput = input;
        if (Number.isFinite(output)) {
            this.PreviousOutput = output;
            return output;
        }
        return 0;
    }
}

type Props = {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    graduationElementFunction: (elementValue: number, offset: number) => React.ReactElement;
    bugElementFunction: (bug: Bug, offset: number) => React.ReactElement;
    bugs: Bug[];
    tapeValue: number;
    lowerLimit: number;
    upperLimit: number
}

export const VerticalTape: React.FC<Props> = ({
    displayRange, valueSpacing, distanceSpacing, graduationElementFunction, bugs, bugElementFunction, tapeValue,
    lowerLimit = -Infinity, upperLimit = Infinity,
}) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing);

    const clampedValue = Math.max(Math.min(tapeValue, upperLimit), lowerLimit);

    let lowestValue = Math.max(Math.round((clampedValue - displayRange) / valueSpacing) * valueSpacing, lowerLimit);
    if (lowestValue < tapeValue - displayRange) {
        lowestValue += valueSpacing;
    }

    const graduationElements: React.ReactElement[] = [];

    for (let i = 0; i < numTicks; i++) {
        const elementValue = lowestValue + i * valueSpacing;
        if (elementValue <= upperLimit) {
            const offset = -elementValue * distanceSpacing / valueSpacing;
            graduationElements.push(graduationElementFunction(elementValue, offset));
        }
    }

    const bugElements: React.ReactElement[] = [];

    bugs.forEach((bug) => {
        const { value } = bug;

        const offset = -value * distanceSpacing / valueSpacing;
        bugElements.push(bugElementFunction(bug, offset));
    });

    return (
        <g transform={`translate(0 ${clampedValue * distanceSpacing / valueSpacing})`}>
            {graduationElements}
            {bugElements}
        </g>
    );
};
