// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { Health } from './Health';

/**
 * This class is a singleton that is used to manage the state of the client connection to the SimBridge server.
 * The aim is to prevent other services to constantly try to connect to the server when it is not available.
 */
export class ClientState {
    // The singleton instance
    private static instance: ClientState;

    // flag to indicate if the client is available
    private available: boolean = false;

    // counter for failed connection attempts
    private connectionAttemptCounter: number = 0;

    // SimBridge Connect setting
    private simbridgeConnect: string = 'AUTO ON';

    // how many times to attempt to connect to the server before giving up
    private static maxSimBridgeConnectionAttempts: number = 60;

    /**
     * Constructor for the singleton. Start checking the server availability regularly
     * and updates the state which can be retrieved with isAvailable().
     */
    private constructor() {
        this.simbridgeConnect = NXDataStore.get('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');
        // reset the setting if not permanent off
        if (this.simbridgeConnect !== 'PERM OFF') {
            NXDataStore.set('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');
        }

        // Try to connect websocket if enabled in EFB and no connection established
        setInterval(() => {
            this.checkServerAvailability();
        }, 5_000);
    }

    /**
     * The singleton instance getter
     */
    public static getInstance(): ClientState {
        if (!ClientState.instance) {
            ClientState.instance = new ClientState();
        }
        return ClientState.instance;
    }

    /**
     * Returns true if the client is available, false otherwise
     */
    public isAvailable(): boolean {
        return this.available;
    }

    /**
     * Checks if the SimBridge server is available (via health check service) and updates the state accordingly
     * @private
     */
    private checkServerAvailability() {
        this.simbridgeConnect = NXDataStore.get('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');
        if (this.simbridgeConnect !== 'AUTO ON') {
            this.available = false;
            return;
        }

        if (this.connectionAttemptCounter++ >= ClientState.maxSimBridgeConnectionAttempts) {
            console.log('ClientState: Maximum number of connection attempts to Simbridge exceeded. No more attempts.');
            NXDataStore.set('CONFIG_SIMBRIDGE_ENABLED', 'AUTO OFF');
            this.connectionAttemptCounter = 0;
        } else {
            // try to connect to the server
            Health.getHealth().then(
                (result) => {
                    if (result) {
                        this.available = true;
                        this.connectionAttemptCounter = 0;
                    } else {
                        this.available = false;
                        console.debug(`State: SimBridge is not available. Connection attempt counter: ${this.connectionAttemptCounter}`);
                    }
                },
            ).catch(() => {
                this.available = false;
                console.debug(`State: SimBridge is not available. Connection attempt counter: ${this.connectionAttemptCounter}`);
            });
        }
    }
}

//  this.socketConnectionAttempts = 0;
//         this.maxConnectionAttempts = 60;
//         this.simbridgeConnect = NXDataStore.get("CONFIG_SIMBRIDGE_ENABLED", 'AUTO ON');
//         if (this.simbridgeConnect !== 'PERM OFF') {
//             NXDataStore.set("CONFIG_SIMBRIDGE_ENABLED", 'AUTO ON');
//             this.simbridgeConnect = 'AUTO ON';
//         } else {
//             console.log("SimBridge connection attempts permanently deactivated.");
//         }

//   // Try to connect websocket if enabled in EFB and no connection established
//             this.simbridgeConnect = NXDataStore.get("CONFIG_SIMBRIDGE_ENABLED", 'AUTO ON');
//             if (this.simbridgeConnect === 'AUTO ON' && (!this.socket || this.socket.readyState !== 1)) {
//                 // We try to connect for a fixed amount of attempts, then we deactivate the connection setting
//                 if (this.socketConnectionAttempts++ >= this.maxConnectionAttempts) {
//                     console.log("Maximum number of connection attempts to Simbridge exceeded. No more attempts.");
//                     NXDataStore.set("CONFIG_SIMBRIDGE_ENABLED", 'AUTO OFF');
//                     this.socketConnectionAttempts = 0;
//                 } else {
//                     console.log(`Attempting Simbridge connection ${this.socketConnectionAttempts} of ${this.maxConnectionAttempts} attempts.`);
//                     this.connectWebsocket(NXDataStore.get("CONFIG_SIMBRIDGE_PORT", "8380"));
//                 }
//             } else if (this.simbridgeConnect !== 'AUTO ON') {
//                 if (this.socketConnectionAttempts > 0) {
//                     console.log("Simbridge connection attempts deactivated. No more attempts.");
//                     this.socketConnectionAttempts = 0;
//                 }
//                 if (this.socket) {
//                     // If there is a connection established but the EFB setting has been changed
//                     // then close connection
//                     this.socket.close();
//                     this.socket = undefined;
//                 }
//             }
