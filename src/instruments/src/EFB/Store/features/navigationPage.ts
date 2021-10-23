import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReactZoomPanPinchState } from 'react-zoom-pan-pinch';
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

export type ProviderTab = Exclude<NavigationTab, NavigationTab.PINNED_CHARTS>

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
    pageIndex: number;
}

type ProviderTabInfo = {
    chartRotation: number;
    searchQuery: string;
    selectedTabIndex: number;
    isFullScreen: boolean;
    chartDimensions: {
        width?: number;
        height?: number;
    };
    chartName: ThemedChart;
    chartId: string;
    chartLinks: ThemedChart;
    pagesViewable: number;
    currentPage: number;
    chartPosition: {positionX: number, positionY: number, scale: number};
};

interface InitialChartState {
    selectedNavigationTabIndex: number;
    usingDarkTheme: boolean;
    [NavigationTab.NAVIGRAPH]: ProviderTabInfo;
    [NavigationTab.LOCAL_FILES]: ProviderTabInfo;
    [NavigationTab.PINNED_CHARTS]: {
        searchQuery: string;
        selectedProviderIndex: number;
        chartTypeIndex: number;
        sortTypeIndex: PinSort;
        editMode: boolean;
    };
    planeInFocus: boolean;
    boundingBox?: NavigraphBoundingBox;
    pagesViewable: number;
    pinnedCharts: PinnedChart[];
    provider: ChartProvider;
}

const initialState: InitialChartState = {
    selectedNavigationTabIndex: 0,
    usingDarkTheme: true,
    [NavigationTab.NAVIGRAPH]: {
        chartRotation: 0,
        searchQuery: '',
        selectedTabIndex: 0,
        isFullScreen: false,
        chartDimensions: {
            width: 0,
            height: 0,
        },
        chartName: {
            light: '',
            dark: '',
        },
        chartId: '',
        chartLinks: {
            light: '',
            dark: '',
        },
        pagesViewable: 1,
        currentPage: 1,
        chartPosition: {
            positionX: 0,
            positionY: 0,
            scale: 1,
        },
    },
    [NavigationTab.LOCAL_FILES]: {
        chartRotation: 0,
        searchQuery: '',
        selectedTabIndex: 0,
        isFullScreen: false,
        chartDimensions: {
            width: 0,
            height: 0,
        },
        chartName: {
            light: '',
            dark: '',
        },
        chartId: '',
        chartLinks: {
            light: '',
            dark: '',
        },
        pagesViewable: 1,
        currentPage: 1,
        chartPosition: {
            positionX: 0,
            positionY: 0,
            scale: 1,
        },
    },
    [NavigationTab.PINNED_CHARTS]: {
        searchQuery: '',
        selectedProviderIndex: 0,
        chartTypeIndex: 0,
        sortTypeIndex: PinSort.NONE,
        editMode: false,
    },
    planeInFocus: false,
    boundingBox: undefined,
    pagesViewable: 1,
    pinnedCharts: [],
    provider: undefined as any,
};

export const navigationTabSlice = createSlice({
    name: 'chart',
    initialState,
    reducers: {
        setSelectedNavigationTabIndex: (state, action: PayloadAction<number>) => {
            state.selectedNavigationTabIndex = action.payload;
        },
        setUsingDarkTheme: (state, action: PayloadAction<boolean>) => {
            state.usingDarkTheme = action.payload;
        },
        setPlaneInFocus: (state, action: PayloadAction<boolean>) => {
            state.planeInFocus = action.payload;
        },
        setBoundingBox: (state, action: PayloadAction<NavigraphBoundingBox | undefined>) => {
            state.boundingBox = action.payload;
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
    setUsingDarkTheme,
    setPlaneInFocus,
    setBoundingBox,
    setProvider,
    addPinnedChart,
    removedPinnedChart,
    editPinnedChart,
    editTabProperty,
    setSelectedNavigationTabIndex,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
