import { v4 } from 'uuid';

const MAX_CONNECTION_ATTEMPTS = 10;

const pfd: InstrumentMetadata = {
    instrumentID: 'pfd',
    dimensions: {
        width: 768,
        height: 768,
    },
    gauges: [
        {
            name: 'PFD',
            bundles: {
                js: '/Pages/VCockpit/Instruments/A32NX/PFD/pfd.js',
                css: '/Pages/VCockpit/Instruments/A32NX/PFD/pfd.css',
            },
        },
    ],
};

const nd: InstrumentMetadata = {
    instrumentID: 'ND',
    dimensions: {
        width: 768,
        height: 768,
    },
    gauges: [
        {
            name: 'ND',
            bundles: {
                js: '/Pages/VCockpit/Instruments/A32NX/ND/nd.js',
                css: '/Pages/VCockpit/Instruments/A32NX/ND/nd.css',
            },
        },
    ],
};

const ewd: InstrumentMetadata = {
    instrumentID: 'EWD',
    dimensions: {
        width: 768,
        height: 768,
    },
    gauges: [
        {
            name: 'EWD',
            bundles: {
                js: '/Pages/VCockpit/Instruments/A32NX/EWD/ewd.js',
                css: '/Pages/VCockpit/Instruments/A32NX/EWD/ewd.css',
            },
        },
    ],
};

const efb: InstrumentMetadata = {
    instrumentID: 'EFB',
    dimensions: {
        width: 1430,
        height: 1000,
    },
    gauges: [
        {
            name: 'EFB',
            bundles: {
                js: '/Pages/VCockpit/Instruments/A32NX/EFB/efb.js',
                css: '/Pages/VCockpit/Instruments/A32NX/EFB/efb.css',
            },
        },
    ],
};

const planeInstruments = [pfd, nd, ewd, efb];

export class RemoteClient {
    private ws: WebSocket | null = null;

    private clientID = v4();

    private connectionAttemptCount = 0;

    private simVarSubscriptions: {
        simVar: string,
        unit: string,
        id: number,
        fromClientID: string,
        subscriptionGroupID: string,
    }[] = [];

    private simVarValueCache: Record<number, any> = {};

    private aircraftDataUpdateInterval: number | null = null;

    constructor(private readonly url: string) {
        this.attemptConnect();
    }

    public update(): void {
        if (!this.ws) {
            return;
        }

        const data: [number, number][] = [];

        for (const simvar of this.simVarSubscriptions) {
            const value = SimVar.GetSimVarValue(simvar.simVar, simvar.unit);

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
        const msg: Messages = JSON.parse(message);

        switch (msg.type) {
        case 'remoteRequestAircraftSignin':
            this.sendMessage(this.createSigninMessage());
            this.sendMessage(this.createAircraftStatusMessage());
            break;
        case 'remoteRequestGaugeBundles':
            this.createSendBundleCodeMessages(msg.instrumentID);
            break;
        case 'remoteEnumerateInstruments':
            this.sendMessage({ type: 'aircraftSendInstruments', instruments: planeInstruments, fromClientID: this.clientID });
            break;
        case 'remoteSubscribeToSimVar':
            this.simVarSubscriptions.push(msg);
            break;
        case 'remoteSubscriptionGroupCancel': {
            console.log(`[RemoteClient](onMessage) Clearing subscription group with id '${msg.subscriptionGroupID}'`);

            const oldSimVarCount = this.simVarSubscriptions.length;

            this.simVarSubscriptions = this.simVarSubscriptions.filter((it) => it.subscriptionGroupID !== msg.subscriptionGroupID);

            console.log(`[RemoteClient](onMessage) -> Cleared ${oldSimVarCount - this.simVarSubscriptions.length} simvars`);

            break;
        }
        case 'remoteClientDisconnect': {
            console.log(`[RemoteClient](onMessage) Remote client with ID '${msg.fromClientID}' disconnected`);

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

    private sendMessage(message: Messages) {
        if (!this.ws) {
            throw new Error('Cannot send message if no websocket exists');
        }

        // TODO Connection state, msg queue
        this.ws.send(JSON.stringify(message));
    }

    private scheduleConnectionAttempt(): void {
        setTimeout(() => this.attemptConnect(), 3_000);
    }

    private createSigninMessage(): AircraftSigninMessage {
        return { type: 'aircraftSignin', clientName: 'a32nx', fromClientID: this.clientID };
    }

    private createAircraftStatusMessage(): AircraftStatusMessage {
        return {
            type: 'aircraftStatus',
            simUtcTime: 0,
            simLocaltime: 0,
            airframe: {
                name: 'A320-251N',
                livery: 'FBW',
            },
            flightPlanInfo: {
                callsign: 'DZNTS591',
                origin: 'NZQN',
                dest: 'NZWN',
                altn: 'NZAA',
                progress: 35,
            },
            fromClientID: this.clientID,
        };
    }

    private async createSendBundleCodeMessages(instrumentID: string): Promise<void> {
        const instruments = planeInstruments.find((it) => it.instrumentID === instrumentID);

        const codeBundleUrl = instruments.gauges[0].bundles.js;

        const bundle = await (await fetch(codeBundleUrl)).text();

        const cssBundleUrl = instruments.gauges[0].bundles.css;

        const cssBundle = await (await fetch(cssBundleUrl)).text();

        const jsChunkCount = Math.ceil(bundle.length / 100_000);
        const cssChunkCount = Math.ceil(cssBundle.length / 100_000);

        let iter = 0;

        let jsBytesSent = 0;
        let jsChunkIndex = 0;
        let cssBytesSent = 0;
        let cssChunkIndex = 0;
        while ((jsBytesSent < bundle.length || cssBytesSent < cssBundle.length) && iter < 100) {
            const jsData = bundle.substring(jsChunkIndex * 100_000, Math.min(bundle.length, (jsChunkIndex + 1) * 100_000));
            const cssData = cssBundle.substring(cssChunkIndex * 100_000, Math.min(cssBundle.length, (cssChunkIndex + 1) * 100_000));

            const msg: Messages = {
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

    private createSendSimVarValuesMessage(values: [number, number][]): AircraftSendSimVarValuesMessage {
        return {
            type: 'aircraftSendSimVarValues',
            values,
            fromClientID: this.clientID,
        };
    }
}

interface BaseMessage {
    type: string;
    fromClientID: string;
}

export interface AircraftSigninMessage extends BaseMessage {
    type: 'aircraftSignin';
    clientName: string;
}

export interface AircraftStatusMessage extends BaseMessage {
    type: 'aircraftStatus';
    simUtcTime: number;
    simLocaltime: number;
    flightPlanInfo: {
        callsign: string;
        origin: string | null;
        dest: string | null;
        altn: string | null;
        progress: number;
    };
    airframe: {
        name: string;
        livery: string;
    };
}

export interface AircraftSendGaugeBundlesMessage extends BaseMessage {
    type: 'aircraftSendGaugeBundles';
    bundles: {
        js: {
            data: string,
            chunkIndex: number,
            chunkCount: number,
        };
        css: {
            data: string,
            chunkIndex: number,
            chunkCount: number,
        };
    };
}

export interface AircraftSendInstrumentsMessage extends BaseMessage {
    type: 'aircraftSendInstruments';
    instruments: InstrumentMetadata[];
}

export interface AircraftSendSimVarValuesMessage extends BaseMessage {
    type: 'aircraftSendSimVarValues';
    values: [id: number, value: number][];
}

export interface AircraftClientDisconnectMessage extends BaseMessage {
    type: 'aircraftClientDisconnect';
    clientID: string;
}

export interface RemoteSigninMessage extends BaseMessage {
    type: 'remoteSignin';
    clientName: string;
}

export interface RemoteRequestAircraftSigninMessage extends BaseMessage {
    type: 'remoteRequestAircraftSignin';
}

export interface RemoteRequestGaugeBundlesMessage extends BaseMessage {
    type: 'remoteRequestGaugeBundles';
    instrumentID: string;
}

export interface RemoteEnumerateInstrumentsMessage extends BaseMessage {
    type: 'remoteEnumerateInstruments';
}

export interface RemoteSubscribeToSimVarMessage extends BaseMessage {
    type: 'remoteSubscribeToSimVar';
    simVar: string;
    unit: string;
    id: number;
    subscriptionGroupID: string;
}

export interface RemoteSubscriptionGroupCancelMessage extends BaseMessage {
    type: 'remoteSubscriptionGroupCancel';
    subscriptionGroupID: string;
}

export interface RemoteClientDisconnectMessage extends BaseMessage {
    type: 'remoteClientDisconnect';
    clientID: string;
}

export interface ProtocolErrorMessage extends BaseMessage {
    type: 'protocolError',
    id: number,
    message: string,
}

export interface ProtocolHeartbeat extends BaseMessage {
    type: 'protocolHeartbeat',
}

export type Messages =
    | AircraftSigninMessage
    | AircraftStatusMessage
    | AircraftSendGaugeBundlesMessage
    | AircraftSendInstrumentsMessage
    | AircraftSendSimVarValuesMessage
    | AircraftClientDisconnectMessage
    | RemoteSigninMessage
    | RemoteRequestAircraftSigninMessage
    | RemoteRequestGaugeBundlesMessage
    | RemoteEnumerateInstrumentsMessage
    | RemoteSubscribeToSimVarMessage
    | RemoteSubscriptionGroupCancelMessage
    | RemoteClientDisconnectMessage
    | ProtocolErrorMessage
    | ProtocolHeartbeat;

export interface GaugeMetadata {
    name: string;
    bundles: {
        js: string;
        css: string;
    };
}

export interface InstrumentMetadata {
    instrumentID: string;
    dimensions: {
        width: number;
        height: number;
    };
    gauges: GaugeMetadata[];
}
