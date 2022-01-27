import { createSlice } from '@reduxjs/toolkit';
import { TypedAction } from '../store';

interface FlightPlanProgressState {
    flightPlanProgress: number;
}

const initialState: FlightPlanProgressState = { flightPlanProgress: 0 };

export const flightProgressSlice = createSlice({
    name: 'flightPlanProgress',
    initialState,
    reducers: {
        setFlightPlanProgress: (state, action: TypedAction<number>) => {
            state.flightPlanProgress = action.payload;
        },
    },
});

export const { setFlightPlanProgress } = flightProgressSlice.actions;
export default flightProgressSlice.reducer;
