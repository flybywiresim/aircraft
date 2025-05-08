// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ApproachPhase,
  ClimbPhase,
  CruisePhase,
  DescentPhase,
  DonePhase,
  GoAroundPhase,
  Phase,
  PreFlightPhase,
  TakeOffPhase,
} from '@fmgc/flightphase/Phase';
import { Arinc429Word, ConfirmationNode } from '@flybywiresim/fbw-sdk';
import { VerticalMode } from '@shared/autopilot';
import { FmgcFlightPhase, isAllEngineOn, isAnEngineOn, isOnGround, isReady, isSlewActive } from '@shared/flightphase';
import { EventBus, GameStateProvider, SimVarValueType, Subject, Wait } from '@microsoft/msfs-sdk';

export interface FlightPhaseManagerEvents {
  /** The FMGC flight phase. */
  fmgc_flight_phase: FmgcFlightPhase;
}

function canInitiateDes(distanceToDestination: number): boolean {
  const fl = Math.round(Simplane.getAltitude() / 100);
  const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100;
  const cruiseFl = SimVar.GetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number') / 100;

  // Can initiate descent? OR Can initiate early descent?
  return (
    ((distanceToDestination < 200 || fl < 200) && fcuSelFl < cruiseFl && fcuSelFl < fl) ||
    (distanceToDestination >= 200 && fl > 200 && fcuSelFl <= 200)
  );
}

export class FlightPhaseManager {
  private onGroundConfirmationNode = new ConfirmationNode(30 * 1000);

  private readonly activePhase = Subject.create(FmgcFlightPhase.Preflight);

  private phases: { [key in FmgcFlightPhase]: Phase } = {
    [FmgcFlightPhase.Preflight]: new PreFlightPhase(),
    [FmgcFlightPhase.Takeoff]: new TakeOffPhase(),
    [FmgcFlightPhase.Climb]: new ClimbPhase(),
    [FmgcFlightPhase.Cruise]: new CruisePhase(),
    [FmgcFlightPhase.Descent]: new DescentPhase(),
    [FmgcFlightPhase.Approach]: new ApproachPhase(),
    [FmgcFlightPhase.GoAround]: new GoAroundPhase(),
    [FmgcFlightPhase.Done]: new DonePhase(),
  };

  private phaseChangeListeners: Array<(prev: FmgcFlightPhase, next: FmgcFlightPhase) => void> = [];

  get phase() {
    return this.activePhase.get();
  }

  constructor(private readonly bus: EventBus) {}
  init(): void {
    console.log(`FMGC Flight Phase: ${this.phase}`);
    this.phases[this.phase].init();
    this.changePhase(this.phase);
    this.activePhase.sub((v) => this.bus.getPublisher<FlightPhaseManagerEvents>().pub('fmgc_flight_phase', v), true);

    // For simulation purposes we need to handle loading or spawning in various states.
    // In here we should not rely on aircraft systems, but instead simvars from MSFS.
    Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame).then(() => {
      switch (true) {
        case SimVar.GetSimVarValue('GEAR IS ON GROUND', SimVarValueType.Bool) > 0:
          this.changePhase(FmgcFlightPhase.Preflight);
          break;
        case SimVar.GetSimVarValue('PLANE ALTITUDE', SimVarValueType.Feet) > 18_000:
          this.changePhase(FmgcFlightPhase.Cruise);
          break;
        case SimVar.GetSimVarValue('FLAPS HANDLE INDEX', SimVarValueType.Enum) > 0:
          this.changePhase(FmgcFlightPhase.Approach);
          break;
        default:
          this.changePhase(FmgcFlightPhase.Climb);
          break;
      }
    });
  }

  shouldActivateNextPhase(_deltaTime: number): void {
    // process transitions only when plane is ready
    if (isReady() && !isSlewActive()) {
      if (this.shouldActivateDonePhase(_deltaTime)) {
        this.changePhase(FmgcFlightPhase.Done);
      } else if (this.phases[this.phase].shouldActivateNextPhase(_deltaTime)) {
        this.changePhase(this.phases[this.phase].nextPhase);
      }
    } else if (isReady() && isSlewActive()) {
      this.handleSlewSituation(_deltaTime);
    }
  }

  /** @deprecated Use {@link FlightPhaseManagerEvents} instead. */ addOnPhaseChanged(
    cb: (prev: FmgcFlightPhase, next: FmgcFlightPhase) => void,
  ): void {
    this.phaseChangeListeners.push(cb);
  }

  handleFcuAltKnobPushPull(distanceToDestination: number): void {
    switch (this.phase) {
      case FmgcFlightPhase.Takeoff:
        this.changePhase(FmgcFlightPhase.Climb);
        break;
      case FmgcFlightPhase.Climb:
      case FmgcFlightPhase.Cruise:
        if (canInitiateDes(distanceToDestination)) {
          this.changePhase(FmgcFlightPhase.Descent);
        }
        break;
      default:
    }
  }

  handleFcuAltKnobTurn(distanceToDestination: number): void {
    if (this.phase === FmgcFlightPhase.Cruise) {
      const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
      const VS = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
      const FPA = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees');
      if (
        (activeVerticalMode === VerticalMode.OP_DES ||
          (activeVerticalMode === VerticalMode.VS && VS < 0) ||
          (activeVerticalMode === VerticalMode.FPA && FPA < 0) ||
          activeVerticalMode === VerticalMode.DES) &&
        canInitiateDes(distanceToDestination)
      ) {
        this.changePhase(FmgcFlightPhase.Descent);
      }
    }
  }

  handleFcuVSKnob(distanceToDestination: number, onStepClimbDescent: () => void): void {
    if (this.phase === FmgcFlightPhase.Climb || this.phase === FmgcFlightPhase.Cruise) {
      /** a timeout of 100ms is required in order to receive the updated autopilot vertical mode */
      setTimeout(() => {
        const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
        const VS = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
        const FPA = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees');
        if (
          (activeVerticalMode === VerticalMode.VS && VS < 0) ||
          (activeVerticalMode === VerticalMode.FPA && FPA < 0)
        ) {
          if (canInitiateDes(distanceToDestination)) {
            this.changePhase(FmgcFlightPhase.Descent);
          } else {
            onStepClimbDescent();
          }
        }
      }, 100);
    }
  }

  handleNewCruiseAltitudeEntered(newCruiseFlightLevel: number): void {
    const currentFlightLevel = Math.round(SimVar.GetSimVarValue('INDICATED ALTITUDE:3', 'feet') / 100);
    if (this.phase === FmgcFlightPhase.Approach) {
      this.changePhase(FmgcFlightPhase.Climb);
    } else if (currentFlightLevel < newCruiseFlightLevel && this.phase === FmgcFlightPhase.Descent) {
      this.changePhase(FmgcFlightPhase.Climb);
    } else if (
      currentFlightLevel > newCruiseFlightLevel &&
      (this.phase === FmgcFlightPhase.Climb || this.phase === FmgcFlightPhase.Descent)
    ) {
      this.changePhase(FmgcFlightPhase.Cruise);
    }
  }

  handleNewDestinationAirportEntered(): void {
    if (this.phase === FmgcFlightPhase.GoAround) {
      const accAlt = isAllEngineOn()
        ? Arinc429Word.fromSimVarValue('L:A32NX_FM1_MISSED_ACC_ALT')
        : Arinc429Word.fromSimVarValue('L:A32NX_FM1_MISSED_EO_ACC_ALT');
      if (Simplane.getAltitude() > accAlt.valueOr(0)) {
        this.changePhase(FmgcFlightPhase.Climb);
      }
    }
  }

  changePhase(newPhase: FmgcFlightPhase): void {
    const prevPhase = this.phase;
    console.log(`FMGC Flight Phase: ${prevPhase} => ${newPhase}`);
    this.activePhase.set(newPhase);
    SimVar.SetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'number', newPhase);
    // Updating old SimVar to ensure backwards compatibility
    SimVar.SetSimVarValue(
      'L:AIRLINER_FLIGHT_PHASE',
      'number',
      newPhase < FmgcFlightPhase.Takeoff ? FmgcFlightPhase.Preflight : newPhase + 1,
    );

    this.phases[this.phase].init();

    for (const pcl of this.phaseChangeListeners) {
      pcl(prevPhase, newPhase);
    }

    this.shouldActivateNextPhase(0);
  }

  tryGoInApproachPhase(): boolean {
    if (
      this.phase === FmgcFlightPhase.Preflight ||
      this.phase === FmgcFlightPhase.Takeoff ||
      this.phase === FmgcFlightPhase.Done
    ) {
      return false;
    }

    if (this.phase !== FmgcFlightPhase.Approach) {
      this.changePhase(FmgcFlightPhase.Approach);
    }

    return true;
  }

  shouldActivateDonePhase(_deltaTime: number): boolean {
    this.onGroundConfirmationNode.input = isOnGround();
    this.onGroundConfirmationNode.update(_deltaTime);
    return (
      this.onGroundConfirmationNode.output &&
      !isAnEngineOn() &&
      this.phase !== FmgcFlightPhase.Done &&
      this.phase !== FmgcFlightPhase.Preflight
    );
  }

  handleSlewSituation(_deltaTime: number) {
    switch (this.phase) {
      case FmgcFlightPhase.Preflight:
      case FmgcFlightPhase.Takeoff:
      case FmgcFlightPhase.Done:
        if (Simplane.getAltitudeAboveGround() >= 1500) {
          this.changePhase(FmgcFlightPhase.Climb);
        }
        break;
      default:
    }
  }
}
