import React from 'react';

type Props = {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    graduationElementFunction: (elementValue: number, offset: number) => JSX.Element;
    tapeValue: number;
    lowerLimit: number;
    upperLimit: number
}

export const VerticalTape: React.FC<Props> = ({
    displayRange, valueSpacing, distanceSpacing, graduationElementFunction, tapeValue,
    lowerLimit = -Infinity, upperLimit = Infinity,
}) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing);

    const clampedValue = Math.max(Math.min(tapeValue, upperLimit), lowerLimit);

    let lowestValue = Math.max(Math.round((clampedValue - displayRange) / valueSpacing) * valueSpacing, lowerLimit);
    if (lowestValue < tapeValue - displayRange) {
        lowestValue += valueSpacing;
    }

    const graduationElements: JSX.Element[] = [];

    for (let i = 0; i < numTicks; i++) {
        const elementValue = lowestValue + i * valueSpacing;
        if (elementValue <= upperLimit) {
            const offset = -elementValue * distanceSpacing / valueSpacing;
            graduationElements.push(graduationElementFunction(elementValue, offset));
        }
    }

    return (
        <g transform={`translate(0 ${clampedValue * distanceSpacing / valueSpacing})`}>
            {graduationElements}
        </g>
    );
};
