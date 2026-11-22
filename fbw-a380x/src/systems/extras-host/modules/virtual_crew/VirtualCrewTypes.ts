// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import voiceLines from './voice-lines.json';

/** Role of a crew member in the current flight, as defined by the SOP */
export type CrewRole = 'PF' | 'PM';

/** Seat occupied by a crew member */
export type CrewSeat = 'CAPT' | 'FO';

/** Gender of a synthesised voice */
export type CrewVoice = 'male' | 'female';

/** Identifier of a phrase of the virtual crew, see voice-lines.json */
export type VoiceLineId = keyof typeof voiceLines.lines;

/** Inputs given by the pilot flying in the button mode */
export type CrewInput = 'PRIMARY' | 'SECONDARY';

/** Actions performed by the virtual pilot monitoring on the aircraft */
export type CrewAction =
  | { type: 'GEAR_UP' }
  | { type: 'GEAR_DOWN' }
  | { type: 'FLAPS_SET'; index: number }
  /** Sets a local variable, e.g. to push a pushbutton of the overhead panel */
  | { type: 'SET_LOCAL_VAR'; name: string; value: number }
  /** Presses a momentary pushbutton: the local variable is set to 1, then back to 0 */
  | { type: 'PULSE_LOCAL_VAR'; name: string }
  /**
   * Triggers a simulator or aircraft event, e.g. 'A32NX.FCU_FD_PUSH' (without the K: prefix), with a second parameter
   * for the events which need it (e.g. ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE)
   */
  | { type: 'KEY_EVENT'; name: string; value?: number; value2?: number }
  /** Moves the pitch trim switch until the THS reaches the position, in degrees (nose up positive) */
  | { type: 'PITCH_TRIM'; degrees: number }
  /** Publishes an event on the synced event bus, e.g. a setting of the MFD SURV page */
  | { type: 'BUS_EVENT'; topic: string; value: boolean | number }
  /** Sets the seat belts signs, only toggled if not in the requested position */
  | { type: 'SEAT_BELTS'; on: boolean }
  /** Sets the wing lights, only toggled if not in the requested position */
  | { type: 'WING_LIGHTS'; on: boolean };

/**
 * Values read like simulator variables which the integration module computes: settings of the flyPad and values which
 * need a conversion
 */
export const CrewReadVars = {
  /** 1 if the transponder policy is the one of IVAO (AUTO at the line-up, STBY after landing), 0 for VATSIM */
  SsrPolicyIvao: 'VCREW:SSR_POLICY_IVAO',
  /** Takeoff THS of the FMS (from the THS FOR of the PERF TO page), in degrees, NaN if not available */
  TakeoffThs: 'VCREW:TAKEOFF_THS',
  /** Position of the THS, in degrees (nose up positive) */
  ThsPosition: 'VCREW:THS_POSITION',
} as const;

/**
 * An engine shut down by the crew: off, or shutting down (engine master off). The engine stays in the shutting down
 * state until the EGT has cooled down to the ambient temperature, which takes several minutes.
 * @param engine the engine
 * @returns true if the engine is shut down
 */
export const isEngineShutDown = (engine: EngineSnapshot): boolean => engine.state === 0 || engine.state === 4;

/** Reads a simulator variable, e.g. 'L:A32NX_EXT_PWR_AVAIL:1' */
export type SimVarReader = (name: string) => number;

/** A phrase spoken by a crew member */
export interface CrewSpeech {
  role: CrewRole;
  line: VoiceLineId;
  /**
   * Pause after the phrase, in milliseconds, the default pause between phrases if not defined. A short pause chains
   * the parts of a composed sentence, e.g. "engine" "two" "stable".
   */
  pauseAfterMs?: number;
}

/** Everything the crew does as a result of an update or an input */
export interface CrewOutput {
  speech: CrewSpeech[];
  actions: CrewAction[];
}

/** Flight phase of the FMGC (L:A32NX_FMGC_FLIGHT_PHASE) */
export enum FmgcPhase {
  Preflight = 0,
  Takeoff = 1,
  Climb = 2,
  Cruise = 3,
  Descent = 4,
  Approach = 5,
  GoAround = 6,
  Done = 7,
}

/** State of an engine as perceived by the crew */
export interface EngineSnapshot {
  /** 0 off, 1 on (running), 2 starting, 3 restarting, 4 shutting down (L:A32NX_ENGINE_STATE) */
  state: number;
  starterValveOpen: boolean;
  /** Fuel flow, 0 when no fuel is delivered */
  fuelFlow: number;
}

/** Barometric reference of one side of the FCU (EFIS control panel) */
export interface BaroSnapshot {
  /** STD selected */
  std: boolean;
  /** Reference set (QNH or QFE), in hectopascals */
  hpa: number;
  /** The reference is displayed in inches of mercury */
  inHg: boolean;
}

/** Aircraft state as perceived by the crew, all speeds in knots, altitudes in feet, vertical speed in ft/min */
export interface AircraftSnapshot {
  onGround: boolean;
  indicatedAirspeed: number;
  groundSpeed: number;
  radioAltitude: number;
  verticalSpeed: number;
  /** V1 inserted in the FMS, 0 if not available */
  v1: number;
  /** VR inserted in the FMS, 0 if not available */
  vr: number;
  /** F speed, 0 if not available */
  fSpeed: number;
  /** S speed, 0 if not available */
  sSpeed: number;
  /** True if the thrust levers are at least in the FLX/MCT detent (two levers at least, as for the FWS) */
  thrustLeversInTakeoffPosition: boolean;
  /** True if the landing gear lever is up */
  gearLeverUp: boolean;
  /** Flaps lever position, 0 = flaps 0, 1 = flaps 1 (1+F), 2, 3, 4 = FULL */
  flapsLeverIndex: number;

  /** Mode of the autothrust shown on the FMA (L:A32NX_AUTOTHRUST_MODE), e.g. 1 MAN TOGA, 3 MAN FLX */
  autothrustMode?: number;
  /** N1 of the engines, in percent */
  n1?: number[];
  /** N1 of the current thrust limit (FLX or TOGA for the takeoff), in percent, 0 if not available */
  thrustLimitN1?: number;
  /** Pressure altitude as indicated, in feet. Optional for the takeoff procedure. */
  altitude?: number;
  /** Magnetic heading, in degrees */
  heading?: number;
  fmgcPhase?: FmgcPhase;
  parkingBrakeSet?: boolean;
  groundSpoilersArmed?: boolean;
  /** Ground spoilers extended (speed brake lever fully extended) */
  groundSpoilersExtended?: boolean;
  /** Thrust reversers of the engines 2 and 3 deployed */
  reversersDeployed?: boolean;
  /** Deceleration of the autobrake reached */
  autobrakeDecel?: boolean;
  /** Engine mode selector in IGN START (any engine) */
  engineModeSelectorStart?: boolean;
  engines?: EngineSnapshot[];
  /** VFE of the next flaps position, 0 if not available */
  vfeNext?: number;
  /** Approach speed of the FMS, 0 if not available */
  vapp?: number;
  /** ALT CRZ or ALT CRZ* on the FMA: the cruise altitude is held or being captured */
  altCruiseMode?: boolean;
  /** Altitude selected on the FCU */
  fcuAltitude?: number;
  /** Localizer received, deviation in dots (undefined if not received) */
  localizerDots?: number;
  /** Glideslope received, deviation in dots (undefined if not received) */
  glideslopeDots?: number;
  /** Transition altitude of the FMS (departure), in feet, undefined if not available */
  transitionAltitude?: number;
  /** Transition level of the FMS (arrival), as a flight level, undefined if not available */
  transitionLevel?: number;
  /** QNH of the APPR PERF page of the FMS, in hectopascals, 0 if not entered */
  destinationQnh?: number;
  /** Barometric references of the pilot flying and of the pilot monitoring, with the FCU side of the latter */
  baro?: { pf: BaroSnapshot; pm: BaroSnapshot; pmSide: 'L' | 'R' };
  /** Flaps lever position for landing of the approach briefing: 3 or 4 (FULL) */
  briefedLandingFlaps?: number;
  /** Brake pedals of the pilot flying (0 to 100) and pressure of the alternate brakes (psi) */
  brakes?: { left: number; right: number; alternatePressure: number };
  /** Sidestick and rudder pedals of the pilot flying, -1 to 1 */
  flightControls?: { pitch: number; roll: number; rudder: number };
}
