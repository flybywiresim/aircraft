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
export const EcamAbnormalSensedAta80Rest: { [n: number]: AbnormalProcedure } = {
  990900001: {
    title: '\x1b<4m\x1b4mMISC\x1bm BOMB ON BOARD',
    sensed: false,
    items: [], // TODO
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
    items: [], // TODO
  },
  990900011: {
    title: '\x1b<4m\x1b4mMISC\x1bm VOLCANIC ASH ENCOUNTER',
    sensed: false,
    items: [], // TODO
  },
};
