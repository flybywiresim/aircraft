// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { BuiltInChartProvider } from '@microsoft/msfs-sdk';

import { MsfsChartUI } from './MsfsChartUI';
import { ChartProvider, NavigationTab } from '../../../Store/features/navigationPage';

export const FaaChartPage = () => (
  <MsfsChartUI msfsProvider={BuiltInChartProvider.Faa} provider={ChartProvider.FAA} tab={NavigationTab.FAA} />
);
