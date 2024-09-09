// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Navbar, t, PageLink, PageRedirect, TabRoutes } from '@flybywiresim/flypad';


export const CurrentFuel = () => {
  const tabs: PageLink[] = [

  ];

  return (
    <div className="transform-gpu">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('HandleFuel.CurrentFuel.CurrentFuel')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/ground" />
      </div>
      <PageRedirect basePath="/ground" tabs={tabs} />
      <TabRoutes basePath="/ground" tabs={tabs} />
    </div>
  );
};
