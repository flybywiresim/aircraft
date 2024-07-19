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
  windDirection?: number;
  windMagnitude?: number;
  weight?: number;
  runwayHeading?: number;
  approachSpeed?: number;
  flaps: LandingFlapsConfig;
  runwayCondition: LandingRunwayConditions;
  reverseThrust: boolean;
  altitude?: number;
  slope?: number;
  temperature?: number;
  overweightProcedure: boolean;
  pressure?: number;
  runwayLength?: number;
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
  runwayBearing?: number;
  runwayLength?: number;
  runwaySlope?: number;
  lineupAngle?: LineupAngle;
  elevation?: number;

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

  availableRunways: Runway[];
  selectedRunwayIndex: number;
}

interface TPerformanceState {
  landing: TPerformanceLanding;
  takeoff: TPerformanceTakeoff;
}

export const initialState: TPerformanceState = {
  landing: {
    icao: '',
    windDirection: undefined,
    windMagnitude: undefined,
    weight: undefined,
    runwayHeading: undefined,
    approachSpeed: undefined,
    flaps: LandingFlapsConfig.Full,
    runwayCondition: LandingRunwayConditions.Dry,
    reverseThrust: false,
    altitude: undefined,
    slope: undefined,
    temperature: undefined,
    overweightProcedure: false,
    pressure: undefined,
    runwayLength: undefined,
    maxAutobrakeLandingDist: 0,
    mediumAutobrakeLandingDist: 0,
    lowAutobrakeLandingDist: 0,
    runwayVisualizationLabels: [],
    runwayNumber: 0,
    displayedRunwayLength: 0,
    autoland: false,
  },
  takeoff: {
    availableRunways: [],
    antiIce: TakeoffAntiIceSetting.Off,
    packs: true,
    takeoffCg: TakeoffCoGPositions.Standard,
    forceToga: false,
    config: 1,
    lineupAngle: 90,
    runwayCondition: RunwayCondition.Dry,
    selectedRunwayIndex: -1,
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
