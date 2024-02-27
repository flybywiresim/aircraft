// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from '../Localization/translation';
import { PageLink, PageRedirect, TabRoutes } from '../Utils/routing';
import { Navbar } from '../UtilComponents/Navbar';
import { AircraftPresets } from './Widgets/AircraftPresets';
import { LightPresets } from './Widgets/LightPresets';
import { PresetsHelp } from './Widgets/PresetsHelp';

export const Presets = () => {
  const tabs: PageLink[] = [
    { name: 'Interior Lighting', alias: t('Presets.InteriorLighting.Title'), component: <LightPresets /> },
    { name: 'Aircraft States', alias: t('Presets.AircraftStates.Title'), component: <AircraftPresets /> },
    { name: '?', component: <PresetsHelp /> },
  ];

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('Presets.Title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/presets" />
      </div>
      <PageRedirect basePath="/presets" tabs={tabs} />
      <TabRoutes basePath="/presets" tabs={tabs} />
    </div>
  );
};
