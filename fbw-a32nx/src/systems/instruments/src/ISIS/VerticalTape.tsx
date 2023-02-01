import React from 'react';
import { Bug } from './Bug';

type VerticalTapeProps = {
    displayRange: number,
    valueSpacing: number,
    distanceSpacing: number,
    graduationElementFunction: (elementValue: number, offset: number) => React.ReactElement,
    bugElementFunction: (bug: Bug, offset: number) => React.ReactElement,
    bugs: Bug[],
    tapeValue: number,
    lowerLimit: number,
    upperLimit: number
}

export const VerticalTape: React.FC<VerticalTapeProps> = ({
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
