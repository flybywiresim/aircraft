// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { initializeApp, Scope } from 'navigraph/app';
import { getAuth } from 'navigraph/auth';
import { getChartsAPI } from 'navigraph/charts';
import { NXDataStore } from '../../shared/src/persistence';

if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
  initializeApp({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: [Scope.CHARTS, Scope.AMDB],
  });
}

export const navigraphAuth = getAuth({
  storage: {
    getItem: (key) => NXDataStore.getLegacy(key) ?? '',
    setItem: (key, value) => NXDataStore.setLegacy(key, value),
  },
  keys: {
    accessToken: 'NAVIGRAPH_ACCESS_TOKEN',
    refreshToken: 'NAVIGRAPH_REFRESH_TOKEN',
  },
});

export const navigraphCharts = getChartsAPI();
