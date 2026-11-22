// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CrewSpeech } from '../VirtualCrewTypes';

/** Brakes of the pilot flying and pressure of the alternate brakes, as seen by the pilot monitoring */
export interface BrakeInputs {
  /** Brake pedals, 0 to 100 */
  left: number;
  right: number;
  /** Pressure of the alternate brakes (triple indicator), in psi */
  alternatePressure: number;
}

/** Pedal deflection considered as a brake application */
const PEDALS_PRESSED = 30;

/** Pressure of the alternate brakes below which the triple indicator reads zero, in psi */
const PRESSURE_ZERO = 100;

/**
 * Brake check of the SOP "Taxi", when the aircraft starts moving: the pilot flying announces "brake check" and
 * presses the brake pedals, the pilot monitoring checks the brake pressure on the triple indicator and announces
 * "pressure zero" (the normal brakes are used, the alternate brakes are not pressurised). On a pressure, the pilot
 * monitoring asks to check and waits for another brake application.
 */
export class BrakeCheck {
  private running = false;

  private completed = false;

  /** The pedals were released since the last brake application */
  private released = true;

  public get isRunning(): boolean {
    return this.running;
  }

  public get isDone(): boolean {
    return this.completed;
  }

  /** The pilot flying starts the check */
  public start(): CrewSpeech[] {
    this.running = true;
    this.completed = false;
    this.released = true;
    return [{ role: 'PF', line: 'brakeCheck' }];
  }

  /** The check is not performed (secondary button), the crew continues */
  public skip(): void {
    this.running = false;
    this.completed = true;
  }

  public update(brakes: BrakeInputs): CrewSpeech[] {
    if (!this.running) {
      return [];
    }
    const pressed = brakes.left >= PEDALS_PRESSED && brakes.right >= PEDALS_PRESSED;
    if (!pressed) {
      this.released = true;
      return [];
    }
    if (!this.released) {
      return [];
    }
    this.released = false;
    if (brakes.alternatePressure < PRESSURE_ZERO) {
      this.running = false;
      this.completed = true;
      return [{ role: 'PM', line: 'pressureZero' }];
    }
    return [{ role: 'PM', line: 'pleaseCheck' }];
  }

  public reset(): void {
    this.running = false;
    this.completed = false;
  }
}
