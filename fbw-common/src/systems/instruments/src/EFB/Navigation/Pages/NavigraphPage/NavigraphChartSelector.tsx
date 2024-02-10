// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavigraphChart } from '@flybywiresim/fbw-sdk';

import React, { useState, useEffect } from 'react';
import { CloudArrowDown, PinFill, Pin } from 'react-bootstrap-icons';
import { t } from '../../../Localization/translation';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import {
    NavigationTab,
    editTabProperty,
    setBoundingBox,
    setProvider,
    ChartProvider,
    isChartPinned,
    removedPinnedChart,
    addPinnedChart,
} from '../../../Store/features/navigationPage';
import { navigationTabs } from '../../Navigation';

interface NavigraphChartSelectorProps {
    selectedTab: OrganizedChart;
    loading?: boolean;
}

type RunwayOrganizedChart = {
    name: string,
    charts: NavigraphChart[],
}

export type OrganizedChart = {
    name: string,
    charts: NavigraphChart[],
    bundleRunways?: boolean,
}

export const NavigraphChartSelector = ({ selectedTab, loading }: NavigraphChartSelectorProps) => {
    const NO_RUNWAY_NAME = 'NONE';
    const [runwaySet, setRunwaySet] = useState<Set<string>>(new Set());
    const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChart[]>([]);

    const dispatch = useAppDispatch();

    const { chartId, searchQuery, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.NAVIGRAPH]);
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

    useEffect(() => {
        if (selectedTab.bundleRunways) {
            const runwayNumbers: string[] = [];

            selectedTab.charts.forEach((chart) => {
                if (chart.runway.length !== 0) {
                    chart.runway.forEach((runway) => {
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
                        (chart) => chart.runway.includes(runway)
                            || (chart.runway.length === 0 && runway === NO_RUNWAY_NAME),
                    ),
                });
            });

            setOrganizedCharts(organizedRunwayCharts);
        } else {
            setOrganizedCharts([]);
        }
    }, [runwaySet]);

    const handleChartClick = (chart: NavigraphChart) => {
        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, pagesViewable: 1 }));

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, currentPage: 1 }));

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartId: chart.id }));

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartDimensions: { width: undefined, height: undefined } }));
        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartName: { light: chart.fileDay, dark: chart.fileNight } }));

        dispatch(setBoundingBox(chart.boundingBox));

        dispatch(setProvider(ChartProvider.NAVIGRAPH));
    };

    if (loading) {
        return (
            <div
                className="flex h-full items-center justify-center rounded-md border-2 border-theme-accent"
                style={{ height: '42.75rem' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div
                className="flex h-full items-center justify-center rounded-md border-2 border-theme-accent"
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
                                <span className="rounded-t-lg bg-theme-secondary p-1 text-center">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="flex flex-row bg-theme-accent"
                                        onClick={() => handleChartClick(chart)}
                                        key={chart.id}
                                    >
                                        <div className="flex flex-row items-center">
                                            <div className={`h-full w-2 transition duration-100 ${chart.id === chartId
                                                ? 'bg-theme-highlight'
                                                : 'bg-theme-secondary'}`}
                                            />
                                            <div
                                                className="flex h-full items-center px-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (isChartPinned(chart.id)) {
                                                        dispatch(removedPinnedChart({ chartId: chart.id }));
                                                    } else {
                                                        dispatch(addPinnedChart({
                                                            chartId: chart.id,
                                                            chartName: { light: chart.fileDay, dark: chart.fileNight },
                                                            title: searchQuery,
                                                            subTitle: chart.procedureIdentifier,
                                                            tabIndex: selectedTabIndex,
                                                            timeAccessed: 0,
                                                            tag: selectedTab.name,
                                                            provider: ChartProvider.NAVIGRAPH,
                                                            pagesViewable: 1,
                                                            boundingBox: chart.boundingBox,
                                                            pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.NAVIGRAPH),
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
                                            <span>{chart.procedureIdentifier}</span>
                                            <span className="mr-auto mt-0.5 rounded-md bg-theme-secondary px-2 text-sm text-theme-text">
                                                {chart.indexNumber}
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
                                className="flex w-full flex-row overflow-hidden rounded-md bg-theme-accent"
                                onClick={() => handleChartClick(chart)}
                                key={chart.id}
                            >
                                <div className="flex flex-row items-center">
                                    <div className={`h-full w-2 transition duration-100 ${chart.id === chartId
                                        ? 'bg-theme-highlight'
                                        : 'bg-theme-secondary'}`}
                                    />
                                    <div
                                        className="flex h-full items-center px-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            if (isChartPinned(chart.id)) {
                                                dispatch(removedPinnedChart({ chartId: chart.id }));
                                            } else {
                                                dispatch(addPinnedChart({
                                                    chartId: chart.id,
                                                    chartName: { light: chart.fileDay, dark: chart.fileNight },
                                                    title: searchQuery,
                                                    subTitle: chart.procedureIdentifier,
                                                    tabIndex: selectedTabIndex,
                                                    timeAccessed: 0,
                                                    tag: selectedTab.name,
                                                    provider: ChartProvider.NAVIGRAPH,
                                                    pagesViewable: 1,
                                                    boundingBox: chart.boundingBox,
                                                    pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.NAVIGRAPH),
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
                                    <span>{chart.procedureIdentifier}</span>
                                    <span
                                        className="mr-auto rounded-sm bg-theme-secondary px-2 text-sm text-theme-text"
                                    >
                                        {chart.indexNumber}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
        </div>
    );
};
