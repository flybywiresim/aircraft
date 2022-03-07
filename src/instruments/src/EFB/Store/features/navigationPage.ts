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

interface InitialChartState {
    selectedPageIndex: number;
    chartRotation: number;
    usingDarkTheme: boolean;
    [NavigationTab.NAVIGRAPH]: {
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
    };
    [NavigationTab.LOCAL_FILES]: {
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
    };
    [NavigationTab.PINNED_CHARTS]: {
        searchQuery: string;
        selectedProviderIndex: number;
        chartTypeIndex: number;
        sortTypeIndex: PinSort;
    };
    planeInFocus: boolean;
    boundingBox?: NavigraphBoundingBox;
    pagesViewable: number;
    currentPage: number;
    pinnedCharts: PinnedChart[];
    provider: ChartProvider;
}

const initialState: InitialChartState = {
    selectedPageIndex: 0,
    chartRotation: 0,
    usingDarkTheme: true,
    [NavigationTab.NAVIGRAPH]: {
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
    },
    [NavigationTab.LOCAL_FILES]: {
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
    },
    [NavigationTab.PINNED_CHARTS]: {
        searchQuery: '',
        selectedProviderIndex: 0,
        chartTypeIndex: 0,
        sortTypeIndex: PinSort.NONE,
    },
    planeInFocus: false,
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
        setSelectedPageIndex: (state, action: PayloadAction<number>) => {
            state.selectedPageIndex = action.payload;
        },
        setChartRotation: (state, action: PayloadAction<number>) => {
            state.chartRotation = action.payload;
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
    setUsingDarkTheme,
    setPlaneInFocus,
    setBoundingBox,
    setPagesViewable,
    setCurrentPage,
    setProvider,
    addPinnedChart,
    removedPinnedChart,
    editPinnedChart,
    editTabProperty,
    setSelectedPageIndex,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
