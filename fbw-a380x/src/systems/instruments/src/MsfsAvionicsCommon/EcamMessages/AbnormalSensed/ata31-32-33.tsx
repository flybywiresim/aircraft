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
export const EcamAbnormalSensedAta313233: { [n: number]: AbnormalProcedure } = {
  // ATA 31: CDS
  311800001: {
    title: '\x1b<4m\x1b4mCDS & AUTO FLT\x1bm FCU SWITCHED OFF',
    sensed: true,
    items: [],
  },
  311800002: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT EFIS BKUP CTL FAULT',
    sensed: true,
    items: [],
  },
  311800003: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O EFIS BKUP CTL FAULT',
    sensed: true,
    items: [],
  },
  311800004: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT EFIS CTL PNL FAULT',
    sensed: true,
    items: [],
  },
  311800005: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O EFIS CTL PNL FAULT',
    sensed: true,
    items: [],
  },
  311800006: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT+F/O EFIS CTL PNLs FAULT',
    sensed: true,
    items: [],
  },
  311800007: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT PFD DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800008: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT ND DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800009: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT EWD DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800010: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT F/O PFD DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800011: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT F/O ND DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800012: {
    title: '\x1b<4m\x1b4mCDS\x1bm DISPLAY DISAGREE',
    sensed: true,
    items: [],
  },
  313800001: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT CURSOR CTL FAULT',
    sensed: true,
    items: [],
  },
  313800002: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O CURSOR CTL FAULT',
    sensed: true,
    items: [],
  },
  313800003: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT CURSOR CTL+KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800004: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O CURSOR CTL+KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800005: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800006: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800007: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT MAILBOX ACCESS FAULT',
    sensed: true,
    items: [],
  },
  314800001: {
    title: '\x1b<4m\x1b4mFWS\x1bm AIRLINE CUSTOMIZATION REJECTED',
    sensed: true,
    items: [],
  },
  314800002: {
    title: '\x1b<4m\x1b4mCDS\x1bm FWS 1+2 & CPIOM FAULT',
    sensed: true,
    items: [],
  },
  314800003: {
    title: '\x1b<4m\x1b4mCDS\x1bm FWS 1+2 & FCDC 1+2 FAULT',
    sensed: true,
    items: [],
  },
  314800004: {
    title: '\x1b<4m\x1b4mFWS\x1bm FWS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  314800005: {
    title: '\x1b<4m\x1b4mFWS\x1bm ATQC DATABASE REJECTED',
    sensed: true,
    items: [],
  },
  314800006: {
    title: '\x1b<4m\x1b4mFWS\x1bm AUDIO FUNCTION LOSS',
    sensed: true,
    items: [],
  },
  314800007: {
    title: '\x1b<4m\x1b4mFWS\x1bm ECP FAULT',
    sensed: true,
    items: [],
  },
  314800008: {
    title: '\x1b<4m\x1b4mFWS\x1bm FWS 1 FAULT',
    sensed: true,
    items: [],
  },
  314800009: {
    title: '\x1b<4m\x1b4mFWS\x1bm FWS 2 FAULT',
    sensed: true,
    items: [],
  },
  316800001: {
    title: '\x1b<4m\x1b4mNAV\x1bm HUD FAULT',
    sensed: true,
    items: [],
  },
  316800002: {
    title: '\x1b<4m\x1b4mNAV\x1bm HUD FPV DISAGREE',
    sensed: true,
    items: [],
  },
  318800001: {
    title: '\x1b<4m\x1b4mVIDEO\x1bm MULTIPLEXER FAULT',
    sensed: true,
    items: [],
  },
  319800001: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm ACCELMTR FAULT',
    sensed: true,
    items: [],
  },
  319800002: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm CVR FAULT',
    sensed: true,
    items: [],
  },
  319800003: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm DFDR FAULT',
    sensed: true,
    items: [],
  },
  319800004: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm SYS FAULT',
    sensed: true,
    items: [],
  },
  334800101: {
    title: '\x1b<4m\x1b4mCABIN\x1bm EMER EXIT LT FAULT',
    sensed: true,
    items: [],
  },
  // 32 Landing gear
  320800001: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON ALL L/G',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800002: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON L + R BODY L/G',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800003: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON LEFT BODY L/G',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800004: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON RIGHT BODY L/G',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800005: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON WING + L BODY L/Gs',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800006: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON WING + R BODY L/Gs',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800007: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID FAULT ON WING L/Gs',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800008: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm A-SKID OFF',
    sensed: true,
    items: [
      {
        name: 'DELAY BRAKING UNTIL NLG TOUCHDOWN',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
        style: ChecklistLineStyle.Cyan,
      },
    ],
  },
  320800009: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm ACCU PRESS LO',
    sensed: true,
    items: [
      // If the alert is triggered before engine start or after the last engine shutdown:
      {
        name: 'ACCUS REINFLATE',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CHOCKS',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // If the alert   is triggered after landing and before the last engine shutdown:
      {
        name: 'BEFORE ENGINE SHUTDOWN:',
        sensed: false,
      },
      {
        name: 'CHOCKS',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  320800010: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm ALTN + EMER BRK FAULT',
    sensed: true,
    items: [
      // Only in cruise or after landing
      {
        name: 'NO LOSS IN BRK EFFICIENCY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800011: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm ALTN BRK FAULT',
    sensed: true,
    items: [
      // In cruise or after landing, and if the normal braking is failed on another wheel group:
      {
        name: 'NO LOSS IN BRK EFFICIENCY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800012: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm ALTN BRK PRESS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  320800013: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm AUTO BRK FAULT',
    sensed: true,
    items: [],
  },
  320800014: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm BTV FAULT',
    sensed: true,
    items: [],
  },
  320800015: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  320800016: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  320800017: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm EMER BRK FAULT',
    sensed: true,
    items: [
      // In cruise or after landing, if braking is not affected:
      {
        name: 'NO LOSS IN BRK EFFICIENCY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800018: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm HOT',
    sensed: true,
    items: [
      // Before engine start or after landing
      {
        name: 'PARK BRK',
        sensed: false,
        labelNotCompleted: 'PREFER CHOCKS',
      },
      // on ground
      {
        name: 'DELAY T.O FOR COOLG',
        sensed: false,
      },
      // in flight
      {
        name: 'IF PERF PERMIT:',
        sensed: false,
      },
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },
      {
        name: 'L/G',
        sensed: false,
        labelNotCompleted: 'DOWN FOR COOLG',
      },
    ],
  },
  320800019: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm MINOR FAULT',
    sensed: true,
    items: [],
  },
  320800020: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm NORM BRK FAULT',
    sensed: true,
    items: [
      // On ground, after first engine start, and if alternate braking is failed on a wheel group with
      // normal braking still available on the same wheel group:
      {
        name: 'NO LOSS IN BRK EFFICIENCY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800021: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm NORM BRK PRESS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  320800022: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm PARK BRK ON',
    sensed: true,
    items: [
      {
        name: 'PARK BRK',
        sensed: true,
        labelNotCompleted: 'OFF ',
      },
    ],
  },
  320800023: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm PARK BRK PRESS LO',
    sensed: true,
    items: [
      // Before engine start, or after engine shutdown
      {
        name: 'ACCUS REINFLATE',
        sensed: true,
        labelNotCompleted: 'ON ',
      },
      {
        name: 'CHOCKS',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // If the alert   is triggered after landing and before the last engine shutdown:
      {
        name: 'BEFORE ENGINE SHUTDOWN:',
        sensed: false,
      },
      {
        name: 'CHOCKS',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  320800024: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm PEDAL BRAKING FAULT',
    sensed: true,
    items: [
      {
        name: 'PARK BRK ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
    ],
  },
  320800025: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm RELEASED',
    sensed: true,
    items: [
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
    ],
  },
  320800026: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm RESIDUAL BRAKING',
    sensed: true,
    items: [
      {
        name: 'ON BRK (1/2)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (3/4)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (5/6)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (7/8)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (9/10)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (11/12)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (13/14)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        name: 'ON BRK (15/16)',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
    ],
  },
  320800027: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm SEL VLV JAMMED OPEN',
    sensed: true,
    items: [],
  },
  320800028: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm SYS REDUNDANCY LOST',
    sensed: true,
    items: [
      {
        // If one or more RDC channels B are lost:
        name: 'SYS B REDUNDANCY LOST',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        // If RDC channel 3A is lost:
        name: 'SYS A REDUNDANCY LOST ON L BODY',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        // If RDC channel 2A is lost
        name: 'SYS A REDUNDANCY LOST ON R BODY ',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        // If RDC channel (2A+3A) is lost:
        name: 'SYS B REDUNDANCY LOST ON L + R BODY',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
      {
        // If RDC channel 1A is lost:
        name: 'SYS A REDUNDANCY LOST ON WING',
        sensed: true,
        style: ChecklistLineStyle.Amber,
      },
    ],
  },
  320800029: {
    title: '\x1b<4m\x1b4mBRAKES\x1bm SYS SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  320800030: {
    title: '\x1b<2m\x1b4mCONFIG\x1bm PARK BRK ON',
    sensed: true,
    items: [],
  },
  320800031: {
    title: '\x1b<4m\x1b4mL/G\x1bm ABNORM OLEO PRESS',
    sensed: true,
    items: [],
  },
  320800032: {
    title: '\x1b<4m\x1b4mL/G\x1bm BOGIE POSITION FAULT',
    sensed: true,
    items: [
      // If one engine is running and all L/Gs are already locked down when the alert is activated
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
    ],
  },
  320800033: {
    title: '\x1b<4m\x1b4mL/G\x1bm CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  320800034: {
    title: '\x1b<4m\x1b4mL/G\x1bm CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  320800035: {
    title: '\x1b<4m\x1b4mL/G\x1bm CTL 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: '[MFD SURV] GPWS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // If one engine is running and if all L/Gs are already locked down when the alert is activated
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
    ],
  },
  320800036: {
    title: '\x1b<4m\x1b4mL/G\x1bm DOORS NOT CLOSED',
    sensed: true,
    items: [
      // If a BLG outer door is displayed as open due to its center door not folded:
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
      // in flight
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },

      // If at least one L/G door is not closed, except if a BLG outer door is displayed as opend ue to its center door not folded:

      // In flight, if the speed is below 250 kt or M 0.55 when the alert is triggered:
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },
      {
        name: 'L/G',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
      // In flight, if the speed is above 250 kt or M 0.55 when the alert is triggered:
      {
        name: 'SPEED',
        sensed: false,
        labelNotCompleted: 'REDUCE BELOW 250/.55',
      },
      {
        name: 'L/G',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },
      // In flight, IF ALERT PERSISTS & L/G RETRACTN RQRD
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'DOWN',
      },
      {
        name: 'WITHIN 10 S AFTER WING L/G LOCKED DOWN:',
        sensed: false,
      },
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'UP',
      },

      //if at eleast one engine running
      {
        name: 'FUEL CONSUMPT INCREASD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800037: {
    title: '\x1b<2m\x1b4mL/G\x1bm GEAR NOT DOWN',
    sensed: true,
    items: [],
  },
  320800038: {
    title: '\x1b<2m\x1b4mL/G\x1bm GEAR NOT DOWN',
    sensed: true,
    items: [],
  },
  320800039: {
    title: '\x1b<2m\x1b4mL/G\x1bm GEAR NOT LOCKED DOWN',
    sensed: true,
    items: [
      {
        name: 'L/G (AFTER 60 S)', // timer should coutndown..
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },

      // IF L/G STILL NOT DOWN AFTER 120 S
      {
        name: 'FOR L/G GRVTY EXTN : MAX SPEED 220 KT',
        sensed: false,
      },
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'UP',
      },
      {
        name: 'L/G GRVTY',
        sensed: true,
        labelNotCompleted: 'DOWN',
      },

      // WHEN L/G LOCKED DOWN OR AFTER 120 S
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'DOWN',
      },
      // if not succesfull
      {
        name: 'LDG WITH ABNORM L/G PROC',
        sensed: false,
        labelNotCompleted: 'APPLY',
      },
    ],
  },
  320800040: {
    title: '\x1b<4m\x1b4mL/G\x1bm GEAR NOT LOCKED UP',
    sensed: true,
    items: [
      // If any landing gear door is not closed:

      {
        // If speed is above 250 kt/M .55:
        name: 'SPEED',
        sensed: false,
        labelNotCompleted: 'REDUCE BELOW 250/.55',
      },
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
      // if not succesfull
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'DOWN',
      },
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },

      {
        name: 'FUEL CONSUMPT INCREASD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },

      // if all doors are closed
      {
        name: 'AVOID EXCESS G LOAD',
        sensed: false,
      },
    ],
  },
  320800041: {
    title: '\x1b<4m\x1b4mL/G\x1bm GEAR UPLOCK FAULT',
    sensed: true,
    items: [
      {
        // If one engine is running and all L/Gs are already locked down when the alert is activated
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
    ],
  },
  320800042: {
    title: '\x1b<4m\x1b4mL/G\x1bm GRVTY EXTN FAULT',
    sensed: true,
    items: [],
  },
  320800043: {
    title: '\x1b<4m\x1b4mL/G\x1bm OLEO PRESS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  320800044: {
    title: '\x1b<4m\x1b4mL/G\x1bm RETRACTION FAULT',
    sensed: true,
    items: [
      // If in flight

      //If the body wheel steering is not locked:
      //If speed is below 250 kt or M 0.55:

      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },
      {
        name: 'L/G: KEEP DOWN',
        sensed: false,
      },

      //If speed is above 250 kt or M 0.55:
      {
        name: 'L/G: KEEP DOWN',
        sensed: false,
      },

      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },

      // In all other cases:
      // If speed is below 250 kt or M 0.55:
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },
      {
        name: 'L/G',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },

      // if not succesfull
      {
        name: 'L/G : KEEP DOWN',
        sensed: false,
      },

      // If speed is above 250 kt or M 0.55:

      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },
      {
        name: 'L/G',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
      // IF NOT SUCCESSFUL
      {
        name: 'L/G : KEEP DOWN',
        sensed: false,
      },
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
      },

      // if at least one engine is running
      {
        name: 'FUEL CONSUMPT INCREASD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800045: {
    title: '\x1b<4m\x1b4mL/G\x1bm SYSTEM DISAGREE',
    sensed: true,
    items: [],
  },
  320800046: {
    title: '\x1b<4m\x1b4mL/G\x1bm WEIGHT ON WHEELS FAULT',
    sensed: true,
    items: [],
  },
  320800047: {
    title: '\x1b<4m\x1b4mSTEER\x1bm ALTN N/W STEER FAULT',
    sensed: true,
    items: [],
  },
  320800048: {
    title: '\x1b<4m\x1b4mSTEER\x1bm ALTN STEER SYS HOT',
    sensed: true,
    items: [
      {
        name: 'EXPECT N/W STEER LOSS',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800049: {
    title: '\x1b<4m\x1b4mSTEER\x1bm B/W STEER FAULT',
    sensed: true,
    items: [
      {
        name: 'EXPECT N/W STEER LOSS',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800050: {
    title: '\x1b<4m\x1b4mSTEER\x1bm B/W STEER FAULT',
    sensed: true,
    items: [
      {
        name: 'B/W STEER NOT CENTERED',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      // If all L/G are already locked down when the alert is activated, and at least one engine isrunning:

      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
    ],
  },
  320800051: {
    title: '\x1b<4m\x1b4mSTEER\x1bm CAPT STEER TILLER FAULT',
    sensed: true,
    items: [],
  },
  320800052: {
    title: '\x1b<4m\x1b4mSTEER\x1bm FO STEER TILLER FAULT',
    sensed: true,
    items: [],
  },
  320800053: {
    title: '\x1b<4m\x1b4mSTEER\x1bm CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  320800054: {
    title: '\x1b<4m\x1b4mSTEER\x1bm CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  320800055: {
    title: '\x1b<4m\x1b4mSTEER\x1bm N/W + B/W STEER FAULT',
    sensed: true,
    items: [],
  },
  320800056: {
    title: '\x1b<4m\x1b4mSTEER\x1bm N/W STEER ANGLE LIMIT EXCEEDED',
    sensed: true,
    items: [
      {
        name: 'POTENTIAL DAMAGE TO NOSE L/G',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  320800057: {
    title: '\x1b<4m\x1b4mSTEER\x1bm N/W STEER DISC FAULT',
    sensed: true,
    items: [
      // on ground
      {
        name: 'N/W STEER POWERED',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FOR TOWING : ALL ENG MASTERS OFF',
        sensed: false,
      },
    ],
  },
  320800058: {
    title: '\x1b<4m\x1b4mSTEER\x1bm N/W STEER FAULT',
    sensed: true,
    items: [],
  },
  320800059: {
    title: '\x1b<4m\x1b4mSTEER\x1bm N/W STEER NOT DISC',
    sensed: true,
    items: [
      {
        name: 'N/W STEER POWERED',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'FOR TOWING : ALL ENG MASTERS OFF',
        sensed: false,
      },
    ],
  },
  320800060: {
    title: '\x1b<4m\x1b4mSTEER\x1bm NORM N/W STEER FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : STEER ENDURANCE LIMITED',
        sensed: false,
      },
    ],
  },
  320800061: {
    title: '\x1b<4m\x1b4mSTEER\x1bm PEDAL STEER CTL FAULT',
    sensed: true,
    items: [],
  },
  320800062: {
    title: '\x1b<4m\x1b4mSTEER\x1bm SEL VLV JAMMED OPEN',
    sensed: true,
    items: [
      {
        // If the normal or the alternate NW steering selector valves is stuck open
        name: 'N/W STEER POWERED',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        // If only the normal NW steering selector valve is stuck open
        name: 'FOR TOWING : ALL ENG MASTERS OFF',
        sensed: false,
      },
      {
        // If the alternate NW steering selector valve is stick open
        name: 'NO TOWING',
        sensed: false,
      },
    ],
  },
  320800063: {
    title: '\x1b<4m\x1b4mWHEEL\x1bm TIRE PRESS LO',
    sensed: true,
    items: [],
  },
};
