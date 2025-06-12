// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscription,
} from '@microsoft/msfs-sdk';
import { A32NXElectricalSystemEvents } from '../../../shared/src/publishers/A32NXElectricalSystemPublisher';
import { A32NXFcuBusEvents } from '../../../shared/src/publishers/A32NXFcuBusPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429RegisterSubject,
  Arinc429SignStatusMatrix,
  DmcSwitchingKnob,
} from '@flybywiresim/fbw-sdk';

// In future this will move to the Systems instance in VCockpitLogic which will also handle the
// display switching, and then it can be expanded a bit and become a DMC rather than the combined DMC bus.
// For now it can live in each PFD, just to relay DMC L/R data as needed.
export class PseudoDmc implements Instrument {
  private readonly sub = this.bus.getSubscriber<A32NXElectricalSystemEvents & A32NXFcuBusEvents & Arinc429Values>();

  private readonly dmcSwitchingState = Subject.create(DmcSwitchingKnob.Norm);

  private readonly fcuDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly mainElecSupply = ConsumerSubject.create(null, false);
  private readonly alternateElecSupply = ConsumerSubject.create(null, false);
  private readonly isAcPowered = MappedSubject.create(
    ([isMainSupplyPowered, isAlternateSupplyPowered, dmcSwitching]) =>
      dmcSwitching === (this.isRightSide ? DmcSwitchingKnob.Fo : DmcSwitchingKnob.Capt)
        ? isAlternateSupplyPowered
        : isMainSupplyPowered,
    this.mainElecSupply,
    this.alternateElecSupply,
    this.dmcSwitchingState,
  );

  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));

  private readonly dmcDiscreteWord350 = Arinc429RegisterSubject.createEmpty();
  private readonly dmcAltitude = Arinc429RegisterSubject.createEmpty();

  private readonly outputWords = [this.dmcDiscreteWord350, this.dmcAltitude];

  /** Not valid until init is called! */
  private isRightSide = false;

  constructor(
    private readonly bus: EventBus,
    private readonly instrument: BaseInstrument,
  ) {}

  /** @inheritdoc */
  public init(): void {
    this.isRightSide = this.instrument.instrumentIndex === 2;

    const outputSubs: Subscription[] = [
      this.fcuDiscreteWord2.sub(
        (v) => {
          // STD
          this.dmcDiscreteWord350.setBitValue(11, v.bitValueOr(28, false));
          // QNH
          this.dmcDiscreteWord350.setBitValue(12, v.bitValueOr(29, false));
          this.dmcDiscreteWord350.setSsm(Arinc429SignStatusMatrix.NormalOperation);
        },
        true,
        true,
      ),
      this.altitude.sub((v) => this.dmcAltitude.setWord(v.rawWord), true, true),
    ];

    this.isAcPowered.sub((isPowered) => {
      if (isPowered) {
        for (const sub of outputSubs) {
          sub.resume(true);
        }
      } else {
        for (const sub of outputSubs) {
          sub.pause();
        }
        for (const word of this.outputWords) {
          word.setValueSsm(0, Arinc429SignStatusMatrix.FailureWarning);
        }
      }
    }, true);

    this.dmcDiscreteWord350.sub(
      (word) =>
        word.writeToSimVar(
          this.isRightSide ? 'L:A32NX_DMC_DISCRETE_WORD_350_RIGHT' : 'L:A32NX_DMC_DISCRETE_WORD_350_LEFT',
        ),
      true,
    );
    this.dmcAltitude.sub(
      (word) => word.writeToSimVar(this.isRightSide ? 'L:A32NX_DMC_ALTITUDE_RIGHT' : 'L:A32NX_DMC_ALTITUDE_LEFT'),
      true,
    );

    this.mainElecSupply.setConsumer(
      this.sub.on(this.isRightSide ? 'a32nx_elec_ac_2_bus_is_powered' : 'a32nx_elec_ac_ess_bus_is_powered'),
    );

    this.alternateElecSupply.setConsumer(
      this.sub.on(this.isRightSide ? 'a32nx_elec_ac_1_bus_is_powered' : 'a32nx_elec_ac_ess_bus_is_powered'),
    );

    this.fcuDiscreteWord2.setConsumer(
      this.sub.on(this.isRightSide ? 'a32nx_fcu_eis_discrete_word_2_right' : 'a32nx_fcu_eis_discrete_word_2_left'),
    );
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.dmcSwitchingState.set(SimVar.GetSimVarValue('L:A32NX_EIS_DMC_SWITCHING_KNOB', SimVarValueType.Enum));
  }
}
