import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MetarParserType } from '@instruments/common/metarTypes';

/**
 * DashboardState holds any preservable states on the Dashboard Widgets and its
 * children widgets (mainly WeatherWidget).
 * This makes sure that switching EFB pages retains user selections or input.
 */
interface DashboardState {
    userDepartureIcao?: string;
    userDestinationIcao?: string;
    departureMetar?: MetarParserType;
    destinationMetar?: MetarParserType;
}

const initialState: DashboardState = {
    userDepartureIcao: undefined,
    userDestinationIcao: undefined,
    departureMetar: undefined,
    destinationMetar: undefined,
};

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setUserDepartureIcao: (state, action: PayloadAction<string>) => {
            state.userDepartureIcao = action.payload;
        },
        setUserDestinationIcao: (state, action: PayloadAction<string>) => {
            state.userDestinationIcao = action.payload;
        },
        setDepartureMetar: (state, action: PayloadAction<MetarParserType | undefined>) => {
            state.departureMetar = action.payload;
        },
        setDestinationMetar: (state, action: PayloadAction<MetarParserType | undefined>) => {
            state.destinationMetar = action.payload;
        },
    },
});

export const {
    setUserDepartureIcao,
    setUserDestinationIcao,
    setDepartureMetar,
    setDestinationMetar,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
