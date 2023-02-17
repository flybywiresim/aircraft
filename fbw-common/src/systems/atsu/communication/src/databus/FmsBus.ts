import { AtsuStatusCodes, DatalinkModeCode, DatalinkStatusCode } from '@atsu/common';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export interface RouterFmsMessages {
    routerDatalinkStatus: {
        vhf: DatalinkStatusCode,
        satellite: DatalinkStatusCode,
        hf: DatalinkStatusCode,
    };
    routerDatalinkMode: {
        vhf: DatalinkModeCode,
        satellite: DatalinkModeCode,
        hf: DatalinkModeCode,
    };
}

export interface FmsRouterMessages {
    routerConnect: { requestId: number, callsign: string };
    routerDisconnect: number;
    routerRequestStationAvailable: { requestId: number, callsign: string };
    routerManagementResponse: { requestId: number, status: AtsuStatusCodes };
}

export type FmsRouterBusCallbacks = {
    connect: (callsign: string) => Promise<AtsuStatusCodes>;
    disconnect: () => Promise<AtsuStatusCodes>;
    stationAvailable: (callsign: string) => Promise<AtsuStatusCodes>;
}

export class FmsRouterBus {
    private readonly subscriber: EventSubscriber<FmsRouterMessages>;

    private readonly publisher: Publisher<FmsRouterMessages>;

    private callbacks: FmsRouterBusCallbacks = {
        connect: null,
        disconnect: null,
        stationAvailable: null,
    };

    private async requestWithParameter(value: string, requestId: number, callback: (value: string) => Promise<AtsuStatusCodes>): Promise<void> {
        if (callback !== null) {
            callback(value).then((code) => {
                this.publisher.pub('routerManagementResponse', { requestId, status: code }, true, false);
            });
        }
    }

    private async requestWithoutParameter(requestId: number, callback: () => Promise<AtsuStatusCodes>): Promise<void> {
        if (callback !== null) {
            callback().then((code) => {
                this.publisher.pub('routerManagementResponse', { requestId, status: code }, true, false);
            });
        }
    }

    constructor(private readonly bus: EventBus) {
        this.subscriber = this.bus.getSubscriber<FmsRouterMessages>();
        this.publisher = this.bus.getPublisher<FmsRouterMessages>();
    }

    public initialize(): void {
        this.subscriber.on('routerConnect').handle((data) => this.requestWithParameter(data.callsign, data.requestId, this.callbacks.connect));
        this.subscriber.on('routerDisconnect').handle((data) => this.requestWithoutParameter(data, this.callbacks.disconnect));
        this.subscriber.on('routerRequestStationAvailable').handle((data) => this.requestWithParameter(data.callsign, data.requestId, this.callbacks.connect));
    }

    public addDataCallback<K extends keyof FmsRouterBusCallbacks>(event: K, callback: FmsRouterBusCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}

export class RouterFmsBus {
    private readonly publisher: Publisher<RouterFmsMessages>;

    constructor(private readonly bus: EventBus) {
        this.publisher = this.bus.getPublisher<RouterFmsMessages>();
    }

    public sendDatalinkStatus(status: { vhf: DatalinkStatusCode, satellite: DatalinkStatusCode, hf: DatalinkStatusCode }): void {
        this.publisher.pub('routerDatalinkStatus', status, true, false);
    }

    public sendDatalinkMode(mode: { vhf: DatalinkModeCode, satellite: DatalinkModeCode, hf: DatalinkModeCode }): void {
        this.publisher.pub('routerDatalinkMode', mode, true, false);
    }
}
