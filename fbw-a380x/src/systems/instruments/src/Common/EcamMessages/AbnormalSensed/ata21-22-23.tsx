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
export const EcamAbnormalSensedAta212223: { [n: number]: AbnormalProcedure } = {
  // ATA 21: AC
  // TODO: items is not done yet for most abnormal procedures
  211800001: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  211800002: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL 2 FAULT ',
    sensed: true,
    items: [],
  },
  211800003: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL 1 FAULT ',
    sensed: true,
    items: [],
  },
  211800004: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL 2 FAULT   ',
    sensed: true,
    items: [],
  },
  211800005: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL DEGRADED',
    sensed: true,
    items: [],
  },
  211800006: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL DEGRADED  ',
    sensed: true,
    items: [],
  },
  211800007: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL REDUNDANCY LOST  ',
    sensed: true,
    items: [],
  },
  211800008: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL REDUNDANCY LOST ',
    sensed: true,
    items: [],
  },
  211800009: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'PACK 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800010: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 FAULT  ',
    sensed: true,
    items: [
      {
        name: 'PACK 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800011: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 OFF ',
    sensed: true,
    items: [],
  },
  211800012: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 OFF',
    sensed: true,
    items: [],
  },
  211800013: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 OVHT',
    sensed: true,
    items: [
      {
        name: 'PACK 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800014: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 OVHT ',
    sensed: true,
    items: [
      {
        name: 'PACK 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800015: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 REGUL FAULT',
    sensed: true,
    items: [
      {
        name: 'PACK 1 IN BYPASS MODE',
        sensed: false,
      },
      {
        name: 'PACK 1 AVAIL ABOVE FL 290', // ONLY IF BYPASS MODE OR EXTRACT FAULT
        sensed: false,
      },
      {
        name: 'PACK 1 WATER EXTRACT FAULT',
        sensed: false,
      },
      {
        name: 'PACK 1 RAM AIR DOOR CLOSED',
        sensed: false,
      },
      {
        // Message auto-rcl'd when below fl290
        name: 'PACK 1',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
    ],
  },
  211800016: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 REGUL FAULT',
    sensed: true,
    items: [
      {
        name: 'PACK 2 IN BYPASS MODE',
        sensed: false,
      },
      {
        name: 'PACK 2 AVAIL ABOVE FL 290',
        sensed: false,
      },
      {
        name: 'PACK 2 WATER EXTRACT FAULT',
        sensed: false,
      },
      {
        name: 'PACK 2 RAM AIR DOOR CLOSED',
        sensed: false,
      },
      {
        name: 'PACK 2',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
    ],
  },
  211800017: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 VLV 1 FAULT ',
    sensed: true,
    items: [],
  },
  211800018: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 VLV 2 FAULT',
    sensed: true,
    items: [],
  },
  211800019: {
    title: '\x1b<4m\x1b4mAIR \x1bm PACK 2 VLV 1 FAULT',
    sensed: true,
    items: [],
  },
  211800020: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 VLV 2 FAULT ',
    sensed: true,
    items: [],
  },
  211800021: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1+2 FAULT  ',
    sensed: true,
    items: [],
  },
  211800022: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1+2 REGUL REDUNDANCY FAULT  ',
    sensed: true,
    items: [],
  },
  211800023: {
    title: '\x1b<4m\x1b4mCOND\x1bm ALL PRIMARY CABIN FANS FAULT  ',
    sensed: true,
    items: [],
  },
  211800024: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO DUCT OVHT  ',
    sensed: true,
    items: [],
  },
  211800025: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO HEATER FAULT  ',
    sensed: true,
    items: [],
  },
  211800026: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO ISOL FAULT  ',
    sensed: true,
    items: [],
  },
  211800027: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO VENT FAULT  ',
    sensed: true,
    items: [],
  },
  211800028: {
    title: '\x1b<4m\x1b4mCOND\x1bm DUCT OVHT  ',
    sensed: true,
    items: [],
  },
  211800029: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD CARGO ISOL FAULT  ',
    sensed: true,
    items: [],
  },
  211800030: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD CARGO TEMP REGUL FAULT  ',
    sensed: true,
    items: [],
  },
  211800031: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD CARGO VENT FAULT  ',
    sensed: true,
    items: [],
  },
  211800032: {
    title: '\x1b<4m\x1b4mCOND\x1bm HOT AIR 1 FAULT',
    sensed: true,
    items: [],
  },
  211800033: {
    title: '\x1b<4m\x1b4mCOND\x1bm HOT AIR 2 FAULT',
    sensed: true,
    items: [],
  },
  211800034: {
    title: '\x1b<4m\x1b4mCOND\x1bm MIXER PRESS REGUL FAULT  ',
    sensed: true,
    items: [],
  },
  211800035: {
    title: '\x1b<4m\x1b4mCOND\x1bm ONE PRIMARY CABIN FAN FAULT  ',
    sensed: true,
    items: [],
  },
  211800036: {
    title: '\x1b<4m\x1b4mCOND\x1bm PURSER TEMP SEL FAULT  ',
    sensed: true,
    items: [],
  },
  211800037: {
    title: '\x1b<4m\x1b4mCOND\x1bm RAM AIR 1 FAULT  ',
    sensed: true,
    items: [],
  },
  211800038: {
    title: '\x1b<4m\x1b4mCOND\x1bm RAM AIR 2 FAULT ',
    sensed: true,
    items: [],
  },
  211800039: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL 1 FAULT   ',
    sensed: true,
    items: [],
  },
  211800040: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL 2 FAULT  ',
    sensed: true,
    items: [],
  },
  211800041: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL FAULT',
    sensed: true,
    items: [],
  },
  211800042: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  211800043: {
    title: '\x1b<4m\x1b4mCOND\x1bm THREE PRIMARY CABIN FANS FAULT',
    sensed: true,
    items: [],
  },
  211800044: {
    title: '\x1b<4m\x1b4mCOND\x1bm TWO PRIMARY CABIN FANS FAULT ',
    sensed: true,
    items: [],
  },
  // ATA 21: VENT
  212800001: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  212800002: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  212800003: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL DEGRADED',
    sensed: true,
    items: [],
  },
  212800004: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL FAULT',
    sensed: true,
    items: [],
  },
  212800005: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  212800006: {
    title: '\x1b<4m\x1b4mCOND\x1bm AVNCS VENT CTL FAULT',
    sensed: true,
    items: [],
  },
  212800007: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  212800008: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  212800009: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL DEGRADED',
    sensed: true,
    items: [],
  },
  212800010: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL FAULT',
    sensed: true,
    items: [],
  },
  212800011: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  212800012: {
    title: '\x1b<4m\x1b4mCOND\x1bm PART SECONDARY CABIN FANS FAULT',
    sensed: true,
    items: [],
  },
  212800013: {
    title: '\x1b<4m\x1b4mCOND\x1bm SECONDARY CABIN FANS FAULT',
    sensed: true,
    items: [],
  },
  212800014: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS BLOWING FAULT',
    sensed: true,
    items: [],
  },
  212800015: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS EXTRACT FAULT',
    sensed: true,
    items: [],
  },
  212800016: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS L BLOWING FAULT',
    sensed: true,
    items: [],
  },
  212800017: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS R BLOWING FAULT',
    sensed: true,
    items: [],
  },
  212800018: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS OVBD VLV FAULT',
    sensed: true,
    items: [],
  },
  212800019: {
    title: '\x1b<4m\x1b4mVENT\x1bm COOLG SYS 1 OVHT',
    sensed: true,
    items: [],
  },
  212800020: {
    title: '\x1b<4m\x1b4mVENT\x1bm COOLG SYS 2 OVHT',
    sensed: true,
    items: [],
  },
  212800021: {
    title: '\x1b<4m\x1b4mVENT\x1bm COOLG SYS PROT FAULT',
    sensed: true,
    items: [],
  },
  212800022: {
    title: '\x1b<4m\x1b4mVENT\x1bm IFE BAY ISOL FAULT',
    sensed: true,
    items: [],
  },
  212800023: {
    title: '\x1b<4m\x1b4mVENT\x1bm IFE BAY VENT FAULT',
    sensed: true,
    items: [],
  },
  212800024: {
    title: '\x1b<4m\x1b4mVENT\x1bm LAV & GALLEYS EXTRACT FAULT',
    sensed: true,
    items: [],
  },
  212800025: {
    title: '\x1b<4m\x1b4mVENT\x1bm PACK BAY 1 VENT FAULT',
    sensed: true,
    items: [],
  },
  212800026: {
    title: '\x1b<4m\x1b4mVENT\x1bm PACK BAY 2 VENT FAULT',
    sensed: true,
    items: [],
  },
  212800027: {
    title: '\x1b<4m\x1b4mVENT\x1bm PACK BAY 1+2 VENT FAULT',
    sensed: true,
    items: [],
  },
  212800028: {
    title: '\x1b<4m\x1b4mVENT\x1bm THS BAY VENT FAULT',
    sensed: true,
    items: [],
  },
  // ATA 21: PRESS
  213800001: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS CAB ALT',
    sensed: true,
    items: [],
  },
  213800002: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS DIFF PRESS',
    sensed: true,
    items: [],
  },
  213800003: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS NEGATIVE DIFF PRESS',
    sensed: true,
    items: [],
  },
  213800004: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS RESIDUAL DIFF PRESS',
    sensed: true,
    items: [],
  },
  213800005: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm AUTO CTL FAULT',
    sensed: true,
    items: [],
  },
  213800006: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  213800007: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm DIFF PRESS HI',
    sensed: true,
    items: [],
  },
  213800008: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm DIFF PRESS LO',
    sensed: true,
    items: [],
  },
  213800009: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm INHIBITED BY DOORS',
    sensed: true,
    items: [],
  },
  213800010: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm MAN CTL FAULT',
    sensed: true,
    items: [],
  },
  213800011: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  213800012: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  213800013: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 3 FAULT',
    sensed: true,
    items: [],
  },
  213800014: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 4 FAULT',
    sensed: true,
    items: [],
  },
  213800015: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL FAULT',
    sensed: true,
    items: [],
  },
  213800016: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm SENSORS FAULT',
    sensed: true,
    items: [],
  },
  213800017: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm SYS FAULT',
    sensed: true,
    items: [],
  },
  213800018: {
    title: '\x1b<4m\x1b4mCOND\x1bm CABIN AIR EXTRACT VLV FAULT',
    sensed: true,
    items: [],
  },
  // ATA 22: FG / FMS
  220800001: {
    title: '\x1b<2m\x1b4mAUTO FLT\x1bm AP OFF',
    sensed: true,
    items: [], // TODO
  },
  220800002: {
    title: '\x1b<2mAUTOLAND',
    sensed: true,
    items: [], // TODO
  },
  220800003: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm A/THR LIMITED',
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS', // When all ENG operative
        sensed: true,
        labelNotCompleted: 'CLB',
      },
      {
        name: 'THR LEVERS', // In case of ENG out
        sensed: true,
        labelNotCompleted: 'MCT',
      },
    ],
  },
  220800004: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'MOVE',
      },
    ],
  },
  220800005: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm AFS CTL PNL FAULT',
    sensed: true,
    items: [
      {
        name: 'USE MFD FCU BKUP', // If FCU BKUP is avail on CAPT + F/O side
        sensed: false,
      },
      {
        name: 'Use CAPT MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
      {
        name: 'Use F/O MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
    ],
  },
  220800006: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm APPROACH CAPABILITY DOWNGRADED',
    sensed: true,
    items: [],
  },
  220800007: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm AFS CTL PNL+CAPT BKUP CTL FAULT',
    sensed: true,
    items: [
      {
        name: 'Use F/O MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
    ],
  },
  220800008: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm AFS CTL PNL+F/O BKUP CTL FAULT',
    sensed: true,
    items: [
      {
        name: 'Use CAPT MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
    ],
  },
  220800009: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 1 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 1', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800010: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 2 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 2', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800011: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 3 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 3', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800012: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 4 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 4', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800013: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ROLL OUT FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR AUTOLAND: MAN ROLL OUT ONLY', // Always completed
        sensed: true,
        color: 'green',
      },
    ],
  },
  220800014: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm TCAS MODE FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TCAS ALERT', // Always completed
        sensed: true,
        color: 'green',
      },
      {
        name: 'AP & FD', // Always completed
        sensed: true,
        labelNotCompleted: 'OFF',
        color: 'green',
      },
      {
        name: 'FLY MANUALLY TCAS RA ORDER', // Always completed
        sensed: true,
        color: 'green',
      },
    ],
  },
  220800015: {
    title: '\x1b<4m\x1b4mCDS & AUTO FLT\x1bm FCU SWITCHED OFF',
    sensed: true,
    items: [],
  },
  221800001: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMC-A FAULT',
    sensed: true,
    items: [
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
    ],
  },
  221800002: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMC-B FAULT',
    sensed: true,
    items: [
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
    ],
  },
  221800003: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMC-C FAULT',
    sensed: true,
    items: [
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
    ],
  },
  221800004: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'FMC A+C FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC A+B FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC A FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'BOTH ON 2',
      },
    ],
  },
  221800005: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'FMC A+B FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC B+C FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC B FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'BOTH ON 1',
      },
    ],
  },
  221800006: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'ALL FMCs FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'FOR NAV: USE STBY INSTRUMENTS',
        sensed: false,
      },
      {
        name: 'FOR NAVAID TUNING: USE RMP',
        sensed: false,
      },
      {
        name: '[MFD SURV] TAWS FLAP MODE',
        sensed: false,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  221800007: {
    title: '\x1b<4m\x1b4mT.O\x1bm SPEEDS NOT INSERTED',
    sensed: true,
    items: [],
  },
  230800001: {
    title: '\x1b<4m\x1b4mCAB COM\x1bm CIDS 1+2+3 FAULT',
    sensed: true,
    items: [],
  },
  230800002: {
    title: '\x1b<4m\x1b4mCAB COM\x1bm CIDS CABIN COM FAULT',
    sensed: true,
    items: [
      {
        name: 'UPPER DECK PA FAULT',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'MAIN DECK PA FAULT',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'LOWER DECK PA FAULT',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'CABIN INTERPHONE FAULT',
        sensed: true,
        color: 'amber',
      },
    ],
  },
  230800003: {
    title: '\x1b<4m\x1b4mCAB COM\x1bm COM DEGRADED',
    sensed: true,
    items: [
      {
        name: 'PA DEGRADED',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'CABIN INTERPHONE DEGRADED',
        sensed: true,
        color: 'amber',
      },
    ],
  },
  230800004: {
    title: '\x1b<4m\x1b4mCOM\x1bm CAPT PTT STUCK',
    sensed: true,
    items: [],
  },
  230800005: {
    title: '\x1b<4m\x1b4mCOM\x1bm F/O PTT STUCK',
    sensed: true,
    items: [],
  },
  230800006: {
    title: '\x1b<4m\x1b4mCOM\x1bm THIRD OCCUPANT PTT STUCK',
    sensed: true,
    items: [],
  },
  230800007: {
    title: '\x1b<4m\x1b4mCOM\x1bm DATALINK FAULT',
    sensed: true,
    items: [
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
        color: 'cyan',
      },
      {
        name: 'CPNY COM VOICE ONLY',
        sensed: true,
        color: 'cyan',
      },
    ],
  },
  230800008: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 1 DATALINK FAULT',
    sensed: true,
    items: [],
  },
  230800009: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 2 DATALINK FAULT',
    sensed: true,
    items: [],
  },
  230800010: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 1 EMITTING',
    sensed: true,
    items: [],
  },
  230800011: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 2 EMITTING',
    sensed: true,
    items: [],
  },
  230800012: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800013: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800014: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800015: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800016: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800017: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800018: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1+2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'NO VOICE COM AVAIL', // If SATCOM datalink avail
        sensed: true,
        color: 'cyan',
      },
      {
        name: 'SATCOM DATALINK AVAIL', // If SATCOM datalink avail
        sensed: true,
        color: 'cyan',
      },
      {
        name: 'NO COM AVAIL', // If SATCOM datalink not avail
        sensed: true,
        color: 'cyan',
      },
    ],
  },
  230800019: {
    title: '\x1b<4m\x1b4mCOM\x1bm SATCOM DATALINK FAULT',
    sensed: true,
    items: [],
  },
  230800020: {
    title: '\x1b<4m\x1b4mCOM\x1bm SATCOM FAULT',
    sensed: true,
    items: [],
  },
  230800021: {
    title: '\x1b<4m\x1b4mCOM\x1bm SATCOM VOICE FAULT',
    sensed: true,
    items: [],
  },
  230800022: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 1 EMITTING',
    sensed: true,
    items: [
      {
        name: 'RMP TX KEY', // After 60s of VHF emitting
        sensed: true,
        labelNotCompleted: 'DESELECT',
      },
    ],
  },
  230800023: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 2 EMITTING',
    sensed: true,
    items: [
      {
        name: 'RMP TX KEY', // After 60s of VHF emitting
        sensed: true,
        labelNotCompleted: 'DESELECT',
      },
    ],
  },
  230800024: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 3 EMITTING',
    sensed: true,
    items: [
      {
        name: 'RMP TX KEY', // After 60s of VHF emitting
        sensed: true,
        labelNotCompleted: 'DESELECT',
      },
    ],
  },
  230800025: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 3 DATALINK FAULT',
    sensed: true,
    items: [],
  },
};
