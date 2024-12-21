// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { MathUtils, useInteractionSimVar, useSimVar } from '@flybywiresim/fbw-sdk';

type DeviationIndicatorProps = {
  deviation: number;
  available: boolean;
};

const DeviationIndicator: React.FC<DeviationIndicatorProps> = ({ deviation, available }) => {
  const dots = deviation / 0.4;

  const belowMinimum = dots < -2;
  const aboveMaximum = dots > 2;

  return (
    <>
      <rect x={0} y={0} width={178.26} height={18.326} fill="black" />
      <circle className="LSCircle NoFill" cx={14.161} cy={9.1625} r={2.9155} />
      <circle className="LSCircle NoFill" cx={51.646} cy={9.1625} r={2.9155} />
      <circle className="LSCircle NoFill" cx={126.616} cy={9.1625} r={2.9155} />
      <circle className="LSCircle NoFill" cx={164.101} cy={9.1625} r={2.9155} />
      {available &&
        ((!(aboveMaximum || belowMinimum) && ( // assumes 0.4 deg of deviation per dot and 37.485px distance between dots
          <g transform={`translate(${(dots * 37.485).toFixed(5)} 0)`}>
            <path
              className="FillMagenta"
              d="M 75.6 9.1 v 0.8 l 8.3443 6.7 h 10.0132 l 8.3443 -6.7 v -1.6 l -8.3443 -6.7 h -10.0132 l -8.3443 6.7 z"
            />
          </g>
        )) ||
          (belowMinimum && (
            <path className="FillMagenta" d="M 0.75 9.1 v 0.8 l 8.3443 6.7 h 5.0066 v -15 h -5.0066 l -8.3443 6.7 z" />
          )) ||
          (aboveMaximum && (
            <path className="FillMagenta" d="M 177.5 9.1 v 0.8 l -8.3443 6.7 h -5.0066 v -15 h 5.0066 l 8.3443 6.7 z" />
          )))}
      <line x1={89.131} x2={89.131} y1={2.499} y2={15.827} className="StrokeYellow" />
    </>
  );
};
export const LandingSystem: React.FC = () => {
  const [gsDeviation] = useSimVar('L:A32NX_RADIO_RECEIVER_GS_DEVIATION', 'number', 50);
  const [gsAvailable] = useSimVar('L:A32NX_RADIO_RECEIVER_GS_IS_VALID', 'number', 50);
  const [lsDeviation] = useSimVar('L:A32NX_RADIO_RECEIVER_LOC_DEVIATION', 'number', 50);
  const [lsAvailable] = useSimVar('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number', 50);

  const [lsActive] = useInteractionSimVar('L:A32NX_ISIS_LS_ACTIVE', 'Boolean', 'H:A32NX_ISIS_LS_PRESSED');

  return (
    lsActive && (
      <g id="LandingSystem">
        <g transform="translate(166.869 376.62)">
          <DeviationIndicator
            deviation={MathUtils.correctMsfsLocaliserError(lsDeviation) / 2}
            available={lsAvailable}
          />
        </g>
        <g transform="translate(340.133 180.869) rotate(90 0 0)">
          <DeviationIndicator deviation={gsDeviation} available={gsAvailable} />
        </g>
      </g>
    )
  );
};
