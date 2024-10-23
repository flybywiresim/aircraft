// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { BatDisplay } from '@flybywiresim/bat';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { render } from '@instruments/common/index';
import React from 'react';
import './style.scss';

const BatRoot = () => {
  const [selectedBattery, setSelectedBattery] = useSimVar('L:A380X_OVHD_ELEC_BAT_SELECTOR_KNOB', 'Number', 100);

  // set to OFF if the value is out of range
  if (selectedBattery < 0 || selectedBattery > 4) {
    setSelectedBattery(2);
  }

  // mapping of knob (lvar) values to battery numbers to allow easy lvar and model values
  const batteryMap = [4, 3, 0, 1, 2]; // ESS, APU, OFF, BAT1, BAT2

  return (
    <svg className={`bat-svg${selectedBattery == 2 ? ' off' : ''}`} viewBox="0 0 200 100">
      <BatDisplay batteryNumber={batteryMap[selectedBattery]} blankWhenOff={true} x="196" y="48" />
    </svg>
  );
};

render(<BatRoot />);
