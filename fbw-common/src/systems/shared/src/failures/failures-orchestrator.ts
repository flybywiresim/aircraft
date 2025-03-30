// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AtaChapterNumber } from '../ata';
import { GenericDataListenerSync } from '../GenericDataListenerSync';

export interface Failure {
  ata: AtaChapterNumber;
  identifier: number;
  name: string;
}

export type FailureDefinition = [AtaChapterNumber, number, string];

/**
 * Orchestrates the activation and deactivation of failures.
 *
 * Only a single instance of the orchestrator should exist within the whole application.
 */
export class FailuresOrchestrator {
  // FIXME replace with EventBus once EFB and RMP ported to avionics framework
  // we can also then use SetSubject to simplify the rest of the code a bit
  private readonly genericDataListener = new GenericDataListenerSync(
    this.onDataListenerMessage.bind(this),
    'FBW_FAILURE_REQUEST',
  );

  private failures: Failure[] = [];

  private activeFailures = new Set<number>();

  private needSendFailures = true;

  constructor(failures: FailureDefinition[]) {
    failures.forEach((failure) => {
      this.failures.push({
        ata: failure[0],
        identifier: failure[1],
        name: failure[2],
      });
    });

    RegisterViewListener(
      'JS_LISTENER_COMM_BUS',
      (listener) => {
        listener.on('FBW_FAILURE_REQUEST', () => (this.needSendFailures = true));
        // better send in case we missed a request from a wasm consumer
        this.needSendFailures = true;
      },
      true,
    );
  }

  private sendFailuresToWasm(activeFailures: number[]): void {
    Coherent.call('COMM_BUS_WASM_CALLBACK', 'FBW_FAILURE_UPDATE', JSON.stringify(activeFailures));
  }

  private sendFailuresToJs(activeFailures: number[]): void {
    this.genericDataListener.sendEvent('FBW_FAILURE_UPDATE', activeFailures);
  }

  private onDataListenerMessage(topic: string): void {
    if (topic === 'FBW_FAILURE_REQUEST') {
      this.needSendFailures = true;
    }
  }

  update() {
    if (this.needSendFailures) {
      this.needSendFailures = false;
      const failures = Array.from(this.activeFailures);
      this.sendFailuresToWasm(failures);
      this.sendFailuresToJs(failures);
    }
  }

  /**
   * Activates the failure with the given identifier.
   */
  async activate(identifier: number): Promise<void> {
    this.activeFailures.add(identifier);
    this.needSendFailures = true;
  }

  /**
   * Deactivates the failure with the given identifier.
   */
  async deactivate(identifier: number): Promise<void> {
    this.activeFailures.delete(identifier);
    this.needSendFailures = true;
  }

  /**
   * Determines whether or not the failure with the given identifier is active.
   */
  isActive(identifier: number): boolean {
    return this.activeFailures.has(identifier);
  }

  getAllFailures(): Readonly<Readonly<Failure>[]> {
    return this.failures;
  }

  getActiveFailures(): Set<number> {
    return new Set(this.activeFailures);
  }
}
