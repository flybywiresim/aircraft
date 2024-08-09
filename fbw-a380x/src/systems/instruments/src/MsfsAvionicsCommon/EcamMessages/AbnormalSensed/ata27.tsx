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
    title: '\x1b<4m\x1b4mF/CTL\x1bm ALTERNATE LAW (PROT LOST)',
    sensed: true,
    items: [],
  },
  271800009: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm DIRECT LAW',
    sensed: true,
    items: [],
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
    items: [],
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
    items: [],
  },
  271800037: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 FAULT',
    sensed: true,
    items: [],
  },
  271800038: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 FAULTT',
    sensed: true,
    items: [],
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
  271800051: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL JAMMED',
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
  271800057: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM RUNWAY',
    sensed: true,
    items: [],
  },
  271800058: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 1 FAULT',
    sensed: true,
    items: [],
  },
  271800059: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 2 FAULT',
    sensed: true,
    items: [],
  },
  271800060: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 3 FAULT',
    sensed: true,
    items: [],
  },
  271800061: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SINGLE ELEVATOR FAULT',
    sensed: true,
    items: [],
  },
  271800062: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SINGLE RUDDER FAULT',
    sensed: true,
    items: [],
  },
  271800063: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs FAULT',
    sensed: true,
    items: [],
  },
  271800064: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs POSITION/LVR DISAGREE',
    sensed: true,
    items: [],
  },
  271800065: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs STILL EXTENDED',
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
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER NOT ZERO',
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
    items: [],
  },
  272800007: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 2 FAULT',
    sensed: true,
    items: [],
  },
  272800008: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 1+2 FAULT',
    sensed: true,
    items: [],
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
  272800017: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LDG WITH FLAPS LEVER JAMMED',
    sensed: true,
    items: [],
  },
  272800018: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LDG WITH NO SLATS NO FLAPS',
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
    items: [],
  },
  272800022: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 2 FAULT',
    sensed: true,
    items: [],
  },
  272800023: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 1+2 FAULT',
    sensed: true,
    items: [],
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
};
