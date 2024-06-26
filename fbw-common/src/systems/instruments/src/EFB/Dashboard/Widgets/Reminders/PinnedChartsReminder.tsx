// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from '../../../Localization/translation';
import { useAppSelector } from '../../../Store/store';
import { PinnedChartCard } from '../../../Navigation/Pages/PinnedChartsPage';
import { RemindersSection } from './RemindersSection';

export const PinnedChartsReminder = () => {
  const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

  return (
    <RemindersSection title={t('Dashboard.ImportantInformation.PinnedCharts.Title')} pageLinkPath="/navigation">
      <div className="grid grid-cols-2">
        {[...pinnedCharts]
          .sort((a, b) => b.timeAccessed - a.timeAccessed)
          .map((pinnedChart, index) => (
            <PinnedChartCard
              pinnedChart={pinnedChart}
              className={`${index && index % 2 !== 0 && 'ml-4'} mt-4`}
              key={pinnedChart.chartId}
              showDelete={false}
            />
          ))}
      </div>

      {!pinnedCharts.length && (
        <h1 className="m-auto my-4 text-center font-bold opacity-60">
          {t('Dashboard.ImportantInformation.PinnedCharts.NoPinnedCharts')}
        </h1>
      )}
    </RemindersSection>
  );
};
