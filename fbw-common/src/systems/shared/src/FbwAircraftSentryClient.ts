// Copyright (c) 2021-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

import { NXDataStore } from './persistence';
import { SentryReporter } from './SentryReporter';

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
  dsn?: string;

  /**
   * Prefix of `build_info.json` file, for fetching commit SHA
   */
  buildInfoFilePrefix?: string;
}

/**
 * FBW sentry.io client for aircraft use
 */
export class FbwAircraftSentryClient {
  private static reporter: SentryReporter | undefined;

  private static initializationPromise: Promise<void> | undefined;

  private static lifecycleGeneration = 0;

  /**
   * Method called when a panel is initialized. Waits for `DataStore` property changes.
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

    return Promise.resolve(false);
  }

  /**
   * Runs the client subscription (subscribes to the NXDataStore property and controls the client accordingly)
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   */
  private async runClientSubscription(config: FbwAircraftSentryClientConfiguration) {
    NXDataStore.getAndSubscribeLegacy(SENTRY_CONSENT_KEY, (key, value) => {
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
    FbwAircraftSentryClient.lifecycleGeneration += 1;
    FbwAircraftSentryClient.reporter?.close();
    FbwAircraftSentryClient.reporter = undefined;

    console.log('[SentryClient] Sentry closed');
  }

  /**
   * Initialises the Sentry client, assuming consent is given
   *
   * @param config a {@link FbwAircraftSentryClientConfiguration} object
   */
  private static async initializeSentry(config: FbwAircraftSentryClientConfiguration) {
    if (FbwAircraftSentryClient.reporter) {
      return;
    }

    if (FbwAircraftSentryClient.initializationPromise) {
      return FbwAircraftSentryClient.initializationPromise;
    }

    const generation = FbwAircraftSentryClient.lifecycleGeneration;
    const initializationPromise = FbwAircraftSentryClient.doInitializeSentry(config, generation);
    FbwAircraftSentryClient.initializationPromise = initializationPromise;

    try {
      await initializationPromise;
    } finally {
      if (FbwAircraftSentryClient.initializationPromise === initializationPromise) {
        FbwAircraftSentryClient.initializationPromise = undefined;
      }
    }
  }

  private static async doInitializeSentry(config: FbwAircraftSentryClientConfiguration, generation: number) {
    if (!config.buildInfoFilePrefix || !config.dsn) {
      console.log('[SentryClient] Sentry not initialised due to missing config.');
      return;
    }

    let release = 'unknown';
    let clientVersion = 'unknown';
    try {
      const manifest = await (await fetch(`/VFS/${config.buildInfoFilePrefix}_build_info.json`)).json();

      if (typeof manifest.pretty_release_name === 'string' && manifest.pretty_release_name) {
        release = manifest.pretty_release_name;
      }
      if (typeof manifest.version === 'string' && manifest.version) {
        clientVersion = manifest.version;
      }
    } catch (_e) {
      console.warn(
        `[SentryClient] Could not load ${config.buildInfoFilePrefix}_build_info.json. Using 'unknown' as release name`,
      );
    }

    if (generation !== FbwAircraftSentryClient.lifecycleGeneration) {
      return;
    }

    const reporter = new SentryReporter(config.dsn, release, clientVersion);
    reporter.start();
    FbwAircraftSentryClient.reporter = reporter;

    console.log('[SentryClient] Sentry initialized');

    NXDataStore.getAndSubscribeLegacy('A32NX_SENTRY_SESSION_ID', (_, value) => {
      if (value) {
        reporter.setSessionId(value);
        console.log('[SentryClient] Sentry tag "session_id" set to', value);
      }
    });
  }
}
