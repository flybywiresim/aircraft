// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { Health } from './Health';

/**
 * This class is a singleton that is used to manage the state of the client connection to the
 * SimBridge server. The aim is to prevent simbridge-client services to constantly try to connect
 * to the server when it is not available and therefore creating unnecessary log entries and load.
 */
export class ClientState {
    // The singleton instance
    private static instance: ClientState;

    // flag to indicate if the client is available
    private available: boolean = false;

    // SimBridge Connect setting
    private simbridgeConnect: string = 'AUTO ON';

    // counter for failed connection attempts
    private connectionAttemptCounter: number = 0;

    // how many times to attempt to connect to the server before giving up
    private static maxSimBridgeConnectionAttempts: number = 60;

    /**
     * Private constructor for the singleton. Start checking the server availability regularly
     * to update the state which can be retrieved with isAvailable().
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
     * Returns true if the client is available, false otherwise.
     * Availability is checked every 5 seconds.
     */
    public isAvailable(): boolean {
        return this.available;
    }

    /**
     * Checks if the SimBridge server is available (via health check service) and updates the state accordingly
     * @private
     */
    private checkServerAvailability() {
        // Check the SimBridge Enabled setting (set in the flyPad EFB)
        // If the setting is not AUTO ON, then the client is not available
        this.simbridgeConnect = NXDataStore.get('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');
        if (this.simbridgeConnect !== 'AUTO ON') {
            this.available = false;
            return;
        }

        // After 60 failed connection attempts, give up and set the SimBridge Enabled setting to AUTO OFF to
        // prevent the client from trying to connect to the server again. The user can reset the setting to AUTO ON
        // in the flyPad EFB to try again.
        if (this.connectionAttemptCounter++ >= ClientState.maxSimBridgeConnectionAttempts) {
            NXDataStore.set('CONFIG_SIMBRIDGE_ENABLED', 'AUTO OFF');
            this.connectionAttemptCounter = 0;
        } else {
            // try to connect to the server
            Health.getHealth().then(
                (result) => {
                    if (result) {
                        if (!this.available) { // only log once when SimBridge becomes available
                            console.log('[SimBridge-Client] SimBridge available.');
                        }
                        this.available = true;
                        this.connectionAttemptCounter = 0;
                    } else {
                        this.available = false;
                        console.log(`[SimBridge-Client] SimBridge is not available. Connection attempt counter: 
                                    ${this.connectionAttemptCounter} of ${ClientState.maxSimBridgeConnectionAttempts}`);
                    }
                },
            ).catch(() => {
                this.available = false;
                console.log(`[SimBridge-Client] SimBridge is not available. Connection attempt counter: 
                            ${this.connectionAttemptCounter} of ${ClientState.maxSimBridgeConnectionAttempts}`);
            });
        }
    }
}
