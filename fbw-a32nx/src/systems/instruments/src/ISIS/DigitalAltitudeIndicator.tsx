import React from 'react';
import { Bug } from './Bug';

type ElementFunction = (value: number, offset: number, color: string) => React.ReactElement;

const TensDigits: ElementFunction = (value, offset, color) => {
    let text: string;
    if (value < 0) {
        text = (value + 100).toString();
    } else if (value >= 100) {
        text = (value - 100).toString().padEnd(2, '0');
    } else {
        text = value.toString().padEnd(2, '0');
    }

    return (
        <text transform={`translate(0 ${offset})`} className={`FontLarge Text${color}`} x="18" y="52">{text}</text>
    );
};

const HundredsDigit: ElementFunction = (value, offset, color) => {
    let text: string;
    if (value < 0) {
        text = (value + 1).toString();
    } else if (value >= 10) {
        text = (value - 10).toString();
    } else {
        text = value.toString();
    }

    return (
        <text transform={`translate(0 ${offset})`} className={`FontLargest Text${color}`} x="62" y="32">{text}</text>
    );
};

const ThousandsDigit: ElementFunction = (value, offset, color) => {
    let text: string;
    if (!Number.isNaN(value)) {
        text = (value % 10).toString();
    } else {
        text = '';
    }

    return (
        <text transform={`translate(0 ${offset})`} className={`FontLargest Text${color}`} x="40" y="32">{text}</text>
    );
};

const TenThousandsDigit: ElementFunction = (value, offset, color) => {
    let text: string;
    if (!Number.isNaN(value)) {
        text = value.toString();
    } else {
        text = '';
    }

    return (
        <text transform={`translate(0 ${offset})`} className={`FontLargest Text${color}`} x="18" y="32">{text}</text>
    );
};

type DrumProps = {
    displayRange: number,
    valueSpacing: number,
    distanceSpacing: number,
    positionOffset: number,
    value: number,
    color: string,
    elementFunction: (value: number, offset: number, color: string) => React.ReactElement,
    showZero?: boolean
}

const Drum: React.FC<DrumProps> = ({ displayRange, valueSpacing, distanceSpacing, positionOffset, value, color, elementFunction, showZero = true }) => {
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

    const graduationElements: React.ReactElement[] = [];

    for (let i = 0; i < numTicks; i++) {
        const elementPosition = highestPosition - i * valueSpacing;
        const offset = -elementPosition * distanceSpacing / valueSpacing;

        let elementVal = highestValue - i * valueSpacing;
        if (!showZero && elementVal === 0) {
            elementVal = NaN;
        }

        graduationElements.push(elementFunction(elementVal, offset, color));
    }

    return (
        <g transform={`translate(0 ${positionOffset * distanceSpacing / valueSpacing})`}>
            {graduationElements}
        </g>
    );
};

type DigitalAltitudeIndicatorProps = {
    altitude: number,
    mda: number,
    bugs: Bug[]
}

export const DigitalAltitudeIndicator: React.FC<DigitalAltitudeIndicatorProps> = ({ altitude, mda, bugs }) => {
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

    const isAltitudeInBugRange = bugs.some(({ value }) => Math.abs(value - altitude) < 100);

    return (
        <g>
            <path d="M 512 238 h -84 v 8 h -84 v 42 h 84 v 8 h 84" className="FillBackground" />
            <svg x={340} y={248} color={color} width="100" height="40" viewBox="0 0 100 40">
                <Drum
                    displayRange={1}
                    value={TenThousandsValue}
                    showZero={false}
                    valueSpacing={1}
                    distanceSpacing={42}
                    positionOffset={TenThousandsPosition}
                    color={color}
                    elementFunction={TenThousandsDigit}
                />
                <Drum
                    displayRange={1}
                    value={ThousandsValue}
                    showZero={showThousandsZero}
                    valueSpacing={1}
                    distanceSpacing={42}
                    positionOffset={ThousandsPosition}
                    color={color}
                    elementFunction={ThousandsDigit}
                />
                <Drum
                    displayRange={1}
                    value={HundredsValue}
                    valueSpacing={1}
                    distanceSpacing={42}
                    positionOffset={HundredsPosition}
                    color={color}
                    elementFunction={HundredsDigit}
                />
            </svg>
            <svg viewBox="0 0 100 58" x={422} y={238} width="100" height="58">
                <Drum
                    displayRange={40}
                    value={tensDigits}
                    valueSpacing={20}
                    distanceSpacing={36}
                    positionOffset={tensDigits}
                    color={color}
                    elementFunction={TensDigits}
                />
            </svg>
            <path
                d="M 512 238 h -84 v 8 h -84 v 42 h 84 v 8 h 84"
                className={`NoFill ${isAltitudeInBugRange ? 'StrokeCyan' : 'StrokeYellow'}`}
            />
            {isNegative && (
                <g id="NegativeAltitudeText" className="TextWhite FontLarge">
                    <text x="350" y="240">N</text>
                    <text x="350" y="280">E</text>
                    <text x="350" y="320">G</text>
                </g>
            )}
        </g>
    );
};
