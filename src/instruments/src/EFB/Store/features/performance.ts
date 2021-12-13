import { createSlice } from "@reduxjs/toolkit";
import { LandingFlapsConfig, LandingRunwayConditions } from '../../Performance/Calculators/LandingCalculator';
import { DistanceLabel } from '../../Performance/Widgets/RunwayVisualizationWidget';
import { TypedAction } from "../store";

type TPerformanceLanding = {
    icao: string,
    windDirection: number,
    windMagnitude: number,
    weight: number,
    runwayHeading: number,
    approachSpeed: number,
    flaps: LandingFlapsConfig,
    runwayCondition: LandingRunwayConditions,
    reverseThrust: boolean,
    altitude: number,
    slope: number,
    temperature: number,
    overweightProcedure: boolean,
    pressure: number,
    runwayLength: number,
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

const initialState: TPerformanceState = {
    landing: {
        icao: '',
        windDirection: 0,
        windMagnitude: 0,
        weight: 0,
        runwayHeading: 0,
        approachSpeed: 0,
        flaps: LandingFlapsConfig.Conf3,
        runwayCondition: LandingRunwayConditions.Dry,
        reverseThrust: false,
        altitude: 0,
        slope: 0,
        temperature: 0,
        overweightProcedure: false,
        pressure: 0,
        runwayLength: 0,
        maxAutobrakeLandingDist: 0,
        mediumAutobrakeLandingDist: 0,
        lowAutobrakeLandingDist: 0,
        runwayVisualizationLabels: [],
        runwayNumber: 0,
        displayedRunwayLength: 0,
    },
};

const performanceSlice = createSlice({
    name: "performance",
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
    }
});

export const { setLandingValues, clearLandingValues } = performanceSlice.actions;

export default performanceSlice.reducer;
