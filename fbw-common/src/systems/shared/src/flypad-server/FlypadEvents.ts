import { SimbriefClient } from '@microsoft/msfs-sdk';

import { MetarParserType } from '../../../instruments/src/metarTypes';

type UnwrapPromise<T> = T extends PromiseLike<infer V> ? V : T

/**
 * Events sent from the flypad client to the flypad server
 */
export interface FlypadClientEvents {
    'fpc_HelloWorld': void,

    'fpc_GetMetar': string,

    'fpc_GetSimbriefOfp': void,
}

/**
 * Events sent from the flypad server to the flypad client
 */
export interface FlypadServerEvents {
    'fps_Initialized': void,

    'fps_HelloWorld': string,

    'fps_SendMetar': MetarParserType

    'fps_SendSimbriefOfp': UnwrapPromise<ReturnType<(typeof SimbriefClient)['getOfp']>>,
}
