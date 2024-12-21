// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ChecklistLineStyle, NormalProcedure } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

/** All normal procedures (checklists, via ECL) should be here.
 * Display is ordered by ID, ascending. That's why keys need to be numbers. */
export const EcamNormalProcedures: { [n: number]: NormalProcedure } = {
  1000001: {
    title: 'COCKPIT PREPARATION',
    items: [
      {
        name: 'GEAR PINS & COVERS',
        labelNotCompleted: 'REMOVE',
        labelCompleted: 'REMOVED',
        sensed: false,
      },
      {
        name: 'FUEL QTY',
        labelNotCompleted: '___KG',
        sensed: false,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'BARO REF',
        labelNotCompleted: '____ (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
    ],
  },
  1000002: {
    title: 'BEFORE START',
    items: [
      {
        name: 'PARKING BRAKE',
        labelNotCompleted: '___',
        sensed: false,
      },
      {
        name: 'T.O SPEEDS & THRUST',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'BEACON',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
    ],
  },
  1000003: {
    title: 'AFTER START',
    items: [
      {
        name: 'ANTI ICE',
        labelNotCompleted: '___',
        sensed: false,
      },
      {
        name: 'PITCH TRIM',
        labelNotCompleted: 'T.O',
        sensed: true,
      },
      {
        name: 'RUDDER TRIM',
        labelNotCompleted: 'NEUTRAL',
        sensed: true,
      },
    ],
  },
  1000004: {
    title: 'TAXI',
    items: [
      {
        name: 'FLIGHT CONTROLS',
        labelNotCompleted: 'CHECKED (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'FLAPS SETTING',
        labelNotCompleted: 'CONF ___ (BOTH)',
        labelCompleted: 'CONF ___',
        sensed: false,
      },
      {
        name: 'RADAR',
        labelNotCompleted: 'ON',
        sensed: false,
      },
      {
        name: 'T.O',
        style: ChecklistLineStyle.SubHeadline,
        labelNotCompleted: '',
        sensed: true,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'GND SPLRs',
        labelNotCompleted: 'ARM',
        labelCompleted: 'ARM',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: 'T.O',
        sensed: true,
        level: 1,
      },
      {
        name: 'AUTO BRAKE',
        labelNotCompleted: 'RTO',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'T.O CONFIG',
        labelNotCompleted: 'TEST',
        labelCompleted: 'NORMAL',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
    ],
  },
  1000005: {
    title: 'LINE-UP',
    items: [
      {
        name: 'T.O RWY',
        labelNotCompleted: '___ (BOTH)',
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
        labelNotCompleted: 'ON',
        sensed: false,
      },
    ],
  },
  1000006: {
    title: '<<DEPARTURE CHANGE>>',
    deferred: true,
    items: [
      {
        name: 'RWY & SID',
        labelNotCompleted: '___',
        sensed: false,
      },
      {
        name: 'FLAPS SETTING',
        labelNotCompleted: 'CONF ___ (BOTH)',
        labelCompleted: 'CONF ___',
        sensed: false,
      },
      {
        name: 'T.O SPEEDS & THRUST',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'FCU ALT',
        labelNotCompleted: '___',
        labelCompleted: 'SET',
        sensed: false,
      },
    ],
  },
  1000007: {
    title: 'APPROACH',
    items: [
      {
        name: 'BARO REF',
        labelNotCompleted: '____ (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'MINIMUM',
        labelNotCompleted: '___',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'AUTO BRAKE',
        labelNotCompleted: '___',
        labelCompleted: 'SET',
        sensed: false,
      },
    ],
  },
  1000008: {
    title: 'LANDING',
    items: [
      { name: 'LDG', style: ChecklistLineStyle.SubHeadline, sensed: true, labelNotCompleted: '' },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'LDG GEAR',
        labelNotCompleted: 'DOWN',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'GND SPLRs',
        labelNotCompleted: 'ARM',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: 'LDG',
        sensed: true,
      },
    ],
  },
  1000009: {
    title: 'PARKING',
    items: [
      {
        name: 'PARK BRAKE OR CHOCKS',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'ENGINES',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'WING LIGHTS',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'FUEL PUMPs',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
    ],
  },
  1000010: {
    title: 'SECURING THE AIRCRAFT',
    items: [
      {
        name: 'OXYGEN',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'EMER EXIT LT',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'EFBs',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'BATTERIES',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
    ],
  },
};
