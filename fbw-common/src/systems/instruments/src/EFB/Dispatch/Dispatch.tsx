// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { t, Navbar, TabRoutes, PageLink, PageRedirect } from '@flybywiresim/flypad';
import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';

export const Dispatch = () => {
  const tabs: PageLink[] = [
    { name: 'OFP', alias: t('Dispatch.Ofp.Title'), component: <LoadSheetWidget /> },
    { name: 'Overview', alias: t('Dispatch.Overview.Title'), component: <OverviewPage /> },
  ];

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('Dispatch.Title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/dispatch" />
      </div>

      <PageRedirect basePath="/dispatch" tabs={tabs} />
      <TabRoutes basePath="/dispatch" tabs={tabs} />
    </div>
  );
};
