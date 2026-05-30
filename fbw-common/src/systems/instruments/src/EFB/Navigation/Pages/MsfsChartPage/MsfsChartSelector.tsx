// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useState, useEffect } from 'react';
import { CloudArrowDown, PinFill, Pin } from 'react-bootstrap-icons';

import { t } from '../../../Localization/translation';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import {
  NavigationTab,
  editTabProperty,
  setProvider,
  ChartProvider,
  isChartPinned,
  removedPinnedChart,
  addPinnedChart,
  setBoundingBox,
  MsfsChartTabTypeToIndex,
} from '../../../Store/features/navigationPage';
import { BuiltInChartProvider, RunwayIdentifier } from '@microsoft/msfs-sdk';
import { MsfsChartData, MsfsChartUtils, runwayDesignatorPriority } from './MsfsChartUtils';
import { navigationTabs } from '../../Navigation';

interface MsfsChartSelectorProps {
  tab: NavigationTab.FAA | NavigationTab.LIDO;
  provider: ChartProvider;
  selectedTab: OrganizedChart;
  loading?: boolean;
}

type RunwayOrganizedChart = {
  /** null means multiple runways */
  runway: RunwayIdentifier | null;
  name: string;
  charts: MsfsChartData<BuiltInChartProvider>[];
};

export type OrganizedChart = {
  name: string;
  charts: readonly MsfsChartData<BuiltInChartProvider>[];
  bundleRunways?: boolean;
};

let currentOpId = 0;

export const MsfsChartSelector = ({ selectedTab, loading, provider, tab }: MsfsChartSelectorProps) => {
  const NO_RUNWAY_NAME = 'Multiple Runways';

  const [runwaySet, setRunwaySet] = useState<(RunwayIdentifier | null)[]>([]);
  const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChart[]>([]);

  const dispatch = useAppDispatch();

  const { chartId, searchQuery, selectedTabType } = useAppSelector((state) => state.navigationTab[tab]);

  const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

  useEffect(() => {
    const runwayNumbers: (RunwayIdentifier | null)[] = [];
    let isSomeMultipleRunway = false;

    if (selectedTab.bundleRunways) {
      selectedTab.charts.forEach((chart) => {
        if (chart.runways.length === 1) {
          if (
            !runwayNumbers.some(
              (r) => r && r.number === chart.runways[0].number && r.designator === chart.runways[0].designator,
            )
          ) {
            runwayNumbers.push(chart.runways[0]);
          }
        } else {
          isSomeMultipleRunway = true;
        }
      });
    }

    if (isSomeMultipleRunway) {
      runwayNumbers.push(null);
    }

    setRunwaySet(runwayNumbers);
  }, [selectedTab.charts]);

  useEffect(() => {
    if (selectedTab.bundleRunways) {
      const organizedRunwayCharts: RunwayOrganizedChart[] = [];

      runwaySet.forEach((runway) => {
        const charts = selectedTab.charts.filter(
          (chart) =>
            (chart.runways.length === 1 &&
              runway &&
              chart.runways[0].number === runway.number &&
              chart.runways[0].designator === runway.designator) ||
            (chart.runways.length !== 1 && runway === null),
        );
        if (charts.length) {
          organizedRunwayCharts.push({
            runway,
            name: runway === null ? NO_RUNWAY_NAME : `RW${runway.number.padStart(2, '0')}${runway.designator}`,
            charts,
          });
        }
      });

      organizedRunwayCharts.sort((a, b) => {
        // Put multi-runway charts at the end. Should only occur once in the array so this is safe.
        if (a.runway === null) {
          return 1;
        }
        if (b.runway === null) {
          return -1;
        }
        if (a.runway.number === b.runway.number) {
          return runwayDesignatorPriority[a.runway.designator] - runwayDesignatorPriority[b.runway.designator];
        }
        return a.runway.number.localeCompare(b.runway.number);
      });

      setOrganizedCharts(organizedRunwayCharts);
    } else {
      setOrganizedCharts([]);
    }
  }, [runwaySet]);

  const handleChartClick = async (chart: MsfsChartData<BuiltInChartProvider>) => {
    const opId = ++currentOpId;

    const chartPages = await MsfsChartUtils.getChartPages(chart.guid);

    if (opId !== currentOpId) {
      // another async request started after us
      return;
    }

    dispatch(
      editTabProperty({
        tab,
        chartId: chart.guid,
        pagesViewable: chartPages.length,
        currentPage: 1,
        currentChartPages: chartPages,
        chartDimensions: { width: undefined, height: undefined },
        chartName: { light: chart.name, dark: chart.name },
        chartLinks: { light: chartPages[0].lightUrl, dark: chartPages[0].darkUrl },
      }),
    );

    dispatch(setBoundingBox(undefined));

    dispatch(setProvider(provider));
  };

  const handlePinChart = async (chart: MsfsChartData<BuiltInChartProvider>) => {
    const chartPages = await MsfsChartUtils.getChartPages(chart.guid);
    dispatch(
      addPinnedChart({
        chartId: chart.guid,
        chartName: { light: chart.name, dark: chart.name },
        title: searchQuery,
        subTitle: chart.name,
        tabIndex: MsfsChartTabTypeToIndex[selectedTabType],
        timeAccessed: 0,
        tag: selectedTab.name,
        provider,
        pagesViewable: chartPages.length,
        boundingBox: undefined,
        chartLinks: { light: chartPages[0].lightUrl, dark: chartPages[0].darkUrl },
        pageIndex: navigationTabs.findIndex((t) => t.associatedTab === tab),
      }),
    );
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
      {selectedTab.bundleRunways ? (
        <>
          {organizedCharts.map((item) => (
            <div className="flex w-full flex-col divide-y-2 divide-gray-700 overflow-hidden rounded-md" key={item.name}>
              <span className="rounded-t-lg bg-theme-secondary p-1 text-center">{item.name}</span>
              {item.charts.map((chart) => (
                <div className="flex flex-row bg-theme-accent" onClick={() => handleChartClick(chart)} key={chart.guid}>
                  <div className="flex flex-row items-center">
                    <div
                      className={`h-full w-2 transition duration-100 ${
                        chart.guid === chartId ? 'bg-theme-highlight' : 'bg-theme-secondary'
                      }`}
                    />
                    <div
                      className="flex h-full items-center px-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                      onClick={(event) => {
                        event.stopPropagation();

                        if (isChartPinned(chart.guid)) {
                          dispatch(removedPinnedChart({ chartId: chart.guid }));
                        } else {
                          handlePinChart(chart);
                        }
                      }}
                    >
                      {pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chart.guid) ? (
                        <PinFill size={40} />
                      ) : (
                        <Pin size={40} />
                      )}
                    </div>
                  </div>
                  <div className="m-2 flex flex-col">
                    <span>{chart.name}</span>
                    <span>
                      <span className="mr-auto rounded-sm bg-theme-secondary px-2 text-sm text-theme-text">
                        {chart.type.toUpperCase()}
                      </span>
                      {chart.runways.length > 1 &&
                        chart.runways.map((rw) => (
                          <span className="ml-1 mr-auto rounded-sm bg-theme-secondary px-2 text-sm text-theme-text">
                            {`RW${rw.number.padStart(2, '0')}${rw.designator}`}
                          </span>
                        ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      ) : (
        <>
          {selectedTab.charts.map((chart) => (
            <div
              className="flex w-full flex-row overflow-hidden rounded-md bg-theme-accent"
              onClick={() => handleChartClick(chart)}
              key={chart.guid}
            >
              <div className="flex flex-row items-center">
                <div
                  className={`h-full w-2 transition duration-100 ${
                    chart.guid === chartId ? 'bg-theme-highlight' : 'bg-theme-secondary'
                  }`}
                />
                <div
                  className="flex h-full items-center px-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  onClick={(event) => {
                    event.stopPropagation();

                    if (isChartPinned(chart.guid)) {
                      dispatch(removedPinnedChart({ chartId: chart.guid }));
                    } else {
                      handlePinChart(chart);
                    }
                  }}
                >
                  {pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chart.guid) ? (
                    <PinFill size={40} />
                  ) : (
                    <Pin size={40} />
                  )}
                </div>
              </div>
              <div className="m-2 flex flex-col">
                <span>{chart.name}</span>
                <span className="mr-auto rounded-sm bg-theme-secondary px-2 text-sm text-theme-text">
                  {chart.type.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
