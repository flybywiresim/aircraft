//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { createContext } from 'react';
import { LandingPerformanceCalculator, TakeoffPerformanceCalculator } from 'shared/src';

interface PerformanceCalculators {
  takeoff: TakeoffPerformanceCalculator | null;
  landing: LandingPerformanceCalculator | null;
}
export const PerformanceCalculatorContext = createContext<PerformanceCalculators>({
  takeoff: null,
  landing: null,
});
