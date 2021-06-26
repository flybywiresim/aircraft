import React from 'react';

const TensDigits = (value, offset, color) => {
    let text;
    if (value < 0) {
        text = (value + 100).toString();
    } else if (value >= 100) {
        text = (value - 100).toString().padEnd(2, '0');
    } else {
        text = value.toString().padEnd(2, '0');
    }

    return (
        <text transform={`translate(0 ${offset})`} className={`FontLarge ${color}`} x="0" y="52">{text}</text>
    );
};

const HundredsDigit = (value, offset, color) => {
    let text;
    if (value < 0) {
        text = (value + 1).toString();
    } else if (value >= 10) {
        text = (value - 10).toString();
    } else {
        text = value.toString();
    }

    return (
        <text transform={`translate(0 ${offset})`} className={`FontLargest ${color}`} x="60" y="48">{text}</text>
    );
};
const ThousandsDigit = (value, offset, color) => {
    let text;
    if (!Number.isNaN(value)) {
        text = (value % 10).toString();
    } else {
        text = '';
    }
    return (
        <text transform={`translate(0 ${offset})`} className={`FontLargest ${color}`} x="30" y="48">{text}</text>
    );
};
const TenThousandsDigit = (value, offset, color) => {
    let text;
    if (!Number.isNaN(value)) {
        text = value.toString();
    } else {
        text = '';
    }
    return (
        <text transform={`translate(0 ${offset})`} className={`FontLargest ${color}`} x="0" y="48">{text}</text>
    );
};

type DrumProps = {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    positionOffset: number;
    value: number;
    showZero?: boolean;
    elementFunction: (value: number, offset: number, color: string) => JSX.Element;
}

const Drum: React.FC<DrumProps> = ({ displayRange, valueSpacing, distanceSpacing, positionOffset, value, elementFunction, showZero = true }) => {
    const numTicks = Math.round(displayRange * 2 / valueSpacing); // How many numbers to draw (at most)

    // Where to draw topmost number
    let highestPosition = Math.round((positionOffset + displayRange) / valueSpacing) * valueSpacing;
    if (highestPosition > positionOffset + displayRange) {
        highestPosition -= valueSpacing;
    }

    // Value of topmost number
    let highestValue = Math.round((value + displayRange) / valueSpacing) * valueSpacing;
    if (highestValue > value + displayRange) {
        highestValue -= valueSpacing;
    }

    const graduationElements: JSX.Element[] = [];

    for (let i = 0; i < numTicks; i++) {
        const elementPosition = highestPosition - i * valueSpacing;
        const offset = -elementPosition * distanceSpacing / valueSpacing;

        let elementVal = highestValue - i * valueSpacing;
        if (!showZero && elementVal === 0) {
            elementVal = NaN;
        }

        graduationElements.push(elementFunction(elementVal, offset, 'Green'));
    }

    return (
        <g transform={`translate(0 ${positionOffset * distanceSpacing / valueSpacing})`}>
            {graduationElements}
        </g>
    );
};

type DigitalAltitudeIndicatorProps = {
    altitude: number;
    mda: number
}

export const DigitalAltitudeIndicator: React.FC<DigitalAltitudeIndicatorProps> = ({ altitude, mda }) => {
    const isNegative = altitude < 0;

    const color = (mda !== 0 && altitude < mda) ? 'Amber' : 'Green';

    const absAlt = Math.abs(Math.max(Math.min(altitude, 50000), -1500)); // 1990
    const tensDigits = absAlt % 100; // 90

    const HundredsValue = Math.floor((absAlt / 100) % 10); // 9
    let HundredsPosition = 0; // 0.5
    if (tensDigits > 80) {
        HundredsPosition = tensDigits / 20 - 4;
    }

    const ThousandsValue = Math.floor((absAlt / 1000) % 10); // 1
    let ThousandsPosition = 0; // 0.5
    if (HundredsValue >= 9) {
        ThousandsPosition = HundredsPosition;
    }

    const TenThousandsValue = Math.floor((absAlt / 10000) % 10); // 0
    let TenThousandsPosition = 0; // 0
    if (ThousandsValue >= 9) {
        TenThousandsPosition = ThousandsPosition;
    }

    const showThousandsZero = TenThousandsValue !== 0;

    return (
        <g>
            <path
                d="M512,224 L440,224 L440,232 L340,232 L340,288 L440,288 L440,296 L512,296"
                fill="black"
                stroke="yellow"
                strokeWidth={3}
            />
            { /* alt tape goes here */ }
            { /* if alt < 0 show NEG banner */ }
            { /* <text x={434} y={257} fontSize={48} textAnchor="end" alignmentBaseline="central" fill="lime">{Math.round(alt / 100).toFixed(0).padStart(3)}</text> */ }
            <svg x={340} y={234} color={color} width="100" height="52" viewBox="0 0 100 52">
                <Drum
                    displayRange={1}
                    value={TenThousandsValue}
                    showZero={false}
                    valueSpacing={1}
                    distanceSpacing={52}
                    positionOffset={TenThousandsPosition}
                    elementFunction={TenThousandsDigit}
                />
                <Drum
                    displayRange={1}
                    value={ThousandsValue}
                    showZero={showThousandsZero}
                    valueSpacing={1}
                    distanceSpacing={52}
                    positionOffset={ThousandsPosition}
                    elementFunction={ThousandsDigit}
                />
                <Drum
                    displayRange={1}
                    value={HundredsValue}
                    valueSpacing={1}
                    distanceSpacing={52}
                    positionOffset={HundredsPosition}
                    elementFunction={HundredsDigit}
                />
            </svg>
            <svg viewBox="0 0 100 70" x={440} y={226} width="100" height="70">
                <Drum
                    displayRange={40}
                    value={tensDigits}
                    valueSpacing={20}
                    distanceSpacing={48}
                    positionOffset={tensDigits}
                    elementFunction={TensDigits}
                />
            </svg>
        </g>
    );
};
