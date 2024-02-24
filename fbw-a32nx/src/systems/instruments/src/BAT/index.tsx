// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import './style.scss';
import React from 'react';
import { render } from '@instruments/common/index';
import { BatDisplay } from '@flybywiresim/bat';

const BatRoot = () => (
  <svg className="bat-svg" viewBox="0 0 200 100">
    <BatDisplay batteryNumber={1} x="184" y="45" />
    <BatDisplay batteryNumber={2} x="184" y="95" />
  </svg>
);

render(<BatRoot />);
