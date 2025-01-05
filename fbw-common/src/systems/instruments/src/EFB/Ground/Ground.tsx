// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Navbar, t, PageLink, PageRedirect, TabRoutes } from '@flybywiresim/flypad';
import { ServicesPage } from './Pages/Services/ServicesPage';
import { PushbackPage } from './Pages/Pushback/PushbackPage';
import { PayloadPage } from './Pages/Payload/PayloadPage';
import { Fuel } from './Pages/Fuel/Fuel';

export const Ground = () => {
  const tabs: PageLink[] = [
    { name: 'Services', alias: t('Ground.Services.Title'), component: <ServicesPage /> },
    { name: 'Fuel', alias: t('Ground.Fuel.Title'), component: <Fuel /> },
    { name: 'Payload', alias: t('Ground.Payload.Title'), component: <PayloadPage /> },
    { name: 'Pushback', alias: t('Ground.Pushback.Title'), component: <PushbackPage /> },
  ];

  return (
    <div className="transform-gpu">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('Ground.Title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/ground" />
      </div>
      <PageRedirect basePath="/ground" tabs={tabs} />
      <TabRoutes basePath="/ground" tabs={tabs} />
    </div>
  );
};
