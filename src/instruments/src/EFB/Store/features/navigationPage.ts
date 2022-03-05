import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NavigraphBoundingBox } from '../../ChartsApi/Navigraph';
import { store, RootState } from '../store';

type ThemedChart = {
    light: string;
    dark: string;
}

export enum ChartProvider {
    NAVIGRAPH = 'NAVIGRAPH',
    LOCAL_FILES = 'LOCAL_FILES'
}

export type PinnedChart = {
    chartId: string;
    chartName: ThemedChart;
    subTitle: string;
    title: string;
    tabIndex: number;
    timeAccessed: number;
    tag: string;
    provider: ChartProvider;
    pagesViewable: number;
    boundingBox?: NavigraphBoundingBox;
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
    searchQuery: string;
    chartName: ThemedChart;
    boundingBox?: NavigraphBoundingBox;
    pagesViewable: number;
    currentPage: number;
    pinnedCharts: PinnedChart[];
    provider: ChartProvider;
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
    searchQuery: '',
    chartName: {
        light: '',
        dark: '',
    },
    boundingBox: undefined,
    pagesViewable: 1,
    currentPage: 1,
    pinnedCharts: [],
    provider: undefined as any,
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
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
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
        setProvider: (state, action: PayloadAction<ChartProvider>) => {
            state.provider = action.payload;
        },
        addPinnedChart: (state, action: PayloadAction<PinnedChart>) => {
            state.pinnedCharts.push(action.payload);
        },
        removedPinnedChart: (state, action: PayloadAction<{chartId: string}>) => {
            state.pinnedCharts = state.pinnedCharts.filter((pinnedChart) => pinnedChart.chartId !== action.payload.chartId);
        },
        editPinnedChart: (state, action: PayloadAction<{chartId: string} & Partial<PinnedChart>>) => {
            const editIndex = state.pinnedCharts.findIndex((chart) => chart.chartId === action.payload.chartId);

            const editedProperties = {};

            Object.entries(action.payload)
                .filter((([key]) => key !== 'chartId'))
                .forEach(([key, value]) => editedProperties[key] = value);

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
    setSearchQuery,
    setChartName,
    setBoundingBox,
    setPagesViewable,
    setCurrentPage,
    setProvider,
    addPinnedChart,
    removedPinnedChart,
    editPinnedChart,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
