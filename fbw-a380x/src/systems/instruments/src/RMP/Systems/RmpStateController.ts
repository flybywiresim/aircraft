// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument, KeyEventManager, MappedSubject, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { RmpState, RmpStateControllerEvents } from '@flybywiresim/rmp';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';

/** A controller to manage the power and init state of the RMP. */
export class A380xRmpStateController implements Instrument {
  private readonly pub = this.bus.getPublisher<RmpStateControllerEvents>();

  private readonly state = Subject.create(RmpState.OffStandby);

  private readonly dcPowerVar: string;

  private readonly brightnessKnobVar = `L:A380X_RMP_${this.rmpIndex}_BRIGHTNESS_KNOB`;

  private readonly failureKey: number;

  private readonly selectBusAVars: string[];

  private readonly failedLedVar = `L:A380X_RMP_${this.rmpIndex}_RED_LED`;

  private readonly standbyLedVar = `L:A380X_RMP_${this.rmpIndex}_GREEN_LED`;

  private readonly failuresConsumer = new FailuresConsumer();

  private readonly rmp3BusA = Subject.create(false);

  private readonly rmp3BusAVar = 'L:FBW_RMP3_BUS_A';

  private readonly screenPotentiometer: number;

  private readonly screenBrightness = Subject.create(0);

  private readonly busAOutput = MappedSubject.create(
    ([state, rmp3BusA]) => {
      switch (state) {
        case RmpState.On:
        case RmpState.OnFailed:
          return true;
        default:
          return rmp3BusA;
      }
    },
    this.state,
    this.rmp3BusA,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly rmpIndex: 1 | 2 | 3,
  ) {
    switch (rmpIndex) {
      case 1:
        this.dcPowerVar = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED';
        this.failureKey = A380Failure.RadioManagementPanel1;
        this.selectBusAVars = ['L:FBW_VHF1_BUS_A', 'L:FBW_VHF3_BUS_A', 'L:FBW_HF1_BUS_A'];
        this.screenPotentiometer = 80;
        break;
      case 2:
        this.dcPowerVar = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED';
        this.failureKey = A380Failure.RadioManagementPanel2;
        this.selectBusAVars = ['L:FBW_VHF2_BUS_A', 'L:FBW_HF2_BUS_A'];
        this.screenPotentiometer = 81;
        break;
      case 3:
        this.dcPowerVar = 'L:A32NX_ELEC_DC_1_BUS_IS_POWERED';
        this.failureKey = A380Failure.RadioManagementPanel3;
        this.selectBusAVars = ['L:FBW_RMP3_BUS_A'];
        this.screenPotentiometer = 82;
        break;
    }
  }

  /** @inheritdoc */
  init(): void {
    this.state.sub((v) => {
      this.pub.pub('rmp_state', v);

      SimVar.SetSimVarValue(
        this.failedLedVar,
        SimVarValueType.Bool,
        v === RmpState.OffFailed || v === RmpState.OnFailed,
      );
      SimVar.SetSimVarValue(this.standbyLedVar, SimVarValueType.Bool, v === RmpState.OffStandby);
    }, true);

    this.failuresConsumer.register(this.failureKey);

    this.busAOutput.sub((v) => {
      for (const lVar of this.selectBusAVars) {
        SimVar.SetSimVarValue(lVar, SimVarValueType.Bool, v);
      }
    });

    KeyEventManager.getManager(this.bus).then((manager) => {
      this.screenBrightness.sub(
        (brightness) => manager.triggerKey('LIGHT_POTENTIOMETER_SET', true, this.screenPotentiometer, brightness),
        true,
      );
    });
  }

  /** @inheritdoc */
  onUpdate(): void {
    const powerOn = SimVar.GetSimVarValue(this.dcPowerVar, SimVarValueType.Bool) > 0;
    const brightnessSetting = SimVar.GetSimVarValue(this.brightnessKnobVar, SimVarValueType.Number);
    const brightnessOn = brightnessSetting > 0;
    this.failuresConsumer.update();
    const failed = this.failuresConsumer.isActive(this.failureKey);

    if (powerOn) {
      if (failed) {
        this.state.set(brightnessOn ? RmpState.OnFailed : RmpState.OffFailed);
      } else {
        this.state.set(brightnessOn ? RmpState.On : RmpState.OffStandby);
      }
    } else {
      this.state.set(brightnessOn ? RmpState.OnFailed : RmpState.OffFailed);
    }

    if (this.rmpIndex !== 3) {
      this.rmp3BusA.set(SimVar.GetSimVarValue(this.rmp3BusAVar, SimVarValueType.Bool) > 0);
    }

    this.screenBrightness.set(this.state.get() === RmpState.On ? Math.max(brightnessSetting, 5) : 0);
  }
}
