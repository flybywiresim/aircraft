// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useState, useEffect } from 'react';
import { CloudArrowDown, PinFill, Pin } from 'react-bootstrap-icons';
import { ChartFoxGroupedChart } from '../../../Apis/ChartFox/ChartFox';
import { t } from '../../../translation';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import {
    NavigationTab,
    editTabProperty,
    // setBoundingBox,
    setProvider,
    ChartProvider,
    isChartPinned,
    removedPinnedChart,
    addPinnedChart,
} from '../../../Store/features/navigationPage';
import { navigationTabs } from '../../Navigation';

interface ChartFoxChartSelectorProps {
    selectedTab: OrganizedChart;
    loading?: boolean;
}

type RunwayOrganizedChart = {
    name: string,
    charts: ChartFoxGroupedChart[],
}

export type OrganizedChart = {
    name: string,
    charts: ChartFoxGroupedChart[],
    bundleRunways?: boolean,
}

export const ChartFoxChartSelector = ({ selectedTab, loading }: ChartFoxChartSelectorProps) => {
    const NO_RUNWAY_NAME = 'NONE';
    const [runwaySet, setRunwaySet] = useState<Set<string>>(new Set());
    const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChart[]>([]);

    const dispatch = useAppDispatch();

    const { chartId, searchQuery, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.CHARTFOX]);
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

    useEffect(() => {
        if (selectedTab.bundleRunways) {
            const runwayNumbers: string[] = [];

            selectedTab.charts.forEach((chart) => {
                if (chart.runways.length !== 0) {
                    chart.runways.forEach((runway) => {
                        runwayNumbers.push(runway);
                    });
                } else {
                    runwayNumbers.push(NO_RUNWAY_NAME);
                }
            });

            setRunwaySet(new Set(runwayNumbers));
        } else {
            setRunwaySet(new Set());
        }
    }, [selectedTab.charts]);

    useEffect(() => {
        if (selectedTab.bundleRunways) {
            const organizedRunwayCharts: RunwayOrganizedChart[] = [];

            runwaySet.forEach((runway) => {
                organizedRunwayCharts.push({
                    name: runway,
                    charts: selectedTab.charts.filter(
                        (chart) => chart.runways.includes(runway)
                            || (chart.runways.length === 0 && runway === NO_RUNWAY_NAME),
                    ),
                });
            });

            setOrganizedCharts(organizedRunwayCharts);
        } else {
            setOrganizedCharts([]);
        }
    }, [runwaySet]);

    const handleChartClick = (chart: ChartFoxGroupedChart) => {
        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, pagesViewable: 1 }));

        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, currentPage: 1 }));

        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, chartId: chart.id }));

        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, chartDimensions: { width: undefined, height: undefined } }));
        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, chartName: { light: chart.name, dark: chart.name } }));

        // TODO: convert translation matrix into bounding box
        // dispatch(setBoundingBox(chart.boundingBox));

        dispatch(setProvider(ChartProvider.CHARTFOX));
    };

    if (loading) {
        return (
            <div
                className="border-theme-accent flex h-full items-center justify-center rounded-md border-2"
                style={{ height: '42.75rem' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div
                className="border-theme-accent flex h-full items-center justify-center rounded-md border-2"
                style={{ height: '42.75rem' }}
            >
                <p>{t('NavigationAndCharts.ThereAreNoChartsToDisplay')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {selectedTab.bundleRunways
                ? (
                    <>
                        {organizedCharts.map((item) => (
                            <div className="flex w-full flex-col divide-y-2 divide-gray-700 overflow-hidden rounded-md" key={item.name}>
                                <span className="bg-theme-secondary rounded-t-lg p-1 text-center">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="bg-theme-accent flex flex-row"
                                        onClick={() => handleChartClick(chart)}
                                        key={chart.id}
                                    >
                                        <div className="flex flex-row items-center">
                                            <div className={`h-full w-2 transition duration-100 ${chart.id === chartId
                                                ? 'bg-theme-highlight'
                                                : 'bg-theme-secondary'}`}
                                            />
                                            <div
                                                className="hover:text-theme-body hover:bg-theme-highlight flex h-full items-center px-2 transition duration-100"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (isChartPinned(chart.id)) {
                                                        dispatch(removedPinnedChart({ chartId: chart.id }));
                                                    } else {
                                                        dispatch(addPinnedChart({
                                                            chartId: chart.id,
                                                            chartName: { light: chart.name, dark: chart.name },
                                                            title: searchQuery,
                                                            subTitle: chart.typeKey,
                                                            tabIndex: selectedTabIndex,
                                                            timeAccessed: 0,
                                                            tag: selectedTab.name,
                                                            provider: ChartProvider.CHARTFOX,
                                                            pagesViewable: 1,
                                                            // TODO: convert translation matrix into bounding box
                                                            // boundingBox: chart.boundingBox,
                                                            pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.CHARTFOX),
                                                        }));
                                                    }
                                                }}
                                            >
                                                {
                                                    pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chart.id)
                                                        ? <PinFill size={40} />
                                                        : <Pin size={40} />
                                                }
                                            </div>
                                        </div>
                                        <div className="m-2 flex flex-col">
                                            <span>{chart.name}</span>
                                            <span className="text-theme-text bg-theme-secondary mr-auto mt-0.5 rounded-md px-2 text-sm">
                                                {/* TODO: Figure out what to use instead of indexNumber */}
                                                {/* {chart.indexNumber} */}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </>
                )
                : (
                    <>
                        {selectedTab.charts.map((chart) => (
                            <div
                                className="bg-theme-accent flex w-full flex-row overflow-hidden rounded-md"
                                onClick={() => handleChartClick(chart)}
                                key={chart.id}
                            >
                                <div className="flex flex-row items-center">
                                    <div className={`h-full w-2 transition duration-100 ${chart.id === chartId
                                        ? 'bg-theme-highlight'
                                        : 'bg-theme-secondary'}`}
                                    />
                                    <div
                                        className="hover:text-theme-body hover:bg-theme-highlight flex h-full items-center px-2 transition duration-100"
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            if (isChartPinned(chart.id)) {
                                                dispatch(removedPinnedChart({ chartId: chart.id }));
                                            } else {
                                                dispatch(addPinnedChart({
                                                    chartId: chart.id,
                                                    chartName: { light: chart.name, dark: chart.name },
                                                    title: searchQuery,
                                                    subTitle: chart.typeKey,
                                                    tabIndex: selectedTabIndex,
                                                    timeAccessed: 0,
                                                    tag: selectedTab.name,
                                                    provider: ChartProvider.CHARTFOX,
                                                    pagesViewable: 1,
                                                    // TODO: convert translation matrix into bounding box
                                                    // boundingBox: chart.boundingBox,
                                                    pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.CHARTFOX),
                                                }));
                                            }
                                        }}
                                    >
                                        {
                                            pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chart.id)
                                                ? <PinFill size={40} />
                                                : <Pin size={40} />
                                        }
                                    </div>
                                </div>
                                <div className="m-2 flex flex-col">
                                    <span>{chart.name}</span>
                                    <span
                                        className="text-theme-text bg-theme-secondary mr-auto rounded-sm px-2 text-sm"
                                    >
                                        {/* TODO: Figure out what to use instead of indexNumber */}
                                        {/* {chart.indexNumber} */}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
        </div>
    );
};
