// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VoiceLineId } from '../VirtualCrewTypes';

/*
 * Composition of spoken values from the phrases of voice-lines.json, following the radiotelephony conventions:
 * digits one by one ("one two five decimal eight"), whole thousands and hundreds ("three thousand five hundred"),
 * flight levels, runway designators and the phonetic alphabet.
 */

const DIGITS: VoiceLineId[] = [
  'numZero',
  'numOne',
  'numTwo',
  'numThree',
  'numFour',
  'numFive',
  'numSix',
  'numSeven',
  'numEight',
  'numNine',
];

const ALPHABET: VoiceLineId[] = [
  'alphaA',
  'alphaB',
  'alphaC',
  'alphaD',
  'alphaE',
  'alphaF',
  'alphaG',
  'alphaH',
  'alphaI',
  'alphaJ',
  'alphaK',
  'alphaL',
  'alphaM',
  'alphaN',
  'alphaO',
  'alphaP',
  'alphaQ',
  'alphaR',
  'alphaS',
  'alphaT',
  'alphaU',
  'alphaV',
  'alphaW',
  'alphaX',
  'alphaY',
  'alphaZ',
];

/**
 * The digits of a text, one by one, other characters are ignored
 * @param text e.g. "4721"
 * @returns the phrases
 */
export function digitWords(text: string): VoiceLineId[] {
  return text
    .split('')
    .filter((c) => c >= '0' && c <= '9')
    .map((c) => DIGITS[c.charCodeAt(0) - 48]);
}

/**
 * A digit
 * @param digit 0 to 9
 * @returns the phrase
 */
export function digitWord(digit: number): VoiceLineId {
  return DIGITS[Math.max(0, Math.min(9, Math.round(digit)))];
}

/**
 * A letter of the phonetic alphabet
 * @param letter e.g. "K"
 * @returns the phrase, undefined if not a letter
 */
export function letterWord(letter: string): VoiceLineId | undefined {
  const code = letter.toUpperCase().charCodeAt(0) - 65;
  return code >= 0 && code < 26 ? ALPHABET[code] : undefined;
}

/**
 * A number as spoken in radiotelephony: whole thousands and hundreds with "thousand" and "hundred", digits otherwise
 * @param value e.g. 3500
 * @returns e.g. "three thousand five hundred"
 */
export function numberWords(value: number): VoiceLineId[] {
  const n = Math.round(Math.abs(value));
  if (n >= 1000 && n % 100 === 0) {
    const thousands = Math.floor(n / 1000);
    const hundreds = (n % 1000) / 100;
    return [
      ...digitWords(thousands.toString()),
      'numThousand',
      ...(hundreds > 0 ? [digitWord(hundreds), 'numHundred' as VoiceLineId] : []),
    ];
  }
  if (n >= 100 && n < 1000 && n % 100 === 0) {
    return [digitWord(n / 100), 'numHundred'];
  }
  return digitWords(n.toString());
}

/**
 * An altitude or a flight level entered as text
 * @param text e.g. "6000", "6000 FT", "FL120"
 * @returns e.g. "six thousand feet", "flight level one two zero", empty if not understood
 */
export function altitudeWords(text: string): VoiceLineId[] {
  const value = text.toUpperCase().replace(/\s/g, '');
  const level = value.match(/^FL(\d{2,3})$/);
  if (level) {
    return ['numFlightLevel', ...digitWords(level[1])];
  }
  const feet = value.match(/^(\d{3,5})(FT)?$/);
  if (feet) {
    return [...numberWords(parseInt(feet[1])), 'numFeet'];
  }
  return [];
}

/**
 * A runway designator
 * @param text e.g. "27R", "RWY 09L", "KJFK04L" is not understood
 * @returns e.g. "two seven right", empty if not understood
 */
export function runwayWords(text: string): VoiceLineId[] {
  const match = text
    .toUpperCase()
    .replace(/^RWY|^RW/, '')
    .trim()
    .match(/^(\d{1,2})([LRC])?$/);
  if (!match) {
    return [];
  }
  const side: Record<string, VoiceLineId> = { L: 'rwyLeft', R: 'rwyRight', C: 'rwyCenter' };
  return [...digitWords(match[1].padStart(2, '0')), ...(match[2] ? [side[match[2]]] : [])];
}

/**
 * A radio frequency
 * @param text e.g. "125.800"
 * @returns e.g. "one two five decimal eight", empty if not understood
 */
export function frequencyWords(text: string): VoiceLineId[] {
  const match = text.trim().match(/^(\d{3})[.,](\d{1,3})$/);
  if (!match) {
    return [];
  }
  const decimals = match[2].replace(/0+$/, '') || '0';
  return [...digitWords(match[1]), 'numDecimal', ...digitWords(decimals)];
}

/**
 * The minimum of the FMS
 * @param mda minimum descent altitude (baro), 0 if not defined
 * @param dh decision height (radio), negative if not defined
 * @returns e.g. "two hundred radio", "five six zero baro", empty if no minimum
 */
export function minimumWords(mda: number, dh: number): VoiceLineId[] {
  if (dh >= 0 && !(mda > 0)) {
    return [...numberWords(dh), 'minRadio'];
  }
  if (mda > 0) {
    return [...numberWords(mda), 'minBaro'];
  }
  return [];
}

/**
 * Position of the autobrake selector
 * @param position L:A32NX_AUTOBRAKES_SELECTED_MODE: 0 DISARM, 1 BTV, 2 LO, 3 L2, 4 L3, 5 HI
 * @returns the phrase
 */
export function autobrakeWords(position: number): VoiceLineId[] {
  switch (position) {
    case 1:
      return ['abBtv'];
    case 2:
      return ['abLow'];
    case 3:
      return ['numTwo'];
    case 4:
      return ['numThree'];
    case 5:
      return ['abHigh'];
    default:
      return ['respOff'];
  }
}
