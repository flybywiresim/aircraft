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
  Arinc429WordData,
  DmcSwitchingKnob,
  IrBusEvents,
  RegisteredSimVar,
} from '@flybywiresim/fbw-sdk';
import { AdirsSimVars } from '../MsfsAvionicsCommon/SimVarTypes';
import { GlobalDmcEvents } from '../MsfsAvionicsCommon/GlobalDmcEvents';
import { SwitchingPanelVSimVars } from 'instruments/src/MsfsAvionicsCommon/SimVarTypes';

// In future this will move to the Systems instance in VCockpitLogic which will also handle the
// display switching, and then it can be expanded a bit and become a DMC rather than the combined DMC bus.
// For now it can live in each PFD, just to relay DMC L/R data as needed.
export class PseudoDmc implements Instrument {
  private readonly sub = this.bus.getSubscriber<
    A32NXElectricalSystemEvents &
      A32NXFcuBusEvents &
      AdirsSimVars &
      Arinc429Values &
      IrBusEvents &
      SwitchingPanelVSimVars
  >();
  private readonly publisher = this.bus.getPublisher<GlobalDmcEvents>();

  private readonly monotonicSimTimeVar = RegisteredSimVar.create<number>('E:SIMULATION TIME', SimVarValueType.Number);
  private currentTime = 0;
  private mainPoweredOnTime = 0;
  private alternatePoweredOnTime = 0;
  private readonly flash1Hz = Subject.create(false);

  private readonly dmcSwitchingState = Subject.create(DmcSwitchingKnob.Norm);
  private readonly isOnAlternateDmc = this.dmcSwitchingState.map(
    (v) => v === (this.isRightSide ? DmcSwitchingKnob.Fo : DmcSwitchingKnob.Capt),
  );

  private readonly fcuDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly adrSwitchingKnob = ConsumerSubject.create(this.sub.on('airKnob'), 0);

  private readonly mainElecSupply = ConsumerSubject.create(null, false);
  private readonly alternateElecSupply = ConsumerSubject.create(null, false);
  private readonly isAcPowered = MappedSubject.create(
    ([isMainSupplyPowered, isAlternateSupplyPowered, isOnAlternateDmc]) =>
      isOnAlternateDmc ? isAlternateSupplyPowered : isMainSupplyPowered,
    this.mainElecSupply,
    this.alternateElecSupply,
    this.isOnAlternateDmc,
  );

  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));

  private readonly dmcDiscreteWord272 = Arinc429RegisterSubject.createEmpty();
  private readonly dmcDiscreteWord350 = Arinc429RegisterSubject.createEmpty();
  private readonly dmcAltitude = Arinc429RegisterSubject.createEmpty();

  private readonly selectedIrDiscreteWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('irMaintWordRaw'), 0);
  private readonly dmcDiscreteWord271 = Arinc429RegisterSubject.createEmpty();
  private readonly irDiscreteWordOnside = Arinc429LocalVarConsumerSubject.create(null, 0);
  private readonly irDiscreteWordBackup = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_maint_word_3'), 0);
  /** SDI 01 for DMC L, SDI 10 for DMC R */
  private readonly dmcDiscreteWord313Onside = Arinc429RegisterSubject.createEmpty();
  /** SDI 11 */
  private readonly dmcDiscreteWord313Backup = Arinc429RegisterSubject.createEmpty();
  private readonly irPitchAngleWordOnside = ConsumerSubject.create(null, 0);
  private readonly irPitchAngleWordBackup = ConsumerSubject.create(this.sub.on('ir_pitch_3'), 0);
  /** SDI 01 for DMC L, SDI 10 for DMC R */
  private readonly dmcPitchAngleWord324Onside = Arinc429RegisterSubject.createEmpty();
  /** SDI 11 */
  private readonly dmcPitchAngleWord324Backup = Arinc429RegisterSubject.createEmpty();

  private readonly outputWords = [
    this.dmcDiscreteWord271,
    this.dmcDiscreteWord313Backup,
    this.dmcDiscreteWord313Onside,
    this.dmcDiscreteWord350,
    this.dmcAltitude,
    this.dmcPitchAngleWord324Onside,
    this.dmcPitchAngleWord324Backup,
  ];

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
      this.selectedIrDiscreteWord.sub((v) => PseudoDmc.mapIrDiscreteToDmc(v, this.dmcDiscreteWord271), true, true),
      this.irDiscreteWordOnside.sub(
        (v) =>
          this.dmcDiscreteWord313Onside.setValueSsm(
            v.value << 10,
            v.isInvalid() ? Arinc429SignStatusMatrix.NoComputedData : v.ssm,
          ),
        true,
        true,
      ),
      this.irDiscreteWordBackup.sub(
        (v) =>
          this.dmcDiscreteWord313Backup.setValueSsm(
            v.value << 10,
            v.isInvalid() ? Arinc429SignStatusMatrix.NoComputedData : v.ssm,
          ),
        true,
        true,
      ),
      this.irPitchAngleWordOnside.sub((v) => this.dmcPitchAngleWord324Onside.setWord(v), true, true),
      this.irPitchAngleWordBackup.sub((v) => this.dmcPitchAngleWord324Backup.setWord(v), true, true),
      this.adrSwitchingKnob.sub(
        (knobPosition) => {
          if (this.isRightSide) {
            this.dmcDiscreteWord272.setBitValue(13, knobPosition === 2);
            this.dmcDiscreteWord272.setBitValue(14, knobPosition === 1 || knobPosition === 2);
          } else {
            this.dmcDiscreteWord272.setBitValue(13, knobPosition === 0 || knobPosition === 1);
            this.dmcDiscreteWord272.setBitValue(14, knobPosition === 0);
          }
          this.dmcDiscreteWord272.setSsm(Arinc429SignStatusMatrix.NormalOperation);
        },
        true,
        true,
      ),
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

    this.mainElecSupply.sub((v) => {
      if (v) {
        this.mainPoweredOnTime = this.currentTime;
      } else {
        this.mainPoweredOnTime = 0;
      }
    }, true);

    this.alternateElecSupply.sub((v) => {
      if (v) {
        this.alternatePoweredOnTime = this.currentTime;
      } else {
        this.alternatePoweredOnTime = 0;
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

    this.dmcDiscreteWord271.sub(
      (word) =>
        word.writeToSimVar(
          this.isRightSide ? 'L:A32NX_DMC_DISCRETE_WORD_271_RIGHT' : 'L:A32NX_DMC_DISCRETE_WORD_271_LEFT',
        ),
      true,
    );
    this.dmcDiscreteWord313Onside.sub(
      (word) =>
        word.writeToSimVar(
          this.isRightSide ? 'L:A32NX_DMC_IR_2_DISCRETE_WORD_RIGHT' : 'L:A32NX_DMC_IR_1_DISCRETE_WORD_LEFT',
        ),
      true,
    );
    this.dmcDiscreteWord313Backup.sub(
      (word) =>
        word.writeToSimVar(
          this.isRightSide ? 'L:A32NX_DMC_IR_3_DISCRETE_WORD_RIGHT' : 'L:A32NX_DMC_IR_3_DISCRETE_WORD_LEFT',
        ),
      true,
    );
    this.dmcPitchAngleWord324Onside.sub(
      (word) =>
        word.writeToSimVar(
          this.isRightSide ? 'L:A32NX_DMC_IR_2_PITCH_ANGLE_RIGHT' : 'L:A32NX_DMC_IR_1_PITCH_ANGLE_LEFT',
        ),
      true,
    );
    this.dmcPitchAngleWord324Backup.sub(
      (word) =>
        word.writeToSimVar(
          this.isRightSide ? 'L:A32NX_DMC_IR_3_PITCH_ANGLE_RIGHT' : 'L:A32NX_DMC_IR_3_PITCH_ANGLE_LEFT',
        ),
      true,
    );

    const flash1HzTopic: keyof GlobalDmcEvents = this.isRightSide ? 'dmc_right_flash_1hz' : 'dmc_left_flash_1hz';
    this.flash1Hz.sub((v) => this.publisher.pub(flash1HzTopic, v, true, true), true);

    this.mainElecSupply.setConsumer(
      this.sub.on(this.isRightSide ? 'a32nx_elec_ac_2_bus_is_powered' : 'a32nx_elec_ac_ess_bus_is_powered'),
    );

    this.alternateElecSupply.setConsumer(
      this.sub.on(this.isRightSide ? 'a32nx_elec_ac_1_bus_is_powered' : 'a32nx_elec_ac_ess_bus_is_powered'),
    );

    this.fcuDiscreteWord2.setConsumer(
      this.sub.on(this.isRightSide ? 'a32nx_fcu_eis_discrete_word_2_right' : 'a32nx_fcu_eis_discrete_word_2_left'),
    );

    this.irDiscreteWordOnside.setConsumer(this.sub.on(this.isRightSide ? 'ir_maint_word_2' : 'ir_maint_word_1'));
    this.irPitchAngleWordOnside.setConsumer(this.sub.on(this.isRightSide ? 'ir_pitch_2' : 'ir_pitch_1'));
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.dmcSwitchingState.set(SimVar.GetSimVarValue('L:A32NX_EIS_DMC_SWITCHING_KNOB', SimVarValueType.Enum));

    this.currentTime = this.monotonicSimTimeVar.get() * 1000;
    if (this.isAcPowered.get()) {
      const powerOnTime = Math.max(
        0,
        this.currentTime - (this.isOnAlternateDmc.get() ? this.alternatePoweredOnTime : this.mainPoweredOnTime),
      );
      this.flash1Hz.set(powerOnTime % 1000 >= 500);
    } else {
      this.flash1Hz.set(false);
    }
  }

  private static mapIrDiscreteToDmc(ir: Arinc429WordData, dmc: Arinc429RegisterSubject): void {
    dmc.setBitValue(12, ir.bitValue(9));
    dmc.setBitValue(26, ir.bitValue(16));
    dmc.setBitValue(27, ir.bitValue(17));
    dmc.setBitValue(28, ir.bitValue(18));
    dmc.setBitValue(29, ir.bitValue(1));
    dmc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
  }
}
