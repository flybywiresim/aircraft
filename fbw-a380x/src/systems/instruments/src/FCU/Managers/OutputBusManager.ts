//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Arinc429RegisterSubject, Arinc429SignStatusMatrix } from '@flybywiresim/fbw-sdk';
import {
  ConsumerSubject,
  EventBus,
  Instrument,
  MathUtils,
  Subscribable,
  Subscription,
  UnitType,
} from '@microsoft/msfs-sdk';
import { BaroEvents, BaroMode, BaroUnit } from 'instruments/src/FCU/Managers/BaroManager';

interface DiscreteOutputWordDef {
  localVarName: string;
  bits: Map<number, Subscribable<boolean>>;
}

interface NumericOutputWordDef {
  localVarName: string;
  value: Subscribable<number>;
}

export class OutputBusManager implements Instrument {
  private readonly sub = this.bus.getSubscriber<BaroEvents>();

  private readonly baroMode1 = ConsumerSubject.create(this.sub.on('baro_mode_1'), BaroMode.Qnh);
  private readonly baroMode2 = ConsumerSubject.create(this.sub.on('baro_mode_2'), BaroMode.Qnh);
  private readonly baroUnit1 = ConsumerSubject.create(this.sub.on('baro_unit_1'), BaroUnit.Hpa);
  private readonly baroUnit2 = ConsumerSubject.create(this.sub.on('baro_unit_2'), BaroUnit.Hpa);
  private readonly baroCorrection1 = ConsumerSubject.create(this.sub.on('baro_correction_1'), 1013);
  private readonly baroCorrection2 = ConsumerSubject.create(this.sub.on('baro_correction_2'), 1013);

  // FIXME change to A380X prefix once the rusty boys can handle it
  private readonly outputWordDefs: (DiscreteOutputWordDef | NumericOutputWordDef)[] = [
    {
      localVarName: 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_1',
      // FIXME add the ND range bits
      bits: new Map([[11, this.baroUnit1.map((v) => v === BaroUnit.Hg)]]),
    },
    {
      localVarName: 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_1',
      // FIXME add the ND range bits
      bits: new Map([[11, this.baroUnit2.map((v) => v === BaroUnit.Hg)]]),
    },
    {
      localVarName: 'L:A32NX_FCU_LEFT_EIS_DISCRETE_WORD_2',
      bits: new Map([
        // FIXME add the ND mode, and option bits
        [28, this.baroMode1.map((v) => v === BaroMode.Std)],
        [29, this.baroMode1.map((v) => v === BaroMode.Qnh)],
      ]),
    },
    {
      localVarName: 'L:A32NX_FCU_RIGHT_EIS_DISCRETE_WORD_2',
      bits: new Map([
        // FIXME add the ND mode, and option bits
        [28, this.baroMode2.map((v) => v === BaroMode.Std)],
        [29, this.baroMode2.map((v) => v === BaroMode.Qnh)],
      ]),
    },
    {
      localVarName: 'L:A32NX_FCU_LEFT_EIS_BARO',
      value: this.baroCorrection1.map((v) =>
        MathUtils.round(v < 100 ? v : UnitType.IN_HG.convertFrom(v, UnitType.HPA), 0.001),
      ),
    },
    {
      localVarName: 'L:A32NX_FCU_RIGHT_EIS_BARO',
      value: this.baroCorrection2.map((v) =>
        MathUtils.round(v < 100 ? v : UnitType.IN_HG.convertFrom(v, UnitType.HPA), 0.001),
      ),
    },
    {
      localVarName: 'L:A32NX_FCU_LEFT_EIS_BARO_HPA',
      value: this.baroCorrection1.map((v) =>
        MathUtils.round(v >= 100 ? v : UnitType.HPA.convertFrom(v, UnitType.IN_HG), 0.1),
      ),
    },
    {
      localVarName: 'L:A32NX_FCU_RIGHT_EIS_BARO_HPA',
      value: this.baroCorrection2.map((v) =>
        MathUtils.round(v >= 100 ? v : UnitType.HPA.convertFrom(v, UnitType.IN_HG), 0.1),
      ),
    },
  ];

  private readonly valueSubs: Subscription[] = [];
  private readonly outputWords: Arinc429RegisterSubject[] = [];

  constructor(
    private readonly bus: EventBus,
    private readonly isHealthy: Subscribable<boolean>,
  ) {}

  /** @inheritdoc */
  public init(): void {
    for (const output of this.outputWordDefs) {
      const arincWord = Arinc429RegisterSubject.createEmpty();
      if ('bits' in output) {
        for (const [bit, value] of output.bits.entries()) {
          this.valueSubs.push(value.sub((v) => arincWord.setBitValue(bit, v)));
        }
      } else {
        this.valueSubs.push(output.value.sub((v) => arincWord.setValue(v)));
      }
      this.outputWords.push(arincWord);
      arincWord.sub((v) => v.writeToSimVar(output.localVarName), true);
    }

    this.isHealthy.sub((v) => {
      const ssm = v ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.FailureWarning;
      for (const sub of this.valueSubs) {
        if (ssm === Arinc429SignStatusMatrix.FailureWarning) {
          sub.pause();
        } else {
          sub.resume(true);
        }
      }
      for (const word of this.outputWords) {
        word.setSsm(ssm);
        if (ssm === Arinc429SignStatusMatrix.FailureWarning) {
          word.setValue(0);
        }
      }
    }, true);
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
