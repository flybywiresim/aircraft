// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DebounceTimer,
  EventBus,
  Instrument,
  MappedSubject,
  MathUtils,
  SimVarValueType,
  Subject,
  UnitType,
} from '@microsoft/msfs-sdk';

export enum BaroMode {
  Std,
  Qnh,
  Qfe,
}

export enum BaroUnit {
  Hpa,
  Hg,
}

export type BaroIndex = 1 | 2;

interface BaroBaseEvents {
  baro_mode: BaroMode;
  baro_unit: BaroUnit;
  baro_correction: number;
  baro_preselect_visible: boolean;
}

export type BaroEvents = {
  [P in keyof BaroBaseEvents as `${P}_${BaroIndex}`]: BaroBaseEvents[P];
};

export class BaroManager implements Instrument {
  private static readonly MAX_CORRECTION_HPA = 1100;
  private static readonly MAX_CORRECTION_HG = 32.48;
  private static readonly MIN_CORRECTION_HPA = 745;
  private static readonly MIN_CORRECTION_HG = 22.0;
  private static readonly PRESEL_TIME = 4_000;

  private readonly publisher = this.bus.getPublisher<BaroEvents>();

  // FIXME hook up to flypad setting when other systems support it
  private qfePinProg = false;
  private readonly lastBaroMode: BaroMode.Qfe | BaroMode.Qnh = BaroMode.Qnh;

  private readonly mode = Subject.create(BaroMode.Qnh);
  private readonly unit = Subject.create(BaroUnit.Hpa);
  private readonly correction = Subject.create(1013);

  private readonly modeEventKey: keyof BaroEvents = `baro_mode_${this.index}`;
  private readonly unitEventKey: keyof BaroEvents = `baro_unit_${this.index}`;
  private readonly correctionEventKey: keyof BaroEvents = `baro_correction_${this.index}`;
  private readonly preselectVisibleEventKey: keyof BaroEvents = `baro_preselect_visible_${this.index}`;

  private readonly unitSelectorVarId = SimVar.GetRegisteredId(
    `L:XMLVAR_Baro_Selector_HPA_1`, // FIXME split
    SimVarValueType.Bool,
    'FCU',
  );

  private readonly preselectLocalVarName = `L:A380X_EFIS_${this.index === 2 ? 'R' : 'L'}_BARO_PRESELECTED`;
  private readonly preSelectVisibileTimer = new DebounceTimer();
  private readonly isPreSelectVisible = Subject.create(false);
  private readonly preselectLocalVarValue = MappedSubject.create(
    ([isVisible, correction]) => (isVisible ? correction : 0),
    this.isPreSelectVisible,
    this.correction,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly index: BaroIndex,
  ) {}

  public init(): void {
    this.mode.sub(this.onBaroModeChanged.bind(this), true);
    this.unit.sub(this.onBaroUnitChanged.bind(this), true);
    this.correction.sub(this.onBaroCorrectionChanged.bind(this), true);

    this.mode.sub((v) => v !== BaroMode.Std && this.isPreSelectVisible.set(false));
    this.isPreSelectVisible.sub((v) => {
      this.publisher.pub(this.preselectVisibleEventKey, v);
    }, true);

    this.preselectLocalVarValue.sub(
      (v) => SimVar.SetSimVarValue(this.preselectLocalVarName, SimVarValueType.Number, v),
      true,
    );
  }

  public onUpdate(): void {
    this.unit.set(SimVar.GetSimVarValueFastReg(this.unitSelectorVarId) > 0 ? BaroUnit.Hpa : BaroUnit.Hg);
  }

  private onBaroUnitChanged(newUnit: BaroUnit): void {
    const correction = this.correction.get();
    const isCorrectionInHg = correction < 100;
    const unit = this.unit.get();
    if (unit === BaroUnit.Hg && !isCorrectionInHg) {
      this.correction.set(MathUtils.round(UnitType.IN_HG.convertFrom(correction, UnitType.HPA), 0.01));
    } else if (unit === BaroUnit.Hpa && isCorrectionInHg) {
      this.correction.set(MathUtils.round(UnitType.HPA.convertFrom(correction, UnitType.IN_HG), 1));
    }

    this.publisher.pub(this.unitEventKey, newUnit);
  }

  private onBaroModeChanged(newMode: BaroMode): void {
    this.publisher.pub(this.modeEventKey, newMode);
  }

  private onBaroCorrectionChanged(newCorrection: number): void {
    this.publisher.pub(this.correctionEventKey, newCorrection);
  }

  public setCorrection(correction: number): void {
    const isCorrectionInHg = correction < 100;
    const unit = this.unit.get();
    if (unit === BaroUnit.Hg && !isCorrectionInHg) {
      this.correction.set(MathUtils.round(UnitType.IN_HG.convertFrom(correction, UnitType.HPA), 0.01));
    } else if (unit === BaroUnit.Hpa && isCorrectionInHg) {
      this.correction.set(MathUtils.round(UnitType.HPA.convertFrom(correction, UnitType.IN_HG), 1));
    } else {
      this.correction.set(MathUtils.round(correction, unit === BaroUnit.Hg ? 0.01 : 1));
    }

    if (this.mode.get() === BaroMode.Std) {
      this.isPreSelectVisible.set(true);
      this.preSelectVisibileTimer.schedule(() => this.isPreSelectVisible.set(false), BaroManager.PRESEL_TIME);
    }
  }

  private incrementCorrection(direction: 1 | -1): void {
    const unit = this.unit.get();
    const mode = this.mode.get();

    const increment = direction * (unit === BaroUnit.Hg ? 0.01 : 1);
    this.correction.set(
      MathUtils.clamp(
        this.correction.get() + increment,
        unit === BaroUnit.Hg ? BaroManager.MIN_CORRECTION_HG : BaroManager.MIN_CORRECTION_HPA,
        unit === BaroUnit.Hg ? BaroManager.MAX_CORRECTION_HG : BaroManager.MAX_CORRECTION_HPA,
      ),
    );
    if (mode === BaroMode.Std) {
      this.isPreSelectVisible.set(true);
      this.preSelectVisibileTimer.schedule(() => this.isPreSelectVisible.set(false), BaroManager.PRESEL_TIME);
    }
  }

  public onRotateClockwise(): void {
    this.incrementCorrection(1);
  }

  public onRotateCounterClockwise(): void {
    this.incrementCorrection(-1);
  }

  public setMode(mode: BaroMode): void {
    if (mode === BaroMode.Qfe && !this.qfePinProg) {
      return;
    }
    this.mode.set(mode);
  }

  public onPull(): void {
    const mode = this.mode.get();
    if (mode === BaroMode.Std) {
      this.mode.set(this.lastBaroMode);
    } else if (this.qfePinProg) {
      this.mode.set(mode === BaroMode.Qfe ? BaroMode.Qnh : BaroMode.Qfe);
    } else {
      this.mode.set(BaroMode.Qnh);
    }
  }

  public onPush(): void {
    this.mode.set(BaroMode.Std);
  }
}
