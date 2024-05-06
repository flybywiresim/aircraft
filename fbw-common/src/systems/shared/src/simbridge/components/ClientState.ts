// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { Health } from './Health';

/**
 * SimBridgeState is one of:
 * - OFF: SimBridge is deactivated in the EFB
 * - OFFLINE: SimBridge is activated in the EFB, but the connection to the SimBridge server could not be established
 * - CONNECTING: SimBridge is activated in the EFB, and the connection to the SimBridge server is being established
 * - CONNECTED: SimBridge is activated in the EFB and the connection to the SimBridge server is established
 */
export const enum SimBridgeClientState {
  OFF = 'OFF',
  OFFLINE = 'OFFLINE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

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
  private simBridgeEnabledSetting: string = 'AUTO ON';

  // counter for failed connection attempts
  private connectionAttemptCounter: number = 0;

  // how many times to attempt to connect to the server before giving up
  private maxSimBridgeConnectionAttempts: number = 60;

  // Indicates the state of the client connection to the SimBridge server
  private simBridgeState: SimBridgeClientState = SimBridgeClientState.OFF;

  /**
   * Private constructor for the singleton. Start checking the server availability regularly
   * to update the state which can be retrieved with isAvailable().
   */
  private constructor() {
    // Subscribe to the SimBridge Enabled setting to be notified when it changes. Otherwise, we would
    // only be able to check each check interval (5sec)
    NXDataStore.getAndSubscribe(
      'CONFIG_SIMBRIDGE_ENABLED',
      (key, value) => {
        // console.log(`[SimBridge-Client] SimBridge Enabled setting changed to: ${value}`);
        this.simBridgeEnabledSetting = value;
        this.connectionAttemptCounter = 0;
        this.checkServerAvailability();
      },
      'AUTO ON',
    );
    // Subscribe to the SimBridge Remote setting so we can instantly re-establish connection
    // when we change this
    NXDataStore.subscribe('CONFIG_SIMBRIDGE_REMOTE', (_) => {
      this.connectionAttemptCounter = 0;
      this.checkServerAvailability();
    });

    // reset the setting if not permanent off
    if (this.simBridgeEnabledSetting !== 'PERM OFF') {
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
   *
   * @deprecated use getSimBridgeClientState() or isConnected() instead
   */
  public isAvailable(): boolean {
    return this.available;
  }

  /**
   * Returns the current state of the client connection to the SimBridge server.
   * This returns a cached value that is updated every 5 seconds and does not perform
   * a health check to the server.
   *
   * @returns {SimBridgeClientState}
   */
  public getSimBridgeClientState(): SimBridgeClientState {
    return this.simBridgeState;
  }

  /**
   * Returns true if the SimBridgeClientState is CONNECTED
   */
  public isConnected(): boolean {
    return this.simBridgeState === SimBridgeClientState.CONNECTED;
  }

  /**
   * Sets the SimBridgeClientState based on the SimBridge Enabled setting and the availability of the server
   *
   * @private
   */
  private setSimBridgeState() {
    if (this.available) {
      this.simBridgeState = SimBridgeClientState.CONNECTED;
      return;
    }
    switch (this.simBridgeEnabledSetting) {
      case 'AUTO ON':
        this.simBridgeState = SimBridgeClientState.CONNECTING;
        break;
      case 'AUTO OFF':
        this.simBridgeState = SimBridgeClientState.OFFLINE;
        break;
      default:
        this.simBridgeState = SimBridgeClientState.OFF;
    }
  }

  /**
   * Checks if the SimBridge server is available (via health check service) and updates the state accordingly
   * @private
   */
  private checkServerAvailability() {
    // Check the SimBridge Enabled setting (set in the flyPad EFB)
    // If the setting is not AUTO ON, then the client is not available
    if (this.simBridgeEnabledSetting !== 'AUTO ON') {
      this.connectionAttemptCounter = 0;
      this.available = false;
      this.setSimBridgeState();
      return;
    }

    // After 60 failed connection attempts, give up and set the SimBridge Enabled setting to AUTO OFF to
    // prevent the client from trying to connect to the server again. The user can reset the setting to AUTO ON
    // in the flyPad EFB to try again.
    if (this.connectionAttemptCounter++ >= this.maxSimBridgeConnectionAttempts) {
      NXDataStore.set('CONFIG_SIMBRIDGE_ENABLED', 'AUTO OFF');
      this.connectionAttemptCounter = 0;
    } else {
      // try to connect to the server
      Health.getHealth()
        .then((result) => {
          if (result) {
            if (!this.available) {
              // only log once when SimBridge becomes available
              console.log('[SimBridge-Client] SimBridge available.');
            }
            this.available = true;
            this.connectionAttemptCounter = 0;
          } else {
            this.available = false;
            console.log(`[SimBridge-Client] SimBridge is not available. Connection attempt counter:
                                    ${this.connectionAttemptCounter} of ${this.maxSimBridgeConnectionAttempts}`);
          }
        })
        .catch(() => {
          this.available = false;
          console.log(`[SimBridge-Client] SimBridge is not available. Connection attempt counter:
                            ${this.connectionAttemptCounter} of ${this.maxSimBridgeConnectionAttempts}`);
        });
    }
    this.setSimBridgeState();
  }
}
