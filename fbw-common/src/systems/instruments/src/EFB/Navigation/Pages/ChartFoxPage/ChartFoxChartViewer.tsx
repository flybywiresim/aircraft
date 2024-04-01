import React, { useEffect, useState } from 'react';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { ClientState } from '@flybywiresim/fbw-sdk';
import { useAppSelector } from '../../../Store/store';
import { ChartFileType, NavigationTab } from '../../../Store/features/navigationPage';
import { t } from '../../../Localization/translation';
import { ChartViewer } from '../../Navigation';

enum ConnectionState {
    ATTEMPTING,
    FAILED,
    ESTABLISHED,
}

export const ChartFoxChartViewer = ({ onConnectionRetry }) => {
    const [connectionState, setConnectionState] = useState(ConnectionState.ATTEMPTING);

    const { chartName } = useAppSelector((state) => state.navigationTab[NavigationTab.CHARTFOX]);

    const tryConnection = async () => {
        if (!ClientState.getInstance().isConnected()) {
            window.setTimeout(() => {
                setConnectionState(ConnectionState.FAILED);
            }, 500);
            return;
        }
        setConnectionState(ConnectionState.ESTABLISHED);
    };

    const handleConnectionRetry = () => {
        setConnectionState(ConnectionState.ATTEMPTING);
        onConnectionRetry();
        tryConnection();
    };

    useEffect(() => {
        tryConnection();
    }, [chartName]);

    // using chartName instead of chartLinks because PDF failures won't set chartLinks
    if (!chartName.light || !chartName.dark) {
        return (
            <div
                className="relative flex items-center justify-center rounded-lg bg-theme-accent ml-6 rounded-l-none"
                style={{ width: '804px' }}
            >
                <p>{t('NavigationAndCharts.ThereIsNoChartToDisplay')}</p>
            </div>
        );
    }

    // Don't require a client connection for image-based charts
    if (chartName.fileType !== ChartFileType.Pdf) {
        return <ChartViewer />;
    }

    // ---- PDF territory ----
    switch (connectionState) {
    case ConnectionState.ATTEMPTING:
        return (
            <div
                className="relative flex items-center justify-center rounded-lg bg-theme-accent ml-6 rounded-l-none"
                style={{ width: '804px' }}
            >
                <h1>{t('NavigationAndCharts.ChartFox.EstablishingConnection')}</h1>
                <CloudArrowDown size={40} className="animate-bounce" />
            </div>
        );
    case ConnectionState.ESTABLISHED:
        return <ChartViewer />;
    case ConnectionState.FAILED:
        return (
            <div
                className="relative flex items-center justify-center rounded-lg bg-theme-accent ml-6"
                style={{ width: '804px' }}
            >
                <div className="space-y-4">
                    <h1>{t('NavigationAndCharts.ChartFox.FailedToEstablishConnection')}</h1>
                    <button
                        type="button"
                        className="flex w-full items-center justify-center space-x-4 rounded-md border-2
                            border-theme-highlight bg-theme-highlight py-2 text-theme-body transition
                            duration-100 hover:bg-theme-body hover:text-theme-highlight"
                        onClick={handleConnectionRetry}
                    >
                        {t('NavigationAndCharts.ChartFox.Retry')}
                    </button>
                </div>
            </div>
        );
    default: return <></>;
    }
};
