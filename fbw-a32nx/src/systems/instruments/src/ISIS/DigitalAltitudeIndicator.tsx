// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

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
    <text transform={`translate(0 ${offset})`} className={`FontTens Text${color}`} x="24" y="40">
      {text}
    </text>
  );
};

const HundredsDigit: ElementFunction = (value, offset, color) => {
  let text: string;
  if (value < 0) {
    text = (value + 1).toString();
  } else if (value >= 10) {
    text = (value % 10).toString();
  } else {
    text = value.toString();
  }

  return (
    <text transform={`translate(0 ${offset})`} className={`FontLargest Text${color}`} x="73.5" y="32">
      {text}
    </text>
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
    <text transform={`translate(0 ${offset})`} className={`FontLargest Text${color}`} x="48" y="32">
      {text}
    </text>
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
    <text transform={`translate(0 ${offset})`} className={`FontLargest Text${color}`} x="22" y="32">
      {text}
    </text>
  );
};

type DrumProps = {
  displayRange: number;
  valueSpacing: number;
  distanceSpacing: number;
  positionOffset: number;
  value: number;
  color: string;
  elementFunction: (value: number, offset: number, color: string) => React.ReactElement;
  showZero?: boolean;
  mirrorAtZero?: boolean;
};

const Drum: React.FC<DrumProps> = ({
  displayRange,
  valueSpacing,
  distanceSpacing,
  positionOffset,
  value,
  color,
  elementFunction,
  showZero = true,
  mirrorAtZero = false,
}) => {
  const numTicks = Math.max(Math.round((displayRange * 2) / valueSpacing), 3); // How many numbers to draw (at most)

  // Where to draw topmost number
  let highestPosition = Math.round((positionOffset + displayRange) / valueSpacing) * valueSpacing;
  if (highestPosition > positionOffset + displayRange) {
    highestPosition -= valueSpacing;
  }
  if (highestPosition === 0) {
    // negative values for positionOffset can make highestPosition too small
    highestPosition++;
  }

  // Value of topmost number
  let highestValue = Math.round((value + displayRange) / valueSpacing) * valueSpacing;
  if (highestValue > value + displayRange) {
    highestValue -= valueSpacing;
  }

  // if the overall altitude is negative. second term is true for value === -0
  const negativeAltitude = value < 0 || 1 / value === -Infinity;
  // at height = 0, we want 20 0 20 (top to bottom).
  // Everywhere else, we want 80 0 20 (for negative altitude) or 20 0 80 (for positive altitude)
  if (!mirrorAtZero) {
    if (negativeAltitude) {
      highestValue += value > 0 ? 100 : -100;
    } else {
      highestValue += value >= 0 ? 100 : -100;
    }
  }

  const graduationElements: React.ReactElement[] = [];

  for (let i = 0; i < numTicks; i++) {
    const elementPosition = highestPosition - i * valueSpacing;
    const offset = (-elementPosition * distanceSpacing) / valueSpacing;

    let elementVal = highestValue - i * valueSpacing;
    elementVal = mirrorAtZero ? elementVal : elementVal % 100;
    if (!showZero && elementVal === 0) {
      elementVal = NaN;
    }

    graduationElements.push(elementFunction(Math.abs(elementVal), offset, color));
  }

  return <g transform={`translate(0 ${(positionOffset * distanceSpacing) / valueSpacing})`}>{graduationElements}</g>;
};

type DigitalAltitudeIndicatorProps = {
  altitude: number;
  mda: number;
  bugs: Bug[];
};

export const DigitalAltitudeIndicator: React.FC<DigitalAltitudeIndicatorProps> = ({ altitude, mda, bugs }) => {
  const isNegative = altitude < 0;

  const color = mda !== 0 && altitude < mda ? 'Amber' : 'Green';

  const clampedAlt = Math.max(Math.min(altitude, 50000), -1500); // -1281
  const tensDigits = clampedAlt % 100; // -81

  const HundredsValue = Math.trunc((clampedAlt / 100) % 10); // -2
  let HundredsPosition = 0; // -0.05
  if (Math.abs(tensDigits) > 80) {
    HundredsPosition = isNegative ? tensDigits / 20 + 4 : tensDigits / 20 - 4;
  }

  const ThousandsValue = Math.trunc((clampedAlt / 1000) % 10); // -1
  let ThousandsPosition = 0; // 0
  if (Math.abs(HundredsValue) >= 9) {
    ThousandsPosition = HundredsPosition;
  }

  const TenThousandsValue = Math.trunc((clampedAlt / 10000) % 10); // 0
  let TenThousandsPosition = 0; // 0
  if (Math.abs(ThousandsValue) >= 9) {
    TenThousandsPosition = ThousandsPosition;
  }

  const showThousandsZero = TenThousandsValue !== 0;

  const isAltitudeInBugRange = bugs.some(({ value }) => Math.abs(value - altitude) < 100);

  return (
    <g>
      <path
        d="M 466.749 243.344 h -49.147 v 8.33 h -76.636 v 36.652 h 76.636 v 8.33 h 49.147"
        className="FillBackground"
      />
      <svg x={325} y={252} color={color} width="100" height="37" viewBox="0 0 100 37">
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
          mirrorAtZero={Math.abs(altitude) < 500}
        />
      </svg>
      <svg viewBox="0 0 100 53.312" x={400} y={243.344} width="100" height="53.312">
        <Drum
          displayRange={30}
          value={tensDigits}
          valueSpacing={20}
          distanceSpacing={40}
          positionOffset={tensDigits}
          color={color}
          elementFunction={TensDigits}
          mirrorAtZero={Math.abs(altitude) < 50}
        />
      </svg>
      <path
        d="M 466.749 243.344 h -49.147 v 8.33 h -76.636 v 36.652 h 76.636 v 8.33 h 49.147"
        className={`NoFill ${isAltitudeInBugRange ? 'StrokeCyanBig' : 'StrokeYellowBig'}`}
      />
      {isNegative && (
        <g id="NegativeAltitudeText" className="TextWhite FontLargest">
          <text x="343" y="243">
            N
          </text>
          <text x="343" y="284">
            E
          </text>
          <text x="343" y="325">
            G
          </text>
        </g>
      )}
    </g>
  );
};
