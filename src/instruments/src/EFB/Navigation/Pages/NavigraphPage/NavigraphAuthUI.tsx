import { useInterval } from '@flybywiresim/react-components';
import React, { useEffect, useState } from 'react';
import { CloudArrowDown, ShieldLock } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import QRCode from 'qrcode.react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useTranslation } from 'react-i18next';
import { useNavigraph } from '../../../ChartsApi/Navigraph';

const Loading = () => {
    const navigraph = useNavigraph();
    const [, setRefreshToken] = usePersistentProperty('NAVIGRAPH_REFRESH_TOKEN');
    const [showResetButton, setShowResetButton] = useState(false);

    const { t } = useTranslation();

    const handleResetRefreshToken = () => {
        setRefreshToken('');
        navigraph.authenticate();
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowResetButton(true);
        }, 2_000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center">
            <div
                className="flex justify-center items-center rounded-md bg-theme-secondary"
                style={{ width: '400px', height: '400px' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
            <button
                type="button"
                className={`flex justify-center items-center p-2 mt-6 rounded-md focus:outline-none bg-theme-highlight transition duration-200 opacity-0 ${showResetButton && 'opacity-100'}`}
                style={{ width: '400px' }}
                onClick={handleResetRefreshToken}
            >
                {t('NavigationAndCharts.Navigraph.ResetNavigraphAuthentication')}
            </button>
        </div>
    );
};

export const NavigraphAuthUI = () => {
    const navigraph = useNavigraph();
    const [displayAuthCode, setDisplayAuthCode] = useState('LOADING');

    const { t } = useTranslation();

    useInterval(() => {
        if (navigraph.auth.code) {
            setDisplayAuthCode(navigraph.auth.code);
        }
    }, 1000);

    const hasQr = !!navigraph.auth.qrLink;

    useInterval(async () => {
        if (!navigraph.hasToken) {
            try {
                await navigraph.getToken();
            } catch (e) {
                toast.error(`Navigraph Authentication Error: ${e.message}`, { autoClose: 10_000 });
            }
        }
    }, (navigraph.auth.interval * 1000));

    return (
        <div className="flex overflow-x-hidden justify-center items-center p-6 w-full rounded-lg h-content-section-reduced bg-theme-accent">
            <div className="flex flex-col justify-center items-center">
                <ShieldLock className="mr-2" size={40} />

                <h2 className="flex justify-center items-center mt-2">
                    {t('NavigationAndCharts.Navigraph.AuthenticateWithNavigraph')}
                </h2>

                <p className="mt-6 w-2/3 text-center">
                    {t('NavigationAndCharts.Navigraph.ScanTheQrCodeOrOpen')}
                    {' '}
                    <span className="text-theme-highlight">{navigraph.auth.link}</span>
                    {' '}
                    {t('NavigationAndCharts.Navigraph.IntoYourBrowserAndEnterTheCodeBelow')}
                </p>

                <h1
                    className="flex items-center px-4 mt-4 h-16 text-4xl font-bold tracking-wider rounded-md border-2 bg-theme-secondary border-theme-highlight"
                    style={{ minWidth: '200px' }}
                >
                    {displayAuthCode}
                </h1>

                <div className="mt-16">
                    {hasQr
                        ? (
                            <div className="p-3 bg-white rounded-md">
                                <QRCode
                                    value={navigraph.auth.qrLink}
                                    size={400}
                                />
                            </div>
                        )
                        : <Loading />}
                </div>
            </div>
        </div>
    );
};
