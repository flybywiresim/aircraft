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
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        style: ChecklistLineStyle.Green,
        labelNotCompleted: 'OFF',
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
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: true,
        style: ChecklistLineStyle.Green,
        labelNotCompleted: 'OFF',
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
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: true,
        style: ChecklistLineStyle.Cyan,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        style: ChecklistLineStyle.Green,
        labelNotCompleted: 'OFF',
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
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: true,
        style: ChecklistLineStyle.Cyan,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        style: ChecklistLineStyle.Green,
        labelNotCompleted: 'OFF',
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
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: true,
        style: ChecklistLineStyle.Cyan,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: true,
        style: ChecklistLineStyle.Green,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340800007: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2+3 DATA DEGRADED',
    sensed: true,
    items: [
      {
        name: 'USE STBY INSTRUMENTS',
        sensed: true,
      },
      {
        name: '[MFD SURV] ALT RPTG',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340800008: {
    title: '\x1b<2m\x1b4mNAV\x1bm ADR 1+2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'USE STBY INSTRUMENTS',
        sensed: true,
      },
      {
        name: 'ADR 1+2+3 P/Bs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'PFD BKUP SPEED & ALT AVAIL',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      // No anemometric failure detection for now
    ],
  },
  340800009: {
    title: '\x1b<4m\x1b4mNAV\x1bm AIR DATA DISAGREE',
    sensed: true,
    items: [], // not implemented
  },
  340800010: {
    title: '\x1b<2m\x1b4mNAV\x1bm ALL AIR DATA DISAGREE',
    sensed: true,
    items: [], // not implemented
  },
  340800011: {
    title: '\x1b<4m\x1b4mNAV\x1bm AOA 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800012: {
    title: '\x1b<4m\x1b4mNAV\x1bm AOA 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800013: {
    title: '\x1b<4m\x1b4mNAV\x1bm AOA 3 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800014: {
    title: '\x1b<4m\x1b4mNAV\x1bm AOA DISAGREE',
    sensed: true,
    items: [], // not implemented
  },
  340800015: {
    title: '\x1b<4m\x1b4mNAV\x1bm ARPT NAV FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800016: {
    title: '\x1b<4m\x1b4mNAV\x1bm CAPT AND F/O ALT DISAGREE',
    sensed: true,
    items: [], // not modeled
  },
  340800017: {
    title: '\x1b<4m\x1b4mNAV\x1bm CAPT AND F/O ATT DISAGREE',
    sensed: true,
    items: [], // not modeled
  },
  340800018: {
    title: '\x1b<4m\x1b4mNAV\x1bm CAPT AND F/O BARO REF DISAGREE',
    sensed: true,
    items: [], // no separate baros
  },
  340800019: {
    title: '\x1b<4m\x1b4mNAV\x1bm CAPT AND F/O BARO VALUE DISAGREE',
    sensed: true,
    items: [], // no separate baros
  },
  340800020: {
    title: '\x1b<4m\x1b4mNAV\x1bm CAPT AND F/O HDG DISAGREE',
    sensed: true,
    items: [], // not modeled
  },
  340800021: {
    title: '\x1b<4m\x1b4mNAV\x1bm EXTREME LATITUDE',
    sensed: true,
    items: [
      {
        name: 'NORTH REF SEL',
        sensed: true,
        labelNotCompleted: 'TRUE',
      },
    ],
  },
  340800022: {
    title: '\x1b<4m\x1b4mNAV\x1bm FLS 1 CAPABILITY LOST',
    sensed: true,
    items: [], // FLS not implemented
  },
  340800023: {
    title: '\x1b<4m\x1b4mNAV\x1bm FLS 2 CAPABILITY LOST',
    sensed: true,
    items: [], // FLS not implemented
  },
  340800024: {
    title: '\x1b<4m\x1b4mNAV\x1bm FLS 1+2 CAPABILITY LOST',
    sensed: true,
    items: [], // FLS not implemented
  },
  340800025: {
    title: '\x1b<4m\x1b4mNAV\x1bm FM / GPS POS DISAGREE',
    sensed: true,
    items: [], // not implemented
  },
  340800026: {
    title: '\x1b<4m\x1b4mNAV\x1bm FM / IR POS DISAGREE',
    sensed: true,
    items: [], // not implemented
  },
  340800027: {
    title: '\x1b<4m\x1b4mNAV\x1bm GLS 1 CAPABILITY LOST',
    sensed: true,
    items: [], // GLS not implemented
  },
  340800028: {
    title: '\x1b<4m\x1b4mNAV\x1bm GLS 2 CAPABILITY LOST',
    sensed: true,
    items: [], // GLS not implemented
  },
  340800029: {
    title: '\x1b<4m\x1b4mNAV\x1bm GLS 1+2 CAPABILITY LOST',
    sensed: true,
    items: [], // GLS not implemented
  },
  340800030: {
    title: '\x1b<4m\x1b4mNAV\x1bm GLS 1 FAULT',
    sensed: true,
    items: [], // GLS not implemented
  },
  340800031: {
    title: '\x1b<4m\x1b4mNAV\x1bm GLS 2 FAULT',
    sensed: true,
    items: [], // GLS not implemented
  },
  340800032: {
    title: '\x1b<4m\x1b4mNAV\x1bm GLS 1+2 FAULT',
    sensed: true,
    items: [], // GLS not implemented
  },
  340800033: {
    title: '\x1b<4m\x1b4mNAV\x1bm GNSS SIGNAL DEGRADED',
    sensed: true,
    items: [], // not implemented
  },
  340800034: {
    title: '\x1b<4m\x1b4mNAV\x1bm GPS 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800035: {
    title: '\x1b<4m\x1b4mNAV\x1bm GPS 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800036: {
    title: '\x1b<4m\x1b4mNAV\x1bm GPS 1+2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800037: {
    title: '\x1b<4m\x1b4mNAV\x1bm ILS 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800038: {
    title: '\x1b<4m\x1b4mNAV\x1bm ILS 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800039: {
    title: '\x1b<4m\x1b4mNAV\x1bm ILS 1+2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800040: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'IR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      }, // TODO add "If IR is available in ATT mode" when/if ATT mode is implemented
    ],
  },
  340800041: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'IR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      }, // TODO add "If IR is available in ATT mode" when/if ATT mode is implemented
    ],
  },
  340800072: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'IR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      }, // TODO add "If IR is available in ATT mode" when/if ATT mode is implemented
    ],
  },
  340800042: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        // If selected on SYS 2
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        // If selected on SYS 2
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'IR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'IR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ], // TODO add "If one of the affected IR is available in ATT mode" when/if ATT mode is implemented
  },
  340800043: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR 1+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        // If selected on SYS 1
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        // If selected on SYS 1
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'IR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'IR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'STANDBY NAV IN TRUE GPS TRK',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
    ], // TODO add "If one of the affected IR is available in ATT mode" when/if ATT mode is implemented
  },
  340800044: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR 2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        // If selected on SYS 2
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        // If selected on SYS 2
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'IR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'IR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ], // TODO add "If one of the affected IR is available in ATT mode" when/if ATT mode is implemented
  },
  340800045: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR NOT ALIGNED',
    sensed: true,
    items: [
      {
        name: 'IR 1 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 2 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 3 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1+2 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1+3 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 2+3 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1+2+3 IN ALIGN',
        sensed: true,
        style: ChecklistLineStyle.Green,
      },
    ], // Only EXCESS MOTION for now
  },
  340800046: {
    title: '\x1b<4m\x1b4mNAV\x1bm LS 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800047: {
    title: '\x1b<4m\x1b4mNAV\x1bm LS 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800048: {
    title: '\x1b<4m\x1b4mNAV\x1bm LS 1+2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800049: {
    title: '\x1b<4m\x1b4mNAV\x1bm LS TUNING DISAGREE',
    sensed: true,
    items: [], // TODO
  },
  340800050: {
    title: '\x1b<4m\x1b4mNAV\x1bm OAT PROBE 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800051: {
    title: '\x1b<4m\x1b4mNAV\x1bm OAT PROBE 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800052: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA DEGRADED',
    sensed: true,
    items: [], // error model not implemented
  },
  340800053: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS A FAULT',
    sensed: true,
    items: [],
  },
  340800054: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS B FAULT',
    sensed: true,
    items: [],
  },
  340800055: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS C FAULT',
    sensed: true,
    items: [],
  },
  340800056: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS A LOST BY PRIM',
    sensed: true,
    items: [], // not implemented
  },
  340800057: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS B LOST BY PRIM',
    sensed: true,
    items: [], // not implemented
  },
  340800058: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS C LOST BY PRIM',
    sensed: true,
    items: [], // not implemented
  },
  340800059: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS A+B FAULT',
    sensed: true,
    items: [],
  },
  340800060: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS A+C FAULT',
    sensed: true,
    items: [],
  },
  340800061: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS B+C FAULT',
    sensed: true,
    items: [],
  },
  340800062: {
    title: '\x1b<4m\x1b4mNAV\x1bm RA SYS A+B+C FAULT',
    sensed: true,
    items: [],
  },
  340800063: {
    title: '\x1b<4m\x1b4mNAV\x1bm RESIDUAL AIR SPEED',
    sensed: true,
    items: [], // error model not implemented
  },
  340800064: {
    title: '\x1b<4m\x1b4mNAV\x1bm SIDESLIP PROBE 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800065: {
    title: '\x1b<4m\x1b4mNAV\x1bm SIDESLIP PROBE 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800066: {
    title: '\x1b<4m\x1b4mNAV\x1bm SIDESLIP PROBE 3 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800067: {
    title: '\x1b<4m\x1b4mNAV\x1bm STATIC PROBE FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800068: {
    title: '\x1b<4m\x1b4mNAV\x1bm TAT PROBE 1 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800069: {
    title: '\x1b<4m\x1b4mNAV\x1bm TAT PROBE 2 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800070: {
    title: '\x1b<4m\x1b4mNAV\x1bm TAT PROBE 3 FAULT',
    sensed: true,
    items: [], // not implemented
  },
  340800071: {
    title: '\x1b<2m\x1b4mNAV\x1bm UNRELIABLE AIR SPEED INDICATION',
    sensed: true,
    items: [], // not implemented
  },
  // SURVEILLANCE
  341800016: {
    title: '\x1b<4m\x1b4mSURV\x1bm TCAS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'XPDR & TCAS',
        labelNotCompleted: 'SYS 2',
        sensed: true,
      },
    ],
  },
  341800017: {
    title: '\x1b<4m\x1b4mSURV\x1bm TCAS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'XPDR & TCAS',
        labelNotCompleted: 'SYS 1',
        sensed: true,
      },
    ],
  },
  341800018: {
    title: '\x1b<4m\x1b4mSURV\x1bm TCAS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  341800019: {
    title: '\x1b<4m\x1b4mSURV\x1bm TCAS STBY',
    sensed: true,
    items: [],
  },
  341800037: {
    title: '\x1b<4m\x1b4mSURV\x1bm XPDR STBY',
    sensed: true,
    items: [],
  },
  341800020: {
    title: '\x1b<4m\x1b4mSURV\x1bm TERR SYS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: '[MFD SURV] STATUS & SWTG PAGE',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'AS RQRD',
      },
    ],
  },
  341800021: {
    title: '\x1b<4m\x1b4mSURV\x1bm TERR SYS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: '[MFD SURV] STATUS & SWTG PAGE',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'AS RQRD',
      },
    ],
  },
  341800022: {
    title: '\x1b<4m\x1b4mSURV\x1bm TERR SYS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: '[MFD SURV] TERR SYS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  341800023: {
    title: '\x1b<4m\x1b4mSURV\x1bm TAWS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: '[MFD SURV] STATUS & SWTG PAGE',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
    ],
  },
  341800024: {
    title: '\x1b<4m\x1b4mSURV\x1bm TAWS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: '[MFD SURV] STATUS & SWTG PAGE',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
    ],
  },
  341800025: {
    title: '\x1b<4m\x1b4mSURV\x1bm TAWS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: '[MFD SURV] TERR SYS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: '[MFD SURV] GPWS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  341800026: {
    title: '\x1b<4m\x1b4mSURV\x1bm GPWS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: '[MFD SURV] STATUS & SWTG PAGE',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'AS RQRD',
      },
    ],
  },
  341800027: {
    title: '\x1b<4m\x1b4mSURV\x1bm GPWS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: '[MFD SURV] STATUS & SWTG PAGE',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'AS RQRD',
      },
    ],
  },
  341800028: {
    title: '\x1b<4m\x1b4mSURV\x1bm GPWS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: '[MFD SURV] GPWS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340900001: {
    title: '\x1b<4m\x1b4mNAV\x1bm IR ALIGNMENT IN ATT MODE',
    sensed: false,
    items: [], // TODO
  },
  340900002: {
    title: '\x1b<4m\x1b4mNAV\x1bm FLUCTUATING VERTICAL SPEED',
    sensed: false,
    items: [], // TODO
  },
  340900003: {
    title: '\x1b<2m\x1b4mNAV\x1bm UNRELIABLE AIRSPEED INDICATION',
    sensed: false,
    items: [], // TODO
  },
};

export const EcamDeferredProcAta34: { [n: number]: DeferredProcedure } = {
  340700001: {
    fromAbnormalProcs: ['340800008'],
    title: '\x1b<4mLDG ELEVN',
    type: DeferredProcedureType.AT_TOP_OF_DESCENT,
    items: [],
  },
};
