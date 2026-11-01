// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from './Localization/translation';
import { SENTRY_CONSENT_KEY, SentryConsentState, usePersistentProperty } from '@flybywiresim/fbw-sdk-react';

export const TelemetryConsent: React.FC = () => {
  const [consentState, setConsentState] = usePersistentProperty(SENTRY_CONSENT_KEY, SentryConsentState.Unknown);

  const handleCancel = () => setConsentState(SentryConsentState.Refused);

  const handleConfirm = () => setConsentState(SentryConsentState.Given);

  return consentState === SentryConsentState.Unknown ? (
    <div className="z-9001 absolute left-0 top-0 flex h-full w-full items-center justify-center bg-theme-body">
      <div className="w-5/12 rounded-xl border-2 border-theme-accent bg-theme-body p-8">
        <h1 className="font-bold">{t('TelemetryConsent.Title')}</h1>
        <p className="mt-4">{t('TelemetryConsent.Message')}</p>

        <div className="mt-8 flex flex-row space-x-4">
          <div
            className="flex w-full items-center justify-center rounded-md border-2 border-theme-accent bg-theme-accent px-8 py-2 text-center text-theme-text transition duration-100 hover:border-theme-highlight hover:bg-theme-body hover:text-theme-highlight"
            onClick={handleCancel}
          >
            {t('Modals.Cancel')}
          </div>
          <div
            className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight px-8 py-2 text-center text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
            onClick={handleConfirm}
          >
            {t('Modals.Confirm')}
          </div>
        </div>
      </div>
    </div>
  ) : null;
};
