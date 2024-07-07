// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import './style.scss';
import React from 'react';
import { render } from '../Common';
import { RootRadioPanel } from './Components/BaseRadioPanels';

render(
  <div className="rmp-wrapper">
    <RootRadioPanel side="L" />
    <RootRadioPanel side="R" />
  </div>,
);
