// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  AbnormalProcedure,
  ChecklistLineStyle,
  DeferredProcedure,
  DeferredProcedureType,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

// Convention for IDs:
// First two digits: ATA chapter
// Third digit: Sub chapter, if needed
// Fourth digit:
//    0 for MEMOs,
//    1 for normal checklists,
//    2 for infos,
//    3 for INOP SYS,
//    4 for limitations,
//    7 for deferred procedures,
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedAta80Rest: { [n: number]: AbnormalProcedure } = {
  990900001: {
    title: '\x1b<4m\x1b4mMISC\x1bm BOMB ON BOARD',
    sensed: false,
    items: [
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: 'IF LDG + EVAC POSSIBLE WITHIN 30 MIN :',
        sensed: false,
        condition: true,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'COMPANY',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'EVAC',
        sensed: false,
        labelNotCompleted: 'PREPARE',
        level: 1,
      },
      {
        name: 'IF NO IMMEDIATE LANDING :',
        sensed: false,
        condition: true,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'COMPANY',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'ACFT (IF CLIMBING)',
        sensed: false,
        labelNotCompleted: 'LEVEL OFF',
        level: 1,
      },
      {
        name: 'TRGT SPEED : PREFER LO IAS',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN ALT MODE',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 1,
      },
      {
        name: 'DECENT TO CAB ALT + 2500FT/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'WHEN ACFT ALT = CAB ALT + 2500FT/MEA-MORA :',
        sensed: false,
        condition: true,
      },
      {
        name: 'ELEC GALLEY',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ELEC PAX SYS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'IF FUEL PERMITS :',
        sensed: false,
        condition: true,
      },
      {
        name: 'FLAPS',
        sensed: true,
        labelNotCompleted: 'AT LEAST CONF 1',
        level: 1,
      },
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'DOWN',
        level: 1,
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
        level: 1,
      },
      {
        name: 'FMS PRED UNRELIABLE WITHOUT ACCURATE FMS FUEL PENALTY INSERTION',
        sensed: false,
        style: ChecklistLineStyle.Green,
        level: 1,
      },
      {
        name: 'DURING FURTHER DESCENT : MAINTAIN MAX DIFF PRESS 1 PSI',
        sensed: false,
        level: 1,
      },
      {
        name: 'EVAC',
        sensed: false,
        labelNotCompleted: 'PREPARE',
        level: 1,
      },
    ],
  },
  990900002: {
    title: '\x1b<4m\x1b4mMISC\x1bm CKPT WINDOW CRACKED',
    sensed: false,
    items: [], // TODO
  },
  990900003: {
    title: '\x1b<4m\x1b4mMISC\x1bm CKPT WINDOW ELEC ARCING',
    sensed: false,
    items: [], // TODO
  },
  990900004: {
    title: '\x1b<2m\x1b4mMISC\x1bm DITCHING',
    sensed: false,
    items: [], // TODO
  },
  990900005: {
    title: '\x1b<2m\x1b4mMISC\x1bm EMER DESCENT',
    sensed: false,
    items: [], // TODO
  },
  990900006: {
    title: '\x1b<2m\x1b4mMISC\x1bm EMER EVAC',
    sensed: false,
    items: [], // TODO
  },
  990900007: {
    title: '\x1b<2m\x1b4mMISC\x1bm FORCED LANDING',
    sensed: false,
    items: [], // TODO
  },
  990900008: {
    title: '\x1b<4m\x1b4mMISC\x1bm OIS FAULT',
    sensed: false,
    items: [], // TODO
  },
  990900009: {
    title: '\x1b<4m\x1b4mMISC\x1bm OVERWEIGHT LDG',
    sensed: false,
    items: [], // TODO
  },
  990900010: {
    title: '\x1b<4m\x1b4mMISC\x1bm SEVERE TURBULENCE',
    sensed: false,
    items: [
      {
        name: 'SEAT BELTS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'MAX TURB SPEED : 300 / .85 ',
        sensed: false,
      },
      {
        name: 'MIX TURB SPEED : GREEN DOT',
        sensed: false,
      },
      {
        name: 'ADJUST SPEED AS NECCESSARY FOR COMFORT',
        sensed: false,
      },
      {
        name: 'AP : KEEP ON',
        sensed: false,
      },
      {
        name: 'CABIN & CKPT (LOOSE EQPT)',
        sensed: false,
        labelNotCompleted: 'SECURE',
      },
      {
        name: 'SPEED BRAKES',
        sensed: false,
        labelNotCompleted: 'AS RQRD',
      },
      {
        name: 'IF EXCESSIVE THRUST VARIATIONS :',
        sensed: false,
        condition: true,
      },
      {
        name: 'A/THR',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'DECENT TO OR BELOW OPT ALT',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  990900011: {
    title: '\x1b<4m\x1b4mMISC\x1bm VOLCANIC ASH ENCOUNTER',
    sensed: false,
    items: [], // TODO
  },
};

export const EcamDeferredProcAta80: { [n: number]: DeferredProcedure } = {
  210700001: {
    fromAbnormalProcs: ['990900001'],
    title: 'IF NO IMMEDIATE LANDING :',
    type: DeferredProcedureType.FOR_APPROACH,
    items: [
      {
        name: '> CAB PRESS MANAGEMENT',
        sensed: false,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'CABIN ALT MODE',
        sensed: true,
        labelNotCompleted: 'AUTO',
      },
    ],
  },
};
