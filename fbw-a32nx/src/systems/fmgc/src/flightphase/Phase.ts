// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Arinc429Word, ConfirmationNode, NXDataStore } from '@flybywiresim/fbw-sdk';
import { Accessible } from '@microsoft/msfs-sdk';
import { VerticalMode } from '@shared/autopilot';
import {
  FmgcFlightPhase,
  getAutopilotVerticalMode,
  isAllEngineOn,
  isAnEngineOn,
  isOnGround,
  conditionTakeOff,
} from '@shared/flightphase';

export abstract class Phase {
  constructor(protected readonly pressureAltitude: Accessible<number | null>) {}
  // eslint-disable-next-line no-empty-function
  init(): void {
    /* prototype function */
  }

  abstract shouldActivateNextPhase(time: any): boolean;

  nextPhase: FmgcFlightPhase;
}

export class PreFlightPhase extends Phase {
  takeoffConfirmation = new ConfirmationNode(0.2 * 1000);

  init() {
    this.nextPhase = FmgcFlightPhase.Takeoff;
  }

  shouldActivateNextPhase(_deltaTime) {
    this.takeoffConfirmation.input = conditionTakeOff();
    this.takeoffConfirmation.update(_deltaTime);
    return this.takeoffConfirmation.output;
  }
}

export class TakeOffPhase extends Phase {
  accelerationAltitudeMsl: number;

  accelerationAltitudeMslEo: number;

  init() {
    this.nextPhase = FmgcFlightPhase.Climb;
    SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', false);

    const accAlt = Arinc429Word.fromSimVarValue('L:A32NX_FM1_ACC_ALT');
    this.accelerationAltitudeMsl = accAlt.valueOr(
      SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
    );
    const eoAccAlt = Arinc429Word.fromSimVarValue('L:A32NX_FM1_EO_ACC_ALT');
    this.accelerationAltitudeMslEo = eoAccAlt.valueOr(
      SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
    );
  }

  shouldActivateNextPhase(_deltaTime) {
    return Simplane.getAltitude() > (isAllEngineOn() ? this.accelerationAltitudeMsl : this.accelerationAltitudeMslEo);
  }
}

export class ClimbPhase extends Phase {
  init() {
    this.nextPhase = FmgcFlightPhase.Cruise;
  }

  shouldActivateNextPhase(_deltaTime) {
    const pressureAltitude = this.pressureAltitude.get();
    if (pressureAltitude === null) {
      return;
    }

    const cruiseFl = SimVar.GetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number') / 100;
    const fl = Math.round(pressureAltitude / 100);

    // If no cruise alt has been entered, cruiseFl is 0. We don't want to switch to cruise phase in that case
    return cruiseFl > 0 && fl >= cruiseFl;
  }
}

export class CruisePhase extends Phase {
  init() {
    // switch out of cruise phase is handled in FlightPhaseManager
    this.nextPhase = FmgcFlightPhase.Cruise;
  }

  shouldActivateNextPhase(_deltaTime) {
    return false;
  }
}

export class DescentPhase extends Phase {
  init() {
    this.nextPhase = FmgcFlightPhase.Approach;
  }

  shouldActivateNextPhase(_deltaTime) {
    const pressureAltitude = this.pressureAltitude.get();
    const fl = pressureAltitude === null ? null : Math.round(pressureAltitude / 100);
    const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100;
    const cruiseFl = SimVar.GetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number') / 100;

    if (fl !== null && fl === cruiseFl && fcuSelFl === fl) {
      this.nextPhase = FmgcFlightPhase.Cruise;
      return true;
    }

    // APPROACH phase from DECEL pseudo waypoint case. This is decided by the new TS FMS.
    return !!SimVar.GetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool');
  }
}

export class ApproachPhase extends Phase {
  landingConfirmation = new ConfirmationNode(30 * 1000);

  init() {
    SimVar.SetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'Number', 0);
    this.nextPhase = FmgcFlightPhase.Done;
  }

  shouldActivateNextPhase(_deltaTime) {
    if (getAutopilotVerticalMode() === VerticalMode.SRS_GA) {
      this.nextPhase = FmgcFlightPhase.GoAround;
      return true;
    }

    this.landingConfirmation.input = isOnGround();
    this.landingConfirmation.update(_deltaTime);
    return this.landingConfirmation.output || !isAnEngineOn();
  }
}

export class GoAroundPhase extends Phase {
  init() {
    SimVar.SetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'Number', 0);
    this.nextPhase = FmgcFlightPhase.GoAround;
  }

  shouldActivateNextPhase(_deltaTime) {
    // there is no automatic switch from this phase
    return false;
  }
}

export class DonePhase extends Phase {
  init() {
    SimVar.SetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'Number', 0);
    this.nextPhase = FmgcFlightPhase.Done;
  }

  shouldActivateNextPhase(_deltaTime) {
    // there is no automatic switch from this phase
    return false;
  }
}
