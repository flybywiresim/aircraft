import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NavigraphBoundingBox } from '../../ChartsApi/Navigraph';
import { store, RootState } from '../store';
import { PinSort } from '../../Navigation/Pages/PinnedChartsPage';

type ThemedChart = {
    light: string;
    dark: string;
}

export enum ChartProvider {
    NAVIGRAPH = 'NAVIGRAPH',
    LOCAL_FILES = 'LOCAL_FILES'
}

export enum NavigationTab {
    NAVIGRAPH = 'NAVIGRAPH',
    LOCAL_FILES = 'LOCAL_FILES',
    PINNED_CHARTS = 'PINNED_CHARTS'
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
    chartId: string;
    chartLinks: ThemedChart;
    [NavigationTab.NAVIGRAPH]: {
        searchQuery: string;
        selectedTabIndex: number;
    };
    [NavigationTab.LOCAL_FILES]: {
        searchQuery: string;
        selectedTabIndex: number;
    };
    [NavigationTab.PINNED_CHARTS]: {
        searchQuery: string;
        selectedProviderIndex: number;
        chartTypeIndex: number;
        sortTypeIndex: PinSort;
    };
    planeInFocus: boolean;
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
    chartId: '',
    chartLinks: {
        light: '',
        dark: '',
    },
    [NavigationTab.NAVIGRAPH]: {
        searchQuery: '',
        selectedTabIndex: 0,
    },
    [NavigationTab.LOCAL_FILES]: {
        searchQuery: '',
        selectedTabIndex: 0,
    },
    [NavigationTab.PINNED_CHARTS]: {
        searchQuery: '',
        selectedProviderIndex: 0,
        chartTypeIndex: 0,
        sortTypeIndex: PinSort.NONE,
    },
    planeInFocus: false,
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
        setChartId: (state, action: PayloadAction<string>) => {
            state.chartId = action.payload;
        },
        setChartLinks: (state, action: PayloadAction<{ light: string, dark: string }>) => {
            state.chartLinks = action.payload;
        },
        setPlaneInFocus: (state, action: PayloadAction<boolean>) => {
            state.planeInFocus = action.payload;
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
        // This is the best quasi-type-safe path I could think of
        editTabProperty: (state, action: PayloadAction<{tab: NavigationTab} & Partial<typeof initialState[NavigationTab]>>) => {
            const editedProperties = {};

            Object.entries(action.payload)
                .filter((([key]) => key !== 'tab'))
                .forEach(([key, value]) => editedProperties[key] = value);

            // @ts-ignore
            state[action.payload.tab] = { ...state[action.payload.tab], ...editedProperties };
        },
        editPinnedChart: (state, action: PayloadAction<{chartId: string} & Partial<PinnedChart>>) => {
            const editIndex = state.pinnedCharts.findIndex((chart) => chart.chartId === action.payload.chartId);

            const editedProperties = {};

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
    setChartId,
    setChartLinks,
    setPlaneInFocus,
    setChartName,
    setBoundingBox,
    setPagesViewable,
    setCurrentPage,
    setProvider,
    addPinnedChart,
    removedPinnedChart,
    editPinnedChart,
    editTabProperty,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
