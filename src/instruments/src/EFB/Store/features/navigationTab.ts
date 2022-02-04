import { createSlice } from '@reduxjs/toolkit';
import { NavigraphBoundingBox } from '../../ChartsApi/Navigraph';
import { TypedAction } from '../store';

interface InitialChartState {
    chartRotation: number;
    chartDimensions: {
        width: number;
        height: number;
    };
    usingDarkTheme: boolean;
    isFullScreen: boolean;
    tabIndex: number;
    chartId: string;
    chartLinks: ThemedChart;
    planeInFocus: boolean;
    icao: string;
    chartName: ThemedChart;
    boundingBox?: NavigraphBoundingBox;
}

type ThemedChart = {
    light: string;
    dark: string;
}

const initialState: InitialChartState = {
    chartRotation: 0,
    chartDimensions: {
        width: 0,
        height: 0,
    },
    usingDarkTheme: true,
    isFullScreen: false,
    tabIndex: 0,
    chartId: '',
    chartLinks: {
        light: '',
        dark: '',
    },
    planeInFocus: false,
    icao: '',
    chartName: {
        light: '',
        dark: '',
    },
    boundingBox: undefined,
};

export const navigationTabSlice = createSlice({
    name: 'chart',
    initialState,
    reducers: {
        setChartRotation: (state, action: TypedAction<number>) => {
            state.chartRotation = action.payload;
        },
        setChartDimensions: (state, action: TypedAction<Partial<{ width: number, height: number }>>) => ({
            ...state,
            chartDimensions: {
                ...state.chartDimensions,
                ...action.payload,
            },
        }),
        setUsingDarkTheme: (state, action: TypedAction<boolean>) => {
            state.usingDarkTheme = action.payload;
        },
        setIsFullScreen: (state, action: TypedAction<boolean>) => {
            state.isFullScreen = action.payload;
        },
        setTabIndex: (state, action: TypedAction<number>) => {
            state.tabIndex = action.payload;
        },
        setChartId: (state, action: TypedAction<string>) => {
            state.chartId = action.payload;
        },
        setChartLinks: (state, action: TypedAction<{ light: string, dark: string }>) => {
            state.chartLinks = action.payload;
        },
        setPlaneInFocus: (state, action: TypedAction<boolean>) => {
            state.planeInFocus = action.payload;
        },
        setIcao: (state, action: TypedAction<string>) => {
            state.icao = action.payload;
        },
        setChartName: (state, action: TypedAction<{ light: string, dark: string }>) => {
            state.chartName = action.payload;
        },
        setBoundingBox: (state, action: TypedAction<NavigraphBoundingBox | undefined>) => {
            state.boundingBox = action.payload;
        },
    },
});

export const {
    setChartRotation,
    setChartDimensions,
    setUsingDarkTheme,
    setIsFullScreen,
    setTabIndex,
    setChartId,
    setChartLinks,
    setPlaneInFocus,
    setIcao,
    setChartName,
    setBoundingBox,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
