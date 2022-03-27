import { NXDataStore } from '@shared/persistence';

export const localApiUrl: String = `http://localhost:${NXDataStore.get('CONFIG_LOCAL_API_PORT', '8380')}`;
