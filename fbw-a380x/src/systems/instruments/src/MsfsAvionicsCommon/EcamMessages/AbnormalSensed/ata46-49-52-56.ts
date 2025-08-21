// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AbnormalProcedure, ChecklistLineStyle } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

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
export const EcamAbnormalSensedAta46495256: { [n: number]: AbnormalProcedure } = {
  // ATA 52 DOOR
  520800008: {
    title: '\x1b<4m\x1b4mDOOR\x1bm CKPT SLIDING WINDOW NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'CKPT SLIDING WINDOW',
        labelNotCompleted: 'CLOSE',
        sensed: true,
      },
    ],
  },
  520800017: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 1L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800018: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 1R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800019: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 2L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800020: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 2R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800021: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 3L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800022: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 3R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800023: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 4L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800024: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 4R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800025: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 5L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: true,
        condition: true,
        level: 1,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800026: {
    title: '\x1b<4m\x1b4mDOOR\x1bm MAIN 5R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: true,
        condition: true,
        level: 1,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800027: {
    title: '\x1b<4m\x1b4mDOOR\x1bm UPPER 1L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800028: {
    title: '\x1b<4m\x1b4mDOOR\x1bm UPPER 1R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800029: {
    title: '\x1b<4m\x1b4mDOOR\x1bm UPPER 2L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: true,
        condition: true,
        level: 1,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800030: {
    title: '\x1b<4m\x1b4mDOOR\x1bm UPPER 2R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: true,
        condition: true,
        level: 1,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800031: {
    title: '\x1b<4m\x1b4mDOOR\x1bm UPPER 3L NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
  520800032: {
    title: '\x1b<4m\x1b4mDOOR\x1bm UPPER 3R NOT CLOSED',
    sensed: true,
    items: [
      {
        name: 'PACK 1+2 & CAB PRESS NOT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ABNORM CAB V/S',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
        level: 1,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
        level: 1,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
        level: 1,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
        level: 1,
      },
    ],
  },
};
