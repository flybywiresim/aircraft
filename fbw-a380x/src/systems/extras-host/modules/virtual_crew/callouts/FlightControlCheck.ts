// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CrewSpeech, VoiceLineId } from '../VirtualCrewTypes';

/** Inputs of the pilot flying on the flight controls, -1 to 1 */
export interface FlightControlInputs {
  /** Sidestick pitch, positive back (nose up) */
  pitch: number;
  /** Sidestick roll, positive right */
  roll: number;
  /** Rudder pedals, positive right */
  rudder: number;
}

/** Deflection considered as full, and as neutral */
const FULL = 0.95;
const NEUTRAL = 0.05;

interface Axis {
  input: keyof FlightControlInputs;
  /** Callout of the full deflection, negative then positive */
  full: [VoiceLineId, VoiceLineId];
}

/** Sidestick pitch, sidestick roll, then rudder, as the pilot monitoring watches the F/CTL page */
const AXES: Axis[] = [
  { input: 'pitch', full: ['fullDown', 'fullUp'] },
  { input: 'roll', full: ['fullLeft', 'fullRight'] },
  { input: 'rudder', full: ['fullLeft', 'fullRight'] },
];

/**
 * Flight control check of the SOP "Taxi": the pilot flying announces "flight control check" and moves the sidestick
 * and the rudder pedals to the stops, the pilot monitoring announces each full deflection and the return to neutral
 * ("full up", "full down", "neutral", "full left", "full right", "neutral", and the same for the rudder). The check is
 * completed once every axis was deflected to both stops and returned to neutral.
 */
export class FlightControlCheck {
  private running = false;

  private completed = false;

  /** Per axis: full deflection announced on the negative and positive side, neutral announced */
  private readonly announced = AXES.map(() => ({ negative: false, positive: false, neutral: false }));

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
    this.announced.forEach((axis) => Object.assign(axis, { negative: false, positive: false, neutral: false }));
    return [{ role: 'PF', line: 'flightControlCheck' }];
  }

  /** The check is not performed (secondary button), the crew continues */
  public skip(): void {
    this.running = false;
    this.completed = true;
  }

  public update(inputs: FlightControlInputs): CrewSpeech[] {
    if (!this.running) {
      return [];
    }
    const speech: CrewSpeech[] = [];
    AXES.forEach((axis, i) => {
      const state = this.announced[i];
      const value = inputs[axis.input];
      if (value <= -FULL && !state.negative) {
        state.negative = true;
        speech.push({ role: 'PM', line: axis.full[0] });
      } else if (value >= FULL && !state.positive) {
        state.positive = true;
        speech.push({ role: 'PM', line: axis.full[1] });
      } else if (Math.abs(value) <= NEUTRAL && state.negative && state.positive && !state.neutral) {
        state.neutral = true;
        speech.push({ role: 'PM', line: 'respNeutral' });
      }
    });
    if (this.announced.every((axis) => axis.neutral)) {
      this.running = false;
      this.completed = true;
    }
    return speech;
  }

  public reset(): void {
    this.running = false;
    this.completed = false;
  }
}
