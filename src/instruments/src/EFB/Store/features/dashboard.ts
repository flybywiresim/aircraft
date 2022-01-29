import { createSlice } from '@reduxjs/toolkit';
import { TypedAction } from '../store';

/**
 * DashboardState holds any preservable states on the Dashboard Widgets and its
 * children widgets (mainly WeatherWidget).
 * This makes sure that switching EFB pages retains user selections or input.
 */
interface DashboardState {
    userDepartureIcao: string;
    userDestinationIcao: string;
}

const initialState: DashboardState = { userDepartureIcao: '', userDestinationIcao: '' };

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setUserDepartureIcao: (state, action: TypedAction<string>) => {
            state.userDepartureIcao = action.payload;
        },
        setUserDestinationIcao: (state, action: TypedAction<string>) => {
            state.userDestinationIcao = action.payload;
        },
    },
});

export const { setUserDepartureIcao, setUserDestinationIcao } = dashboardSlice.actions;
export default dashboardSlice.reducer;
