import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TakeoffFlapsConfig } from 'instruments/src/EFB/Performance/Calculators/TakeoffCalculator';
import { LandingFlapsConfig, LandingRunwayConditions } from '../../Performance/Calculators/LandingCalculator';
import { DistanceLabel } from '../../Performance/Widgets/RunwayVisualizationWidget';

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

interface TPerformanceTakeoff {
    icao: string;
    windDirection?: number;
    windMagnitude?: number;
    weight?: number;
    runwayHeading?: number;
    approachSpeed?: number;
    flaps: number;
    runwayCondition: LandingRunwayConditions;
    altitude?: number;
    slope?: number;
    temperature?: number;
    pressure?: number;
    runwayLength?: number;
    takeoffDist: number;
    runwayVisualizationLabels: DistanceLabel[];
    runwayNumber: number;
    displayedRunwayLength: number;
    antiIce: boolean;
    packs: boolean;
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
        icao: '',
        windDirection: undefined,
        windMagnitude: undefined,
        weight: undefined,
        runwayHeading: undefined,
        approachSpeed: undefined,
        flaps: TakeoffFlapsConfig.OnePlusF,
        runwayCondition: LandingRunwayConditions.Dry,
        altitude: undefined,
        slope: undefined,
        temperature: undefined,
        pressure: undefined,
        runwayLength: undefined,
        takeoffDist: 0,
        runwayVisualizationLabels: [],
        runwayNumber: 0,
        displayedRunwayLength: 0,
        packs: false,
        antiIce: false,
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
    },
});

export const { setLandingValues, clearLandingValues } = performanceSlice.actions;

export default performanceSlice.reducer;
