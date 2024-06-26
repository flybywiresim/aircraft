// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { CloudArrowDown, Pin, PinFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { LocalChartCategory, Viewer } from '@flybywiresim/fbw-sdk';
import { t } from '../../../Localization/translation';
import {
  addPinnedChart,
  ChartProvider,
  editPinnedChart,
  editTabProperty,
  isChartPinned,
  LocalChartCategoryToIndex,
  NavigationTab,
  removedPinnedChart,
  setBoundingBox,
  setProvider,
} from '../../../Store/features/navigationPage';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { navigationTabs } from '../../Navigation';
import { getImageUrl, getPdfUrl } from './LocalFilesPage';

export type LocalFileChart = {
  fileName: string;
  type: 'IMAGE' | 'PDF';
};

export type LocalFileOrganizedCharts = {
  name: LocalChartCategory;
  alias: string;
  charts: LocalFileChart[];
};
interface LocalFileChartSelectorProps {
  selectedTab: LocalFileOrganizedCharts;
  loading?: boolean;
}

export const LocalFileChartSelector = ({ selectedTab, loading }: LocalFileChartSelectorProps) => {
  const dispatch = useAppDispatch();

  const { chartId, selectedTabType } = useAppSelector((state) => state.navigationTab[NavigationTab.LOCAL_FILES]);
  const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

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

  const getChartResourceUrl = async (chart: LocalFileChart): Promise<string> => {
    try {
      if (chart.type === 'PDF') {
        return await getPdfUrl(chart.fileName, 1);
      }
      return await getImageUrl(chart.fileName);
    } catch (err) {
      return Promise.reject();
    }
  };

  const getPagesViewable = async (chart: LocalFileChart): Promise<number> => {
    if (chart.type === 'PDF') {
      try {
        return await Viewer.getPDFPageNum(chart.fileName);
      } catch (err) {
        return Promise.reject();
      }
    }
    return 1; // return 1 if called on a non-pdf file
  };

  const handleChartClick = async (chart: LocalFileChart) => {
    const oldChartId = chartId;
    dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartId: chart.fileName }));
    try {
      const url = await getChartResourceUrl(chart);
      dispatch(
        editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartDimensions: { width: undefined, height: undefined } }),
      );
      dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartName: { light: url, dark: url } }));
      dispatch(setBoundingBox(undefined));
      const pagesViewable = await getPagesViewable(chart);
      dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, pagesViewable }));
    } catch (_) {
      dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartId: oldChartId }));
      return;
    }
    dispatch(setProvider(ChartProvider.LOCAL_FILES));
    dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, currentPage: 1 }));
  };

  return (
    <div className="space-y-4">
      {selectedTab.charts.map((chart) => (
        <div
          className="flex w-full flex-row overflow-hidden rounded-md bg-theme-accent"
          onClick={() => handleChartClick(chart)}
          key={chart.fileName}
        >
          <div className="flex flex-row items-center">
            <div
              className={`h-full w-2 shrink-0 transition duration-100 ${
                chart.fileName === chartId ? 'bg-theme-highlight' : 'bg-theme-secondary'
              }`}
            />
            <div
              className="flex h-full items-center px-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
              onClick={(event) => {
                event.stopPropagation();

                if (isChartPinned(chart.fileName)) {
                  dispatch(removedPinnedChart({ chartId: chart.fileName }));
                } else {
                  /**
                   * Pinning the chart with temporary values for chartName and pagesViewable
                   * and editing them later to give a snappier experience as these values take time to be resolved.
                   */
                  dispatch(
                    addPinnedChart({
                      chartId: chart.fileName,
                      chartName: { light: '', dark: '' },
                      title: chart.fileName,
                      subTitle: '',
                      tabIndex: LocalChartCategoryToIndex[selectedTabType],
                      timeAccessed: 0,
                      tag: chart.type,
                      provider: ChartProvider.LOCAL_FILES,
                      pagesViewable: 1,
                      pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.LOCAL_FILES),
                    }),
                  );

                  Promise.all([getChartResourceUrl(chart), getPagesViewable(chart)])
                    .then(([url, numPages]) => {
                      dispatch(
                        editPinnedChart({
                          chartId: chart.fileName,
                          chartName: { light: url, dark: url },
                          pagesViewable: numPages,
                        }),
                      );
                    })
                    .catch(() => {
                      dispatch(removedPinnedChart({ chartId: chart.fileName }));
                      toast.error('Unable to generate necessary resource to pin this item.');
                    });
                }
              }}
            >
              {pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chart.fileName) ? (
                <PinFill size={40} />
              ) : (
                <Pin size={40} />
              )}
            </div>
          </div>
          <div className="m-2 flex flex-col">
            <span>{chart.fileName}</span>
            <span className="mr-auto rounded-sm bg-theme-secondary px-2 text-sm text-theme-text">{chart.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
