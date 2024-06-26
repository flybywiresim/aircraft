// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { useInterval } from '@flybywiresim/react-components';
import React, { useEffect, useState } from 'react';
import { CloudArrowDown, ShieldLock } from 'react-bootstrap-icons';
import { DeviceFlowParams } from 'navigraph/auth';
import QRCode from 'qrcode.react';
import { NavigraphKeys, NavigraphSubscriptionStatus } from '@flybywiresim/fbw-sdk';
import { useHistory } from 'react-router-dom';
import { t } from '../../../Localization/translation';
import { useNavigraphAuth } from '../../../../react/navigraph';
import { CancelToken } from '@navigraph/auth';

const NAVIGRAPH_SUBSCRIPTION_CHARTS = 'charts';
const NAVIGRAPH_SUBSCRIPTION_FMSDATA = 'fmsdata';

export type NavigraphAuthInfo =
  | {
      loggedIn: false;
    }
  | {
      loggedIn: true;

      username: string;

      subscriptionStatus: NavigraphSubscriptionStatus;
    };

export const useNavigraphAuthInfo = (): NavigraphAuthInfo => {
  const [info, setInfo] = useState<NavigraphAuthInfo>({ loggedIn: false });

  const navigraphAuth = useNavigraphAuth();

  if (navigraphAuth.user && info.loggedIn === false) {
    setInfo({
      loggedIn: true,
      username: navigraphAuth.user.preferred_username,
      subscriptionStatus: [NAVIGRAPH_SUBSCRIPTION_CHARTS, NAVIGRAPH_SUBSCRIPTION_FMSDATA].every((it) =>
        navigraphAuth.user.subscriptions.includes(it),
      )
        ? NavigraphSubscriptionStatus.Unlimited
        : NavigraphSubscriptionStatus.Unknown,
    });
  } else if (!navigraphAuth.user && info.loggedIn === true) {
    setInfo({ loggedIn: false });
  }

  return info;
};

interface LoadingProps {
  onNewDeviceFlowParams: (params: DeviceFlowParams) => void;
}

const Loading: React.FC<LoadingProps> = ({ onNewDeviceFlowParams }) => {
  const navigraph = useNavigraphAuth();
  const [showResetButton, setShowResetButton] = useState(false);
  const [cancelToken] = useState(CancelToken.source());

  const handleResetRefreshToken = () => {
    cancelToken.cancel('reset requested by user');

    navigraph.signIn((params) => {
      onNewDeviceFlowParams(params);
    });
  };

  useEffect(() => {
    navigraph.signIn((params) => {
      onNewDeviceFlowParams(params);
    }, cancelToken.token);

    const timeout = setTimeout(() => {
      setShowResetButton(true);
    }, 2_000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="flex items-center justify-center rounded-md bg-theme-secondary"
        style={{ width: '400px', height: '400px' }}
      >
        <CloudArrowDown className="animate-bounce" size={40} />
      </div>
      <button
        type="button"
        className={`mt-6 flex items-center justify-center rounded-md bg-theme-highlight p-2 opacity-0 transition duration-200 focus:outline-none ${showResetButton && 'opacity-100'}`}
        style={{ width: '400px' }}
        onClick={handleResetRefreshToken}
      >
        {t('NavigationAndCharts.Navigraph.ResetNavigraphAuthentication')}
      </button>
    </div>
  );
};

export const NavigraphAuthUI = () => {
  const [params, setParams] = useState<DeviceFlowParams | null>(null);

  const [displayAuthCode, setDisplayAuthCode] = useState(t('NavigationAndCharts.Navigraph.LoadingMsg').toUpperCase());

  useInterval(() => {
    if (params?.user_code) {
      setDisplayAuthCode(params.user_code);
    }
  }, 1000);

  const hasQr = !!params?.verification_uri_complete;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-x-hidden rounded-lg bg-theme-accent p-6">
      <div className="flex flex-col items-center justify-center">
        <ShieldLock className="mr-2" size={40} />

        <h2 className="mt-2 flex items-center justify-center">
          {t('NavigationAndCharts.Navigraph.AuthenticateWithNavigraph')}
        </h2>

        <p className="mt-6 w-2/3 text-center">
          {t('NavigationAndCharts.Navigraph.ScanTheQrCodeOrOpen')}{' '}
          <span className="text-theme-highlight">{params?.verification_uri_complete ?? ''}</span>{' '}
          {t('NavigationAndCharts.Navigraph.IntoYourBrowserAndEnterTheCodeBelow')}
        </p>

        <h1
          className="mt-4 flex h-16 items-center rounded-md border-2 border-theme-highlight bg-theme-secondary px-4 text-4xl font-bold tracking-wider"
          style={{ minWidth: '200px' }}
        >
          {displayAuthCode}
        </h1>

        <div className="mt-16">
          {hasQr ? (
            <div className="rounded-md bg-white p-3">
              <QRCode value={params.verification_uri_complete} size={400} />
            </div>
          ) : (
            <Loading onNewDeviceFlowParams={setParams} />
          )}
        </div>
      </div>
    </div>
  );
};

export interface NavigraphAuthUIWrapperProps {
  showLogin: boolean;
  onSuccessfulLogin?: () => void;
}

export const NavigraphAuthUIWrapper: React.FC<NavigraphAuthUIWrapperProps> = ({
  showLogin,
  onSuccessfulLogin,
  children,
}) => {
  const navigraph = useNavigraphAuth();

  useInterval(
    () => {
      if (navigraph.user) {
        onSuccessfulLogin?.();
      }
    },
    1000,
    { runOnStart: true },
  );

  let ui: React.ReactNode;
  if (navigraph.user) {
    ui = children;
  } else if (showLogin) {
    ui = <NavigraphAuthUI />;
  } else {
    ui = <NavigraphAuthRedirectUI />;
  }

  return NavigraphKeys.hasSufficientEnv ? (
    <>{ui}</>
  ) : (
    <div className="mr-4 flex h-content-section-reduced w-full items-center justify-center overflow-x-hidden">
      <p className="mb-6 pt-6 text-3xl">{t('NavigationAndCharts.Navigraph.InsufficientEnv')}</p>
    </div>
  );
};

export const NavigraphAuthRedirectUI = () => {
  const history = useHistory();

  const handleGoToThirdPartySettings = () => {
    history.push('/settings/3rd-party-options');
  };

  return (
    <div className="flex h-content-section-reduced items-center justify-center rounded-lg border-2 border-theme-accent">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1>{t('NavigationAndCharts.Navigraph.GoToThirdPartyOptions.Title')}</h1>

        <button
          type="button"
          className="flex w-52 items-center justify-center space-x-4 rounded-md border-2
                         border-theme-highlight bg-theme-highlight py-2 text-theme-body transition
                         duration-100 hover:bg-theme-body hover:text-theme-highlight"
          onClick={handleGoToThirdPartySettings}
        >
          {t('NavigationAndCharts.Navigraph.GoToThirdPartyOptions.Button')}
        </button>
      </div>
    </div>
  );
};
