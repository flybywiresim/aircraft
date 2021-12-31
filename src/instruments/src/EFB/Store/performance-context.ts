import React, { Context, createContext } from 'react';
import { produce } from 'immer';
import { LandingFlapsConfig, LandingRunwayConditions } from '../Performance/Calculators/LandingCalculator';
import { DistanceLabel } from '../Performance/Widgets/RunwayVisualizationWidget';

export const performanceInitialState: TPerformanceState = {
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

export enum EPerformanceActions {
    SET_TOP_OF_DESCENT,
    SET_LANDING
}

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
    landing: TPerformanceLanding
}

export type TPerformanceContext = {
    performanceState: TPerformanceState;
    performanceDispatch: React.Dispatch<any>;
}

const Reducer = (state, action) => {
    switch (action.type) {
    case EPerformanceActions.SET_LANDING: {
        return produce(state, (draft) => {
            Object.keys(action.payload).forEach((key) => {
                draft.landing[key] = action.payload[key];
            });
        });
    }

    default: {
        throw new Error('No valid action provided');
    }
    }
};

// Curried
export const PerformanceReducer = produce(Reducer);

export const PerformanceContext:Context<TPerformanceContext> = createContext<TPerformanceContext>({ performanceState: performanceInitialState, performanceDispatch: () => {} });
