// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CrewSpeech, VoiceLineId } from '../VirtualCrewTypes';
import { CHAINED_PAUSE_MS } from '../checklists/ChecklistRunner';
import {
  altitudeWords,
  autobrakeWords,
  digitWords,
  frequencyWords,
  letterWord,
  minimumWords,
  runwayWords,
} from '../speech/Phrases';
import { BriefedAntiIce, BriefingValues, parseAntiIce, parseAutobrake, parseLandingFlaps } from './BriefingData';

/*
 * The briefings spoken by the pilot flying, composed from the data of the flyPad and of the FMS: "are you ready for
 * the departure briefing?" "go ahead", the briefing, "any questions?" "no questions". Free text fields
 * (taxi route, engine failure procedure, threats) are not spoken word for word: a generic phrase confirms them.
 */

/** Data of the FMS used in the briefings, in knots */
export interface BriefingFmsData {
  v1?: number;
  vr?: number;
  v2?: number;
  vapp?: number;
}

const value = (values: BriefingValues, key: string) => (values[key] ?? '').trim().toUpperCase();

/** A sentence: the parts are chained, the normal pause follows the last part */
const sentence = (...parts: VoiceLineId[]): CrewSpeech[] =>
  parts.map((line, i) => ({ role: 'PF', line, pauseAfterMs: i < parts.length - 1 ? CHAINED_PAUSE_MS : undefined }));

/** The pilot flying asks if the pilot monitoring is ready, who answers "go ahead" */
const opening = (question: VoiceLineId): CrewSpeech[] => [...sentence(question), { role: 'PM', line: 'goAhead' }];

/** "Any questions?", "no questions" */
const closing = (): CrewSpeech[] => [...sentence('brEndOfBriefing'), { role: 'PM', line: 'noQuestions' }];

const speed = (knots: number | undefined): VoiceLineId[] =>
  knots !== undefined && knots > 0 ? digitWords(Math.round(knots).toString()) : [];

function atis(text: string): CrewSpeech[] {
  const letter = text.length === 1 ? letterWord(text) : undefined;
  return letter ? sentence('brInformation', letter) : [];
}

function runwayCondition(text: string): CrewSpeech[] {
  if (text === '') {
    return [];
  }
  const condition: VoiceLineId = text.startsWith('DRY')
    ? 'brDry'
    : text.startsWith('WET')
      ? 'brWet'
      : text.includes('CONTAM') || text.includes('SNOW') || text.includes('ICE')
        ? 'brContaminated'
        : 'brAsReported';
  return sentence('brRunwayCondition', condition);
}

function takeoffThrust(text: string): CrewSpeech[] {
  if (text.startsWith('TOGA')) {
    return sentence('brTakeoffThrust', 'brToga');
  }
  const flex = text.match(/^FLEX\s*(\d{1,2})/);
  return flex ? sentence('brTakeoffThrust', 'brFlex', ...digitWords(flex[1])) : [];
}

function takeoffFlaps(text: string): CrewSpeech[] {
  const conf = text.replace(/^CONF\s*/, '');
  if (conf === '1+F' || conf === '1') {
    return sentence('brFlaps', 'brOnePlusF');
  }
  if (conf === '2' || conf === '3') {
    return sentence('brFlaps', conf === '2' ? 'numTwo' : 'numThree');
  }
  return [];
}

function antiIce(text: string): CrewSpeech[] {
  switch (parseAntiIce(text)) {
    case BriefedAntiIce.Off:
      return sentence('brAntiIce', 'brOff');
    case BriefedAntiIce.Engines:
      return sentence('brAntiIce', 'brEngineOn');
    case BriefedAntiIce.EnginesAndWings:
      return sentence('brAntiIce', 'brEngineAndWingOn');
    default:
      return [];
  }
}

const withWords = (intro: VoiceLineId, words: VoiceLineId[]) => (words.length > 0 ? sentence(intro, ...words) : []);

const ifEntered = (text: string, line: VoiceLineId) => (text !== '' ? sentence(line) : []);

/**
 * The takeoff briefing of the pilot flying
 * @param values the briefing data of the flyPad, by field key
 * @param fms the takeoff speeds of the FMS
 * @returns the phrases
 */
export function takeoffBriefingSpeech(values: BriefingValues, fms: BriefingFmsData): CrewSpeech[] {
  const v = (key: string) => value(values, `A380X_VCREW_BRIEFING_${key}`);
  return [
    ...opening('brReadyDeparture'),
    ...atis(v('ATIS')),
    ...runwayCondition(v('RWY_COND')),
    ...takeoffThrust(v('TO_THRUST')),
    ...takeoffFlaps(v('TO_FLAPS')),
    ...withWords('brVOne', speed(fms.v1)),
    ...withWords('brVR', speed(fms.vr)),
    ...withWords('brVTwo', speed(fms.v2)),
    ...ifEntered(v('TAXI'), 'brTaxiRoute'),
    ...withWords('brClearedAltitude', altitudeWords(v('CLEARED_ALT'))),
    ...withWords('brSquawk', digitWords(v('SQUAWK')).slice(0, 4)),
    ...withWords('brDepartureFrequency', frequencyWords(v('DEP_FREQ'))),
    ...antiIce(v('ANTI_ICE')),
    ...sentence('brEngineFailure'),
    ...ifEntered(v('THREATS'), 'brThreats'),
    ...closing(),
  ];
}

function approachType(text: string): CrewSpeech[] {
  const types: [string, VoiceLineId][] = [
    ['ILS', 'apIls'],
    ['GLS', 'apGls'],
    ['RNP', 'apRnp'],
    ['RNAV', 'apRnp'],
    ['VOR', 'apVor'],
    ['NDB', 'apNdb'],
    ['LOC', 'apLoc'],
    ['VIS', 'apVisual'],
  ];
  if (text === '') {
    return [];
  }
  const type = types.find(([prefix]) => text.startsWith(prefix));
  return sentence('brApproach', type ? type[1] : 'brAsPublished');
}

/** The minimum of the briefing, e.g. "BARO 560", "RADIO 200", "DH 200", "560" (baro) */
function minimum(text: string): CrewSpeech[] {
  const number = text.match(/(\d{2,5})/);
  if (!number) {
    return [];
  }
  const radio = text.includes('RADIO') || text.includes('DH') || text.includes('RA');
  const words = radio ? minimumWords(0, parseInt(number[1])) : minimumWords(parseInt(number[1]), -1);
  return sentence('brMinimum', ...words);
}

/**
 * The approach briefing of the pilot flying
 * @param values the briefing data of the flyPad, by field key
 * @param fms the approach speed of the FMS
 * @returns the phrases
 */
export function approachBriefingSpeech(values: BriefingValues, fms: BriefingFmsData): CrewSpeech[] {
  const v = (key: string) => value(values, `A380X_VCREW_APPR_${key}`);
  const autobrake = parseAutobrake(v('AUTOBRAKE'));
  return [
    ...opening('brReadyApproach'),
    ...atis(v('ATIS')),
    ...withWords('brLandingRunway', runwayWords(v('RWY'))),
    ...approachType(v('TYPE')),
    ...minimum(v('MINIMUM')),
    ...(v('LDG_FLAPS') !== ''
      ? sentence('brLandingFlaps', parseLandingFlaps(v('LDG_FLAPS')) === 3 ? 'numThree' : 'brFull')
      : []),
    ...withWords('brVApp', speed(fms.vapp)),
    ...(autobrake >= 0 ? sentence('brAutobrake', ...autobrakeWords(autobrake)) : []),
    ...withWords('brGoAroundAltitude', altitudeWords(v('GA_ALT'))),
    ...ifEntered(v('TAXI_IN'), 'brTaxiIn'),
    ...ifEntered(v('THREATS'), 'brThreats'),
    ...closing(),
  ];
}
