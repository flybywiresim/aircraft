// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

const ExcessivePitchAttitudeArrows = React.memo(() => (
  <g id="ExcessivePitchArrows">
    <path
      d="M198 -258 h 46 v 12 h -16 l 28 28 l 28 -28 h -16 v -12 h 46 l -58 58z"
      strokeWidth={2}
      className="StrokeRed NoFill"
    />
    <path d="M216 -162 h 16 l 24 42 l 24 -42 h 16 l -40 70z" strokeWidth={2} className="StrokeRed NoFill" />
    <path d="M220 -66 h12 l24 42 l24 -42 h12 l-35.5 62z" strokeWidth={2} className="StrokeRed NoFill" />
    <path d="M220 578 h12 l24 -42 l24 42 h12 l-35.5 -62z" strokeWidth={2} className="StrokeRed NoFill" />
    <path d="M216 674 h 16 l 24 -42 l 24 42 h 16 l -40 -70z" strokeWidth={2} className="StrokeRed NoFill" />
    <path
      d="M198 770 h 46 v -12 h -16 l 28 -28 l 28 28 h -16 v 12 h 46 l -58 -58z"
      strokeWidth={2}
      className="StrokeRed NoFill"
    />
  </g>
));

type PitchScaleProps = {
  pitchDegPixels: number;
};

export const PitchScale: React.FC<PitchScaleProps> = React.memo(({ pitchDegPixels }) => {
  const markers: React.ReactElement[] = [];
  const center = 270;

  for (let d = -30; d <= 30; d += 10) {
    const y = center - d * pitchDegPixels;
    if (d === 0) {
      markers.push(<line x1={-256} x2={768} y1={y} y2={y} className="StrokeWhite" />);

      continue;
    }
    markers.push(
      <g>
        <text x={225} y={y} fontSize={28} className="TextWhite" textAnchor="end" alignmentBaseline="middle">
          {Math.abs(d).toFixed(0)}
        </text>
        <line x1={231.843} x2={280.157} y1={y} y2={y} className="StrokeWhite" />
      </g>,
    );
  }

  for (let d = -25; d <= 25; d += 10) {
    const y = center - d * pitchDegPixels;
    markers.push(<line x1={243.5} x2={268.5} y1={y} y2={y} className="StrokeWhite" />);
  }

  for (let d = -27.5; d <= 27.5; d += 5) {
    const y = center - d * pitchDegPixels;
    markers.push(<line x1={248.5} x2={263.5} y1={y} y2={y} className="StrokeWhite" />);
  }

  return (
    <g id="PitchScale">
      {markers}
      <ExcessivePitchAttitudeArrows />
    </g>
  );
});
