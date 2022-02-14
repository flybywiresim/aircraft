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
    showDepartureMetar: boolean;
    showDestinationMetar: boolean;
}

const initialState: DashboardState = {
    userDepartureIcao: undefined,
    userDestinationIcao: undefined,
    departureMetar: undefined,
    destinationMetar: undefined,
    showDepartureMetar: false,
    showDestinationMetar: false,
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
        setShowDepartureMetar: (state, action: PayloadAction<boolean>) => {
            state.showDepartureMetar = action.payload;
        },
        setShowDestinationMetar: (state, action: PayloadAction<boolean>) => {
            state.showDestinationMetar = action.payload;
        },
    },
});

export const {
    setUserDepartureIcao,
    setUserDestinationIcao,
    setDepartureMetar,
    setDestinationMetar,
    setShowDepartureMetar,
    setShowDestinationMetar,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
