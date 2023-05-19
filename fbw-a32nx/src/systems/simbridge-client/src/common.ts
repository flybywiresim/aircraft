import { NXDataStore } from '@shared/persistence';

export const getSimBridgeIp = (): string => (NXDataStore.get('CONFIG_SIMBRIDGE_REMOTE', 'local') === 'local' ? 'localhost' : NXDataStore.get('CONFIG_SIMBRIDGE_IP', 'localhost'));

export const getSimBridgeUrl = (): string => `http://${getSimBridgeIp()}:${NXDataStore.get('CONFIG_SIMBRIDGE_PORT', '8380')}`;

export const fetchWithTimeout = (resource: RequestInfo, options?: object, timeout: number = 2000): Promise<Response> => new Promise((resolve, reject) => {
    // AbortController not available in Coherent -_-
    const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout} ms!`));
    }, timeout);

    fetch(resource, options).then((value) => {
        clearTimeout(timer);
        resolve(value);
    }).catch((reason) => {
        clearTimeout(timer);
        reject(reason);
    });
});
