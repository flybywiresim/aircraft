// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { useInterval } from '@flybywiresim/react-components';
import React, { useEffect, useState } from 'react';
import { CloudArrowDown, ShieldLock } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import QRCode from 'qrcode.react';
import { NavigraphClient, NavigraphSubscriptionStatus, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { useHistory } from 'react-router-dom';
import { t } from '../../../translation';
import { useNavigraph } from '../Navigraph';

export type NavigraphAuthInfo = {
    loggedIn: false,
} | {
    loggedIn: true,

    username: string,

    subscriptionStatus: NavigraphSubscriptionStatus,
}

export const useNavigraphAuthInfo = (): NavigraphAuthInfo => {
    const navigraph = useNavigraph();

    const [tokenAvail, setTokenAvail] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<NavigraphSubscriptionStatus>(NavigraphSubscriptionStatus.None);

    useInterval(() => {
        if ((tokenAvail !== navigraph.hasToken) && navigraph.hasToken) {
            navigraph.subscriptionStatus().then(setSubscriptionStatus);
        } else if (!navigraph.hasToken) {
            setSubscriptionStatus(NavigraphSubscriptionStatus.None);
        }

        setTokenAvail(navigraph.hasToken);
    }, 1000, { runOnStart: true });

    if (tokenAvail) {
        return { loggedIn: tokenAvail, username: navigraph.userName, subscriptionStatus };
    }
    return { loggedIn: false };
};

const Loading = () => {
    const navigraph = useNavigraph();
    const [, setRefreshToken] = usePersistentProperty('NAVIGRAPH_REFRESH_TOKEN');
    const [showResetButton, setShowResetButton] = useState(false);

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
                className="flex justify-center items-center bg-theme-secondary rounded-md"
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
    const [displayAuthCode, setDisplayAuthCode] = useState(t('NavigationAndCharts.Navigraph.LoadingMsg').toUpperCase());

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

    useInterval(async () => {
        try {
            await navigraph.getToken();
        } catch (e) {
            toast.error(`Navigraph Authentication Error: ${e.message}`, { autoClose: 10_000 });
        }
    }, (navigraph.tokenRefreshInterval * 1000));

    useEffect(() => {
        if (!navigraph.hasToken) {
            navigraph.authenticate();
        }
    }, []);

    return (
        <div className="flex overflow-x-hidden justify-center items-center p-6 w-full h-full bg-theme-accent rounded-lg">
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
                    className="flex items-center px-4 mt-4 h-16 text-4xl font-bold tracking-wider bg-theme-secondary rounded-md border-2 border-theme-highlight"
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

export interface NavigraphAuthUIWrapperProps {
    showLogin: boolean,
    onSuccessfulLogin?: () => void,
}

export const NavigraphAuthUIWrapper: React.FC<NavigraphAuthUIWrapperProps> = ({ showLogin, onSuccessfulLogin, children }) => {
    const [tokenAvail, setTokenAvail] = useState(false);

    const navigraph = useNavigraph();

    useInterval(() => {
        if (!tokenAvail && navigraph.hasToken) {
            onSuccessfulLogin?.();
        }

        setTokenAvail(navigraph.hasToken);
    }, 1000, { runOnStart: true });

    let ui: React.ReactNode;
    if (tokenAvail) {
        ui = children;
    } else if (showLogin) {
        ui = <NavigraphAuthUI />;
    } else {
        ui = <NavigraphAuthRedirectUI />;
    }

    return (
        NavigraphClient.hasSufficientEnv
            ? (
                <>
                    {ui}
                </>
            )
            : (
                <div className="flex overflow-x-hidden justify-center items-center mr-4 w-full h-content-section-reduced">
                    <p className="pt-6 mb-6 text-3xl">{t('NavigationAndCharts.Navigraph.InsufficientEnv')}</p>
                </div>
            )
    );
};

export const NavigraphAuthRedirectUI = () => {
    const history = useHistory();

    const handleGoToThirdPArtySettings = () => {
        history.push('/settings/3rd-party-options');
    };

    return (
        <div className="flex justify-center items-center h-content-section-reduced rounded-lg border-2 border-theme-accent">
            <div className="flex flex-col justify-center items-center space-y-4">
                <h1>{t('NavigationAndCharts.Navigraph.GoToThirdPartyOptions.Title')}</h1>

                <button
                    type="button"
                    className="flex justify-center items-center py-2 space-x-4 w-52 text-theme-body
                         hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2
                         border-theme-highlight transition duration-100"
                    onClick={handleGoToThirdPArtySettings}
                >
                    {t('NavigationAndCharts.Navigraph.GoToThirdPartyOptions.Button')}
                </button>
            </div>
        </div>
    );
};
