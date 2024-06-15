//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { createContext } from 'react';
import { LandingPerformanceCalculator } from 'shared/src';

interface PerformanceCalculators {
  landing: LandingPerformanceCalculator | null;
}
export const PerformanceCalculatorContext = createContext<PerformanceCalculators>({
  landing: null,
});
