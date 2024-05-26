import { initializeApp, Scope } from 'navigraph/app';
import { getAuth } from 'navigraph/auth';
import { getChartsAPI } from 'navigraph/charts';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

initializeApp({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: [Scope.CHARTS],
});

export const navigraphAuth = getAuth({
  storage: {
    getItem: (key) => NXDataStore.get(key),
    setItem: (key, value) => NXDataStore.set(key, value),
  },
  keys: {
    accessToken: 'NAVIGRAPH_ACCESS_TOKEN',
    refreshToken: 'NAVIGRAPH_REFRESH_TOKEN',
  },
});

export const navigraphCharts = getChartsAPI();
