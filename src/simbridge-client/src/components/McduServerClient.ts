// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { ClientState } from './ClientState';

/**
 * Class to communicate with the SimBridge MCDU server
 */
export class McduServerClient {
    public static port: string = NXDataStore.get('CONFIG_SIMBRIDGE_PORT', '8380');

    public static url: string = `ws://127.0.0.1:${this.port}/interfaces/v1/mcdu`.replace(/\s+/g, '');

    private state: ClientState = ClientState.getInstance();

    private socket: WebSocket = undefined;

    /**
     * Will attempt to connect to the SimBridge MCDU server. Will throw an error if the connection fails.
     */
    public connect(eventHandler: (e: Event) => void) {
        if (this.state.isAvailable()) {
            // first disconnect to clean up any previous connection
            this.disconnect();

            // Connect web socket
            this.socket = new WebSocket(McduServerClient.url);

            // Setup up event handler from the caller
            if (eventHandler && typeof (eventHandler) === 'function') {
                this.socket.onerror = (event) => eventHandler(event);
                this.socket.onclose = (event) => eventHandler(event);
                this.socket.onopen = (event) => eventHandler(event);
                this.socket.onmessage = (event) => eventHandler(event);
            }
        }
    }

    /**
     * Will disconnect from the SimBridge MCDU server. If no connection is active, then nothing will happen.
     */
    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
    }

    /**
     * Checks if the McduServerClient is connected to the SimBridge MCDU server via the websocket.
     */
    public isConnected(): boolean {
        return (this.socket && this.socket.readyState === 1);
    }

    /**
     * Will send a message to the SimBridge MCDU server. An error will be thrown if the connection is not active.
     * @param message
     */
    public send(message: string) {
        if (this.socket && this.socket.readyState) {
            this.socket.send(message);
        }
    }
}

//
/* WEBSOCKET */
//
// /**
//  * Attempts to connect to simbridge
//  */
// connectWebsocket(port) {
//
//     if (this.socket) {
//         // Trying to close a socket in readState == 0 leads to
//         // an error message ('WebSocket is closed before the connection is established')
//         // in the console.
//         // Not closing sockets in readyState 0 leads to an accumulation of
//         // unclosed sockets
//         this.socket.close();
//         this.socket = undefined;
//     }
//
//     const url = `ws://127.0.0.1:${port}/interfaces/v1/mcdu`.replace(/\s+/g, '');
//
//     this.socket = new WebSocket(url);
//
//     this.socket.onerror = () => {
//         // Check this to only log possible errors once connected.
//         // Otherwise, it just spams the log when attempting to connect.
//         if (this.socketConnectionAttempts > 0) {
//             return;
//         }
//         console.log(`WebSocket connection error. Maybe SimBridge disconnected? (${url})`);
//     };
//
//     this.socket.onclose = () => {
//         // Check this to only log possible errors once connected.
//         // Otherwise, it just spams the log when attempting to connect.
//         if (this.socketConnectionAttempts > 0) {
//             return;
//         }
//         console.log(`Websocket connection to SimBridge closed. (${url})`);
//     };
//
//     this.socket.onopen = () => {
//         console.log(`Websocket connection to SimBridge established. (${url})`);
//         (new NXNotifManager).showNotification({title: "MCDU CONNECTED", message: "Successfully connected to SimBridge.", timeout: 5000});
//         this.sendToSocket("mcduConnected");
//         this.sendUpdate();
//         this.socketConnectionAttempts = 0;
//     };
//
//     this.socket.onmessage = (event) => {
//         const [messageType, ...args] = event.data.split(':');
//         if (messageType === 'event') {
//             // backwards compatible with the old MCDU server...
//             // accepts either event:button_name (old), or event:side:button_name (current)
//             const mcduIndex = (args.length > 1 && args[0] === 'right') ? 2 : 1;
//             const button = args.length > 1 ? args[1] : args[0];
//             SimVar.SetSimVarValue(`H:A320_Neo_CDU_${mcduIndex}_BTN_${button}`, "number", 0);
//             SimVar.SetSimVarValue(`L:A32NX_MCDU_PUSH_ANIM_${mcduIndex}_${button}`, "Number", 1);
//         }
//         if (messageType === "requestUpdate") {
//             this.sendUpdate();
//         }
//     };
// }
