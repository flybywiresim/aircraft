// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  HEvent,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subscribable,
  Wait,
} from '@microsoft/msfs-sdk';
import { FGVars, FgVerticalArmedFlags } from '../../MsfsAvionicsCommon/providers/FGDataPublisher';
import { VerticalMode } from '@shared/autopilot';

export class AltitudeManager implements Instrument {
  private static readonly MANAGED_ARMED_MASK =
    FgVerticalArmedFlags.AltCst | FgVerticalArmedFlags.Clb | FgVerticalArmedFlags.Des | FgVerticalArmedFlags.Gs;
  private static readonly MANAGED_MODES = [
    VerticalMode.ALT_CST,
    VerticalMode.ALT_CST_CPT,
    VerticalMode.CLB,
    VerticalMode.DES,
    VerticalMode.FINAL,
    VerticalMode.GS_CPT,
    VerticalMode.GS_TRACK,
    VerticalMode.LAND,
    VerticalMode.FLARE,
    VerticalMode.ROLL_OUT,
  ];

  private readonly sub = this.bus.getSubscriber<FGVars & HEvent>();

  private readonly verticalMode = ConsumerSubject.create(this.sub.on('fg.fma.verticalMode'), 0);
  private readonly verticalArmed = ConsumerSubject.create(this.sub.on('fg.fma.verticalArmedBitmask'), 0);
  private readonly _isVerticalManaged = MappedSubject.create(
    ([verticalMode, verticalArmed]) =>
      (verticalArmed & AltitudeManager.MANAGED_ARMED_MASK) > 0 || AltitudeManager.MANAGED_MODES.includes(verticalMode),
    this.verticalMode,
    this.verticalArmed,
  );
  public readonly isVerticalManaged = this._isVerticalManaged as Subscribable<boolean>;

  constructor(private readonly bus: EventBus) {}

  public init(): void {
    Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame, true).then(() => {
      let initValue = 100;
      if (Simplane.getAltitudeAboveGround() > 1000) {
        initValue = Math.min(49000, Math.max(100, Math.round(Simplane.getAltitude() / 100) * 100));
      }
      Coherent.call('AP_ALT_VAR_SET_ENGLISH', 3, initValue, true).catch(console.error);
    });

    this.isVerticalManaged.sub((v) => SimVar.SetSimVarValue('L:A32NX_FCU_ALT_MANAGED', SimVarValueType.Bool, v), true);

    this.sub.on('hEvent').handle(this.onHEvent.bind(this));
  }

  public onUpdate(): void {
    // noop
  }

  private onHEvent(event: string): void {
    // FIXME don't handle events when not powered up
    if (event === 'A320_Neo_FCU_ALT_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PUSH', 'number', 0);
      SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 2);
    } else if (event === 'A320_Neo_FCU_ALT_PULL') {
      SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PULL', 'number', 0);
      SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 1);
    }
  }
}
