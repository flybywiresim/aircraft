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
export const EcamAbnormalSensedAta24: { [n: number]: AbnormalProcedure } = {
  // ATA 24
  240800001: {
    title: '\x1b<4m\x1b4mELEC\x1bm ABNORMAL FLIGHT OPS SUPPLY',
    sensed: true,
    items: [],
  },
  240800002: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 1 FAULT',
    sensed: true,
    items: [
      {
        // on ground
        name: 'LAST ENG SHUTDOWN : ENG 4',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800003: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 1+2 & DC BUS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
      {
        name: 'AP : SIDESTICK LOCKING DEVICE NOT AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      // Next two only if PRIM 2 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
    ],
  },
  240800004: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 1+2',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },

      // if reset not successful
      {
        name: 'COMMERCIAL 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GEN 1+2',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg

      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENG SHUTDOWN :',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: false,
        labelNotCompleted: 'OFF',
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800005: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 2+3 & DC BUS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'USE VHF 1',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'AVOID ICING CONDs',
        sensed: false,
      },
      {
        name: 'FOR SD : SELECT "MAILBOX" ON CAPT KCCU',
        sensed: false,
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },

      {
        name: 'TRIM TK NOT USABLE', // If trim tank fuel is not usable for engine feed and for CG management
        sensed: false,
      },
      /*
      If trim tank fuel is not usable for engine feed, but the flight crew can manually transfer
      the trim tank fuel for CG management
      */
      {
        name: 'TRIM TK NOT USABLE FOR ENG SUPPLY',
        sensed: false,
      },
      {
        name: 'OIS ON BAT',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FEED TK 4 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },

      // If flight time above FL 300 since departure is less than 30 min
      {
        name: 'DESCENT TO FL 50/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 50/MEA-MORA',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 50/MEA-MORA:',
        sensed: false,
      },
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },
      // If flight time above FL 300 since departure is greater than 30 min:
      {
        name: 'DESCENT TO FL 280',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 280',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 280:',
        sensed: false,
      },
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },
      // If L/G is not down and locked:
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      // If L/G is down and locked
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
      // If fuel quantity in feed tanks 1 and 4 is below 19 000 kg
      {
        name: 'OUTR TKs PMPs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IF SEVERE ICE ACCRETION : FLAP LEVER 3 FOR LDG',
        sensed: false,
      },
      // if soft ga lost
      {
        name: 'GA THR : TOGA ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },

      // After landing, below 80 kt with at least one engine running:
      {
        name: 'BEFORE OPENING ANY CABIN DOOR:',
        sensed: false,
      },
      {
        name: 'RESIDUAL DIFF PRESS',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
      },
    ],
  },
  240800006: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 2+4 FAULT',
    sensed: true,
    items: [
      // after landing
      {
        name: 'LAST ENG SHUTDOWN : ENG 1',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'A/THR',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // in flight
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },

      {
        name: 'TRIM TK NOT USABLE', // If trim tank fuel is not usable for engine feed and for CG management
        sensed: false,
      },
      /*
      If trim tank fuel is not usable for engine feed, but the flight crew can manually transfer
      the trim tank fuel for CG management
      */
      {
        name: 'TRIM TK NOT USABLE FOR ENG SUPPLY',
        sensed: false,
      },

      {
        name: 'USE TRIM TK XFR FOR CG IF NECESSARY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FEED TK 1: 1300 KG MAX NOT USABLE',
        sensed: false,
      },
      {
        name: 'FEED TK 4 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },
      // If flight time above FL 300 since departure is less than 30 min
      {
        name: 'DESCENT TO FL 50/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 50/MEA-MORA',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 50/MEA-MORA:',
        sensed: false,
      },
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },

      // If flight time above FL 300 since departure is greater than 30 min:
      {
        name: 'DESCENT TO FL 280',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 280',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 280:',
        sensed: false,
      },
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },

      // if soft ga lost
      {
        name: 'GA THR : TOGA ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },

      // If fuel quantity in feed tanks 1 and 4 is below 19 000 kg
      {
        name: 'OUTR TKs PMPs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
      },
    ],
  },
  240800007: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 3 FAULT',
    sensed: true,
    items: [
      //if three generators are failed and generator 4 is not available:
      {
        name: 'GEN 3+4',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // IF RESET NOT SUCCESSFUL :
      {
        name: 'IF RESET NOT SUCCESFUL',
        sensed: false,
      },
      {
        name: 'COMMERCIAL 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GEN 3+4',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // If three generators are failed and generator 4 is available:
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // If the main pump of the feed tank 2 is inoperative
      {
        name: 'CROSSFEED 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // If the standby pump of the feed tank 3 is inoperative:
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // on the ground
      {
        name: 'BEFORE OPENING ANY CABIN DOOR:',
        sensed: false,
      },
      {
        name: 'RESIDUAL DIFF PRESS',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
      },
    ],
  },
  240800008: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 3+4 & DC BUS 2 FAULT',
    sensed: true,
    items: [
      // in flight
      {
        name: 'VENT AVNCS EXTRACT',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'F/O BARO REF : STD ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'USE VHF 1 OR 3',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'DU RECONF PB AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'F/O KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },

      // Next two only if PRIM 3 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },

      // After landing, below 80 kt with at least one engine running:
      {
        name: 'BEFORE OPENING ANY CABIN DOOR:',
        sensed: false,
      },
      {
        name: 'RESIDUAL DIFF PRESS',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
      },
    ],
  },
  240800009: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 4 FAULT',
    sensed: true,
    items: [
      {
        name: 'LAST ENG SHUTDOWN : ENG 1',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'VENT AVNCS EXTRACT', // in flight
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },

      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  240800010: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC EMER BUS FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: false,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'XPDR & TCAS',
        sensed: false,
        labelNotCompleted: 'SYS 2 ',
      },
      // after landing
      {
        name: 'BEFORE LAST ENGINE SHUTDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800011: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC ESS BUS ALTN',
    sensed: true,
    items: [],
  },
  240800012: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC ESS BUS FAULT',
    sensed: true,
    items: [
      {
        name: 'AC ESS FEED',
        sensed: true,
        labelNotCompleted: 'ALTN',
      },
      {
        name: 'IF NOT SUCCESSFUL',
        sensed: false,
      },

      {
        name: 'AIR DATA SWTG',
        sensed: false,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'SYS 2 ',
      },
      {
        name: 'XPDR & TCAS',
        sensed: false,
        labelNotCompleted: 'SYS 2 ',
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },

      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENGINE SHUTDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800013: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU BAT FAULT',
    sensed: true,
    items: [
      {
        name: 'APU BAT', // If the temperature of the battery is excessive
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800014: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU GEN A FAULT',
    sensed: true,
    items: [
      {
        name: 'APU GEN A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800015: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU GEN B FAULT',
    sensed: true,
    items: [
      {
        name: 'APU GEN B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800016: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU TR FAULT',
    sensed: true,
    items: [
      // If the APU is off, and the APU battery is on
      {
        name: 'WHEN APU NOT RQRD:',
        sensed: false,
      },
      {
        name: 'APU BAT',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  240800017: {
    title: '\x1b<4m\x1b4mELEC\x1bm BAT 1 (ESS) FAULT',
    sensed: true,
    items: [
      // If the temperature of the battery is excessive
      {
        name: 'BAT 1(ESS)',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800018: {
    title: '\x1b<4m\x1b4mELEC\x1bm BAT 2 (ESS) FAULT',
    sensed: true,
    items: [
      // If the temperature of the battery is excessive
      {
        name: 'BAT 2(ESS)',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800019: {
    title: '\x1b<4m\x1b4mELEC\x1bm BUS TIE OFF',
    sensed: true,
    items: [],
  },
  240800020: {
    title: '\x1b<4m\x1b4mELEC\x1bm C/B MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800021: {
    title: '\x1b<4m\x1b4mELEC\x1bm C/B TRIPPED',
    sensed: true,
    items: [],
  },
  240800022: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN L SUPPLY CENTER OVHT',
    sensed: true,
    items: [
      {
        name: 'COMMERCIAL 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800023: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN R SUPPLY CENTER OVHT',
    sensed: true,
    items: [
      {
        name: 'COMMERCIAL 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800024: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN L SUPPLY CENTER OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  240800025: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN R SUPPLY CENTER OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  240800026: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 1 FAULT',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'AP: SIDESTICK LOCKING DEVICE NOT AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },

      // Next two only if PRIM 2 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENGINE SHUTDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800027: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 1 +2 FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: false,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'USE VHF1',
        sensed: false,
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'AVOID ICING CONDs',
        sensed: false,
      },
      {
        name: 'FOR SD : SELECT "MAILBOX" ON CAPT KCCU',
        sensed: false,
      },
      {
        name: 'OIS ON BAT',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },

      {
        name: 'TRIM TK NOT USABLE', // If trim tank fuel is not usable for engine feed and for CG management
        sensed: false,
      },
      /*
      If trim tank fuel is not usable for engine feed, but the flight crew can manually transfer
      the trim tank fuel for CG management
      */
      {
        name: 'TRIM TK NOT USABLE FOR ENG SUPPLY',
        sensed: false,
      },

      {
        name: 'USE TRIM TK XFR FOR CG IF NECESSARY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },

      // If L/G is not down and locked:
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      // If L/G is down and locked
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IF SEVERE ICE ACCRETION : FLAP LEVER 3 FOR LDG',
        sensed: false,
      },
      // if soft ga lost
      {
        name: 'GA THR : TOGA ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  240800028: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 1+ESS FAULT',
    recommendation: 'LAND ANSA',
    sensed: true,
    items: [
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'NO VOICE COM AVAIL',
        sensed: false,
      },
      {
        name: 'SATCOM DATALINK AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'F/O HEADSETS',
        sensed: true,
        labelNotCompleted: 'ON (FOR AUDIO ALERTS)',
      },
      {
        name: 'SQUAWK AVAIL ON MFD SURV PAGE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'ECP KEYS NOT AVAIL :',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'SYSTEMS, MORE, TO CONFIG, RCL LAST',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FOR SYS PAGES : "ALL" AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'OUTR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'TRIM TK NOT USABLE',
        sensed: false,
      },
      {
        name: 'FUEL QTY : 2000 KG NOT USABLE',
        sensed: false,
      },
      {
        name: 'FOB & GW COMPUTED FROM FU',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: ' LDG DIST AFFECTED',
        sensed: false,
      },
    ],
  },
  240800029: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 2 FAULT',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'F/O BARO REF : STD ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'USE VHF 1 OR 3',
        sensed: false,
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'F/O KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },

      // Next two only if PRIM 3 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  240800030: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC ESS BUS FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'CAPT BARO REF : STD ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'HEADSETS',
        sensed: false,
        labelNotCompleted: 'ON',
      },
      {
        name: 'USE RMP 3',
        sensed: false,
      },
      {
        name: 'USE VHF 2 OR 3',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'SQUAWK AVAIL ON MFD SURV PAGE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'CAPT KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'ECP KEYS NOT AVAIL :',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'SYSTEMS, MORE, TO CONFIG, RCL LAST',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FOR SYS PAGES : "ALL" AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENG SHUTDOWN :',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        labelNotCompleted: 'OFF',
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800031: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC ESS BUS PART FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'HEADSETS',
        sensed: false,
        labelNotCompleted: 'ON',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'CAPT KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },

      {
        name: 'ECP KEYS NOT AVAIL :',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'SYSTEMS, MORE, TO CONFIG, RCL LAST',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FOR SYS PAGES : "ALL" AVAIL',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENG SHUTDOWN :',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        labelNotCompleted: 'OFF',
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  240800032: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800033: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800034: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800035: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800036: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800037: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800038: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800039: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800040: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800041: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800042: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800043: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800044: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 1',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800045: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 2',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800046: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 3',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800047: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 4',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800048: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 1',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800049: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 2',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800050: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 3',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800051: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 4',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800052: {
    title: '\x1b<4m\x1b4mELEC\x1bm ELEC NETWORK MANAGEMENT 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 1+2 : KEEP ON',
        sensed: false,
      },
    ],
  },
  240800053: {
    title: '\x1b<4m\x1b4mELEC\x1bm ELEC NETWORK MANAGEMENT 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 3+4 : KEEP ON',
        sensed: false,
      },
    ],
  },
  240800054: {
    title: '\x1b<4m\x1b4mELEC\x1bm EMER C/B MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800055: {
    title: '\x1b<2m\x1b4mELEC\x1bm EMER CONFIG',
    sensed: true,
    recommendation: 'LAND ASAP',
    items: [
      {
        name: 'RAT MAN ON',
        sensed: true,
        labelNotCompleted: 'PRESS',
      },
      {
        name: ' MIN RAT SPEED : 140 KT',
        sensed: false,
      },
      // if the flight crew did not activate the FIRE SMOKE/FUMES alert
      {
        name: 'ALL GENs',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      {
        name: 'IF NOT SUCCESFUL',
        sensed: false,
      },
      {
        name: 'BUS TIE',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ALL GENs',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // end of condition
      {
        name: 'USE VHF1 OR HF1',
        sensed: false,
      },
      {
        name: 'A/THR',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'VENT AVNCS EXTRACT',
        sensed: true,
        labelNotCompleted: 'OVRD',
      },

      // If the alert triggers at or below FL 230:

      // if the maximum flight level is not restricted below FL 200 by an other alert
      {
        name: 'DESCENT TO FL 200/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 200/MEA-MORA',
        sensed: false,
      },

      // If the flight crew did not activate the FIRE SMOKE/FUMES alert:
      {
        name: 'WHEN BELOW FL 200 : APU',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
      // end of fl230 condition
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      {
        name: 'AVOID ICING CONDs',
        sensed: false,
      },
      {
        name: 'FOR SD : SELECT "MAILBOX" ON CAPT KCCU',
        sensed: false,
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'FEED TK 1 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },
      {
        name: 'FEED TK 4 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },

      //  If the alert triggers above FL 230 or the altitude is not valid:

      // If the maximum flight level is not restricted below FL 200 by an other alert:
      {
        name: 'DESCENT TO FL 200/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 200/MEA-MORA',
        sensed: false,
      },

      // If the flight crew did not activate the FIRE SMOKE/FUMES alert:
      {
        name: 'WHEN BELOW FL 200 : APU',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
      // end of fl230 condition

      /*
      If the maximum flight level is restricted below FL 200 by an other alert, and the flight
    crew did not activate FIRE SMOKE/FUMES alert:
      */
      {
        name: 'APU',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'IF SEVERE ICE ACCRETION: FLAP LEVER 3 FOR LDG',
        sensed: false,
      },
      {
        name: 'LDG PERF AFFECTED',
        sensed: false,
      },

      // When the fuel quantity in feed tanks 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: false,
        labelNotCompleted: 'ON',
      },
    ],
  },
  240800056: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 1',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800057: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 2',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800058: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 3',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800059: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 4 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 4',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800060: {
    title: '\x1b<4m\x1b4mELEC\x1bm  F/CTL ACTUATOR PWR SUPPLY FAULT',
    sensed: true,
    items: [],
  },
  240800061: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800062: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800063: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800064: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 4 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800065: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 1 OFF',
    sensed: true,
    items: [],
  },
  240800066: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 2 OFF',
    sensed: true,
    items: [],
  },
  240800067: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 3 OFF',
    sensed: true,
    items: [],
  },
  240800068: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 4 OFF',
    sensed: true,
    items: [],
  },
  240800069: {
    title: '\x1b<4m\x1b4mELEC\x1bm LOAD MANAGEMENT FAULT',
    sensed: true,
    items: [
      {
        name: 'ELMU',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800070: {
    title: '\x1b<4m\x1b4mELEC\x1bm PRIMARY SUPPLY CENTER 1 FAULT',
    sensed: true,
    items: [],
  },
  240800071: {
    title: '\x1b<4m\x1b4mELEC\x1bm PRIMARY SUPPLY CENTER 2 FAULT',
    sensed: true,
    items: [],
  },
  240800072: {
    title: '\x1b<4m\x1b4mELEC\x1bm RAT FAULT',
    sensed: true,
    items: [],
  },
  240800073: {
    title: '\x1b<4m\x1b4mELEC\x1bm REMOTE C/B CTL ACTIVE',
    sensed: true,
    items: [
      {
        name: 'REMOTE C/B CTL',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800074: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 1 DEGRADED',
    sensed: true,
    items: [],
  },
  240800075: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 2 DEGRADED',
    sensed: true,
    items: [],
  },
  240800076: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 1 FAULT',
    sensed: true,
    items: [],
  },
  240800077: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 2 FAULT',
    sensed: true,
    items: [],
  },
  240800078: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 1 REDUND LOST',
    sensed: true,
    items: [],
  },
  240800079: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 2 REDUND LOST',
    sensed: true,
    items: [],
  },
  240800080: {
    title: '\x1b<4m\x1b4mELEC\x1bm STATIC INV FAULT',
    sensed: true,
    items: [],
  },
  240800081: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 1 FAULT',
    sensed: true,
    items: [],
  },
  240800082: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 2 FAULT',
    sensed: true,
    items: [],
  },
  240800083: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR ESS FAULT',
    sensed: true,
    items: [],
  },
  240800084: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 1 MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800085: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 2 MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800086: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR ESS MONITORING FAULT',
    sensed: true,
    items: [],
  },
};
