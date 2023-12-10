import { Wait } from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { protocolV0 } from '@flybywiresim/remote-bridge-types';

import { v4 } from 'uuid';

const MAX_CONNECTION_ATTEMPTS = 10;

const EXCLUDED_DATA_STORAGE_KEYS = [
    'A32NX_NAVIGRAPH_REFRESH_TOKEN',
];

export interface RemoteClientOptions {
    websocketUrl: string,
    clientName: string,
    airframeName: string,
    instrumentsMetadataFile: string,
}

export class RemoteClient {
    private ws: WebSocket | null = null;

    private readonly url: string;

    private readonly airframeName: string;

    private readonly clientName: string;

    private readonly clientID = v4();

    private instruments: protocolV0.InstrumentMetadata[] = [];

    private connectionAttemptCount = 0;

    private simVarSubscriptions: {
        simVar: string,
        simVarType: 'simVar' | 'globalVar',
        unit: string,
        id: number,
        fromClientID: string,
        subscriptionGroupID: string,
    }[] = [];

    private simVarValueCache: Record<number, any> = {};

    private viewListeners = new Map<string, ViewListener.ViewListener>();

    private aircraftDataUpdateInterval: number | null = null;

    constructor(options: RemoteClientOptions) {
        this.url = options.websocketUrl;
        this.airframeName = options.airframeName;
        this.clientName = options.clientName;

        this.attemptConnect();
        this.fetchInstrumentsMetadata(options.instrumentsMetadataFile).then((metadata) => this.instruments = metadata);
    }

    public update(): void {
        if (!this.ws) {
            return;
        }

        const data: [number, number][] = [];

        for (const simvar of this.simVarSubscriptions) {
            const value = simvar.simVarType === 'simVar'
                ? SimVar.GetSimVarValue(simvar.simVar, simvar.unit)
                : SimVar.GetGlobalVarValue(simvar.simVar, simvar.unit);

            if (value !== this.simVarValueCache[simvar.id]) {
                data.push([simvar.id, value]);

                this.simVarValueCache[simvar.id] = value;
            }
        }

        if (data.length > 0) {
            this.sendMessage(this.createSendSimVarValuesMessage(data));
        }
    }

    private attemptConnect(): void {
        this.connectionAttemptCount++;

        console.log(`[RemoteClient](attemptConnect) Attempting to connect (${this.url}). attempt #${this.connectionAttemptCount}`);

        this.ws = new WebSocket(this.url);
        this.ws.addEventListener('error', () => this.onConnectFailed());
        this.ws.addEventListener('open', () => this.onOpened());
        this.ws.addEventListener('message', (msg) => this.onMessage(msg.data));
        this.ws.addEventListener('close', () => this.onClosed());
    }

    private cleanup(): void {
        this.ws.close();
        this.ws = null;
        this.simVarSubscriptions = [];
        if (this.aircraftDataUpdateInterval !== null) {
            clearInterval(this.aircraftDataUpdateInterval);
        }
    }

    private onConnectFailed(): void {
        this.cleanup();

        if (this.connectionAttemptCount < MAX_CONNECTION_ATTEMPTS) {
            this.scheduleConnectionAttempt();
        } else {
            console.error('[RemoteClient](onConnectFailed) Reached max connection attempts, not trying again');
        }
    }

    private onOpened(): void {
        if (!this.ws) {
            return;
        }

        this.sendMessage(this.createSigninMessage());

        this.aircraftDataUpdateInterval = setInterval(() => {
            this.sendMessage(this.createAircraftStatusMessage());
        }, 5_000);
    }

    private onMessage(message: any): void {
        const msg: protocolV0.Messages = JSON.parse(message);

        switch (msg.type) {
        case 'remoteRequestAircraftSignin':
            this.sendMessage(this.createSigninMessage());
            this.sendMessage(this.createAircraftStatusMessage());
            break;
        case 'remoteRequestGaugeBundles':
            Wait.awaitCondition(() => this.instruments.length !== 0, 100, 10_000).then(() => {
                this.createSendBundleCodeMessages(msg.instrumentID);
            }).catch(() => {
                throw new Error('[RemoteClient](onMessage) Waited too long (>10s) for instruments to be fetched');
            });
            break;
        case 'remoteEnumerateInstruments':
            Wait.awaitCondition(() => this.instruments.length !== 0, 100, 10_000).then(() => {
                this.sendMessage({ type: 'aircraftSendInstruments', instruments: this.instruments, fromClientID: this.clientID });
            }).catch(() => {
                throw new Error('[RemoteClient](onMessage) Waited too long (>10s) for instruments to be fetched');
            });
            break;
        case 'remoteSubscribeToSimVar':
            this.simVarSubscriptions.push(msg);
            break;
        case 'remoteRequestDataStorage':
            const data = GetDataStorage().searchData('A32NX');

            const values: Record<string, string> = {};
            for (const dataItem of data) {
                if (EXCLUDED_DATA_STORAGE_KEYS.includes(dataItem.key)) {
                    continue;
                }

                values[dataItem.key] = dataItem.data;
            }

            this.sendMessage({ type: 'aircraftSendDataStorage', values, fromClientID: this.clientID });
            break;
        case 'remoteSetDataStorageKey':
            if (!EXCLUDED_DATA_STORAGE_KEYS.includes(msg.key)) {
                NXDataStore.set(msg.key, msg.value);
            }
            break;
        case 'remoteSetSimVarValue':
            SimVar.SetSimVarValue(msg.name, msg.unit, msg.value).then(() => {
                this.sendMessage({
                    type: 'aircraftAsyncOperationResponse',
                    requestID: msg.requestID,
                    successful: true,
                    result: undefined,
                    fromClientID: this.clientID,
                });
            }).catch(() => {
                this.sendMessage({
                    type: 'aircraftAsyncOperationResponse',
                    requestID: msg.requestID,
                    successful: false,
                    result: undefined,
                    fromClientID: this.clientID,
                });
            });
            break;
        case 'remoteRegisterViewListener': {
            const listener = RegisterViewListener(msg.listenerName);

            this.viewListeners.set(msg.listenerID, listener);

            // TODO clean up this subscription
            for (const call of msg.firstFrameCalls) {
                listener.on(call.event, (...data) => {
                    this.sendMessage({
                        type: 'aircraftEventNotification',
                        subscriptionID: call.subscriptionID,
                        data,
                        fromClientID: this.clientID,
                    });
                });
            }

            this.sendMessage({
                type: 'aircraftAsyncOperationResponse',
                requestID: msg.requestID,
                successful: true,
                result: undefined,
                fromClientID: this.clientID,
            });
            break;
        }
        case 'remoteViewListenerOn': {
            const listener = this.viewListeners.get(msg.listenerID);

            if (!listener) {
                console.error('[RemoteClient](onMessage) remoteViewListenerOn recieved with unknown listenerID');
                break;
            }

            // TODO clean up this subscription
            listener.on(msg.event, (...data) => {
                this.sendMessage({
                    type: 'aircraftEventNotification',
                    subscriptionID: msg.subscriptionID,
                    data,
                    fromClientID: this.clientID,
                });
            });
            break;
        }
        case 'remoteSubscriptionGroupCancel': {
            console.log(`[RemoteClient](onMessage) Clearing subscription group with id '${msg.subscriptionGroupID}'`);

            const oldSimVarCount = this.simVarSubscriptions.length;

            this.simVarSubscriptions = this.simVarSubscriptions.filter((it) => it.subscriptionGroupID !== msg.subscriptionGroupID);

            console.log(`[RemoteClient](onMessage) -> Cleared ${oldSimVarCount - this.simVarSubscriptions.length} simvars`);

            // TODO clean view listeners as well

            break;
        }
        case 'remoteClientDisconnect': {
            console.log(`[RemoteClient](onMessage) Remote client with ID '${msg.clientID}' disconnected`);

            const oldSimVarCount = this.simVarSubscriptions.length;

            this.simVarSubscriptions = this.simVarSubscriptions.filter((it) => it.fromClientID !== msg.clientID);

            console.log(`[RemoteClient](onMessage) -> Cleared ${oldSimVarCount - this.simVarSubscriptions.length} simvars`);

            break;
        }
        default: console.warn(`unknown message type: ${msg.type}`);
        }
    }

    private onClosed(): void {
        this.cleanup();
    }

    private sendMessage(message: protocolV0.Messages) {
        if (!this.ws) {
            throw new Error('Cannot send message if no websocket exists');
        }

        // TODO Connection state, msg queue
        this.ws.send(JSON.stringify(message));
    }

    private scheduleConnectionAttempt(): void {
        setTimeout(() => this.attemptConnect(), 3_000);
    }

    private createSigninMessage(): protocolV0.AircraftSigninMessage {
        return { type: 'aircraftSignin', clientName: this.clientName, fromClientID: this.clientID };
    }

    private createAircraftStatusMessage(): protocolV0.AircraftStatusMessage {
        return {
            type: 'aircraftStatus',
            simUtcTime: 0,
            simLocaltime: 0,
            airframe: {
                name: this.airframeName,
                livery: 'FBW',
            },
            flightPlanInfo: {
                callsign: 'DZNTS591',
                origin: 'NZQN',
                dest: 'NZWN',
                altn: 'NZAA',
                progress: 35,
            },
            aircraftState: {
                heading: SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'Degrees'),
                headingIsTrue: false,
                tas: SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots'),
                altitude: SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet'),
            },
            fromClientID: this.clientID,
        };
    }

    private async createSendBundleCodeMessages(instrumentID: string): Promise<void> {
        const instruments = this.instruments.find((it) => it.instrumentID === instrumentID);

        const codeBundleUrl = instruments.gauges[0].bundles.js;

        const bundle = await (await fetch(codeBundleUrl)).text();

        const cssBundleUrl = instruments.gauges[0].bundles.css;

        const cssBundle = await (await fetch(cssBundleUrl)).text();

        const jsChunkCount = Math.ceil(bundle.length / 100_000);
        const cssChunkCount = Math.ceil(cssBundle.length / 100_000);

        const iter = 0;

        let jsBytesSent = 0;
        let jsChunkIndex = 0;
        let cssBytesSent = 0;
        let cssChunkIndex = 0;
        while ((jsBytesSent < bundle.length || cssBytesSent < cssBundle.length) && iter < 100) {
            const jsData = bundle.substring(jsChunkIndex * 100_000, Math.min(bundle.length, (jsChunkIndex + 1) * 100_000));
            const cssData = cssBundle.substring(cssChunkIndex * 100_000, Math.min(cssBundle.length, (cssChunkIndex + 1) * 100_000));

            const msg: protocolV0.Messages = {
                type: 'aircraftSendGaugeBundles',
                bundles: {
                    js: { chunkIndex: jsChunkIndex, chunkCount: jsChunkCount, data: jsData },
                    css: { chunkIndex: cssChunkIndex, chunkCount: cssChunkCount, data: cssData },
                },
                fromClientID: this.clientID,
            };

            this.sendMessage(msg);

            if (jsBytesSent < bundle.length) {
                jsChunkIndex++;
                jsBytesSent += jsData.length;
            }

            if (jsBytesSent < bundle.length) {
                cssChunkIndex++;
                cssBytesSent += cssData.length;
            }
        }
    }

    private createSendSimVarValuesMessage(values: [number, number][]): protocolV0.AircraftSendSimVarValuesMessage {
        return {
            type: 'aircraftSendSimVarValues',
            values,
            fromClientID: this.clientID,
        };
    }

    private async fetchInstrumentsMetadata(file: string): Promise<protocolV0.InstrumentMetadata[]> {
        const response = await fetch(file);

        if (!response.ok) {
            return [];
        }

        const json: { protocolVersion: number, data: protocolV0.InstrumentMetadata[]; } = JSON.parse(await response.text());

        if (json.protocolVersion !== 0) {
            throw new Error('[RemoteClient](fetchInstrumentsMetadata) protocolVersion of instruments metadata file is not 0');
        }

        return json.data;
    }
}
