// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, HEvent, Instrument, KeyEventManager, MathUtils, Subject, UnitType } from '@microsoft/msfs-sdk';

export type BaroMode = ReturnType<typeof Simplane.getPressureSelectedMode>;
export type BaroUnit = ReturnType<typeof Simplane.getPressureSelectedUnits>;

export type BaroIndex = 1; // | 2;

interface BaroBaseEvents {
  baro_mode: BaroMode;
  baro_unit: BaroUnit;
  baro_correction: number;
  baro_preselect_changed: unknown;
}

export type BaroEvents = {
  [P in keyof BaroBaseEvents as `${P}_${BaroIndex}`]: BaroBaseEvents[P];
};

export class BaroManager implements Instrument {
  private readonly publisher = this.bus.getPublisher<BaroEvents>();
  private readonly sub = this.bus.getSubscriber<HEvent>();

  private keyEventManager?: KeyEventManager;

  private readonly mode = Subject.create<BaroMode>('STD');
  private readonly unit = Subject.create<BaroUnit>('millibar');
  private readonly correction = Subject.create(1013);

  private readonly modeEventKey: keyof BaroEvents = `baro_mode_${this.index}`;
  private readonly unitEventKey: keyof BaroEvents = `baro_unit_${this.index}`;
  private readonly correctionEventKey: keyof BaroEvents = `baro_correction_${this.index}`;
  private readonly preselectChangedEventKey: keyof BaroEvents = `baro_preselect_changed_${this.index}`;

  constructor(
    private readonly bus: EventBus,
    private readonly index: BaroIndex,
  ) {
    KeyEventManager.getManager(this.bus).then((manager) => (this.keyEventManager = manager));
  }

  public init(): void {
    this.mode.sub((v) => {
      SimVar.SetSimVarValue('KOHLSMAN SETTING STD', 'Bool', v === 'STD');
      // FIXME get rid of this when we stop using MSFS altimeter
      if (v !== 'STD') {
        // put pre-select into altimeter
        const correction = this.correction.get();
        const preSelectKohlsman =
          16 * (correction < 100 ? UnitType.HPA.convertFrom(correction, UnitType.IN_HG) : correction);
        // FIXME danger, need to setup altimeter 2 in systems.cfg for fo side rather than isis
        this.keyEventManager?.triggerKey('KOHLSMAN_SET', true, preSelectKohlsman, this.index);
      }
      this.publisher.pub(this.modeEventKey, v);
    }, true);

    this.unit.sub(this.onBaroUnitChanged.bind(this), true);

    this.correction.sub((v) => this.publisher.pub(this.correctionEventKey, v));

    this.sub.on('hEvent').handle(this.onHEvent.bind(this));
  }

  public onUpdate(): void {
    const units = Simplane.getPressureSelectedUnits();
    const mode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);
    const correction = Simplane.getPressureValue(units);

    this.unit.set(units);
    this.mode.set(mode);
    if (mode !== 'STD') {
      this.correction.set(correction);
    }
  }

  private onBaroUnitChanged(newUnit: BaroUnit): void {
    this.publisher.pub(this.unitEventKey, newUnit);

    if (this.mode.get() === 'STD') {
      // we need to change the unit of the pre-selected value
      const correction = this.correction.get();
      const isCorrectionInHg = correction < 100;
      if (newUnit === 'inches of mercury' && !isCorrectionInHg) {
        this.correction.set(MathUtils.round(UnitType.IN_HG.convertFrom(correction, UnitType.HPA), 0.01));
      } else if (newUnit === 'millibar' && isCorrectionInHg) {
        this.correction.set(MathUtils.round(UnitType.HPA.convertFrom(correction, UnitType.IN_HG), 1));
      }
    }
  }

  private onHEvent(event: string): void {
    if (this.mode.get() !== 'STD') {
      return;
    }

    switch (event) {
      case 'A380X_FCU_BARO_PRESEL_DEC': {
        const correction = this.correction.get();
        this.correction.set(correction - (correction > 100 ? 1 : 0.01));
        this.publisher.pub(this.preselectChangedEventKey, null);
        break;
      }
      case 'A380X_FCU_BARO_PRESEL_INC': {
        const correction = this.correction.get();
        this.correction.set(correction + (correction > 100 ? 1 : 0.01));
        this.publisher.pub(this.preselectChangedEventKey, null);
        break;
      }
    }
  }
}
