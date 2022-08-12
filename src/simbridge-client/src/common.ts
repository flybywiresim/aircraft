import { NXDataStore } from '@shared/persistence';

export const simbridgeUrl: String = `http://localhost:${NXDataStore.get('CONFIG_SIMBRIDGE_PORT', '8380')}`;
