// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { ChartFoxStatus } from '@flybywiresim/fbw-sdk';
import { useHistory } from 'react-router-dom';
import { t } from '../../../Localization/translation';
import { useChartFox } from '../ChartFox';

export const ChartFoxAuthUIWrapper = ({ children }) => {
    const chartFox = useChartFox();

    if (chartFox.status === ChartFoxStatus.LoggedIn) {
        return children;
    }

    return <ChartFoxAuthRedirectUI />;
};

export const ChartFoxAuthRedirectUI = () => {
    const history = useHistory();

    const handleGoToThirdPartySettings = () => {
        history.push('/settings/3rd-party-options');
    };

    return (
        <div className="flex h-content-section-reduced items-center justify-center rounded-lg border-2 border-theme-accent">
            <div className="flex flex-col items-center justify-center space-y-4">
                <h1>{t('NavigationAndCharts.ChartFox.GoToThirdPartyOptions.Title')}</h1>

                <button
                    type="button"
                    className="flex w-52 items-center justify-center space-x-4 rounded-md border-2
                         border-theme-highlight bg-theme-highlight py-2 text-theme-body transition
                         duration-100 hover:bg-theme-body hover:text-theme-highlight"
                    onClick={handleGoToThirdPartySettings}
                >
                    {t('NavigationAndCharts.ChartFox.GoToThirdPartyOptions.Button')}
                </button>
            </div>
        </div>
    );
};
