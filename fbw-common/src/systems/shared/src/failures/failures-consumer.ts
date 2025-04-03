// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { GenericDataListenerSync } from '../GenericDataListenerSync';

export class FailuresConsumer {
  // FIXME replace with EventBus once EFB and RMP ported to avionics framework
  private readonly genericDataListener = new GenericDataListenerSync(
    this.onDataListenerMessage.bind(this),
    'FBW_FAILURE_UPDATE',
  );

  private readonly activeFailures = new Map<number, boolean>();

  private readonly callbacks: Map<number, (isActive: boolean) => void> = new Map();

  private isInit = false;

  private onDataListenerMessage(topic: string, data: any): void {
    if (topic === 'FBW_FAILURE_UPDATE') {
      const activeFailures = new Set(data as number[]);
      this.onActiveFailuresChanged(activeFailures);
    }
  }

  private onActiveFailuresChanged(activeFailures: ReadonlySet<number>): void {
    for (const identifier of this.activeFailures.keys()) {
      if (!activeFailures.has(identifier) && this.activeFailures.get(identifier)) {
        this.activeFailures.set(identifier, false);
        this.callbacks.get(identifier)?.(false);
      }
    }
    for (const identifier of activeFailures) {
      if (!this.activeFailures.get(identifier)) {
        this.activeFailures.set(identifier, true);
        this.callbacks.get(identifier)?.(true);
      }
    }
  }

  public update(): void {
    // FIXME replace with Wait.awaitSubscribable(GameStateProvider.get(), (s) => s === GameState.ingame, true).then(() => {})
    // when we can use the avionics framework.
    if (!this.isInit) {
      const inGame = window.parent && window.parent.document.body.getAttribute('gamestate') === 'ingame';
      if (inGame) {
        this.genericDataListener.sendEvent('FBW_FAILURE_REQUEST', undefined);
        this.isInit = true;
      }
    }
  }

  // FIXME replace mechanism with event bus when we are able to use it.
  public register(identifier: number, callback?: (isActive: boolean) => void) {
    if (!callback) {
      return;
    }

    if (this.callbacks.get(identifier) !== undefined) {
      throw new Error(`Cannot register the same failure identifier (${identifier}) multiple times.`);
    }

    this.callbacks.set(identifier, callback);
  }

  public isActive(identifier: number): boolean {
    return this.activeFailures.get(identifier) === true;
  }
}
