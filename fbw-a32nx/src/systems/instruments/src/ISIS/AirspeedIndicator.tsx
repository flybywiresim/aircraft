// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Bug } from './Bug';
import { VerticalTape } from './VerticalTape';

type TickProps = { offset: number; airspeed: number };

const Tick = React.memo<TickProps>(({ offset, airspeed }) => {
  if (airspeed > 250 && airspeed % 10 === 5) {
    return null;
  }

  const tickLength = airspeed % 20 === 10 ? 13.5 : 5;

  return (
    <g transform={`translate(0 ${offset})`}>
      {airspeed % 20 === 0 && (
        <text x={104} textAnchor="end" y={158 + 12} className="TextWhite FontMedium">
          {airspeed}
        </text>
      )}
      <path className="StrokeWhiteMed" d={`M${108 - tickLength},158 h${tickLength}`} />
    </g>
  );
});

const SpeedtapeArrow = React.memo(() => (
  <g id="SpeedtapeArrow">
    <rect className="FillBackground" x={121.887} y={250.841} width={23.324} height={35.4025} />
    <path className="FillYellow" d="M 143.545 285.827 v -31.654 l -19.992 15.827 z" />
  </g>
));

type BugProps = { offset: number };

const BugElement = React.memo<BugProps>(({ offset }) => (
  <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
    <path strokeWidth={7} d="M86,158 h22" />
  </g>
));

type AirspeedIndicatorProps = {
  indicatedAirspeed: number;
  bugs: Bug[];
};

export const AirspeedIndicator: React.FC<AirspeedIndicatorProps> = ({ indicatedAirspeed, bugs }) => (
  <g id="AirspeedIndicator">
    <svg x={12} y={112} width={108} height={296} viewBox="0 0 108 296">
      <VerticalTape
        displayRange={55}
        valueSpacing={5}
        distanceSpacing={16.5}
        graduationElementFunction={(elementValue: number, offset: number) => (
          <Tick offset={offset} airspeed={elementValue} />
        )}
        bugs={bugs}
        bugElementFunction={(bug: Bug, offset: number) => <BugElement offset={offset} />}
        tapeValue={indicatedAirspeed}
        lowerLimit={30}
        upperLimit={660}
      />
    </svg>
    <SpeedtapeArrow />
  </g>
);
