// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from '../../../Localization/translation';
import { WeatherWidget } from '../WeatherWidget';
import { RemindersSection } from './RemindersSection';
import { useAppSelector } from '../../../Store/store';

export const WeatherReminder = () => {
  const { departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
  const { userDepartureIcao, userDestinationIcao } = useAppSelector((state) => state.dashboard);

  return (
    <RemindersSection title={t('Dashboard.ImportantInformation.Weather.Title')} noLink>
      <div className="space-y-6">
        <WeatherWidget name="origin" simbriefIcao={departingAirport} userIcao={userDepartureIcao} />
        <div className="h-1 w-full rounded-full bg-theme-accent" />
        <WeatherWidget name="destination" simbriefIcao={arrivingAirport} userIcao={userDestinationIcao} />
      </div>
    </RemindersSection>
  );
};
