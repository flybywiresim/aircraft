// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ClientState, SimBridgeClientState } from './ClientState';
import { getSimBridgeIp } from '../common';

/**
 * Class to communicate with the SimBridge MCDU server
 */
export class McduServerClient {
  public static ip = (): string => getSimBridgeIp();

  public static port = (): string => NXDataStore.get('CONFIG_SIMBRIDGE_PORT', '8380');

  public static url = (): string => `ws://${this.ip()}:${this.port()}/interfaces/v1/mcdu`.replace(/\s+/g, '');

  private state: ClientState = ClientState.getInstance();

  private socket: WebSocket = undefined;

  /**
   * Will attempt to connect to the SimBridge MCDU server. Will throw an error if the connection fails.
   * @param caller back reference to the caller - see notes below.
   * @param eventHandler The callback to be called when an event is received from the socket.
   *  See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#events for possible events.
   *
   * Note: This method requires the caller object to be provided, so it can send it back to the event handler when an
   * event is triggered. Otherwise, the event handler in McduServerClient will not be able to call the caller's
   * methods as it will not recognize "this" (will be undefined).
   */
  public connect(eventHandler: (e: Event) => void) {
    if (this.state.getSimBridgeClientState() === SimBridgeClientState.CONNECTED) {
      // first disconnect to clean up any previous connection
      this.disconnect();

      // Connect web socket
      this.socket = new WebSocket(McduServerClient.url());

      // Setup up event handler from the caller
      if (eventHandler && typeof eventHandler === 'function') {
        this.socket.onerror = (event) => eventHandler(event);
        this.socket.onclose = (event) => eventHandler(event);
        this.socket.onopen = (event) => eventHandler(event);
        this.socket.onmessage = (event) => eventHandler(event);
      }
    }
  }

  /**
   * Checks if the connection to the SimBridge MCDU Server is still valid.
   * If the user deactivated the SimBridge in the EFB or if the SimBridge connection is not established
   * this will return false.
   *  @see ClientState.isAvailable()
   */
  public validateConnection() {
    return this.state.isAvailable();
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
    return this.socket && this.socket.readyState === 1;
  }

  /**
   * Will send a message to the SimBridge MCDU server. An error will be thrown if the connection is not active.
   * @param message
   */
  public send(message: string) {
    if (this.socket && this.socket.readyState) {
      this.socket.send(message);
    } else {
      throw new Error('MCDUServerClient is not connected to the SimBridge MCDU Server');
    }
  }
}
