// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import voiceLines from '../voice-lines.json';
import {
  altitudeWords,
  autobrakeWords,
  digitWords,
  frequencyWords,
  letterWord,
  minimumWords,
  numberWords,
  runwayWords,
} from './Phrases';
import { approachBriefingSpeech, takeoffBriefingSpeech } from '../briefing/BriefingSpeech';
import {
  BriefedAntiIce,
  parseAntiIce,
  parseAutobrake,
  parseLandingFlaps,
  parseTakeoffFlaps,
} from '../briefing/BriefingData';

describe('virtual crew phrases', () => {
  it('speaks numbers as in radiotelephony', () => {
    expect(digitWords('4721')).toEqual(['numFour', 'numSeven', 'numTwo', 'numOne']);
    expect(numberWords(3500)).toEqual(['numThree', 'numThousand', 'numFive', 'numHundred']);
    expect(numberWords(12000)).toEqual(['numOne', 'numTwo', 'numThousand']);
    expect(numberWords(200)).toEqual(['numTwo', 'numHundred']);
    expect(numberWords(560)).toEqual(['numFive', 'numSix', 'numZero']);
  });

  it('speaks altitudes, flight levels, runways, frequencies and letters', () => {
    expect(altitudeWords('6000 ft')).toEqual(['numSix', 'numThousand', 'numFeet']);
    expect(altitudeWords('FL120')).toEqual(['numFlightLevel', 'numOne', 'numTwo', 'numZero']);
    expect(altitudeWords('as cleared')).toEqual([]);
    expect(runwayWords('27R')).toEqual(['numTwo', 'numSeven', 'rwyRight']);
    expect(runwayWords('RWY 9')).toEqual(['numZero', 'numNine']);
    expect(frequencyWords('125.800')).toEqual(['numOne', 'numTwo', 'numFive', 'numDecimal', 'numEight']);
    expect(letterWord('k')).toBe('alphaK');
    expect(letterWord('1')).toBeUndefined();
  });

  it('speaks the minimum and the autobrake', () => {
    expect(minimumWords(0, 200)).toEqual(['numTwo', 'numHundred', 'minRadio']);
    expect(minimumWords(560, -1)).toEqual(['numFive', 'numSix', 'numZero', 'minBaro']);
    expect(minimumWords(0, -1)).toEqual([]);
    expect(autobrakeWords(2)).toEqual(['abLow']);
    expect(autobrakeWords(4)).toEqual(['numThree']);
  });

  it('understands the briefing entries', () => {
    expect(parseAntiIce('ENG + WING')).toBe(BriefedAntiIce.EnginesAndWings);
    expect(parseAntiIce('off')).toBe(BriefedAntiIce.Off);
    expect(parseAntiIce('')).toBe(BriefedAntiIce.NotBriefed);
    expect(parseAutobrake('LO')).toBe(2);
    expect(parseAutobrake('autobrake 3')).toBe(4);
    expect(parseAutobrake('MED')).toBe(-1);
    expect(parseTakeoffFlaps('CONF 1+F')).toBe(1);
    expect(parseLandingFlaps('3')).toBe(3);
    expect(parseLandingFlaps('FULL')).toBe(4);
  });

  it('composes the briefings from known phrases only', () => {
    const lines = [
      ...takeoffBriefingSpeech(
        {
          A380X_VCREW_BRIEFING_TO_THRUST: 'FLEX 52',
          A380X_VCREW_BRIEFING_TO_FLAPS: '1+F',
          A380X_VCREW_BRIEFING_ATIS: 'K',
          A380X_VCREW_BRIEFING_RWY_COND: 'WET',
          A380X_VCREW_BRIEFING_TAXI: 'A B5',
          A380X_VCREW_BRIEFING_CLEARED_ALT: 'FL070',
          A380X_VCREW_BRIEFING_SQUAWK: '4721',
          A380X_VCREW_BRIEFING_DEP_FREQ: '125.800',
          A380X_VCREW_BRIEFING_ANTI_ICE: 'ENG',
          A380X_VCREW_BRIEFING_THREATS: 'birds',
        },
        { v1: 141, vr: 145, v2: 150 },
      ),
      ...approachBriefingSpeech(
        {
          A380X_VCREW_APPR_ATIS: 'M',
          A380X_VCREW_APPR_RWY: '09L',
          A380X_VCREW_APPR_TYPE: 'RNP',
          A380X_VCREW_APPR_MINIMUM: 'BARO 560',
          A380X_VCREW_APPR_LDG_FLAPS: 'FULL',
          A380X_VCREW_APPR_AUTOBRAKE: 'L2',
          A380X_VCREW_APPR_GA_ALT: '5000',
        },
        { vapp: 142 },
      ),
    ].map((speech) => speech.line);

    expect(lines).toEqual(expect.arrayContaining(['brFlex', 'numFive', 'brOnePlusF', 'brWet', 'brEngineOn', 'apRnp']));
    lines.forEach((line) => expect(voiceLines.lines).toHaveProperty(line));
  });
});
