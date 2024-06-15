// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useContext } from 'react';

import { t } from '../Localization/translation';
import { Navbar } from '../UtilComponents/Navbar';
import { TODCalculator } from '../TODCalculator/TODCalculator';
import { LandingWidget } from './Widgets/LandingWidget';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';
import { PerformanceCalculatorContext } from '../AircraftContext';

export const Performance = () => {
  const calculators = useContext(PerformanceCalculatorContext);

  const tabs: PageLink[] = [
    { name: 'Top of Descent', alias: t('Performance.TopOfDescent.Title'), component: <TODCalculator /> },
    calculators.landing
      ? { name: 'Landing', alias: t('Performance.Landing.Title'), component: <LandingWidget /> }
      : null,
  ].filter((t) => t !== null);

  return (
    <div className="w-full">
      <div className="relative">
        <h1 className="font-bold">{t('Performance.Title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/performance" />
      </div>
      <div className="mt-4">
        <PageRedirect basePath="/performance" tabs={tabs} />
        <TabRoutes basePath="/performance" tabs={tabs} />
      </div>
    </div>
  );
};
