// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { PitchScale } from './PitchScale';
import { RollScale } from './RollScale';
import { RollIndex } from './RollIndex';
import { Att10sFlag } from './Att10sFlag';

export const ArtificialHorizon: React.FC = () => {
  const [pitch] = useSimVar('PLANE PITCH DEGREES', 'degrees', 200);
  const [roll] = useSimVar('PLANE BANK DEGREES', 'degrees', 200);

  const pitchDegPixels = 6.7;

  const pitchShift = -pitch * pitchDegPixels;

  return (
    <Att10sFlag>
      <g id="ArtificialHorizon">
        <g id="RollGroup" transform={`rotate(${roll.toFixed(2)} 256 256)`}>
          <g id="PitchGroup" transform={`translate(0 ${pitchShift.toFixed(2)})`}>
            <rect id="Sky" x={-256} y={-498} width={1024} height={768} className="sky" />
            <rect id="Earth" x={-256} y={270} width={1024} height={768} className="earth" />
            <PitchScale pitchDegPixels={pitchDegPixels} />
          </g>
          <RollIndex />
          <rect x={-256} y={388} width={1024} height={396} className="earth" />
        </g>
        <RollScale />
        <path
          id="Mask"
          className="mask"
          d="M 0 0 v 512 h 512 v -512 z M 122.1 123.5 c 43.9 -23.5 217.9 -25.5 271.4 0 v 266 c -43.9 23.5 -217.9 25.5 -271.4 0 z"
        />
      </g>
    </Att10sFlag>
  );
};
