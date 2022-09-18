import { NXDataStore } from '@shared/persistence';

export const getSimBridgeUrl = (): string => `http://localhost:${NXDataStore.get('CONFIG_SIMBRIDGE_PORT', '8380')}`;
