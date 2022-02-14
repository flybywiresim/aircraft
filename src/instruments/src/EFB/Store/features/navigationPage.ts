import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NavigraphBoundingBox } from '../../ChartsApi/Navigraph';
import { store, RootState } from '../store';

type ThemedChart = {
    light: string;
    dark: string;
}

type PinnedChart = {
    chartId: string;
    chartName: ThemedChart;
    icao: string;
    title: string;
    tabIndex: number;
    timeAccessed: number;
}

interface InitialChartState {
    chartRotation: number;
    chartDimensions: {
        width?: number;
        height?: number;
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
    pagesViewable: number;
    currentPage: number;
    pinnedCharts: PinnedChart[];
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
    pagesViewable: 1,
    currentPage: 1,
    pinnedCharts: [],
};

export const navigationTabSlice = createSlice({
    name: 'chart',
    initialState,
    reducers: {
        setChartRotation: (state, action: PayloadAction<number>) => {
            state.chartRotation = action.payload;
        },
        setChartDimensions: (state, action: PayloadAction<Partial<{ width: number, height: number }>>) => ({
            ...state,
            chartDimensions: {
                ...state.chartDimensions,
                ...action.payload,
            },
        }),
        setUsingDarkTheme: (state, action: PayloadAction<boolean>) => {
            state.usingDarkTheme = action.payload;
        },
        setIsFullScreen: (state, action: PayloadAction<boolean>) => {
            state.isFullScreen = action.payload;
        },
        setTabIndex: (state, action: PayloadAction<number>) => {
            state.tabIndex = action.payload;
        },
        setChartId: (state, action: PayloadAction<string>) => {
            state.chartId = action.payload;
        },
        setChartLinks: (state, action: PayloadAction<{ light: string, dark: string }>) => {
            state.chartLinks = action.payload;
        },
        setPlaneInFocus: (state, action: PayloadAction<boolean>) => {
            state.planeInFocus = action.payload;
        },
        setIcao: (state, action: PayloadAction<string>) => {
            state.icao = action.payload;
        },
        setChartName: (state, action: PayloadAction<{ light: string, dark: string }>) => {
            state.chartName = action.payload;
        },
        setBoundingBox: (state, action: PayloadAction<NavigraphBoundingBox | undefined>) => {
            state.boundingBox = action.payload;
        },
        setPagesViewable: (state, action: PayloadAction<number>) => {
            state.pagesViewable = action.payload;
        },
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        addPinnedChart: (state, action: PayloadAction<PinnedChart>) => {
            state.pinnedCharts.push(action.payload);
        },
        removedPinnedChart: (state, action: PayloadAction<PinnedChart>) => {
            state.pinnedCharts = state.pinnedCharts.filter((pinnedChart) => pinnedChart.chartId !== action.payload.chartId);
        },
        editPinnedChart: (state, action: PayloadAction<{chartId: string} & Partial<PinnedChart>>) => {
            const editIndex = state.pinnedCharts.findIndex((chart) => chart.chartId === action.payload.chartId);

            const editedProperties = Object.fromEntries(
                Object.entries(action.payload)
                    .filter((([key]) => key !== 'chartId')),
            );

            state.pinnedCharts[editIndex] = { ...state.pinnedCharts[editIndex], ...editedProperties };
        },
    },
});

/**
 * @returns Whether or not associated chart with the passed chartId is pinned
 */
export const isChartPinned = (chartId: string): boolean => (store.getState() as RootState).navigationTab.pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chartId);

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
    setPagesViewable,
    setCurrentPage,
    addPinnedChart,
    removedPinnedChart,
    editPinnedChart,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
