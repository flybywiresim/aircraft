// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';

import { AdirsSimVars, SwitchingPanelVSimVars } from './SimVarTypes';
import { UpdatableSimVarPublisher } from './UpdatableSimVarPublisher';

export class AdirsValueProvider<T extends AdirsSimVars> {
  constructor(
    private readonly bus: ArincEventBus,
    private readonly varProvider: UpdatableSimVarPublisher<T>,
    private readonly displaySide: EfisSide,
  ) {}

  public start() {
    const sub = this.bus.getSubscriber<SwitchingPanelVSimVars>();

    const displayIndex = this.displaySide === 'R' ? 2 : 1;

    sub
      .on('attHdgKnob')
      .whenChanged()
      .handle((knobPosition) => {
        const inertialSource = getSupplier(this.displaySide, knobPosition);
        this.varProvider.updateSimVarSource('latitude', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_LATITUDE`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('longitude', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_LONGITUDE`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('vsInert', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_VERTICAL_SPEED`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('pitch', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_PITCH`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('roll', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_ROLL`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('magHeadingRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_HEADING`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('magTrackRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_TRACK`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('fpaRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_FLIGHT_PATH_ANGLE`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('daRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_DRIFT_ANGLE`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('latAccRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_BODY_LATERAL_ACC`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('irMaintWordRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_MAINT_WORD`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('trueHeadingRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_TRUE_HEADING`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('trueTrackRaw', {
          name: `L:A32NX_ADIRS_IR_${inertialSource}_TRUE_TRACK`,
          type: SimVarValueType.Number,
        });
      });

    sub
      .on('airKnob')
      .whenChanged()
      .handle((knobPosition) => {
        const airSource = getSupplier(this.displaySide, knobPosition);
        this.varProvider.updateSimVarSource('speed', {
          name: `L:A32NX_ADIRS_ADR_${airSource}_COMPUTED_AIRSPEED`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('vsBaro', {
          name: `L:A32NX_ADIRS_ADR_${airSource}_BAROMETRIC_VERTICAL_SPEED`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('pressureAltitude', {
          name: `L:A32NX_ADIRS_ADR_${airSource}_ALTITUDE`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('baroCorrectedAltitude', {
          name: `L:A32NX_ADIRS_ADR_${airSource}_BARO_CORRECTED_ALTITUDE_${displayIndex}`,
          type: SimVarValueType.Number,
        });
        this.varProvider.updateSimVarSource('mach', {
          name: `L:A32NX_ADIRS_ADR_${airSource}_MACH`,
          type: SimVarValueType.Number,
        });
      });
  }
}

const getSupplier = (displaySide: EfisSide, knobValue: number) => {
  const adirs3ToCaptain = 0;
  const adirs3ToFO = 2;

  if (displaySide === 'L') {
    return knobValue === adirs3ToCaptain ? 3 : 1;
  }
  return knobValue === adirs3ToFO ? 3 : 2;
};
