import { Context } from '@microsoft/msfs-sdk';
import { FlypadClient } from '@flybywiresim/fbw-sdk';

export let flypadClientContext: Context<FlypadClient>;

export function initializeFlypadClientContext(client: FlypadClient): void {
  flypadClientContext = new Context<FlypadClient>(client);
}
