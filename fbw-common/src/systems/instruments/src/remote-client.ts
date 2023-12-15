import { Wait } from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { protocolV0 } from '@flybywiresim/remote-bridge-types';
import { Base64 } from 'js-base64';

import { v4 } from 'uuid';

const MAX_CONNECTION_ATTEMPTS = 10;

const EXCLUDED_DATA_STORAGE_KEYS = [
    'A32NX_NAVIGRAPH_REFRESH_TOKEN',
];

export interface RemoteClientOptions {
    /** The WebSocket URL the remote client should connect to */
    websocketUrl: () => string,

    /** The name of the client */
    clientName: string,

    /** The name of the airframe the client is loaded into */
    airframeName: string,

    /** The VFS path of the instruments metadata file */
    instrumentsMetadataFile: string,

    /** The path which all file download requests must have at the start of their VFS path */
    fileDownloadBasePath: string,
}

/**
 * Client for connecting a gateway supporting the FBW remote bridge protocol
 */
export class RemoteClient {
    private static readonly PROTOCOL_VERSION = 0;

    private ws: WebSocket | null = null;

    private readonly url: string;

    private readonly airframeName: string;

    private readonly clientName: string;

    private readonly fileDownloadBasePath: string;

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
        this.url = options.websocketUrl();
        this.airframeName = options.airframeName;
        this.clientName = options.clientName;
        this.fileDownloadBasePath = options.fileDownloadBasePath;

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

    // eslint-disable-next-line no-empty-function
    private onOpened(): void {
    }

    private onMessage(message: any): void {
        const msg: protocolV0.Messages = JSON.parse(message);

        switch (msg.type) {
        case 'protocolGatewayIntroductionMessage':
            if (msg.minProtocolVersion > RemoteClient.PROTOCOL_VERSION) {
                console.error(
                    `[RemoteClient](onMessage) Gateway server minProtocolVersion is too high (${msg.minProtocolVersion}). Disconnecting`,
                );
                this.cleanup();
                break;
            }

            if (msg.maxProtocolVersion < RemoteClient.PROTOCOL_VERSION) {
                console.error(
                    `[RemoteClient](onMessage) Gateway server maxProtocolVersion is too low (${msg.minProtocolVersion}). Disconnecting`,
                );
                this.cleanup();
                break;
            }

            console.log(`[RemoteClient] Connected to server '${msg.server}'. Logging in...`);

            // If we are happy with the protocol versions the server supports, we send our login message and data store contents
            this.sendMessage(this.createSigninMessage());

            // TODO we should probably really only do this when asked to
            this.aircraftDataUpdateInterval = setInterval(() => {
                this.sendMessage(this.createAircraftStatusMessage());
            }, 5_000);

            break;
        case 'remoteRequestAircraftSignin':
            this.sendMessage(this.createSigninMessage());
            this.sendMessage(this.createAircraftStatusMessage());
            break;
        case 'remoteDownloadFile':
            if (!msg.fileVfsPath.startsWith(this.fileDownloadBasePath) || msg.fileVfsPath.includes('..')) {
                throw new Error(`[RemoteClient](onMessage) remoteDownloadFile received with unauthorized path (${msg.fileVfsPath})`);
            }

            this.sendFile(msg.requestID, msg.fileVfsPath);
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

            // TODO clean view listeners as well

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

    private async sendFile(requestID: string, filePath: string): Promise<void> {
        const fileContents = await fetch(filePath);
        const data = await fileContents.arrayBuffer();

        const chunkSize = 1024 * 100; // 100 KiB
        const chunkCount = Math.ceil(data.byteLength / chunkSize);

        for (let i = 0; i < chunkCount; i++) {
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min(data.byteLength, chunkStart + chunkSize);

            const chunkData = data.slice(chunkStart, chunkEnd);

            const u8 = new Uint8Array(chunkData);

            this.sendMessage({
                type: 'aircraftSendFileChunk',
                requestID,
                data: Base64.fromUint8Array(u8),
                chunkCount,
                chunkIndex: i,
                totalSizeBytes: data.byteLength,
                fromClientID: this.clientID,
            });
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

        if (json.protocolVersion !== RemoteClient.PROTOCOL_VERSION) {
            throw new Error(`[RemoteClient](fetchInstrumentsMetadata) protocolVersion of instruments metadata file is not ${RemoteClient.PROTOCOL_VERSION}`);
        }

        return json.data;
    }
}
