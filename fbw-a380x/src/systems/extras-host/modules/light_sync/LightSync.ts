/* eslint-disable no-case-declarations */
// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, GameStateProvider, Instrument, KeyEventManager, Wait } from '@microsoft/msfs-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';

enum TimeOfDayState {
  Day = 1,
  DuskDawn = 2,
  Night = 3,
}

enum FwcFlightPhase {
  ElecPwr = 1,
  FirstEngineStarted = 2,
  SecondEngineTakeOffPower = 3,
  AtOrAboveEightyKnots = 4,
  AtOrAboveV1 = 5,
  LiftOff = 6,
  AtOrAbove400Feet = 7,
  AtOrAbove1500FeetTo800Feet = 8,
  AtOrBelow800Feet = 9,
  TouchDown = 10,
  AtOrBelowEightyKnots = 11,
  EnginesShutdown = 12,
}
export class LightSync implements Instrument {
  private keyInterceptManager: KeyEventManager;

  private readonly bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  public init(): void {
    Promise.all([
      KeyEventManager.getManager(this.bus),
      Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true),
    ]).then(([keyEventManager]) => {
      this.keyInterceptManager = keyEventManager;
      this.initLighting();
      this.bus
        .getSubscriber<ClockEvents>()
        .on('realTime')
        .onlyAfter(1500)
        .handle((_now) => {
          this.updateLighting();
        });
    });
  }

  public initLighting(): void {
    console.log('[LightSync] initializing lighting to defaults');

    const msfsCabinCircuitVar = SimVar.GetSimVarValue('A:CIRCUIT SWITCH ON:146', 'bool');
    if (!msfsCabinCircuitVar) {
      SimVar.SetSimVarValue('K:ELECTRICAL_CIRCUIT_TOGGLE', 'number', 146);
    }

    const autoBrightness = this.getAutoBrightness();

    // OVHD Reading Lights
    this.setPotentiometer(96, 0); // Capt
    this.setPotentiometer(97, 0); // F/O

    // Glareshield
    this.setPotentiometer(84, autoBrightness < 50 ? 1.5 * autoBrightness : 0); // Int Lt
    this.setPotentiometer(87, autoBrightness); // Lcd Brt
    this.setPotentiometer(10, 0); // table Cpt
    this.setPotentiometer(11, 0); // table F/O

    // Instruments Cpt
    this.setPotentiometer(88, autoBrightness); // PFD
    this.setPotentiometer(89, autoBrightness); // ND
    this.setPotentiometer(94, autoBrightness / 2); // wxRadar
    this.setPotentiometer(98, autoBrightness); // MFD
    this.setPotentiometer(8, autoBrightness < 50 ? 20 : 0); // console light
    this.setPotentiometer(78, autoBrightness); // OIT

    // Instruments F/O
    this.setPotentiometer(90, autoBrightness); // PFD
    this.setPotentiometer(91, autoBrightness); // ND
    this.setPotentiometer(95, autoBrightness / 2); // wxRadar
    this.setPotentiometer(99, autoBrightness); // MFD
    this.setPotentiometer(9, autoBrightness < 50 ? 20 : 0); // console light
    this.setPotentiometer(79, autoBrightness); // OIT

    // Pedestal
    this.setPotentiometer(80, autoBrightness); // rmpCptLightLevel
    this.setPotentiometer(81, autoBrightness); // rmpFoLightLevel
    this.setPotentiometer(82, autoBrightness); // rmpOvhdLightLevel
    this.setPotentiometer(92, autoBrightness); // ecamUpperLightLevel
    this.setPotentiometer(93, autoBrightness); // ecamLowerLightLevel
    this.setPotentiometer(76, autoBrightness); // pedFloodLightLevel
    this.setPotentiometer(83, autoBrightness); // mainPnlFloodLightLevel
    this.setPotentiometer(85, autoBrightness); // integralLightLevel
    this.setPotentiometer(7, autoBrightness); // ambianceLightLevel
  }

  public onUpdate(): void {}

  public updateLighting(): void {
    // Follow EFB Setting for Cabin Auto Brightness
    if (SimVar.GetSimVarValue('L:A32NX_CABIN_USING_AUTOBRIGHTNESS', 'bool')) {
      const timeOfDay = SimVar.GetSimVarValue('E:TIME OF DAY', 'Enum');
      const fmgcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');

      switch (timeOfDay) {
        case TimeOfDayState.Day:
          this.setPotentiometer(60, 0);
          SimVar.SetSimVarValue('L:A32NX_CABIN_AUTOBRIGHTNESS', 'number', 0);
          break;
        case TimeOfDayState.DuskDawn:
        case TimeOfDayState.Night:
          switch (fmgcFlightPhase) {
            case FmgcFlightPhase.Preflight:
              this.setPotentiometer(
                60,
                SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum') >= FwcFlightPhase.FirstEngineStarted ||
                  SimVar.GetSimVarValue('A:ON ANY RUNWAY', 'bool')
                  ? 1
                  : 85,
                true,
              );
              break;
            case FmgcFlightPhase.Takeoff:
            case FmgcFlightPhase.Approach:
            case FmgcFlightPhase.GoAround:
              this.setPotentiometer(60, 1, true);
              break;
            case FmgcFlightPhase.Climb:
            case FmgcFlightPhase.Cruise:
              this.setPotentiometer(60, 0, true);
              break;
            case FmgcFlightPhase.Descent:
              this.setPotentiometer(
                60,
                Math.round(SimVar.GetSimVarValue('A:PLANE ALTITUDE', 'feet') / 100) * 100 >=
                  SimVar.GetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number') - 5000
                  ? 5
                  : 0,
                true,
              );
              break;
            case FmgcFlightPhase.Done:
              this.setPotentiometer(60, 85, true);
              break;
          }
          break;
      }
    } else {
      const manualBrightness = SimVar.GetSimVarValue('L:A32NX_CABIN_MANUAL_BRIGHTNESS', 'number');
      this.setPotentiometer(60, manualBrightness, false);
    }
  }

  private setPotentiometer(potentiometer: number, brightness: number, autoBrightness: boolean = false) {
    if (this.keyInterceptManager) {
      this.keyInterceptManager.triggerKey('LIGHT_POTENTIOMETER_SET', false, potentiometer, brightness);
    }
    if (autoBrightness) {
      SimVar.SetSimVarValue('L:A32NX_CABIN_AUTOBRIGHTNESS', 'number', brightness);
    }
  }

  private getAutoBrightness(): number {
    /** automatic brightness based on ambient light, [0, 1] scale */
    return Math.max(15, Math.min(85, SimVar.GetSimVarValue('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent')));
  }
}
