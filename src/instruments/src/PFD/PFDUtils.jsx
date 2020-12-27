export const calculateHorizonOffsetFromPitch = (pitch) => {
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

export const calculateVerticalOffsetFromRoll = (roll) => {
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
export const getSmallestAngle = (angle1, angle2) => {
    let smallestAngle = angle1 - angle2;
    if (smallestAngle > 180) {
        smallestAngle -= 360;
    } else if (smallestAngle < -180) {
        smallestAngle += 360;
    }
    return smallestAngle;
};

export const HorizontalTape = ({
    displayRange, valueSpacing, distanceSpacing, graduationElementFunction, bugs, heading, yOffset = 0,
}) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing);

    let leftmostHeading = Math.round((heading - displayRange) / valueSpacing) * valueSpacing;
    if (leftmostHeading < heading - displayRange) {
        leftmostHeading += valueSpacing;
    }

    const graduationElements = [];
    const bugElements = [];

    for (let i = 0; i < numTicks; i++) {
        const elementHeading = leftmostHeading + i * valueSpacing;
        const offset = elementHeading * distanceSpacing / valueSpacing;
        graduationElements.push(graduationElementFunction(elementHeading, offset));
    }

    bugs.forEach((currentElement) => {
        const angleToZero = getSmallestAngle(heading, 0);
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
        <g transform={`translate(${-heading * distanceSpacing / valueSpacing} ${yOffset})`}>
            {graduationElements}
            {bugElements}
        </g>
    );
};

export const VerticalTape = ({
    displayRange, valueSpacing, distanceSpacing, graduationElementFunction, bugs, tapeValue, lowerLimit = -Infinity, upperLimit = Infinity,
}) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing);

    const clampedValue = Math.max(Math.min(tapeValue, upperLimit), lowerLimit);

    let lowestValue = Math.max(Math.round((clampedValue - displayRange) / valueSpacing) * valueSpacing, lowerLimit);
    if (lowestValue < tapeValue - displayRange) {
        lowestValue += valueSpacing;
    }

    const graduationElements = [];
    const bugElements = [];

    for (let i = 0; i < numTicks; i++) {
        const elementValue = lowestValue + i * valueSpacing;
        if (elementValue <= upperLimit) {
            const offset = -elementValue * distanceSpacing / valueSpacing;
            graduationElements.push(graduationElementFunction(elementValue, offset));
        }
    }

    bugs.forEach((currentElement) => {
        const value = currentElement[1];

        const offset = -value * distanceSpacing / valueSpacing;
        bugElements.push(currentElement[0](offset, value));
    });

    return (
        <g transform={`translate(0 ${clampedValue * distanceSpacing / valueSpacing})`}>
            {graduationElements}
            {bugElements}
        </g>
    );
};
