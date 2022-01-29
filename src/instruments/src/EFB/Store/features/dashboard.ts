import { createSlice } from '@reduxjs/toolkit';
import { TypedAction } from '../store';

interface DashboardState {
    departureIcao: string;
    destinationIcao: string;
}

const initialState: DashboardState = { departureIcao: '', destinationIcao: '' };

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setDepartureIcao: (state, action: TypedAction<string>) => {
            state.departureIcao = action.payload;
        },
        setDestinationIcao: (state, action: TypedAction<string>) => {
            state.destinationIcao = action.payload;
        },
    },
});

export const { setDepartureIcao, setDestinationIcao } = dashboardSlice.actions;
export default dashboardSlice.reducer;
