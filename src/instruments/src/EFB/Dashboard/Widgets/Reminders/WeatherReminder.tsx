import React from 'react';
import { useTranslation } from 'react-i18next';
import { WeatherWidget } from '../WeatherWidget';
import { RemindersSection } from './RemindersSection';
import { useAppSelector } from '../../../Store/store';

export const WeatherReminder = () => {
    const { departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const { userDepartureIcao, userDestinationIcao } = useAppSelector((state) => state.dashboard);
    const { t } = useTranslation();

    return (
        <RemindersSection title={t('Dashboard.Weather')} noLink>
            <div className="space-y-6">
                <WeatherWidget name="origin" simbriefIcao={departingAirport} userIcao={userDepartureIcao} />
                <div className="w-full h-1 rounded-full bg-theme-accent" />
                <WeatherWidget name="destination" simbriefIcao={arrivingAirport} userIcao={userDestinationIcao} />
            </div>
        </RemindersSection>
    );
};
