// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AbnormalProcedure } from '@instruments/common/EcamMessages';

// Convention for IDs:
// First two digits: ATA chapter
// Third digit: Sub chapter, if needed
// Fourth digit:
//    0 for MEMOs,
//    1 for normal checklists,
//    2 for infos,
//    3 for INOP SYS,
//    4 for limitations (not populated yet here),
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedAta34: { [n: number]: AbnormalProcedure } = {
  // 34 NAVIGATION
  340800001: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'ADR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800002: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'ADR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340800003: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'ADR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800004: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'ADR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ADR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800005: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'ADR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ADR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
        level: 1,
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
        level: 1,
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800006: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'ADR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ADR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800007: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2+3 DATA DEGRADED',
    sensed: true,
    items: [
      {
        name: 'USE STBY INSTRUMENTS',
        sensed: false,
      },
      {
        name: '[MFD SURV] ALT RPTG',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340800008: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2+3 FAULT',
    sensed: true,
    items: [], // TODO
  },
};
