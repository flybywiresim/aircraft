// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import './style.scss';
import React from 'react';
import { useArinc429Var, useSimVar } from '@flybywiresim/fbw-sdk';
import { render } from '../Common';

const RTPIDisplay = () => {
  const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Bool', 400);
  const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

  const facSourceForTrim = fac2DiscreteWord2.bitValueOr(13, false) ? 2 : 1;
  const trimPos = useArinc429Var(`L:A32NX_FAC_${facSourceForTrim}_RUDDER_TRIM_POS`);

  if (!trimPos.isFailureWarning() || ltsTest === 0) {
    const directionText = trimPos.value >= 0 ? 'L' : 'R';

    return (
      <>
        <text x="0" y="110" className="direction">
          {ltsTest === 0 ? 'T' : directionText}
        </text>
        <text x="330" y="110" className="value">
          {ltsTest === 0 ? '88.8' : `${Math.abs(trimPos.value).toFixed(1)}`}
        </text>
      </>
    );
  }
  return null;
};

const RTPIRoot = () => {
  const [dc2IsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Boolean', 250);

  if (!dc2IsPowered) return null;

  return (
    <svg className="rtpi-svg" viewBox="0 0 338 128">
      <RTPIDisplay />
    </svg>
  );
};

render(<RTPIRoot />);
