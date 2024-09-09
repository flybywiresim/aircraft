// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Navbar, t, PageLink, PageRedirect, TabRoutes } from '@flybywiresim/flypad';
import { CurrentFuel } from 'instruments/src/EFB/handleFuel/Pages/CurrentFuel';

export const HandleFuel = () => {
  const tabs: PageLink[] = [
    { name: 'CurrentFuel', alias: t('HandleFuel.CurrentFuel.Title'), component: <CurrentFuel /> },
  ];

  return (
    <div className="transform-gpu">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('HandleFuel.title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/handleFuel" />
      </div>
      <PageRedirect basePath="/handleFuel" tabs={tabs} /> // TODO : Delete ?
      <TabRoutes basePath="/handleFuel" tabs={tabs} /> // TODO : Delete ?
    </div>
  );
};
