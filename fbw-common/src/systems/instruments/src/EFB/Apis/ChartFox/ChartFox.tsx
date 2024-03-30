// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useContext } from 'react';
import { ChartFoxData } from 'shared/src/chartfox/client';

export const ChartFoxContext = React.createContext<ChartFoxData>(undefined!);

export const useChartFox = () => useContext(ChartFoxContext);
