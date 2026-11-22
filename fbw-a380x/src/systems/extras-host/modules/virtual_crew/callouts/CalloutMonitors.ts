// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewFlightPhase } from '../../../../shared/src/VirtualCrew';
import { AircraftSnapshot, BaroSnapshot, CrewOutput, CrewSpeech, VoiceLineId } from '../VirtualCrewTypes';
import { CockpitControls } from '../CockpitControls';
import { CHAINED_PAUSE_MS } from '../checklists/ChecklistRunner';
import { digitWord, digitWords } from '../speech/Phrases';

/*
 * Callouts of the pilot monitoring which are not part of a sequence of orders: engine start, approach monitoring,
 * altitude and landing rollout. Each callout is made once when its condition becomes true, and armed again as
 * described for each callout.
 */

export interface MonitorContext {
  now: number;
  phase: VirtualCrewFlightPhase;
  aircraft: AircraftSnapshot;
}

const pm = (...lines: VoiceLineId[]): CrewSpeech[] =>
  lines.map((line, i) => ({ role: 'PM', line, pauseAfterMs: i < lines.length - 1 ? CHAINED_PAUSE_MS : undefined }));

const pf = (...lines: VoiceLineId[]): CrewSpeech[] =>
  lines.map((line, i) => ({ role: 'PF', line, pauseAfterMs: i < lines.length - 1 ? CHAINED_PAUSE_MS : undefined }));

const engineWords = (index: number): VoiceLineId[] => ['engine', digitWord(index + 1)];

const ENGINE_START_PHASES = [
  VirtualCrewFlightPhase.BeforeStart,
  VirtualCrewFlightPhase.EngineStart,
  VirtualCrewFlightPhase.AfterStart,
];

/**
 * Engine start, for each engine: "engine N, start valve open", "fuel flow", "engine N stable" (state ON after the
 * start). Armed again when the engine is off with the start valve closed.
 */
export class EngineStartMonitor {
  private readonly announced: { valve: boolean; fuel: boolean; stable: boolean }[] = [];

  public update(context: MonitorContext): CrewSpeech[] {
    const speech: CrewSpeech[] = [];
    const engines = context.aircraft.engines ?? [];
    const active = ENGINE_START_PHASES.includes(context.phase);

    engines.forEach((engine, index) => {
      const state = (this.announced[index] ??= { valve: false, fuel: false, stable: false });
      if (engine.state === 0 && !engine.starterValveOpen) {
        state.valve = false;
        state.fuel = false;
        state.stable = false;
        return;
      }
      if (!active) {
        return;
      }
      if (!state.valve && engine.starterValveOpen && (engine.state === 2 || engine.state === 3)) {
        state.valve = true;
        speech.push(...pm(...engineWords(index), 'startValveOpen'));
      }
      if (state.valve && !state.fuel && engine.fuelFlow > 0) {
        state.fuel = true;
        speech.push(...pm('fuelFlow'));
      }
      if (state.valve && !state.stable && engine.state === 1) {
        state.stable = true;
        speech.push(...pm(...engineWords(index), 'engineStable'));
      }
    });

    return speech;
  }

  public reset(): void {
    this.announced.length = 0;
  }
}

const AIRBORNE_PHASES = [
  VirtualCrewFlightPhase.AfterTakeoff,
  VirtualCrewFlightPhase.Climb,
  VirtualCrewFlightPhase.Cruise,
  VirtualCrewFlightPhase.DescentPreparation,
  VirtualCrewFlightPhase.Descent,
  VirtualCrewFlightPhase.Approach,
  VirtualCrewFlightPhase.GoAround,
];

/** "One thousand to go" when approaching the altitude of the FCU, armed again 1500 ft away from it */
export class AltitudeMonitor {
  private armed = false;

  public update(context: MonitorContext): CrewSpeech[] {
    const { aircraft } = context;
    if (!AIRBORNE_PHASES.includes(context.phase) || aircraft.onGround || aircraft.fcuAltitude === undefined) {
      this.armed = false;
      return [];
    }
    const toGo = aircraft.fcuAltitude - (aircraft.altitude ?? aircraft.fcuAltitude);
    if (Math.abs(toGo) > 1500) {
      this.armed = true;
      return [];
    }
    const approaching = Math.sign(toGo) === Math.sign(aircraft.verticalSpeed) && Math.abs(aircraft.verticalSpeed) > 300;
    if (this.armed && approaching && Math.abs(toGo) <= 1000) {
      this.armed = false;
      return pm('oneThousandToGo');
    }
    return [];
  }

  public reset(): void {
    this.armed = false;
  }
}

/** Interval of the "speed" callout while the deviation persists, in milliseconds */
const SPEED_CALLOUT_INTERVAL_MS = 5000;

/**
 * Approach: "localizer alive", "glideslope alive" when the deviation comes within two dots, once per approach (armed
 * again after a go-around), and "speed" below VAPP - 5 kt or above VAPP + 10 kt, gear down between 1000 and 50 ft.
 */
export class ApproachMonitor {
  private localizerAnnounced = false;

  private glideslopeAnnounced = false;

  private lastSpeedCallout = -Infinity;

  public update(context: MonitorContext): CrewSpeech[] {
    const { aircraft, phase } = context;
    const speech: CrewSpeech[] = [];

    if (phase === VirtualCrewFlightPhase.GoAround) {
      this.reset();
      return speech;
    }
    if (aircraft.onGround || (phase !== VirtualCrewFlightPhase.Descent && phase !== VirtualCrewFlightPhase.Approach)) {
      return speech;
    }

    if (!this.localizerAnnounced && aircraft.localizerDots !== undefined && Math.abs(aircraft.localizerDots) < 2) {
      this.localizerAnnounced = true;
      speech.push(...pm('localizerAlive'));
    }
    if (!this.glideslopeAnnounced && aircraft.glideslopeDots !== undefined && Math.abs(aircraft.glideslopeDots) < 2) {
      this.glideslopeAnnounced = true;
      speech.push(...pm('glideslopeAlive'));
    }

    const vapp = aircraft.vapp ?? 0;
    if (
      phase === VirtualCrewFlightPhase.Approach &&
      vapp > 0 &&
      !aircraft.gearLeverUp &&
      aircraft.radioAltitude < 1000 &&
      aircraft.radioAltitude > 50 &&
      (aircraft.indicatedAirspeed < vapp - 5 || aircraft.indicatedAirspeed > vapp + 10) &&
      context.now - this.lastSpeedCallout >= SPEED_CALLOUT_INTERVAL_MS
    ) {
      this.lastSpeedCallout = context.now;
      speech.push(...pm('speed'));
    }

    return speech;
  }

  public reset(): void {
    this.localizerAnnounced = false;
    this.glideslopeAnnounced = false;
    this.lastSpeedCallout = -Infinity;
  }
}

/** Landing rollout: "spoilers", "reverse green", "decel", "seventy knots", once per landing */
export class RolloutMonitor {
  private readonly announced = new Set<VoiceLineId>();

  /** The aircraft rolled faster than 100 kt on the runway */
  private fast = false;

  public update(context: MonitorContext): CrewSpeech[] {
    const { aircraft, phase } = context;
    if (phase !== VirtualCrewFlightPhase.Landing) {
      this.reset();
      return [];
    }
    if (!aircraft.onGround) {
      return [];
    }
    this.fast ||= aircraft.indicatedAirspeed > 100;

    const callouts: [VoiceLineId, boolean][] = [
      ['spoilers', !!aircraft.groundSpoilersExtended],
      ['reverseGreen', !!aircraft.reversersDeployed],
      ['decel', !!aircraft.autobrakeDecel],
      // only once the aircraft decelerated from a higher speed
      ['seventyKnots', aircraft.indicatedAirspeed <= 70 && this.fast],
    ];
    const speech: CrewSpeech[] = [];
    for (const [line, condition] of callouts) {
      if (condition && !this.announced.has(line)) {
        this.announced.add(line);
        speech.push(...pm(line));
      }
    }
    return speech;
  }

  public reset(): void {
    this.announced.clear();
    this.fast = false;
  }
}

/** Altitude margin to arm the transition callouts, in feet */
const TRANSITION_ARMING_MARGIN_FT = 200;

/** Difference below which two barometric references are the same, in hectopascals (0.01 inHg is 0.34 hPa) */
const BARO_TOLERANCE_HPA = 0.6;

/** Interval between two attempts of the pilot monitoring to set their altimeter, in milliseconds */
const BARO_RETRY_INTERVAL_MS = 1500;

/** Attempts of the pilot monitoring to set their altimeter before replying anyway */
const BARO_MAX_ATTEMPTS = 3;

const CLIMB_PHASES = [
  VirtualCrewFlightPhase.AfterTakeoff,
  VirtualCrewFlightPhase.Climb,
  VirtualCrewFlightPhase.GoAround,
];

const DESCENT_PHASES = [
  VirtualCrewFlightPhase.Cruise,
  VirtualCrewFlightPhase.DescentPreparation,
  VirtualCrewFlightPhase.Descent,
  VirtualCrewFlightPhase.Approach,
];

/**
 * The words of a barometric reference, as set on the FCU: "one zero one three" in hectopascals, "two niner niner two"
 * in inches of mercury
 * @param baro the reference
 * @returns the phrases
 */
export function qnhWords(baro: BaroSnapshot): VoiceLineId[] {
  const value = baro.inHg ? Math.round(baro.hpa / HPA_PER_INHG) : Math.round(baro.hpa);
  return digitWords(value.toString());
}

/** Hectopascals in one inch of mercury, the values in inches are spoken without the decimal point */
const HPA_PER_INHG = 33.8639 / 100;

type TransitionState = 'idle' | 'armed' | 'awaitingPf' | 'settingPm' | 'done';

/**
 * Transition altitude (climb) and transition level (descent), SOP "Climb" and "Descent":
 * - the pilot monitoring calls "transition" when crossing the transition altitude or level of the FMS
 * - in climb, the pilot flying calls "altimeter standard" once their altimeter is on STD (right away if it already
 *   was), in descent the QNH once their altimeter is set to the QNH of the APPR PERF page (any QNH if none entered)
 * - the pilot monitoring then sets their own altimeter and replies with the same words
 *
 * Each callout is armed when the aircraft is on the other side of the transition with a margin, once per flight in
 * each direction.
 */
export class TransitionMonitor {
  private climb: TransitionState = 'idle';

  private descent: TransitionState = 'idle';

  private reply: VoiceLineId[] = [];

  private attempts = 0;

  private nextAttemptAt = 0;

  public update(context: MonitorContext): CrewOutput {
    const output: CrewOutput = { speech: [], actions: [] };
    const { aircraft, phase, now } = context;
    const altitude = aircraft.altitude;
    const baro = aircraft.baro;
    if (aircraft.onGround || altitude === undefined || baro === undefined) {
      return output;
    }

    const transitionAltitude = aircraft.transitionAltitude;
    if (transitionAltitude !== undefined && transitionAltitude > 0) {
      if (
        this.climb === 'idle' &&
        CLIMB_PHASES.includes(phase) &&
        altitude < transitionAltitude - TRANSITION_ARMING_MARGIN_FT
      ) {
        this.climb = 'armed';
      }
      if (this.climb === 'armed' && altitude >= transitionAltitude && aircraft.verticalSpeed > 0) {
        this.climb = 'awaitingPf';
        output.speech.push(...pm('transition'));
      }
    }
    if (this.climb === 'awaitingPf' && baro.pf.std) {
      this.climb = 'settingPm';
      this.startReply(['altimeterStandard'], now, output);
    }
    if (this.climb === 'settingPm' && this.setPmAltimeter(true, baro.pf.hpa, baro.pm, baro.pmSide, now, output)) {
      this.climb = 'done';
    }

    const transitionLevel = aircraft.transitionLevel;
    if (transitionLevel !== undefined && transitionLevel > 0) {
      const transitionLevelFt = transitionLevel * 100;
      if (
        this.descent === 'idle' &&
        DESCENT_PHASES.includes(phase) &&
        altitude > transitionLevelFt + TRANSITION_ARMING_MARGIN_FT
      ) {
        this.descent = 'armed';
      }
      if (this.descent === 'armed' && altitude <= transitionLevelFt && aircraft.verticalSpeed < 0) {
        this.descent = 'awaitingPf';
        output.speech.push(...pm('transition'));
      }
    }
    const qnh = aircraft.destinationQnh ?? 0;
    if (
      this.descent === 'awaitingPf' &&
      !baro.pf.std &&
      (qnh <= 0 || Math.abs(baro.pf.hpa - qnh) < BARO_TOLERANCE_HPA)
    ) {
      this.descent = 'settingPm';
      this.startReply(['qnh', ...qnhWords(baro.pf)], now, output);
    }
    if (this.descent === 'settingPm' && this.setPmAltimeter(false, baro.pf.hpa, baro.pm, baro.pmSide, now, output)) {
      this.descent = 'done';
    }

    return output;
  }

  public reset(): void {
    this.climb = 'idle';
    this.descent = 'idle';
  }

  /** The pilot flying announces the setting, the pilot monitoring will reply once their altimeter is set */
  private startReply(words: VoiceLineId[], now: number, output: CrewOutput): void {
    output.speech.push(...pf(...words));
    this.reply = words;
    this.attempts = 0;
    this.nextAttemptAt = now;
  }

  /**
   * The pilot monitoring sets their altimeter like the one of the pilot flying, and replies when it is set (or after a
   * few attempts, e.g. when the FCU does not react)
   * @returns true when the pilot monitoring has replied
   */
  private setPmAltimeter(
    std: boolean,
    hpa: number,
    pmBaro: BaroSnapshot,
    side: 'L' | 'R',
    now: number,
    output: CrewOutput,
  ): boolean {
    const set = std ? pmBaro.std : !pmBaro.std && Math.abs(pmBaro.hpa - hpa) < BARO_TOLERANCE_HPA;
    if (!set && this.attempts < BARO_MAX_ATTEMPTS) {
      if (now >= this.nextAttemptAt) {
        this.attempts++;
        this.nextAttemptAt = now + BARO_RETRY_INTERVAL_MS;
        output.actions.push(...CockpitControls.baro(side, std, hpa, pmBaro.std));
      }
      return false;
    }
    output.speech.push(...pm(...this.reply));
    return true;
  }
}
