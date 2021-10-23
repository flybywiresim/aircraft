import React, { useState, useEffect } from 'react';
import { CloudArrowDown, PinFill, Pin } from 'react-bootstrap-icons';
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
import { NavigraphChart } from '../../../ChartsApi/Navigraph';

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
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.75rem' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.75rem' }}
            >
                <p>There are no charts to display.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {selectedTab.bundleRunways
                ? (
                    <>
                        {organizedCharts.map((item) => (
                            <div className="flex overflow-hidden flex-col w-full rounded-md divide-y-2 divide-gray-700" key={item.name}>
                                <span className="p-1 text-center rounded-t-lg bg-theme-secondary">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="flex flex-row bg-theme-accent"
                                        onClick={() => handleChartClick(chart)}
                                        key={chart.id}
                                    >
                                        <div className="flex flex-row items-center">
                                            <div className={`w-2 h-full transition duration-100 ${chart.id === chartId
                                                ? 'bg-theme-highlight'
                                                : 'bg-theme-secondary'}`}
                                            />
                                            <div
                                                className="flex items-center px-2 h-full transition duration-100 hover:text-theme-body hover:bg-theme-highlight"
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
                                        <div className="flex flex-col m-2">
                                            <span>{chart.procedureIdentifier}</span>
                                            <span className="px-2 mt-0.5 mr-auto text-sm rounded-md text-theme-text bg-theme-secondary">
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
                                className="flex overflow-hidden flex-row w-full rounded-md bg-theme-accent"
                                onClick={() => handleChartClick(chart)}
                                key={chart.id}
                            >
                                <div className="flex flex-row items-center">
                                    <div className={`w-2 h-full transition duration-100 ${chart.id === chartId
                                        ? 'bg-theme-highlight'
                                        : 'bg-theme-secondary'}`}
                                    />
                                    <div
                                        className="flex items-center px-2 h-full transition duration-100 hover:text-theme-body hover:bg-theme-highlight"
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
                                <div className="flex flex-col m-2">
                                    <span>{chart.procedureIdentifier}</span>
                                    <span
                                        className="px-2 mr-auto text-sm rounded-sm text-theme-text bg-theme-secondary"
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
