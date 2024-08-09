// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NormalProcedure } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export const EcamNormalProcedures: { [n: number]: NormalProcedure } = {
  1000001: {
    title: 'BEFORE START',
    items: [
      {
        name: 'CKPT PREP',
        labelNotCompleted: 'COMPLETE (BOTH)',
        labelCompleted: 'COMPLETED',
        sensed: false,
      },
      {
        name: 'GEAR PINS & COVERS',
        labelNotCompleted: 'REMOVE',
        labelCompleted: 'REMOVED',
        sensed: false,
      },
      {
        name: 'FUEL QTY',
        labelNotCompleted: 'CHECK',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'T.O DATA',
        labelNotCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'BARO REF VALUE',
        labelNotCompleted: '____ SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        sensed: true,
      },
      {
        name: 'ADIRS',
        labelNotCompleted: 'NAV',
        sensed: true,
      },
      { name: '', labelNotCompleted: '', sensed: true, color: 'separation_line' },
      {
        name: 'WINDOWS/DOORS',
        labelNotCompleted: 'CLOSE (BOTH)',
        labelCompleted: 'CLOSED',
        sensed: false,
      },
      {
        name: 'PARK BRK',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'BEACON',
        labelNotCompleted: 'ON',
        sensed: true,
      },
    ],
  },
  1000002: {
    title: 'AFTER START',
    items: [
      {
        name: 'A-ICE',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'ECAM STS',
        labelNotCompleted: 'CHECK',
        labelCompleted: ': NORMAL',
        sensed: true,
      },
      {
        name: 'F/CTL',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'RUDDER TRIM',
        labelNotCompleted: 'NEUTRAL',
        sensed: true,
      },
      {
        name: 'PITCH TRIM',
        labelNotCompleted: 'CHECK',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
    ],
  },
  1000003: {
    title: 'BEFORE TAKEOFF',
    items: [
      {
        name: 'WX / TERR PB',
        labelNotCompleted: 'AS RQRD (BOTH)',
        labelCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'FLIGHT INSTRUMENTS',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'BRIEFING',
        labelNotCompleted: 'CONFIRM',
        labelCompleted: 'CONFIRMED',
        sensed: false,
      },
      {
        name: 'V1 / VR / V2 / THR RATING',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'SQUAWK',
        labelNotCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'T.O',
        color: 'white_underlined',
        labelNotCompleted: '',
        sensed: true,
      },
      {
        name: 'SIGNS',
        labelNotCompleted: 'ON',
        sensed: true,
      },
      {
        name: 'SPLRs',
        labelNotCompleted: 'ARM',
        labelCompleted: ': ARM',
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: 'T.O',
        sensed: true,
      },
      {
        name: 'AUTO BRAKE',
        labelNotCompleted: 'RTO',
        sensed: true,
      },
      {
        name: 'T.O CONFIG',
        labelNotCompleted: 'NORMAL',
        sensed: true,
      },
      { name: '', color: 'separation_line', labelNotCompleted: '', sensed: true },
      {
        name: 'T.O RWY',
        labelNotCompleted: '___ CONFIRM (BOTH)',
        labelCompleted: 'CONFIRMED',
        sensed: false,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        labelCompleted: 'ADVISED',
        sensed: false,
      },
      {
        name: 'PACKS 1+2',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
    ],
  },
  1000004: {
    title: 'AFTER TAKEOFF/CLIMB',
    items: [
      {
        name: 'LDG GEAR',
        labelNotCompleted: 'UP',
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: '0',
        sensed: true,
      },
      {
        name: 'PACKS 1+2',
        labelNotCompleted: 'ON',
        sensed: true,
      },
      {
        name: 'APU MASTER SW',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      { name: '', color: 'separation_line', labelNotCompleted: '', sensed: true },
      {
        name: 'BARO REF VALUE',
        labelNotCompleted: '____ SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
    ],
  },
  1000005: {
    title: 'APPROACH',
    items: [
      {
        name: 'BRIEFING',
        labelNotCompleted: 'CONFIRM',
        labelCompleted: 'CONFIRMED',
        sensed: false,
      },
      {
        name: 'ECAM STS',
        labelNotCompleted: 'CHECK',
        labelCompleted: ': NORMAL',
        sensed: true,
      },
      {
        name: 'BARO REF VALUE',
        labelNotCompleted: '____ SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'MINIMA',
        labelNotCompleted: '____ SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        sensed: true,
      },
    ],
  },
  1000006: {
    title: 'LANDING',
    items: [
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        labelCompleted: 'ADVISED',
        sensed: false,
      },
      {
        name: 'A/THR',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'AUTO BRK',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      { name: 'LDG', color: 'white_underlined', sensed: false, labelNotCompleted: '' },
      {
        name: 'SIGNS',
        labelNotCompleted: 'ON',
        sensed: true,
      },
      {
        name: 'LDG GEAR',
        labelNotCompleted: 'DOWN',
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: 'LDG',
        sensed: true,
      },
      {
        name: 'SPLRs',
        labelNotCompleted: 'ARM',
        labelCompleted: ': ARM',
        sensed: true,
      },
    ],
  },
  1000007: {
    title: 'AFTER LANDING',
    items: [
      {
        name: 'SPLRs',
        labelNotCompleted: 'DISARM',
        labelCompleted: ': DISARM',
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: '0',
        sensed: true,
      },
      {
        name: 'APU',
        labelNotCompleted: 'START',
        labelCompleted: ': START',
        sensed: true,
      },
    ],
  },
  1000008: {
    title: 'PARKING',
    items: [
      {
        name: 'EXT LT',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'PARK BRK / CHOCKS',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'APU BLEED',
        labelNotCompleted: 'ON',
        sensed: true,
      },
      {
        name: 'ALL ENGs',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'FUEL PMPs',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
    ],
  },
  1000009: {
    title: 'SECURING THE AIRCRAFT',
    items: [
      {
        name: 'ADIRS',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'OXYGEN',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'APU BLEED',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'EMER EXIT LT',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'SIGNS',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'APU',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'ALL 3 LAPTOPS',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'ALL 4 BATs',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
    ],
  },
};
