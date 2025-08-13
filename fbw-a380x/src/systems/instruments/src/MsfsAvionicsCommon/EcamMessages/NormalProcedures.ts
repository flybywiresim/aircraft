// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ChecklistLineStyle, NormalProcedure } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export const deferredProcedureIds = [1000007, 1000008, 1000009, 1000011];

/** All normal procedures (checklists, via ECL) should be here.
 * Display is ordered by ID, ascending. That's why keys need to be numbers. */
export const EcamNormalProcedures: { [n: number]: NormalProcedure } = {
  1000001: {
    title: 'COCKPIT PREPARATION',
    items: [
      {
        name: 'GEAR PINS & COVERS',
        labelNotCompleted: 'REMOVED',
        sensed: false,
      },
      {
        name: 'FUEL QUANTITY',
        labelNotCompleted: '____ KG',
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
        sensed: false,
      },
    ],
  },
  1000002: {
    title: 'BEFORE START',
    items: [
      {
        name: 'PARKING BRAKE',
        labelNotCompleted: '____',
        sensed: false,
      },
      {
        name: 'T.O SPEEDS & THRUST',
        labelNotCompleted: '____ (BOTH)',
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
        labelNotCompleted: '____',
        sensed: false,
      },
      {
        name: 'PITCH TRIM',
        labelNotCompleted: 'T.O',
        sensed: false,
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
        sensed: false,
      },
      {
        name: 'FLAPS SETTING',
        labelNotCompleted: 'CONF ____ (BOTH)',
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
        name: 'AUTO BRK',
        labelNotCompleted: 'RTO',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'T.O CONFIG',
        labelNotCompleted: 'TEST',
        labelCompleted: 'NORM',
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
        labelNotCompleted: '____ (BOTH)',
        sensed: false,
      },
      {
        name: 'PACK 1 & 2',
        labelNotCompleted: 'ON',
        sensed: false,
      },
    ],
  },
  1000006: {
    title: '<<DEPARTURE CHANGE>>',
    onlyActivatedByRequest: true,
    items: [
      {
        name: 'RWY & SID',
        labelNotCompleted: '____',
        sensed: false,
      },
      {
        name: 'FLAPS SETTING',
        labelNotCompleted: 'CONF ____ (BOTH)',
        sensed: false,
      },
      {
        name: 'T.O SPEEDS & THRUST',
        labelNotCompleted: '____ (BOTH)',
        sensed: false,
      },
      {
        name: 'FCU ALT',
        labelNotCompleted: '____',
        sensed: false,
      },
    ],
  },
  1000007: {
    title: 'ALL PHASES : DEFERRED PROCEDURE',
    items: [],
  },
  1000008: {
    title: 'AT TOP OF DESCENT : DEFERRED PROCEDURE',
    items: [],
  },
  1000009: {
    title: 'FOR APPROACH : DEFERRED PROCEDURE',
    items: [],
  },
  1000010: {
    title: 'APPROACH',
    items: [
      {
        name: 'BARO REF',
        labelNotCompleted: '____ (BOTH)',
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
        labelNotCompleted: '____',
        sensed: false,
      },
      {
        name: 'AUTO BRAKE',
        labelNotCompleted: '____',
        sensed: false,
      },
    ],
  },
  1000011: {
    title: 'FOR LANDING : DEFERRED PROCEDURE',
    items: [],
  },
  1000012: {
    title: 'LANDING',
    items: [
      { name: 'LDG', style: ChecklistLineStyle.SubHeadline, sensed: true },
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
  1000013: {
    title: 'PARKING',
    items: [
      {
        name: 'PARKING BRAKE OR CHOCKS',
        labelNotCompleted: 'SET',
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
  1000014: {
    title: 'SECURING THE AIRCRAFT',
    items: [
      {
        name: 'OXYGEN',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'EMER EXIT LIGHT',
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
