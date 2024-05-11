// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FbwAircraftSentryClient } from '@flybywiresim/fbw-sdk';

declare const process: any;

new FbwAircraftSentryClient().onInstrumentLoaded({
  dsn: process.env.SENTRY_DSN,
  buildInfoFilePrefix: process.env.AIRCRAFT_PROJECT_PREFIX,
  root: false,
  enableTracing: false,
});
