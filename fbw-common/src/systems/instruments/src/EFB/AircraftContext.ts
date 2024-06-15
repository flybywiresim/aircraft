//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { createContext } from 'react';
import { LandingPerformanceCalculator } from '../../../shared/src/performance/landing';
import { TakeoffPerformanceCalculator } from '../../../shared/src/performance/takeoff';

interface PerformanceCalculators {
  takeoff: TakeoffPerformanceCalculator | null;
  landing: LandingPerformanceCalculator | null;
}
export const PerformanceCalculatorContext = createContext<PerformanceCalculators>({
  takeoff: null,
  landing: null,
});
