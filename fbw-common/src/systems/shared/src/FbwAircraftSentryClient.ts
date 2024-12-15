// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';
import { Integration } from '@sentry/types';
import { NXDataStore } from './persistence';
import { PopUpDialog } from './popup';

export const SENTRY_CONSENT_KEY = 'SENTRY_CONSENT';

export enum SentryConsentState {
  Unknown = 'Unknown',
  Given = 'Given',
  Refused = 'Refused',
}

export interface FbwAircraftSentryClientConfiguration {
  /**
   * Sentry DSN
   */
  dsn: string;

  /**
   * Prefix of `build_info.json` file, for fetching commit SHA
   */
  buildInfoFilePrefix: string;

  /**
   * Whether to enable interaction tracing
   */
  enableTracing: boolean;

  /**
   * Whether this is the root client (ONLY SET THIS ONCE)
   */
  root: boolean;
}

/**
 * FBW sentry.io client for aircraft use
 */
export class FbwAircraftSentryClient {
  /**
   * Method called when a panel is initialized. If root client, runs the normal flow (ask for consent if state is unknown). Otherwise,
   * wait for `DataStore` property changes.
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   *
   * @returns a `Promise<boolean>` that indicates the result of the initial configuration
   */
  onInstrumentLoaded(config: FbwAircraftSentryClientConfiguration): Promise<boolean> {
    if (!config.dsn) {
      console.log('[SentryClient] No DSN defined. Will not try to initialize');

      return Promise.resolve(false);
    }

    this.runClientSubscription(config);

    if (config.root) {
      console.log('[SentryClient] Starting as root client');

      return this.runRootClientFlow(config);
    }

    return Promise.resolve(false);
  }

  /**
   * Runs the client subscription (subscribes to the NXDataStore property and controls the client accordingly)
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   */
  private async runClientSubscription(config: FbwAircraftSentryClientConfiguration) {
    NXDataStore.getAndSubscribe(SENTRY_CONSENT_KEY, (key, value) => {
      if (value === SentryConsentState.Given) {
        console.log('[SentryClient] Synchronised consent state is Given. Initializing sentry');
        FbwAircraftSentryClient.attemptInitializeSentry(config);
      }
      if (value === SentryConsentState.Refused) {
        console.log('[SentryClient] Synchronised consent state is Refused. Shutting down the client');
        FbwAircraftSentryClient.closeSentry();
      }
    });
  }

  /**
   * Runs the root client flow, checking if consent state is known, asking for it otherwise, then initializing appropriately
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   *
   * @returns a `Promise<boolean>` that indicates the result of the root client flow
   */
  private async runRootClientFlow(config: FbwAircraftSentryClientConfiguration): Promise<boolean> {
    const consentValue = NXDataStore.get(SENTRY_CONSENT_KEY, SentryConsentState.Unknown) as SentryConsentState;

    switch (consentValue) {
      case SentryConsentState.Given:
        console.log('[SentryClient] Consent state is Given. Initializing sentry');

        return FbwAircraftSentryClient.attemptInitializeSentry(config);
      case SentryConsentState.Unknown:
        console.log('[SentryClient] Consent state is Unknown. Asking for consent');

        // It seems that for some people, spawning the popup / writing to NXDataStore can cause a CTD if the flight is not fully loaded.
        // So instead, we wait for a bit after the FlightStart event to show it and gather consent.
        return new Promise((resolve, reject) => {
          const instrument = document.querySelector('vcockpit-panel > *');

          if (instrument) {
            instrument.addEventListener('FlightStart', () => {
              // ...and give ourselves some breathing room
              setTimeout(() => {
                resolve(
                  FbwAircraftSentryClient.requestConsent()
                    .then((didConsent) => {
                      if (didConsent) {
                        NXDataStore.set(SENTRY_CONSENT_KEY, SentryConsentState.Given);

                        console.log('[SentryClient] User requested consent state Given. Initializing sentry');

                        return FbwAircraftSentryClient.attemptInitializeSentry(config);
                      }

                      NXDataStore.set(SENTRY_CONSENT_KEY, SentryConsentState.Refused);

                      console.log('[SentryClient] User requested consent state Refused. Doing nothing');

                      return false;
                    })
                    .catch(() => false),
                );
              }, 1_000);
            });
          } else {
            reject(new Error('[SentryClient] Could not find an instrument element to hook onto'));
          }
        });
      case SentryConsentState.Refused:
        console.log('[SentryClient] Consent state is Refused. Doing nothing');
        break;
      default:
        console.log('[SentryClient] Consent state is corrupted. Doing nothing');
        break;
    }

    return false;
  }

  /**
   * Displays an MSFS popup request consent for error reporting
   *
   * @returns a `Promise<boolean` indicating the consent state
   */
  static async requestConsent() {
    const popup = new PopUpDialog();

    return new Promise<boolean>((resolve) => {
      popup.showPopUp(
        'AIRCRAFT - ERROR REPORTING',
        'Are you willing to help FlyByWire Simulations by enabling anonymous reporting of errors that may occur in the future? ' +
          'This is 100% optional and we will never collect your personal data, but it will help us diagnose issues quickly.',
        'normal',
        () => resolve(true),
        () => resolve(false),
      );
    });
  }

  /**
   * Attempts to initialise the Sentry client, assuming consent is given
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   *
   * @returns a `Promise<boolean>` indicating whether the client was successfully initialised
   */
  private static async attemptInitializeSentry(config: FbwAircraftSentryClientConfiguration): Promise<boolean> {
    return FbwAircraftSentryClient.initializeSentry(config)
      .then(() => true)
      .catch((e) => {
        console.error('[SentryClient] Error while initializing sentry');
        console.error(e);

        return false;
      });
  }

  /**
   * Closes the Sentry client
   */
  private static closeSentry() {
    Sentry.close();

    console.log('[SentryClient] Sentry closed');
  }

  /**
   * Initialises the Sentry client, assuming consent is given
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   */
  private static async initializeSentry(config: FbwAircraftSentryClientConfiguration) {
    let release = 'unknown';
    try {
      const manifest = await (await fetch(`/VFS/${config.buildInfoFilePrefix}_build_info.json`)).json();

      release = manifest.pretty_release_name;
    } catch (e) {
      console.warn(
        `[SentryClient] Could not load ${config.buildInfoFilePrefix}_build_info.json. Using 'unknown' as release name`,
      );
    }

    const integrations: Integration[] = [new CaptureConsoleIntegration({ levels: ['error'] })];

    if (config.enableTracing) {
      integrations.push(new BrowserTracing());
    }

    Sentry.init({
      dsn: config.dsn,
      release,
      integrations,
      sampleRate: 0.1,
    });

    console.log('[SentryClient] Sentry initialized');

    NXDataStore.getAndSubscribe('A32NX_SENTRY_SESSION_ID', (_, value) => {
      if (value) {
        Sentry.setTag('session_id', value);
        console.log('[SentryClient] Sentry tag "session_id" set to', value);
      }
    });
  }
}
