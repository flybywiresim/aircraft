import { createSlice } from '@reduxjs/toolkit';
import { LandingFlapsConfig, LandingRunwayConditions } from '../../Performance/Calculators/LandingCalculator';
import { DistanceLabel } from '../../Performance/Widgets/RunwayVisualizationWidget';
import { TypedAction } from '../store';

type TPerformanceLanding = {
    icao: string,
    windDirection?: number,
    windMagnitude?: number,
    weight?: number,
    runwayHeading?: number,
    approachSpeed?: number,
    flaps: LandingFlapsConfig,
    runwayCondition: LandingRunwayConditions,
    reverseThrust: boolean,
    altitude?: number,
    slope?: number,
    temperature?: number,
    overweightProcedure: boolean,
    pressure?: number,
    runwayLength?: number,
    maxAutobrakeLandingDist: number,
    mediumAutobrakeLandingDist: number,
    lowAutobrakeLandingDist: number,
    runwayVisualizationLabels: Array<DistanceLabel>,
    runwayNumber: number,
    displayedRunwayLength: number,
}

type TPerformanceState = {
    landing: TPerformanceLanding,
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
    },
};

const performanceSlice = createSlice({
    name: 'performance',
    initialState,
    reducers: {
        setLandingValues: (state, action: TypedAction<Partial<TPerformanceLanding>>) => {
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
