import { EventBus, SubEvent, Wait } from '@microsoft/msfs-sdk';

import { FlypadClientEvents, FlypadServerEvents } from './FlypadEvents';
import { MetarParserType } from '../../../instruments/src/metarTypes';

export class FlypadClient {
    private readonly eventSub = this.bus.getSubscriber<FlypadServerEvents>();

    private readonly eventPub = this.bus.getPublisher<FlypadClientEvents>();

    public readonly initialized = new SubEvent<FlypadClient, void>();

    constructor(private readonly bus: EventBus) {
        this.eventSub.on('fps_Initialized').handle(() => this.initialized.notify(this, undefined));
    }

    public async getMetar(icao: string): Promise<MetarParserType> {
        if (icao.length !== 4) {
            throw new Error('Invalid ICAO: must be 4 characters in length');
        }

        this.sendMessage('fpc_GetMetar', icao);

        return this.waitForMessage('fps_SendMetar');
    }

    public async getSimbriefOfp(): Promise<FlypadServerEvents['fps_SendSimbriefOfp']> {
        this.sendMessage('fpc_GetSimbriefOfp', undefined);

        return this.waitForMessage('fps_SendSimbriefOfp');
    }

    private sendMessage<k extends keyof FlypadClientEvents & string>(key: k, value: FlypadClientEvents[k]): void {
        this.eventPub.pub(key, value, true);
    }

    private async waitForMessage<k extends keyof FlypadServerEvents & string>(key: k): Promise<FlypadServerEvents[k]> {
        const response = await Wait.awaitConsumer(this.eventSub.on(key));

        return response;
    }
}
