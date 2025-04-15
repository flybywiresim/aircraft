// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AbnormalProcedure } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

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
  // ATA 49 APU
  490800001: {
    title: '\x1b<4m\x1b4mAPU\x1bm FAULT',
    sensed: true,
    items: [],
  },
  490800002: {
    title: '\x1b<4m\x1b4mAPU\x1bm MACH LIMIT EXCEEDED',
    sensed: true,
    items: [
      {
        name: 'IF APU NOT ABSOLUTELY RQRD :',
        sensed: false,
        condition: true,
      },
      {
        name: 'APU MASTER SW OFF',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  490800003: {
    title: '\x1b<4m\x1b4mAPU\x1bm OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
};
