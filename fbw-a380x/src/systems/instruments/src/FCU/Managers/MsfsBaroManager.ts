// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  HEvent,
  Instrument,
  KeyEventData,
  KeyEventManager,
  KeyEvents,
  SimVarValueType,
  Subscribable,
  Wait,
} from '@microsoft/msfs-sdk';
import { BaroEvents, BaroIndex, BaroManager, BaroMode, BaroUnit } from './BaroManager';

export interface BaroKeyManagerConfig {
  readonly baros: {
    readonly manager: BaroManager;
    readonly msfsAltimeter: number;
    readonly index: BaroIndex;
  }[];
}

type BaroState = BaroKeyManagerConfig['baros'][number] & {
  activeMode: Subscribable<BaroMode>;
  activeUnit: Subscribable<BaroUnit>;
  activeCorrection: Subscribable<number>;
  modeInitVarName: string;
  correctionInitVarHgName: string;
  correctionInitVarHpaName: string;
  stdVarName: string;
};

export class MsfsBaroManager implements Instrument {
  private static H_EVENT_REGEX = /^A380X_EFIS_CP_BARO_(PULL|PUSH)_(\d)$/;

  private static readonly HG_TO_KOHLSMAN = 541.822186666672;
  private static readonly HPA_TO_KOHLSMAN = 16;

  private readonly sub = this.bus.getSubscriber<BaroEvents & HEvent>();

  private readonly baroManagerByMsfsIndex = new Map<number, BaroState>(
    this.config.baros.map((c) => [
      c.msfsAltimeter,
      {
        ...c,
        activeMode: ConsumerSubject.create(this.sub.on(`baro_mode_${c.index}`), BaroMode.Qnh),
        activeUnit: ConsumerSubject.create(this.sub.on(`baro_unit_${c.index}`), BaroUnit.Hpa),
        activeCorrection: ConsumerSubject.create(this.sub.on(`baro_correction_${c.index}`), 1013),
        modeInitVarName: 'L:XMLVAR_Baro1_Mode',
        correctionInitVarHgName: 'KOHLSMAN SETTING HG:1',
        correctionInitVarHpaName: 'KOHLSMAN SETTING MB:1',
        stdVarName: `KOHLSMAN SETTING STD:${c.msfsAltimeter}`,
      },
    ]),
  );

  private readonly seaLevelPressureVarId = SimVar.GetRegisteredId('SEA LEVEL PRESSURE', SimVarValueType.HPA, 'FCU');

  // FIXME split baros and set from flypad setting
  private syncEnabled = true;

  constructor(
    private readonly bus: EventBus,
    private readonly config: BaroKeyManagerConfig,
  ) {}

  private keyEventManager?: KeyEventManager;

  /** @inheritdoc */
  public init(): void {
    this.bus.getSubscriber<KeyEvents>().on('key_intercept').handle(this.handleKeyEvent.bind(this));

    KeyEventManager.getManager(this.bus).then((manager) => {
      this.keyEventManager = manager;
      this.setupKeyIntecepts(manager);
    });

    Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame).then(() => this.initFromMsfsVars());

    this.sub.on('hEvent').handle(this.handleHEvent.bind(this));

    this.setupSyncToMsfs();
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }

  private setMsfsCorrection(msfsAltimeter: number, correction: number): void {
    const isHg = correction < 100;
    const kohlsman = correction * (isHg ? MsfsBaroManager.HG_TO_KOHLSMAN : MsfsBaroManager.HPA_TO_KOHLSMAN);
    this.keyEventManager?.triggerKey('KOHLSMAN_SET', true, kohlsman, msfsAltimeter);
  }

  private initFromMsfsVars(): void {
    for (const baro of this.baroManagerByMsfsIndex.values()) {
      switch (SimVar.GetSimVarValue(baro.modeInitVarName, SimVarValueType.Enum)) {
        case 0:
          baro.manager.setMode(BaroMode.Qfe);
          break;
        case 1:
          baro.manager.setMode(BaroMode.Qnh);
          break;
        default:
          baro.manager.setMode(BaroMode.Std);
          break;
      }

      if (baro.activeUnit.get() === BaroUnit.Hg) {
        baro.manager.setCorrection(SimVar.GetSimVarValue(baro.correctionInitVarHgName, SimVarValueType.InHG));
      } else {
        baro.manager.setCorrection(SimVar.GetSimVarValue(baro.correctionInitVarHpaName, SimVarValueType.HPA));
      }
    }
  }

  private handleHEvent(event: string): void {
    const match = event.match(MsfsBaroManager.H_EVENT_REGEX);
    if (match !== null) {
      const event = match[1];
      const msfsIndex = parseInt(match[2]);
      const baro = this.baroManagerByMsfsIndex.get(msfsIndex);
      if (baro) {
        switch (event) {
          case 'PUSH':
            baro.manager.onPush();
            break;
          case 'PULL':
            baro.manager.onPull();
            break;
        }

        if (this.syncEnabled) {
          const newMode = baro.activeMode.get();
          for (const offsideBaro of this.baroManagerByMsfsIndex.values()) {
            if (baro.index !== offsideBaro.index) {
              offsideBaro.manager.setMode(newMode);
            }
          }
        }
      } else {
        console.error(`Received H event ${event} for baro index that doesn't exist!`);
      }
    }
  }

  private setupSyncToMsfs(): void {
    // sync the state to the MSFS altimeters for the benefit of third party software and the sim itself
    for (const baro of this.baroManagerByMsfsIndex.values()) {
      baro.activeMode.sub((v) => {
        if (v === BaroMode.Std) {
          this.keyEventManager?.triggerKey('BAROMETRIC_STD_PRESSURE', true, baro.msfsAltimeter);
          SimVar.SetSimVarValue(baro.stdVarName, SimVarValueType.Bool, 1);
        } else {
          SimVar.SetSimVarValue(baro.stdVarName, SimVarValueType.Bool, 0);
          this.setMsfsCorrection(baro.msfsAltimeter, baro.activeCorrection.get());
        }
      }, true);

      baro.activeCorrection.sub((correction) => {
        if (baro.activeMode.get() !== BaroMode.Std) {
          this.setMsfsCorrection(baro.msfsAltimeter, correction);
        }
      });
    }
  }

  private setupKeyIntecepts(manager: KeyEventManager): void {
    manager.interceptKey('KOHLSMAN_INC', false);
    manager.interceptKey('KOHLSMAN_DEC', false);
    manager.interceptKey('KOHLSMAN_SET', false);
    manager.interceptKey('BAROMETRIC', false);
    manager.interceptKey('BAROMETRIC_STD_PRESSURE', false);
  }

  private handleKeyEvent(ev: KeyEventData): void {
    let msfsIndex: number;

    switch (ev.key) {
      case 'KOHLSMAN_INC':
        msfsIndex = Math.max(1, ev.value0 ?? 0);
        break;
      case 'KOHLSMAN_DEC':
        msfsIndex = Math.max(1, ev.value0 ?? 0);
        break;
      case 'KOHLSMAN_SET':
        msfsIndex = ev.value1 ?? 0;
        break;
      case 'BAROMETRIC':
        msfsIndex = 0;
        break;
      case 'BAROMETRIC_STD_PRESSURE':
        msfsIndex = ev.value0 ?? 0;
        break;
      default:
        return;
    }

    if (this.baroManagerByMsfsIndex.has(msfsIndex)) {
      this.handleBaroKeyEvent(msfsIndex, ev);
    } else if (msfsIndex === 0) {
      for (const msfsIndex of this.baroManagerByMsfsIndex.keys()) {
        this.handleBaroKeyEvent(msfsIndex, ev);
      }
      this.keyEventManager?.triggerKey(ev.key, true, ev.value0, ev.value1, ev.value2);
    } else {
      this.keyEventManager?.triggerKey(ev.key, true, ev.value0, ev.value1, ev.value2);
    }
  }

  private handleBaroKeyEvent(msfsIndex: number, event: KeyEventData): void {
    const baro = this.baroManagerByMsfsIndex.get(msfsIndex);
    if (!baro) {
      throw new Error(`Invalid altimeter index for FCU: ${msfsIndex}`);
    }

    switch (event.key) {
      case 'KOHLSMAN_INC':
        baro.manager.onRotateClockwise();
        if (this.syncEnabled) {
          this.syncBaroCorrectionToOthers(baro);
        }
        break;
      case 'KOHLSMAN_DEC':
        baro.manager.onRotateCounterClockwise();
        if (this.syncEnabled) {
          this.syncBaroCorrectionToOthers(baro);
        }
        break;
      case 'KOHLSMAN_SET':
        if (event.value0) {
          baro.manager.setCorrection(event.value0 / 16.0);
          if (this.syncEnabled) {
            this.syncBaroCorrectionToOthers(baro);
          }
        } else {
          console.error('KOHLSMAN_SET with no value0!');
        }
        break;
      case 'BAROMETRIC':
        this.setSeaLevelPressure();
        break;
      case 'BAROMETRIC_STD_PRESSURE':
        baro.manager.onPush();
        if (this.syncEnabled) {
          const newMode = baro.activeMode.get();
          for (const offsideBaro of this.baroManagerByMsfsIndex.values()) {
            if (baro.index !== offsideBaro.index) {
              offsideBaro.manager.setMode(newMode);
            }
          }
        }
        break;
      default:
        console.error(`Unhandled event in handleBaroKeyEvent ${event.key}!`);
        break;
    }
  }

  private syncBaroCorrectionToOthers(syncFrom: BaroState): void {
    const correction = syncFrom.activeCorrection.get();

    for (const baro of this.baroManagerByMsfsIndex.values()) {
      if (baro.index === syncFrom.index) {
        continue;
      }

      baro.manager.setCorrection(correction);
    }
  }

  private setSeaLevelPressure(): void {
    const correction = SimVar.GetSimVarValueFastReg(this.seaLevelPressureVarId);
    for (const baro of this.baroManagerByMsfsIndex.values()) {
      baro.manager.setCorrection(correction);
    }
  }
}
