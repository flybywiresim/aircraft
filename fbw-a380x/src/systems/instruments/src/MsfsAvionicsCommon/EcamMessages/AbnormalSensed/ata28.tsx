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
//    4 for limitations (not populated yet here),
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedAta28: { [n: number]: AbnormalProcedure } = {
  281800001: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ABNORM AUTO REFUEL DISTRIBUTION',
    sensed: true,
    items: [],
  },
  281800002: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ALL FEED TKs LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'CROSSFEED 1+2+3+4',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'ALL FEED TKs PMPs',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED', // If gravity transfer from the trim tank is in progress
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 2,
      },
      {
        name: 'OUTR TK XFR', // For transfer tanks containing fuel
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'TRIM TK XFR', // If at least one trim tank pump is running
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 2,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
    ],
  },
  281800003: {
    title: '\x1b<4m\x1b4mFUEL\x1bm APU FEED FAULT',
    sensed: true,
    items: [],
  },
  281800004: {
    title: '\x1b<4m\x1b4mFUEL\x1bm APU FEED VLV NOT CLOSED',
    sensed: true,
    items: [],
  },
  281800005: {
    title: '\x1b<4m\x1b4mFUEL\x1bm AUTO GND XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800006: {
    title: '\x1b<4m\x1b4mFUEL\x1bm AUTO GND XFR FAULT',
    sensed: true,
    items: [],
  },
  281800007: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CG AT FWD LIMIT',
    sensed: true,
    items: [],
  },
  281800008: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CG DATA DISAGREE',
    sensed: true,
    items: [],
  },
  281800009: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CG OUT OF RANGE',
    sensed: true,
    items: [],
  },
  281800010: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 1 NOT FULL',
    sensed: true,
    items: [],
  },
  281800011: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 2 NOT FULL',
    sensed: true,
    items: [],
  },
  281800012: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 3 NOT FULL',
    sensed: true,
    items: [],
  },
  281800013: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 4 NOT FULL',
    sensed: true,
    items: [],
  },
  281800014: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 1 FAULT',
    sensed: true,
    items: [],
  },
  281800015: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 2 FAULT',
    sensed: true,
    items: [],
  },
  281800016: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 3 FAULT',
    sensed: true,
    items: [],
  },
  281800017: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 4 FAULT',
    sensed: true,
    items: [],
  },
  281800018: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 1 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800019: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 2 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800020: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 3 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800021: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 4 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800022: {
    title: '\x1b<4m\x1b4mFUEL\x1bm EXCESS AFT CG',
    sensed: true,
    items: [],
  },
  281800023: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK',
        sensed: true,
        style: ChecklistLineStyle.SubHeadline,
      },
      {
        name: 'CROSSFEED 1',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'CROSSFEED 2',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED', // If gravity transfer from the trim tank is in progress
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 2,
      },
      {
        name: 'OUTR TK XFR', // For transfer tanks containing fuel:
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'TRIM TK XFR', // If at least one trim tank pump is running
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 2,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
    ],
  },
  281800024: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK',
        sensed: true,
        style: ChecklistLineStyle.SubHeadline,
      },
      {
        name: 'CROSSFEED 1',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'CROSSFEED 2',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED',
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 2,
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'TRIM TK XFR',
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 2,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
    ],
  },
  281800025: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK',
        sensed: true,
        style: ChecklistLineStyle.SubHeadline,
      },
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED',
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 2,
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'TRIM TK XFR',
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 2,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
    ],
  },
  281800026: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK',
        sensed: true,
        style: ChecklistLineStyle.SubHeadline,
      },
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED',
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 2,
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'TRIM TK XFR',
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 2,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 2,
      },
    ],
  },
  281800027: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800028: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800029: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800030: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800031: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800032: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800033: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800034: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800035: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800036: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800037: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800038: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800039: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 TEMP HI',
    sensed: true,
    items: [],
  },
  281800040: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 TEMP HI',
    sensed: true,
    items: [],
  },
  281800041: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 TEMP HI',
    sensed: true,
    items: [],
  },
  281800042: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 TEMP HI',
    sensed: true,
    items: [],
  },
  281800043: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQDC 1 FAULT',
    sensed: true,
    items: [],
  },
  281800044: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQDC 2 FAULT',
    sensed: true,
    items: [],
  },
  281800045: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQI FAULT',
    sensed: true,
    items: [],
  },
  281800046: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQMS 1 FAULT',
    sensed: true,
    items: [],
  },
  281800047: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQMS 2 FAULT',
    sensed: true,
    items: [],
  },
  281800048: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQMS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  281800049: {
    title: '\x1b<4m\x1b4mFUEL\x1bm GAUGING FAULT',
    sensed: true,
    items: [],
  },
  281800050: {
    title: '\x1b<4m\x1b4mFUEL\x1bm INR TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800051: {
    title: '\x1b<4m\x1b4mFUEL\x1bm INR TKs QTY LO',
    sensed: true,
    items: [],
  },
  281800052: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON',
    sensed: true,
    items: [],
  },
  281800053: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON COMPLETED',
    sensed: true,
    items: [],
  },
  281800054: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON FAULT',
    sensed: true,
    items: [],
  },
  281800055: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON VLV NOT CLOSED',
    sensed: true,
    items: [],
  },
  281800056: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L INR TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800057: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R INR TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800058: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L INR TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800059: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L MID TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800060: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R INR TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800061: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R MID TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800062: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L MID TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800063: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L INR TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800064: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R MID TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800065: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R INR TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800066: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L MID TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800067: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R MID TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800068: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L OUTR TK PMP FAULT',
    sensed: true,
    items: [],
  },
  281800069: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R OUTR TK PMP FAULT',
    sensed: true,
    items: [],
  },
  281800070: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L WING FEED PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800071: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R WING FEED PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800072: {
    title: '\x1b<4m\x1b4mFUEL\x1bm LEAK DET FAULT',
    sensed: true,
    items: [],
  },
  281800073: {
    title: '\x1b<4m\x1b4mFUEL\x1bm LEAK DETECTED',
    sensed: true,
    items: [],
  },
  281800074: {
    title: '\x1b<4m\x1b4mFUEL\x1bm MAN XFR PROCEDURE',
    sensed: true,
    items: [],
  },
  281800075: {
    title: '\x1b<4m\x1b4mFUEL\x1bm MID TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800076: {
    title: '\x1b<4m\x1b4mFUEL\x1bm NO ZFW OR ZFWCG DATA',
    sensed: true,
    items: [
      {
        name: 'FMS ZFW OR ZFWCG VALUES',
        sensed: false,
        labelNotCompleted: 'INITIALIZE',
        labelCompleted: 'INITIALIZED',
      },
    ],
  },
  281800077: {
    title: '\x1b<4m\x1b4mFUEL\x1bm NORM + ALTN XFR FAULT',
    sensed: true,
    items: [],
  },
  281800078: {
    title: '\x1b<4m\x1b4mFUEL\x1bm NORM XFR FAULT',
    sensed: true,
    items: [],
  },
  281800079: {
    title: '\x1b<4m\x1b4mFUEL\x1bm OUTR TK XFR FAULT',
    sensed: true,
    items: [],
  },
  281800080: {
    title: '\x1b<4m\x1b4mFUEL\x1bm OUTR TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800081: {
    title: '\x1b<4m\x1b4mFUEL\x1bm PREDICTED CG OUT OF T.O RANGE',
    sensed: true,
    items: [],
  },
  281800082: {
    title: '\x1b<4m\x1b4mFUEL\x1bm REFUEL / DEFUEL SYS FAULT',
    sensed: true,
    items: [],
  },
  281800083: {
    title: '\x1b<4m\x1b4mFUEL\x1bm REFUEL DATA / FMS DISAGREE',
    sensed: true,
    items: [],
  },
  281800084: {
    title: '\x1b<4m\x1b4mFUEL\x1bm REFUEL FAULT',
    sensed: true,
    items: [],
  },
  281800085: {
    title: '\x1b<4m\x1b4mFUEL\x1bm SYS COMPONENT FAULT',
    sensed: true,
    items: [],
  },
  281800086: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TEMP LO',
    sensed: true,
    items: [],
  },
  281800087: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM & APU LINES FAULT',
    sensed: true,
    items: [],
  },
  281800088: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK GRVTY FWD XFR FAULT',
    sensed: true,
    items: [],
  },
  281800089: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK L PMP FAULT',
    sensed: true,
    items: [],
  },
  281800090: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK R PMP FAULT',
    sensed: true,
    items: [],
  },
  281800091: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK L+R PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800092: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800093: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK OVERFLOW',
    sensed: true,
    items: [],
  },
  281800094: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK XFR FAULT',
    sensed: true,
    items: [],
  },
  281800095: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WEIGHT & BALANCE BKUP FAULT',
    sensed: true,
    items: [],
  },
  281800096: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WEIGHT DATA DISAGREE',
    sensed: true,
    items: [],
  },
  281800097: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WING TK OVERFLOW',
    sensed: true,
    items: [],
  },
  281800098: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WINGS BALANCED',
    sensed: true,
    items: [],
  },
  281800099: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WINGS MAN BALANCING PROCEDURE',
    sensed: true,
    items: [],
  },
  281800100: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WINGS NOT BALANCED',
    sensed: true,
    items: [],
  },
  281800101: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ZFW OR ZFCG FMS DISAGREE',
    sensed: true,
    items: [],
  },
  281800102: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TKs 1+2 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK:',
        sensed: true,
      },
      {
        name: 'ALL CROSSFEEDs',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED', // If gravity transfer from trim tank in progress
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 3,
      },
      {
        name: 'OUTR TK XFR', // For transfer tanks containing fuel
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
      {
        name: 'TRIM TK XFR', // If at least one trim tank pump is running
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 4,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
    ],
  },
  281800103: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TKs 3+4 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK:',
        sensed: true,
      },
      {
        name: 'ALL CROSSFEEDs',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED', // If gravity transfer from trim tank in progress
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 3,
      },
      {
        name: 'OUTR TK XFR', // For transfer tanks containing fuel
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
      {
        name: 'TRIM TK XFR', // If at least one trim tank pump is running
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 4,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
    ],
  },
};
