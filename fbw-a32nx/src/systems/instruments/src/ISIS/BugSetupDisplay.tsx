// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Bug } from './Bug';

type BugSetupDisplayProps = {
  selectedIndex: number;
  bugs: Bug[];
};

export const BugSetupDisplay: React.FC<BugSetupDisplayProps> = ({ selectedIndex, bugs }) => (
  <g id="BugDisplay" className="TextWhite NoFill FontLarge">
    <text x={60} y={60} className="TextCyan">
      EXIT↑
    </text>
    <text x={256} y={60} textAnchor="middle" className="TextWhite">
      BUGS
    </text>
    <text x={150} y={100} textAnchor="middle" className="TextWhite">
      SPD
    </text>
    <text x={335} y={100} textAnchor="middle" className="TextWhite">
      ALT
    </text>
    <text fontSize={16} x={196} y={126} className="TextWhite">
      (+)
    </text>
    <text fontSize={16} x={110} y={180} className="TextWhite">
      (-)
    </text>
    <path fill="none" stroke="white" d="M150 136 v225 h195 v-225z" />
    <g>
      {!bugs[5].isActive && (
        <text x={35} y={150} className="TextWhite">
          OFF
        </text>
      )}
      <BugBox x={150} y={150} value={bugs[5].value} isSelected={selectedIndex === 5} type={BugType.Speed} />
    </g>
    <g>
      {!bugs[4].isActive && (
        <text x={35} y={225} className="TextWhite">
          OFF
        </text>
      )}
      <BugBox x={150} y={225} value={bugs[4].value} isSelected={selectedIndex === 4} type={BugType.Speed} />
    </g>
    <g>
      {!bugs[3].isActive && (
        <text x={35} y={300} className="TextWhite">
          OFF
        </text>
      )}
      <BugBox x={150} y={300} value={bugs[3].value} isSelected={selectedIndex === 3} type={BugType.Speed} />
    </g>
    <g>
      {!bugs[2].isActive && (
        <text x={35} y={375} className="TextWhite">
          OFF
        </text>
      )}
      <BugBox x={150} y={375} value={bugs[2].value} isSelected={selectedIndex === 2} type={BugType.Speed} />
    </g>
    <g>
      {!bugs[0].isActive && (
        <text x={409} y={225} className="TextWhite">
          OFF
        </text>
      )}
      <BugBox x={344} y={225} value={bugs[0].value} isSelected={selectedIndex === 0} type={BugType.Altitude} />
    </g>
    <g>
      {!bugs[1].isActive && (
        <text x={409} y={300} className="TextWhite">
          OFF
        </text>
      )}
      <BugBox x={344} y={300} value={bugs[1].value} isSelected={selectedIndex === 1} type={BugType.Altitude} />
    </g>
    <text x={170} y={450} className="TextCyan">
      SET/SELECT→
    </text>
  </g>
);

enum BugType {
  Speed,
  Altitude,
}

type BugBoxProps = {
  x: number;
  y: number;
  value: number;
  type: BugType;
  isSelected?: boolean;
};

export const BugBox: React.FC<BugBoxProps> = ({ x, y, value, type, isSelected = false }) => {
  let width = 0;
  let numDigits = 0;
  if (type === BugType.Speed) {
    width = 75;
    numDigits = 3;
  } else if (type === BugType.Altitude) {
    width = 108;
    numDigits = 5;
  }

  return (
    <g id="BugBox">
      <rect
        className={`StrokeWhite FillBackground${isSelected ? ' BlinkInfinite' : ''}`}
        x={x - width / 2}
        y={y - 34}
        width={width}
        height={40}
      />
      <text x={x} y={y} textAnchor="middle" className="TextWhite">
        {value.toString().padStart(numDigits, '0')}
      </text>
    </g>
  );
};
