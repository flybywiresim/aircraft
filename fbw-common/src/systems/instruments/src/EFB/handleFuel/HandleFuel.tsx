// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Navbar, t, PageLink, PageRedirect, TabRoutes } from '@flybywiresim/flypad';

export const HandleFuel = () => {
  const tabs: PageLink[] = [
  ];

  return (
    <div className="transform-gpu">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('HandleFuel.Title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/handleFuel" />
        <div className="mr-4 flex h-content-section-reduced w-full items-center justify-center overflow-x-hidden">
          <p className="mb-6 pt-6 text-3xl">{t('HandleFuel.CurrentFuelIs') + 12}</p>
        </div>
      </div>
    </div>
  );
};
