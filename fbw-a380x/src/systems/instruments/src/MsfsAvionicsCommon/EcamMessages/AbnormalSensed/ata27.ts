// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  AbnormalProcedure,
  ChecklistLineStyle,
  DeferredProcedure,
  DeferredProcedureType,
  FMS_PRED_UNRELIABLE_CHECKLIST_ITEM,
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
export const EcamAbnormalSensedAta27: { [n: number]: AbnormalProcedure } = {
  // ATA 27: F/CTL
  271800001: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm L SIDESTICK FAULT (BY TAKE-OVER)',
    sensed: true,
    items: [],
  },
  271800002: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm R SIDESTICK FAULT (BY TAKE-OVER)',
    sensed: true,
    items: [],
  },
  271800003: {
    title: '\x1b<2m\x1b4mCONFIG\x1bm PITCH TRIM NOT IN T.O RANGE',
    sensed: true,
    items: [],
  },
  271800004: {
    title: '\x1b<2m\x1b4mCONFIG\x1bm RUDDER TRIM NOT IN T.O RANGE',
    sensed: true,
    items: [],
  },
  271800005: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm SPD BRK NOT RETRACTED',
    sensed: true,
    items: [],
  },
  271800006: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm AILERON ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800007: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm AILERON ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800008: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm ALTN LAW (PROT LOST)',
    sensed: true,
    items: [
      {
        name: 'MAX SPEED: 310 KT',
        style: ChecklistLineStyle.Cyan,
        sensed: false,
      },
    ],
  },
  271800009: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm DIRECT LAW',
    sensed: true,
    items: [
      {
        name: 'MAX SPEED: 310/.86',
        style: ChecklistLineStyle.Cyan,
        sensed: false,
      },
      {
        name: 'MANEUVER WITH CARE',
        style: ChecklistLineStyle.Cyan,
        sensed: false,
      },
      {
        name: 'AFS CTL PNL KNOB AVAIL FOR BUG SETTING',
        style: ChecklistLineStyle.Green,
        sensed: false,
      },
      {
        name: 'F/CTL BKUP CTL ACTIVE',
        style: ChecklistLineStyle.Green,
        sensed: false,
      },
    ],
  },
  271800010: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm DOUBLE ELEVATOR FAULT',
    sensed: true,
    items: [],
  },
  271800011: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800012: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm ELEVATOR ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800013: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FCDC 1 FAULT',
    sensed: true,
    items: [],
  },
  271800014: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FCDC 2 FAULT',
    sensed: true,
    items: [],
  },
  271800015: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FCDC 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'AUDIOS NOT AVAIL :',
        style: ChecklistLineStyle.Green,
        sensed: false,
      },
      {
        name: `${'\xa0'.repeat(16)}WINDSHEAR, SPEED SPEED`,
        style: ChecklistLineStyle.Green,
        sensed: false,
      },
    ],
  },
  271800016: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm GND SPLRs FAULT',
    sensed: true,
    items: [],
  },
  271800017: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm GND SPLRs NOT ARMED',
    sensed: true,
    items: [],
  },
  271800018: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm TWO GYROMETERs FAULT',
    sensed: true,
    items: [],
  },
  271800019: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L INR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800020: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R INR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800021: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L MID AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800022: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R MID AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800023: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L OUTR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800024: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R OUTR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800025: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L SIDESTICK FAULT',
    sensed: true,
    items: [],
  },
  271800026: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R SIDESTICK FAULT',
    sensed: true,
    items: [],
  },
  271800027: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800028: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800029: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LOAD ALLEVIATION FAULT',
    sensed: true,
    items: [],
  },
  271800030: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PART SPLRs FAULT',
    sensed: true,
    items: [],
  },
  271800031: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm MOST SPLRs FAULT',
    sensed: true,
    items: [],
  },
  271800032: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PITCH TRIM/FMS/CG DISAGREE',
    sensed: true,
    items: [],
  },
  271800033: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800034: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800035: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800036: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 FAULT',
    sensed: true,
    items: [
      { name: 'FOR TAXI: FLAP LVR 1', sensed: false },
      { name: 'PRIM 1', sensed: true, labelNotCompleted: 'OFF THEN ON' },
      { name: 'NOT SUCCESSFUL', condition: true, sensed: true },
      { name: 'PRIM 1', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'SPD BRK: DO NOT USE', sensed: false },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
      {
        name: 'GA THR: TOGA ONLY',
        sensed: false,
      },
      {
        name: 'FOR LDG: USE DIFF BRAKING AS RQRD',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  271800037: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 FAULT',
    sensed: true,
    items: [
      { name: 'FOR TAXI: FLAP LVR 1', sensed: false },
      { name: 'PRIM 2', sensed: true, labelNotCompleted: 'OFF THEN ON' },
      { name: 'NOT SUCCESSFUL', condition: true, sensed: true },
      { name: 'PRIM 2', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'PRIM 2', sensed: true, labelNotCompleted: 'KEEP ON' },
      { name: 'SPD BRK: DO NOT USE', sensed: false },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
      {
        name: 'GA THR: TOGA ONLY',
        sensed: false,
      },
      {
        name: 'FOR LDG: USE DIFF BRAKING AS RQRD',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  271800038: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 FAULT',
    sensed: true,
    items: [
      { name: 'FOR TAXI: FLAP LVR 1', sensed: false },
      { name: 'PRIM 3', sensed: true, labelNotCompleted: 'OFF THEN ON' },
      { name: 'NOT SUCCESSFUL', condition: true, sensed: true },
      { name: 'PRIM 3', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'SPD BRK: DO NOT USE', sensed: false },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
      {
        name: 'GA THR: TOGA ONLY',
        sensed: false,
      },
      {
        name: 'FOR LDG: USE DIFF BRAKING AS RQRD',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  271800039: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800040: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800041: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800042: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800043: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800044: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800045: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM VERSIONS DISAGREE',
    sensed: true,
    items: [],
  },
  271800046: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC VERSIONS DISAGREE',
    sensed: true,
    items: [],
  },
  271800047: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIMs PIN PROG DISAGREE',
    sensed: true,
    items: [],
  },
  271800048: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800049: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800050: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL FAULT',
    sensed: true,
    items: [],
  },
  271800052: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800053: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PRESSURE SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800054: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM 1 FAULT',
    sensed: true,
    items: [],
  },
  271800055: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM 2 FAULT',
    sensed: true,
    items: [],
  },
  271800056: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM FAULT',
    sensed: true,
    items: [],
  },
  271800058: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 1 FAULT',
    sensed: true,
    items: [
      { name: 'FOR TAXI: FLAP LVR 1', sensed: false },
      { name: 'SEC 1', sensed: true, labelNotCompleted: 'OFF THEN ON' },
      { name: 'NOT SUCCESSFUL', condition: true, sensed: true },
      { name: 'SEC 1', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  271800059: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 2 FAULT',
    sensed: true,
    items: [
      { name: 'FOR TAXI: FLAP LVR 1', sensed: false },
      { name: 'SEC 2', sensed: true, labelNotCompleted: 'OFF THEN ON' },
      { name: 'NOT SUCCESSFUL', condition: true, sensed: true },
      { name: 'SEC 2', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'SEC 2', sensed: true, labelNotCompleted: 'KEEP ON', level: 1 },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  271800060: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 3 FAULT',
    sensed: true,
    items: [
      { name: 'FOR TAXI: FLAP LVR 1', sensed: false },
      { name: 'SEC 3', sensed: true, labelNotCompleted: 'OFF THEN ON' },
      { name: 'NOT SUCCESSFUL', condition: true, sensed: true },
      { name: 'SEC 3', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  271800061: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SINGLE ELEVATOR FAULT',
    sensed: true,
    items: [],
  },
  271800062: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SINGLE RUDDER FAULT',
    sensed: true,
    items: [
      {
        name: 'FUEL CONSUMPT INCRSD',
        style: ChecklistLineStyle.Cyan,
        sensed: false,
      },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
    ],
  },
  271800063: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs FAULT',
    sensed: true,
    items: [],
  },
  271800064: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPEED BRAKES POS/LEVER DISAGREE',
    sensed: true,
    items: [
      {
        name: 'SPEED BRAKES LEVER',
        sensed: true,
        labelNotCompleted: 'RETRACT',
      },
    ],
  },
  271800065: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPEED BRAKES STILL EXTENDED',
    sensed: true,
    items: [],
  },
  271800066: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm STABILIZER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800067: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm STABILIZER ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800068: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm STABILIZER FAULT',
    sensed: true,
    items: [],
  },
  271800069: {
    title: '\x1b<2mOVERSPEED',
    sensed: true,
    items: [
      {
        name: 'VMO/MMO',
        sensed: true,
        labelNotCompleted: '340/.89',
      },
      {
        name: 'VLE/MLE',
        sensed: true,
        labelNotCompleted: '250/.55',
      },
      {
        name: 'VFE', // CONF 1
        sensed: true,
        labelNotCompleted: '263',
      },
      {
        name: 'VFE', // CONF 1+F
        sensed: true,
        labelNotCompleted: '222',
      },
      {
        name: 'VFE', // CONF 2
        sensed: true,
        labelNotCompleted: '220',
      },
      {
        name: 'VFE', // CONF 3
        sensed: true,
        labelNotCompleted: '196',
      },
      {
        name: 'VFE', // CONF FULL
        sensed: true,
        labelNotCompleted: '182',
      },
    ],
  },
  271800070: {
    title: '\x1b<4m\x1b4mOVERSPEED\x1bm LOAD ANALYSIS REQUIRED',
    sensed: true,
    items: [],
  },
  // ATA 27: FLAPS/SLATS
  272800001: {
    title: '\x1b<2m\x1b4mCONFIG\x1bm SLATS NOT IN T.O CONFIG',
    sensed: true,
    items: [],
  },
  272800002: {
    title: '\x1b<2m\x1b4mCONFIG\x1bm FLAPS NOT IN T.O CONFIG',
    sensed: true,
    items: [],
  },
  272800003: {
    title: '\x1b<2m\x1b4mF/CTL\x1bm FLAPS LEVER NOT ZERO',
    sensed: true,
    items: [],
  },
  272800004: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  272800005: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  272800006: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'FLAPS SLOW',
        sensed: false,
      },
    ],
  },
  272800007: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'FLAPS SLOW',
        sensed: false,
      },
    ],
  },
  272800008: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR VFE : USE PFD',
        sensed: false,
      },
      {
        name: 'WHEN SPEED BELOW VFE',
        condition: true,
        sensed: false,
      },
      {
        name: 'FLAPS LEVER',
        labelNotCompleted: 'RECYCLE',
        sensed: false,
        level: 1,
      },
      {
        name: 'USE SELECTED SPEED',
        sensed: false,
      },
      {
        name: '[MFD SURV] TAWS FLAP MODE',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: '[MFD SURV] GPWS',
        labelNotCompleted: 'OFF',
        sensed: true,
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
      {
        name: 'FOR LDG : FLAP LVR 3',
        sensed: false,
      },
      {
        name: 'NO AUTOLAND',
        sensed: false,
      },
      {
        name: 'FOR GA : KEEP S/F CONF',
        sensed: false,
      },
      {
        name: 'LDG PERF AFFECTED',
        sensed: false,
      },
    ],
  },
  272800009: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP 1 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800010: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP 2 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800011: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT 1 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800012: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT 2 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800013: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER OUT OF DETENT',
    sensed: true,
    items: [],
  },
  272800014: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER SYS 1 FAULT',
    sensed: true,
    items: [],
  },
  272800015: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER SYS 2 FAULT',
    sensed: true,
    items: [],
  },
  272800016: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LOCKED',
    sensed: true,
    items: [],
  },
  272800019: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  272800020: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  272800021: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
    ],
  },
  272800022: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
    ],
  },
  272800023: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'SLATS 1',
        labelNotCompleted: 'RESET',
        sensed: false,
      },
      {
        name: 'FOR VFE : USE PFD',
        sensed: false,
      },
      {
        name: 'WHEN SPEED BELOW VFE',
        condition: true,
        sensed: false,
      },
      {
        name: 'FLAPS LEVER',
        labelNotCompleted: 'RECYCLE',
        sensed: false,
        level: 1,
      },
      {
        name: 'USE SELECTED SPEED',
        sensed: false,
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
      {
        name: 'FOR LDG : FLAP LVR 3',
        sensed: false,
      },
      {
        name: 'NO AUTOLAND',
        sensed: false,
      },
      {
        name: 'FOR GA : KEEP S/F CONF',
        sensed: false,
      },
      {
        name: 'LDG PERF AFFECTED',
        sensed: false,
      },
    ],
  },
  272800024: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLATS LOCKED',
    sensed: true,
    items: [],
  },
  272800025: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLATS TIP BRK TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800026: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLATS TIP BRK TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800027: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS TIP BRK TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800028: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm T.O FLAPS / FMS DISAGREE',
    sensed: true,
    items: [],
  },
  270900001: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL JAMMED',
    sensed: false,
    items: [
      { name: 'AP : KEEP ON', sensed: false },
      { name: 'MINIMIZE XWIND FOR LANDING', sensed: false, style: ChecklistLineStyle.Green },
      { name: 'AUTOLAND : RECOMMENDED', sensed: false, style: ChecklistLineStyle.Green },
      { name: 'AUTO BRK : DO NOT USE', sensed: false },
      { name: 'FOR LDG:USE DIFF BRAKING AS RQRD', sensed: false, style: ChecklistLineStyle.Green },
      { name: 'REVERSER:SYMMETRIC USE ONLY', sensed: false },
      { name: 'LDG DIST AFFECTED', sensed: false },
    ],
  },
  270900002: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM RUNAWAY',
    sensed: false,
    items: [
      { name: 'USE RUDDER WITH CARE', sensed: false },
      { name: 'USE RUDDER PEDALS TO CENTER RUDDER', sensed: false },
      { name: 'RUDDER TRIM', labelNotCompleted: 'RESET', sensed: false },
      { name: 'RESET NOT SUCCESSFUL', condition: true, sensed: false },
      { name: 'FOR CONTINUED FLT : CONSIDER AP USE', sensed: false, level: 1 },
      { name: 'RESET SUCCESSFUL', condition: true, sensed: false },
    ],
  },
  270900003: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPEED BRAKES LEVER JAMMED',
    sensed: false,
    items: [
      { name: 'FOR AUTO-RETRACTION:THR LVRS TOGA', sensed: false },
      { name: 'EXPECT AP/FD GA MODE ENGAGEMENT', sensed: false, style: ChecklistLineStyle.Green },
      { name: 'GND SPLRs WILL EXTEND AT REV SELECTION', sensed: false, style: ChecklistLineStyle.Green },
      { name: 'FOR LDG:KEEP GND SPLRs ARMED', sensed: false, style: ChecklistLineStyle.Green },
    ],
  },
  270900004: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LDG WITH FLAPS LEVER JAMMED',
    sensed: false,
    items: [
      { name: 'FLAPS LEVER', labelNotCompleted: 'FORCE ONE STEP DOWN', sensed: false },
      { name: 'FOR LDG : FLAP LVR 3', sensed: false },
      { name: '[MFD SURV] TAWS FLAP MODE', labelNotCompleted: 'OFF', sensed: true },
      { name: 'NO AUTOLAND', sensed: false },
      { name: 'FOR GA : KEEP S/F CONF', sensed: false },
      { name: 'FUEL CONSUMPT INCRSD', sensed: false },
      { ...FMS_PRED_UNRELIABLE_CHECKLIST_ITEM },
      { name: 'LDG PERF AFFECTED', sensed: false },
    ],
  },
  270900005: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LDG WITH NO SLATS NO FLAPS',
    sensed: false,
    items: [
      { name: 'FLAPS LEVER JAMMED', condition: true, sensed: false },
      { name: 'LDG WITH FLAP LVR JAMMED PROC', labelNotCompleted: 'APPLY', sensed: false, level: 1 },
      { name: 'FLAPS LEVER NOT JAMMED', condition: true, sensed: false },
      { name: '[MFD SURV] TAWS FLAP MODE', labelNotCompleted: 'OFF', sensed: true, level: 1 },
      { name: 'USE SELECTED SPEED', sensed: false, level: 1 },
      { name: 'NO AUTOLAND', sensed: false, level: 1 },
      { name: 'FOR GA : KEEP S/F CONF', sensed: false, level: 1 },
      { name: 'LDG PERF AFFECTED', sensed: false, level: 1 },
      { name: 'FOR APPROACH', sensed: true, style: ChecklistLineStyle.CenteredSubHeadline, level: 1 },
      { name: 'FLAP LVR', labelNotCompleted: 'CONF 1', sensed: true, level: 1 },
      { name: 'TRGT SPEED', labelNotCompleted: 'VLS', sensed: false, level: 1 },
      { name: 'AT 500 FT AGL', sensed: true, style: ChecklistLineStyle.CenteredSubHeadline, level: 1 },
      { name: 'A/THR', labelNotCompleted: 'OFF', sensed: true, level: 1 },
      { name: 'SPEED', labelNotCompleted: 'REDUCE TO VAPP', sensed: false, level: 1 },
    ],
  },
};

export const EcamDeferredProcAta27: { [n: number]: DeferredProcedure } = {
  270700001: {
    fromAbnormalProcs: ['270900002'],
    title: 'RUDDER TRIM RUNAWAY',
    type: DeferredProcedureType.FOR_APPROACH,
    items: [
      {
        name: 'AUTOLAND : RECOMMENDED',
        sensed: false,
      },
      {
        name: 'MANUAL LANDING ANTICIPATED',
        sensed: false,
        condition: true,
      },
      {
        name: 'HOLD RUDDER PEDALS BEFORE AP OFF',
        sensed: false,
        level: 1,
      },
      {
        name: 'KEEP RUDDER PEDALS CENTERED',
        sensed: false,
        level: 1,
      },
      {
        name: 'USE PEDALS AS RQRD FOR DECRAB & LDG',
        sensed: false,
        level: 1,
      },
    ],
  },
};
