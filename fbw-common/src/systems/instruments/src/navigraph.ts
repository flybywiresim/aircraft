// @ts-strict-ignore
// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { initializeApp, Scope } from 'navigraph/app';
import { getAuth } from 'navigraph/auth';
import { getChartsAPI } from 'navigraph/charts';
import { NXDataStore } from '../../shared/src/persistence';

initializeApp({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: [Scope.CHARTS, 'amdb' as Scope], // Navigraph SDK doesn't offer AMDB as Scope yet
});

export const navigraphAuth = getAuth({
  storage: {
    getItem: (key) => NXDataStore.getLegacy(key),
    setItem: (key, value) => NXDataStore.setLegacy(key, value),
  },
  keys: {
    accessToken: 'NAVIGRAPH_ACCESS_TOKEN',
    refreshToken: 'NAVIGRAPH_REFRESH_TOKEN',
  },
});

export const navigraphCharts = getChartsAPI();
