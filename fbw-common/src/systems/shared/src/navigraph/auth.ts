import { NavigraphKeys, NXDataStore } from '@flybywiresim/fbw-sdk';
import { initializeApp, Scope } from 'navigraph/app';
import { getAuth } from 'navigraph/auth';

initializeApp({
  clientId: NavigraphKeys.clientId,
  clientSecret: NavigraphKeys.clientSecret,
  scopes: [Scope.CHARTS, 'amdb' as Scope],
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
