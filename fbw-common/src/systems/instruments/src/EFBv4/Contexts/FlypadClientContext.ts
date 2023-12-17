import { Context } from '@microsoft/msfs-sdk';
import { FlypadClient } from '@flybywiresim/fbw-sdk';

// eslint-disable-next-line import/no-mutable-exports
export let flypadClientContext: Context<FlypadClient>;

export function initializeFlypadClientContext(client: FlypadClient): void {
    flypadClientContext = new Context<FlypadClient>(client);
}
