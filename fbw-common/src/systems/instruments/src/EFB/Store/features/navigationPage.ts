// @ts-strict-ignore
// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ChartCategory, LocalChartCategory, NavigraphAirportCharts } from '@flybywiresim/fbw-sdk-react';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Chart } from 'navigraph/charts';
import { store, RootState } from '../store';
import { PinSort } from '../../Navigation/Pages/PinnedChartsPage';
import { BuiltInChartProvider } from '@microsoft/msfs-sdk';
import { MsfsChartData, MsfsChartPage, MsfsProviders } from '../../Navigation/Pages/MsfsChartPage/MsfsChartUtils';

type ThemedChart = {
  light: string;
  dark: string;
};

type UnthemedChart = {
  light: string;
  dark?: undefined;
};

export enum ChartProvider {
  FAA = 'FAA',
  LIDO = 'LIDO',
  NAVIGRAPH = 'NAVIGRAPH',
  LOCAL_FILES = 'LOCAL_FILES',
}

export enum NavigationTab {
  FAA = 'FAA',
  LIDO = 'LIDO',
  NAVIGRAPH = 'NAVIGRAPH',
  LOCAL_FILES = 'LOCAL_FILES',
  PINNED_CHARTS = 'PINNED_CHARTS',
}

export type ProviderTab = Exclude<NavigationTab, NavigationTab.PINNED_CHARTS>;

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
  boundingBox?: Chart['bounding_boxes'];
  chartLinks?: { light: string; dark?: string };
  pageIndex: number;
};

export const NavigraphChartTabTypeIndices: readonly ChartCategory[] = ['STAR', 'APP', 'TAXI', 'SID', 'REF'];
export const MsfsChartTabTypeIndices: readonly MsfsChartCategory[] = ['SID', 'STAR', 'APPR', 'ARPT'];
export const LocalChartTabTypeIndices: readonly LocalChartCategory[] = ['IMAGE', 'PDF', 'BOTH'];

export const NavigraphChartTabTypeToIndex: Record<ChartCategory, number> = {
  STAR: 0,
  APP: 1,
  TAXI: 2,
  SID: 3,
  REF: 4,
};

export const MsfsChartTabTypeToIndex: Record<MsfsChartCategory, number> = {
  SID: 0,
  STAR: 1,
  APPR: 2,
  ARPT: 3,
};

export const LocalChartCategoryToIndex: Record<LocalChartCategory, number> = {
  IMAGE: 0,
  PDF: 1,
  BOTH: 2,
};

type ProviderTabInfo<C> = {
  chartRotation: number;
  searchQuery: string;
  selectedTabType: C;
  isFullScreen: boolean;
  chartDimensions: {
    width?: number;
    height?: number;
  };
  chartName: ThemedChart;
  chartId: string;
  chartLinks: ThemedChart | UnthemedChart;
  pagesViewable: number;
  currentPage: number;
  chartPosition: { positionX: number; positionY: number; scale: number };
  currentChartPages?: unknown[];
};

export type MsfsChartCategory = 'SID' | 'STAR' | 'APPR' | 'ARPT';

export type MsfsProviderTabInfo<T extends MsfsProviders> = ProviderTabInfo<MsfsChartCategory> & {
  availableCharts: Record<MsfsChartCategory, readonly MsfsChartData<T>[]>;
  currentChartPages?: MsfsChartPage[];
};

type NavigraphProviderTabInfo = ProviderTabInfo<ChartCategory> & {
  availableCharts: NavigraphAirportCharts;
};

type LocalFilesTabInfo = ProviderTabInfo<LocalChartCategory>;

interface InitialChartState {
  selectedNavigationTabIndex: number;
  usingLightTheme: boolean;
  [NavigationTab.FAA]: MsfsProviderTabInfo<BuiltInChartProvider.Faa>;
  [NavigationTab.LIDO]: MsfsProviderTabInfo<BuiltInChartProvider.Lido>;
  [NavigationTab.NAVIGRAPH]: NavigraphProviderTabInfo;
  [NavigationTab.LOCAL_FILES]: LocalFilesTabInfo;
  [NavigationTab.PINNED_CHARTS]: {
    searchQuery: string;
    selectedProvider: ChartProvider | 'ALL';
    chartTypeIndex: number;
    sortTypeIndex: PinSort;
    editMode: boolean;
  };
  planeInFocus: boolean;
  boundingBox?: Chart['bounding_boxes'];
  pagesViewable: number;
  pinnedCharts: PinnedChart[];
  provider: ChartProvider;
}

const initialState: InitialChartState = {
  selectedNavigationTabIndex: 0,
  usingLightTheme: true,
  [NavigationTab.FAA]: {
    availableCharts: {
      SID: [],
      STAR: [],
      APPR: [],
      ARPT: [],
    },
    chartRotation: 0,
    searchQuery: '',
    selectedTabType: 'SID',
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
    currentChartPages: undefined,
  },
  [NavigationTab.LIDO]: {
    availableCharts: {
      SID: [],
      STAR: [],
      APPR: [],
      ARPT: [],
    },
    chartRotation: 0,
    searchQuery: '',
    selectedTabType: 'SID',
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
    currentChartPages: undefined,
  },
  [NavigationTab.NAVIGRAPH]: {
    availableCharts: {
      STAR: [],
      APP: [],
      TAXI: [],
      SID: [],
      REF: [],
    },
    chartRotation: 0,
    searchQuery: '',
    selectedTabType: 'STAR',
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
    selectedTabType: 'PDF',
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
    selectedProvider: 'ALL',
    chartTypeIndex: 0,
    sortTypeIndex: PinSort.NONE,
    editMode: false,
  },
  planeInFocus: false,
  boundingBox: undefined,
  pagesViewable: 1,
  pinnedCharts: [],
  provider: ChartProvider.LIDO,
};

export const navigationTabSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    setSelectedNavigationTabIndex: (state, action: PayloadAction<number>) => {
      state.selectedNavigationTabIndex = action.payload;
    },
    setUsingLightTheme: (state, action: PayloadAction<boolean>) => {
      state.usingLightTheme = action.payload;
    },
    setPlaneInFocus: (state, action: PayloadAction<boolean>) => {
      state.planeInFocus = action.payload;
    },
    setBoundingBox: (state, action: PayloadAction<Chart['bounding_boxes'] | undefined>) => {
      state.boundingBox = action.payload;
    },
    setProvider: (state, action: PayloadAction<ChartProvider>) => {
      state.provider = action.payload;
    },
    addPinnedChart: (state, action: PayloadAction<PinnedChart>) => {
      state.pinnedCharts.push(action.payload);
    },
    removedPinnedChart: (state, action: PayloadAction<{ chartId: string }>) => {
      state.pinnedCharts = state.pinnedCharts.filter((pinnedChart) => pinnedChart.chartId !== action.payload.chartId);
    },
    // This is the best quasi-type-safe path I could think of
    editTabProperty: (
      state,
      action: PayloadAction<{ tab: NavigationTab } & Partial<(typeof initialState)[NavigationTab]>>,
    ) => {
      const editedProperties = {};

      Object.entries(action.payload)
        .filter(([key]) => key !== 'tab')
        .forEach(([key, value]) => (editedProperties[key] = value));

      // @ts-ignore
      state[action.payload.tab] = { ...state[action.payload.tab], ...editedProperties };
    },
    editPinnedChart: (state, action: PayloadAction<{ chartId: string } & Partial<PinnedChart>>) => {
      const editIndex = state.pinnedCharts.findIndex((chart) => chart.chartId === action.payload.chartId);

      const editedProperties = {};

      Object.entries(action.payload)
        .filter(([key]) => key !== 'chartId')
        .forEach(([key, value]) => (editedProperties[key] = value));

      state.pinnedCharts[editIndex] = { ...state.pinnedCharts[editIndex], ...editedProperties };
    },
  },
});

/**
 * @returns Whether or not associated chart with the passed chartId is pinned
 */
export const isChartPinned = (chartId: string): boolean =>
  (store.getState() as RootState).navigationTab.pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chartId);

export const {
  setUsingLightTheme,
  setBoundingBox,
  setProvider,
  addPinnedChart,
  removedPinnedChart,
  editPinnedChart,
  editTabProperty,
  setSelectedNavigationTabIndex,
} = navigationTabSlice.actions;
export default navigationTabSlice.reducer;
