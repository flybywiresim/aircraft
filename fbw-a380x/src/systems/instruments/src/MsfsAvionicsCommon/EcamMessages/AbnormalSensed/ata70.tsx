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
//    4 for limitations (not populated yet here),
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedAta70: { [n: number]: AbnormalProcedure } = {
  // ATA 70: ENG
  701800001: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800002: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800003: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800004: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800005: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800006: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800007: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800008: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800009: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800010: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800011: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800012: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800013: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800014: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800015: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800016: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800017: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800018: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800019: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800020: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800021: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800022: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800023: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800024: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800025: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800026: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800027: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800028: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800029: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FAIL',
    sensed: true,
    items: [],
  },
  701800030: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FAIL',
    sensed: true,
    items: [],
  },
  701800031: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FAIL',
    sensed: true,
    items: [],
  },
  701800032: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FAIL',
    sensed: true,
    items: [],
  },
  701800033: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800034: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800035: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800036: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800037: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800038: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800039: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800040: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800041: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800042: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800043: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800044: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800045: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800046: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800047: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800048: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800049: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800050: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800051: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800052: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800053: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800054: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800055: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800056: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800057: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800058: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800059: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800060: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800061: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800062: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800063: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800064: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800065: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800066: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800067: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800068: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800069: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800070: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800071: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800072: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800073: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800074: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800075: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800076: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800077: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800078: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800079: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800080: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800081: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800082: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800083: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800084: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800085: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800086: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800087: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800088: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800089: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800090: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800091: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800092: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800093: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800094: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800095: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800096: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800097: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800098: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800099: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800100: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800101: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800102: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800103: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800104: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800105: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800106: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800107: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800108: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800109: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800110: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800111: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800112: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800113: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 STALL',
    sensed: true,
    items: [],
  },
  701800114: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 STALL',
    sensed: true,
    items: [],
  },
  701800115: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 STALL',
    sensed: true,
    items: [],
  },
  701800116: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 STALL',
    sensed: true,
    items: [],
  },
  701800117: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 START FAULT',
    sensed: true,
    items: [],
  },
  701800118: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 START FAULT',
    sensed: true,
    items: [],
  },
  701800119: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 START FAULT',
    sensed: true,
    items: [],
  },
  701800120: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 START FAULT',
    sensed: true,
    items: [],
  },
  701800121: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800122: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800123: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800124: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800125: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800126: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800127: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800128: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800129: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800130: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800131: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800132: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800133: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800134: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800135: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800136: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800137: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER CTL FAULT',
    sensed: true,
    items: [],
  },
  701800138: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER CTL FAULT',
    sensed: true,
    items: [],
  },
  701800139: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER ENERGIZED',
    sensed: true,
    items: [],
  },
  701800140: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER ENERGIZED',
    sensed: true,
    items: [],
  },
  701800141: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER FAULT',
    sensed: true,
    items: [],
  },
  701800142: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER FAULT',
    sensed: true,
    items: [],
  },
  701800143: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER INHIBITED',
    sensed: true,
    items: [],
  },
  701800144: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER INHIBITED',
    sensed: true,
    items: [],
  },
  701800145: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REV LOCKED',
    sensed: true,
    items: [],
  },
  701800146: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REV LOCKED',
    sensed: true,
    items: [],
  },
  701800147: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800148: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800149: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER UNLOCKED',
    sensed: true,
    items: [],
  },
  701800150: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER UNLOCKED',
    sensed: true,
    items: [],
  },
  701800151: {
    title: '\x1b<4m\x1b4mENG\x1bm ALL ENG FLAME OUT',
    sensed: true,
    items: [],
  },
  701800152: {
    title: '\x1b<4m\x1b4mENG\x1bm HI VIBRATIONS',
    sensed: true,
    items: [],
  },
  701800153: {
    title: '\x1b<4m\x1b4mENG\x1bm RELIGHT IN FLIGHT',
    sensed: true,
    items: [],
  },
  701800154: {
    title: '\x1b<4m\x1b4mENG\x1bm REVERSER SELECTED',
    sensed: true,
    items: [],
  },
  701800155: {
    title: '\x1b<4m\x1b4mENG\x1bm T.O THRUST DISAGREE',
    sensed: true,
    items: [],
  },
  701800156: {
    title: '\x1b<4m\x1b4mENG\x1bm TAIL PIPE FIRE',
    sensed: true,
    items: [],
  },
  701800157: {
    title: '\x1b<4m\x1b4mENG\x1bm THR LEVERS NOT SET',
    sensed: true,
    items: [],
  },
  701800158: {
    title: '\x1b<4m\x1b4mENG\x1bm THRUST LOCKED',
    sensed: true,
    items: [],
  },
  701800159: {
    title: '\x1b<4m\x1b4mENG\x1bm TWO ENG OUT ON SAME SIDE',
    sensed: true,
    items: [],
  },
  701800160: {
    title: '\x1b<4m\x1b4mENG\x1bm TWO ENG OUT ON OPPOSITE SIDE',
    sensed: true,
    items: [],
  },
  701800161: {
    title: '\x1b<4m\x1b4mENG\x1bm TYPE DISAGREE',
    sensed: true,
    items: [],
  },
};
