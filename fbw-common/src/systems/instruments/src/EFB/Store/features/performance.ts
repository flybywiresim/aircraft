// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DistanceLabel } from '../../Performance/Widgets/RunwayVisualizationWidget';
import { Runway } from '../../Performance/Data/Runways';
import { LandingFlapsConfig, LandingRunwayConditions } from '../../../../../shared/src/performance/landing';
import {
  LineupAngle,
  RunwayCondition,
  TakeoffAntiIceSetting,
  TakeoffPerformanceResult,
} from '../../../../../shared/src/performance/takeoff';

interface TPerformanceLanding {
  icao: string;
  availableRunways: Runway[];
  selectedRunwayIndex: number;
  runwayHeading?: number;
  runwayLength?: number;
  elevation?: number;
  slope?: number;

  runwayCondition: LandingRunwayConditions;
  windDirection?: number;
  windMagnitude?: number;
  windEntry?: string;
  temperature?: number;
  pressure?: number;

  weight?: number;
  overweightProcedure: boolean;
  approachSpeed?: number;
  flaps: LandingFlapsConfig;
  reverseThrust: boolean;

  maxAutobrakeLandingDist: number;
  mediumAutobrakeLandingDist: number;
  lowAutobrakeLandingDist: number;
  runwayVisualizationLabels: DistanceLabel[];
  runwayNumber: number;
  displayedRunwayLength: number;
  autoland: boolean;
}

export enum TakeoffCoGPositions {
  Standard,
  Forward,
}

interface TPerformanceTakeoff {
  icao?: string;
  availableRunways: Runway[];
  selectedRunwayIndex: number;
  runwayBearing?: number;
  runwayLength?: number;
  elevation?: number;
  runwaySlope?: number;
  lineupAngle?: LineupAngle;

  runwayCondition: RunwayCondition;
  windDirection?: number;
  windMagnitude?: number;
  windEntry?: string;
  oat?: number;
  qnh?: number;

  weight?: number;
  takeoffCg?: TakeoffCoGPositions;
  config?: number;
  antiIce?: TakeoffAntiIceSetting;
  packs?: boolean;
  forceToga?: boolean;
  cg?: number;

  result?: TakeoffPerformanceResult;
}

interface TPerformanceState {
  landing: TPerformanceLanding;
  takeoff: TPerformanceTakeoff;
}

export const initialState: TPerformanceState = {
  landing: {
    icao: '',
    availableRunways: [],
    selectedRunwayIndex: -1,
    windDirection: undefined,
    windMagnitude: undefined,
    windEntry: undefined,
    weight: undefined,
    runwayHeading: undefined,
    approachSpeed: undefined,
    flaps: LandingFlapsConfig.Full,
    runwayCondition: LandingRunwayConditions.Dry,
    reverseThrust: false,
    elevation: undefined,
    slope: undefined,
    temperature: undefined,
    pressure: undefined,
    overweightProcedure: false,
    runwayLength: undefined,
    autoland: false,
    runwayNumber: 0,
    displayedRunwayLength: 0,
    maxAutobrakeLandingDist: 0,
    mediumAutobrakeLandingDist: 0,
    lowAutobrakeLandingDist: 0,
    runwayVisualizationLabels: [],
  },
  takeoff: {
    availableRunways: [],
    selectedRunwayIndex: -1,
    antiIce: TakeoffAntiIceSetting.Off,
    packs: true,
    takeoffCg: TakeoffCoGPositions.Standard,
    forceToga: false,
    config: 1,
    lineupAngle: 90,
    runwayCondition: RunwayCondition.Dry,
  },
};

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    setLandingValues: (state, action: PayloadAction<Partial<TPerformanceLanding>>) => {
      Object.keys(action.payload).forEach((key) => {
        state.landing[key] = action.payload[key];
      });
    },
    clearLandingValues: (state) => {
      state.landing = initialState.landing;
    },
    setTakeoffValues: (state, action: PayloadAction<Partial<TPerformanceTakeoff>>) => {
      Object.keys(action.payload).forEach((key) => {
        state.takeoff[key] = action.payload[key];
      });
    },
    clearTakeoffValues: (state) => {
      state.takeoff = initialState.takeoff;
    },
  },
});

export const { setLandingValues, clearLandingValues, setTakeoffValues, clearTakeoffValues } = performanceSlice.actions;

export default performanceSlice.reducer;
