// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import React from 'react';
import { Bug } from './Bug';
import { DigitalAltitudeIndicator } from './DigitalAltitudeIndicator';
import { VerticalTape } from './VerticalTape';

type TickProps = { offset: number; altitude: number };

const Tick = React.memo<TickProps>(({ altitude, offset }) => {
  const shouldShowText = altitude % 500 === 0;
  const tickLength = shouldShowText ? 5 : 19;
  const stroke = shouldShowText ? 'StrokeWhiteBig' : 'StrokeWhite';
  const lineStart = shouldShowText ? 0.5 : 0;

  return (
    <g transform={`translate(0 ${offset})`}>
      <path className={stroke} d={`M${lineStart},${158} h${tickLength}`} />
      {shouldShowText && (
        <text x={7} y={158 + 12} className="TextWhite FontMedium">
          {Math.abs(altitude).toString().padStart(5, '0').slice(0, 3)}
        </text>
      )}
    </g>
  );
});

type BugProps = { bug: Bug; offset: number };

const BugElement = React.memo<BugProps>(({ bug, offset }) => {
  if (bug.value % 500 === 0) {
    return (
      <g className="StrokeCyan NoFill" transform={`translate(0 ${offset})`}>
        <path d="M3,151 v-9 h65 v32 h-65 v-9" />
        <polygon className="FillCyan" stroke="none" points="0, 150 10, 142 0, 142" />
        <polygon className="FillCyan" stroke="none" points="0, 165 10, 173 0, 173" />
      </g>
    );
  }

  return (
    <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
      <path strokeWidth={5} d="M0,158 h25" />
    </g>
  );
});

type AltitudeIndicatorProps = {
  altitude: number;
  mda: number;
  bugs: Bug[];
};

export const AltitudeIndicator: React.FC<AltitudeIndicatorProps> = ({ altitude, mda, bugs }) => {
  const [metricAltitude] = usePersistentNumberProperty('ISIS_METRIC_ALTITUDE', 0);

  return (
    <g id="AltitudeIndicator">
      <svg x={395} y={112} width={108} height={296} viewBox="0 0 108 296">
        <VerticalTape
          displayRange={1000}
          valueSpacing={100}
          distanceSpacing={21.5}
          graduationElementFunction={(altitude: number, offset: number) => <Tick altitude={altitude} offset={offset} />}
          bugs={bugs}
          bugElementFunction={(bug: Bug, offset: number) => <BugElement bug={bug} offset={offset} />}
          tapeValue={altitude}
          lowerLimit={-2000}
          upperLimit={50000}
        />
      </svg>
      <DigitalAltitudeIndicator altitude={altitude} mda={mda} bugs={bugs} />
      {!!metricAltitude && <MetricAltitudeIndicator altitude={altitude} />}
    </g>
  );
};

type MetricAltitudeIndicatorProps = {
  altitude: number;
};

export const MetricAltitudeIndicator: React.FC<MetricAltitudeIndicatorProps> = ({ altitude }) => {
  const metricAltitude = Math.abs(Math.round(altitude * 0.3048));
  const isNegative = altitude < 0;
  return (
    <g id="MetricAltitudeIndicator" fontSize={30}>
      {isNegative && (
        <text className="TextWhite" x={238} y={94}>
          NEG
        </text>
      )}
      <rect className="StrokeYellow NoFill" strokeWidth={2} x={235} y={65} width={165} height={32} />
      <text className="TextGreen" x={373} y={94} textAnchor="end">
        {metricAltitude}
      </text>
      <text className="TextCyan" x={377} y={94}>
        M
      </text>
    </g>
  );
};
