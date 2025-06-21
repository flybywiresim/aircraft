// Copyright (c) 2022-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  KeyEvents,
  KeyEventManager,
  KeyEventData,
  SimVarValueType,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { NotificationManager, PilotSeat, PilotSeatEvents } from '@flybywiresim/fbw-sdk';

interface KeyInterceptDefinition {
  /** A handler to be called when this key is inercepted. Defaults to no handler. */
  handler?: (data: KeyEventData) => void;
  /** Whether the event should be passed through to other consumers in the sim. Defaults to false. */
  passThrough?: boolean;
  /** Whether the event should be logged to the console. Defaults to false. */
  log?: boolean;
}

export type KeyInterceptDefinitions = [string, KeyInterceptDefinition][];

/**
 * This class is used to intercept the key events.
 * Subclasses should define the keys to be intercepted and their handlers in the {@link keys} property.
 */
export abstract class KeyInterceptor {
  private readonly keys: Map<string, KeyInterceptDefinition>;

  protected keyInterceptManager?: KeyEventManager;

  protected dialogVisible = false;

  private readonly sub = this.bus.getSubscriber<PilotSeatEvents>();
  protected readonly pilotSeat = ConsumerSubject.create(this.sub.on('pilot_seat'), PilotSeat.Left);

  constructor(
    protected readonly bus: EventBus,
    protected readonly notification: NotificationManager,
  ) {
    this.keys = new Map([
      ['MASTER_CAUTION_ACKNOWLEDGE', { handler: this.onMasterCautionAck.bind(this) }],
      ['MASTER_WARNING_ACKNOWLEDGE', { handler: this.onMasterWarningAck.bind(this) }],
      ...this.getExtraIntercepts(),
    ]);

    KeyEventManager.getManager(this.bus).then((manager) => {
      this.keyInterceptManager = manager;
      this.registerIntercepts();
    });
    console.log('KeyInterceptor: Created');
  }

  protected abstract getExtraIntercepts(): KeyInterceptDefinitions;

  public startPublish(): void {
    console.log('KeyInterceptor: startPublish()');
  }

  private registerIntercepts() {
    for (const [key, config] of this.keys.entries()) {
      // we can assert keyInterceptManager as this is called in it's callback
      this.keyInterceptManager!.interceptKey(key, !!config.passThrough);
    }

    const subscriber = this.bus.getSubscriber<KeyEvents>();
    subscriber.on('key_intercept').handle(this.onKeyIntercepted.bind(this));
  }

  private onKeyIntercepted(data: KeyEventData): void {
    const config = this.keys.get(data.key);
    if (!config) {
      return;
    }

    if (config.log) {
      console.log(`KeyInterceptor: ${data.key}`);
    }

    config.handler?.(data);
  }

  private togglePilotLocalVar(name: string, highTime = 500): void {
    const localVar = `L:${name}_${this.pilotSeat.get() === PilotSeat.Right ? 'R' : 'L'}`;
    SimVar.SetSimVarValue(localVar, SimVarValueType.Bool, true);
    setTimeout(() => SimVar.SetSimVarValue(localVar, SimVarValueType.Bool, false), highTime);
  }

  private onMasterCautionAck(): void {
    this.togglePilotLocalVar('PUSH_AUTOPILOT_MASTERCAUT');
  }

  private onMasterWarningAck(): void {
    this.togglePilotLocalVar('PUSH_AUTOPILOT_MASTERAWARN');
  }
}
