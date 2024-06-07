// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { NavigraphAuthUIWrapper } from '../../../Apis/Navigraph/Components/Authentication';
import { NavigraphChartUI } from './NavigraphChartUI';

export const NavigraphPage = () => (
  <NavigraphAuthUIWrapper showLogin={false}>
    <NavigraphChartUI />
  </NavigraphAuthUIWrapper>
);
