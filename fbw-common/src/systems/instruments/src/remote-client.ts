import { v4 } from 'uuid';

const REMOTE_SERVER_URL = 'ws://localhost:3000/connect';

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

    constructor() {
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

        console.log(`[RemoteClient](attemptConnect) Attempting to connect (${REMOTE_SERVER_URL}). attempt #${this.connectionAttemptCount}`);

        this.ws = new WebSocket(REMOTE_SERVER_URL);
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
        case 'remoteRequestGaugeBundles':
            this.createSendBundleCodeMessage(msg.instrumentID).then((message) => {
                this.sendMessage(message);
            });
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

    private async createSendBundleCodeMessage(instrumentID: string): Promise<AircraftSendGaugeBundlesMessage> {
        const instruments = planeInstruments.find((it) => it.instrumentID === instrumentID);

        const codeBundleUrl = instruments.gauges[0].bundles.js;

        const bundle = await (await fetch(codeBundleUrl)).text();

        const cssBundleUrl = instruments.gauges[0].bundles.css;

        const cssBundle = await (await fetch(cssBundleUrl)).text();

        return { type: 'aircraftSendGaugeBundles', bundles: { js: bundle, css: cssBundle }, fromClientID: this.clientID };
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

interface AircraftSigninMessage extends BaseMessage {
    type: 'aircraftSignin';
    clientName: string;
}

interface AircraftStatusMessage extends BaseMessage {
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

interface AircraftSendGaugeBundlesMessage extends BaseMessage {
    type: 'aircraftSendGaugeBundles';
    bundles: {
        js: string;
        css: string;
    };
}

interface AircraftSendInstrumentsMessage extends BaseMessage {
    type: 'aircraftSendInstruments';
    instruments: InstrumentMetadata[];
}

interface AircraftSendSimVarValuesMessage extends BaseMessage {
    type: 'aircraftSendSimVarValues';
    values: [id: number, value: number][];
}

interface AircraftClientDisconnectMessage extends BaseMessage {
    type: 'aircraftClientDisconnect';
    clientID: string;
}

interface RemoteSigninMessage extends BaseMessage {
    type: 'remoteSignin';
    clientName: string;
}

interface RemoteRequestGaugeBundlesMessage extends BaseMessage {
    type: 'remoteRequestGaugeBundles';
    instrumentID: string;
}

interface RemoteEnumerateInstrumentsMessage extends BaseMessage {
    type: 'remoteEnumerateInstruments';
}

interface RemoteSubscribeToSimVarMessage extends BaseMessage {
    type: 'remoteSubscribeToSimVar';
    simVar: string;
    unit: string;
    id: number;
    subscriptionGroupID: string;
}

interface RemoteSubscriptionGroupCancelMessage extends BaseMessage {
    type: 'remoteSubscriptionGroupCancel';
    subscriptionGroupID: string;
}

interface RemoteClientDisconnectMessage extends BaseMessage {
    type: 'remoteClientDisconnect';
    clientID: string;
}

type Messages =
    | AircraftSigninMessage
    | AircraftStatusMessage
    | AircraftSendGaugeBundlesMessage
    | AircraftSendInstrumentsMessage
    | AircraftSendSimVarValuesMessage
    | AircraftClientDisconnectMessage
    | RemoteSigninMessage
    | RemoteRequestGaugeBundlesMessage
    | RemoteEnumerateInstrumentsMessage
    | RemoteSubscribeToSimVarMessage
    | RemoteSubscriptionGroupCancelMessage
    | RemoteClientDisconnectMessage;

interface GaugeMetadata {
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
