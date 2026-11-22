// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AutobrakeSelector } from '../CockpitControls';

/**
 * Values of the briefings used by the crew to verify the aircraft, read like simulator variables by the reader of the
 * virtual crew (they are not simulator variables).
 */
export const BriefingVars = {
  /** {@link BriefedAntiIce} of the takeoff briefing */
  AntiIce: 'VCREW:BRIEFED_ANTI_ICE',
  /** Position of the autobrake selector of the approach briefing, -1 if not briefed */
  Autobrake: 'VCREW:BRIEFED_AUTOBRAKE',
  /** Flaps lever position for landing of the approach briefing: 3 or 4 (FULL) */
  LandingFlaps: 'VCREW:BRIEFED_LANDING_FLAPS',
  /** Flaps lever position for takeoff of the takeoff briefing: 1 (1+F), 2 or 3, 0 if not briefed */
  TakeoffFlaps: 'VCREW:BRIEFED_TAKEOFF_FLAPS',
} as const;

export enum BriefedAntiIce {
  NotBriefed = 0,
  Off = 1,
  Engines = 2,
  EnginesAndWings = 3,
}

/** Briefing data by field key (VirtualCrewBriefingFields), FMS values included */
export type BriefingValues = Record<string, string | undefined>;

const normalise = (text: string | undefined) => (text ?? '').toUpperCase().replace(/\s+/g, ' ').trim();

/**
 * @param text anti ice of the briefing, e.g. "OFF", "ENG", "ENG + WING"
 * @returns the briefed anti ice
 */
export function parseAntiIce(text: string | undefined): BriefedAntiIce {
  const value = normalise(text);
  if (value === '') {
    return BriefedAntiIce.NotBriefed;
  }
  if (value === 'OFF' || value === 'NO' || value === 'NONE') {
    return BriefedAntiIce.Off;
  }
  if (value.includes('WING') || value.includes('WAI') || value === 'ALL') {
    return BriefedAntiIce.EnginesAndWings;
  }
  return BriefedAntiIce.Engines;
}

/**
 * @param text autobrake of the briefing, e.g. "LOW", "LO", "2", "L3", "HI", "BTV"
 * @returns the position of the autobrake selector, -1 if not understood
 */
export function parseAutobrake(text: string | undefined): number {
  const value = normalise(text).replace(/^AUTO ?BRA?KE? ?/, '');
  switch (value) {
    case 'BTV':
      return AutobrakeSelector.Btv;
    case 'LO':
    case 'LOW':
    case '1':
    case 'L1':
      return AutobrakeSelector.Low;
    case '2':
    case 'L2':
      return AutobrakeSelector.L2;
    case '3':
    case 'L3':
      return AutobrakeSelector.L3;
    case 'HI':
    case 'HIGH':
      return AutobrakeSelector.High;
    default:
      return -1;
  }
}

/**
 * @param text takeoff flaps of the briefing, e.g. "1+F", "CONF 2", "3"
 * @returns the flaps lever position, 0 if not understood
 */
export function parseTakeoffFlaps(text: string | undefined): number {
  const value = normalise(text).replace(/^CONF ?/, '');
  return value === '1+F' || value === '1' ? 1 : value === '2' ? 2 : value === '3' ? 3 : 0;
}

/**
 * @param text landing flaps of the briefing, e.g. "3", "CONF 3", "FULL"
 * @returns the flaps lever position, FULL (4) if not understood
 */
export function parseLandingFlaps(text: string | undefined): number {
  return normalise(text).replace(/^CONF ?/, '') === '3' ? 3 : 4;
}

/**
 * Reads the briefing values stored by the flyPad when the briefing was performed
 * @param json the stored JSON object
 * @returns the values, empty if not available
 */
export function parseBriefingValues(json: string | undefined): BriefingValues {
  try {
    const values = JSON.parse(json ?? '{}');
    return typeof values === 'object' && values !== null ? (values as BriefingValues) : {};
  } catch {
    return {};
  }
}
