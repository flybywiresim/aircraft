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
        name: 'IF ABNORM CAB V/S :',
        sensed: false,
        condition: true,
      },
      {
        name: 'MAX FL : 100/MEA-MORA',
        sensed: false,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        sensed: false,
      },
      {
        name: 'ATC',
        labelNotCompleted: 'NOTIFY',
        sensed: false,
      },
      {
        name: 'DECEND TO FL 100/MEA-MORA',
        labelNotCompleted: 'INITIATE',
        sensed: false,
      },
    ],
  },
};
