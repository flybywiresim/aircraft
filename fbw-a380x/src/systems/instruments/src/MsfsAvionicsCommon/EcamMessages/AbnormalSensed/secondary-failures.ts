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

export const EcamAbnormalSecondaryFailures: { [n: number]: AbnormalProcedure } = {
  999800001: {
    title: '\x1b<4m*F/CTL',
    sensed: true,
    items: [],
  },
  999800002: {
    title: '\x1b<4m*FUEL',
    sensed: true,
    items: [],
  },
  999800003: {
    title: '\x1b<4m*WHEEL',
    sensed: true,
    items: [],
  },
  999800004: {
    // AC
    title: '\x1b<4m*ELEC',
    sensed: true,
    items: [],
  },
  999800005: {
    // DC
    title: '\x1b<4m*ELEC',
    sensed: true,
    items: [],
  },
  999800006: {
    title: '\x1b<4m*BLEED',
    sensed: true,
    items: [],
  },
  999800007: {
    title: '\x1b<4m*HYD',
    sensed: true,
    items: [],
  },
};
