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
//    4 for limitations,
//    7 for deferred procedures,
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedAta80Rest: { [n: number]: AbnormalProcedure } = {
  990900001: {
    title: '\x1b<4m\x1b4mMISC\x1bm BOMB ON BOARD',
    sensed: false,
    items: [
      { name: 'CKPT / CABIN COM', sensed: false, labelNotCompleted: 'ESTABLISH' },
      { name: 'IF LDG + EVAC POSSIBLE WITHIN 30 MIN', sensed: false, condition: true },
      { name: 'ATC / COMPANY', sensed: false, labelNotCompleted: 'NOTIFY', labelCompleted: 'NOTIFIED', level: 1 },
      { name: 'EVAC', sensed: false, labelNotCompleted: 'PREPARE', level: 1 },
      { name: 'IF NO IMMEDIATE LANDING', sensed: false, condition: true },
      { name: 'ATC / COMPANY', sensed: false, labelNotCompleted: 'NOTIFY', labelCompleted: 'NOTIFIED', level: 1 },
      { name: 'ACFT (IF CLIMBING)', sensed: false, labelNotCompleted: 'LEVEL OFF', level: 1 },
      { name: 'TRGT SPEED : PREFER LO IAS', sensed: false, level: 1 },
      { name: 'CABIN ALT MODE', sensed: true, labelNotCompleted: 'MAN', level: 1 },
      { name: 'DESCENT TO CAB ALT + 2500FT/MEA-MORA', sensed: false, level: 1 },
      { name: 'WHEN ACFT ALT = CAB ALT + 2500FT/MEA-MORA', sensed: false, condition: true, level: 2 },
      { name: 'ELEC GALLEY', sensed: true, labelNotCompleted: 'OFF', level: 2 },
      { name: 'ELEC PAX SYS', sensed: true, labelNotCompleted: 'OFF', level: 2 },
      { name: 'IF FUEL PERMITS', sensed: false, condition: true, level: 2 },
      { name: 'FLAPS', sensed: true, labelNotCompleted: 'AT LEAST CONF 1', level: 2 },
      { name: 'L/G LEVER', sensed: true, labelNotCompleted: 'DOWN', level: 2 },
      { name: 'FUEL CONSUMPT INCRSD', sensed: false, level: 1 },
      {
        name: 'FMS PRED UNRELIABLE WITHOUT ACCURATE FMS FUEL PENALTY INSERTION',
        sensed: false,
        style: ChecklistLineStyle.Green,
        level: 1,
      },
      { name: 'DURING FURTHER DESCENT : MAINTAIN MAX DIFF PRESS 1 PSI', sensed: false, level: 1 },
      { name: 'EVAC', sensed: false, labelNotCompleted: 'PREPARE', level: 1 },
    ],
  },
  990900002: {
    title: '\x1b<4m\x1b4mMISC\x1bm CKPT WINDOW CRACKED (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900003: {
    title: '\x1b<4m\x1b4mMISC\x1bm CKPT WINDOW ELEC ARCING (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900004: {
    title: '\x1b<2m\x1b4mMISC\x1bm DITCHING (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900005: {
    title: '\x1b<2m\x1b4mMISC\x1bm EMER DESCENT',
    sensed: false,
    items: [
      { name: 'CREW OXY MASKS', labelNotCompleted: 'USE', sensed: false },
      { name: 'SIGNS', labelNotCompleted: 'ON', sensed: true },
      { name: 'EMER DESCENT', labelNotCompleted: 'INITIATE', labelCompleted: 'INITIATED', sensed: false },
      { name: 'ALL THR LEVERS', labelNotCompleted: 'IDLE', sensed: true },
      { name: 'SPEED BRAKE LEVER', labelNotCompleted: 'FULL', sensed: true },
      { name: 'SPEED', labelNotCompleted: 'MAX / APPROPRIATE', sensed: false },
      { name: 'ATC', labelNotCompleted: 'NOTIFY', labelCompleted: 'NOTIFIED', sensed: false },
      { name: 'EMER DESCENT (PA)', labelNotCompleted: 'ANNOUNCE', labelCompleted: 'ANNOUNCED', sensed: false },
      { name: 'ATC SQUAWK 7700', labelNotCompleted: 'CONSIDER', sensed: false },
      { name: 'MAX FL : 100/MEA-MORA', sensed: false },
      { name: 'CAB ALT ABOVE 14000 FT', condition: true, sensed: false },
      { name: 'PAX OXY MASKS MAN ON', labelNotCompleted: 'PRESS', sensed: true, level: 1 },
      { name: 'WHEN DESCENT ESTABLISHED', condition: true, sensed: false },
      { name: 'CREW OXY MASKS DILUTION', labelNotCompleted: 'N', sensed: false, level: 1 },
    ],
  },
  990900006: {
    title: '\x1b<2m\x1b4mMISC\x1bm EMER EVAC',
    sensed: false,
    items: [
      {
        name: 'WHEN AIRCRAFT STOPPED :',
        style: ChecklistLineStyle.CenteredSubHeadline,
        sensed: true,
      },
      { name: 'PARK BRK', labelNotCompleted: 'ON', sensed: true },
      { name: 'ATC', labelNotCompleted: 'NOTIFY', labelCompleted: 'NOTIFIED', sensed: false },
      { name: 'CABIN CREW', labelNotCompleted: 'ALERT', labelCompleted: 'ALERTED', sensed: false },
      { name: 'PACK 1+2', labelNotCompleted: 'OFF', sensed: true },
      { name: 'ALL ENG MASTERS', labelNotCompleted: 'OFF', sensed: true },
      { name: 'ALL FIRE P/Bs (ENGs & APU)', labelNotCompleted: 'PUSH', sensed: true },
      { name: 'ALL AGENTS (ENGs & APU)', labelNotCompleted: 'AS RQRD', sensed: false },
      { name: 'EVAC RQRD', condition: true, sensed: false },
      { name: 'EVAC (PA)', labelNotCompleted: 'ANNOUNCE', labelCompleted: 'ANNOUNCED', sensed: false, level: 1 },
      { name: 'EVAC COMMAND', labelNotCompleted: 'ON', sensed: true, level: 1 },
      { name: 'ALL 4 BATs', labelNotCompleted: 'OFF', sensed: true, level: 1 },
      { name: 'EVAC NOT RQRD', condition: true, sensed: false },
      {
        name: 'CABIN CREW & PAX (PA)',
        labelNotCompleted: 'ADVISE',
        labelCompleted: 'ADVISED',
        sensed: false,
        level: 1,
      },
    ],
  },
  990900007: {
    title: '\x1b<2m\x1b4mMISC\x1bm FORCED LANDING (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900008: {
    title: '\x1b<4m\x1b4mMISC\x1bm OIS FAULT (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900009: {
    title: '\x1b<4m\x1b4mMISC\x1bm OVERWEIGHT LDG',
    sensed: false,
    items: [
      { name: 'JETTISON PROC', labelNotCompleted: 'CONSIDER', sensed: false },
      { name: 'LDG DIST AFFECTED', sensed: false },
      {
        name: 'FOR APPROACH :',
        style: ChecklistLineStyle.CenteredSubHeadline,
        sensed: true,
      },
      { name: 'PACK 1+2', labelNotCompleted: 'OFF OR ON APU BLEED', sensed: true },
      { name: 'IF LDG CONF 3:USE CONF 1 FOR GO AROUND', sensed: false },
      { name: 'SPEED AT RUNWAY THRESHOLD : VLS', sensed: false },
      {
        name: 'FOR LANDING :',
        style: ChecklistLineStyle.CenteredSubHeadline,
        sensed: true,
      },
      { name: 'USE MAX REVERSE ASAP', sensed: false },
      { name: 'APPLY BRAKES AS NECESSARY', sensed: false },
    ],
  },
  990900010: {
    title: '\x1b<4m\x1b4mMISC\x1bm SEVERE TURBULENCE',
    sensed: false,
    items: [
      { name: 'SEAT BELTS', sensed: true, labelNotCompleted: 'ON' },
      { name: 'MAX TURB SPEED : 300 / .85 ', sensed: false },
      { name: 'MIN TURB SPEED : GREEN DOT', sensed: false },
      { name: 'ADJUST SPEED AS NECCESSARY FOR COMFORT', sensed: false },
      { name: 'AP : KEEP ON', sensed: false },
      { name: 'CABIN & CKPT (LOOSE EQPT)', sensed: false, labelNotCompleted: 'SECURE' },
      { name: 'SPEED BRAKES', sensed: false, labelNotCompleted: 'AS RQRD' },
      { name: 'IF EXCESSIVE THRUST VARIATIONS', sensed: false, condition: true },
      { name: 'A/THR', sensed: true, labelNotCompleted: 'OFF', level: 1 },
      { name: 'DESCENT TO OR BELOW OPT ALT', sensed: false, labelNotCompleted: 'CONSIDER' },
    ],
  },
  990900011: {
    title: '\x1b<4m\x1b4mMISC\x1bm VOLCANIC ASH ENCOUNTER',
    sensed: false,
    items: [
      { name: '180° TURN', sensed: false, labelNotCompleted: 'INITIATE' },
      { name: 'ATC', sensed: false, labelNotCompleted: 'NOTIFY' },
      { name: 'A/THR', sensed: true, labelNotCompleted: 'OFF' },
      { name: 'THRUST (IF CONDS PERMIT)', sensed: false, labelNotCompleted: 'REDUCE' },
      { name: 'CREW OXY MASKS', sensed: false, labelNotCompleted: 'USE / 100% / EMER' },
      { name: 'CABIN CREW', sensed: false, labelNotCompleted: 'NOTIFY' },
      { name: 'PAX OXY MASK MAN ON', sensed: false, labelNotCompleted: 'AS RQRD' },
      { name: 'ENG A-ICE', sensed: true, labelNotCompleted: 'ON' },
      { name: 'WING A-ICE', sensed: true, labelNotCompleted: 'ON' },
      { name: 'AIR FLOW', sensed: true, labelNotCompleted: 'HI' },
      { name: 'ENG PARAMETERS', sensed: false, labelNotCompleted: 'MONITOR' },
      { name: 'AIR SPEED', sensed: false, labelNotCompleted: 'MONITOR' },
    ],
  },
};
// FIXME: add defered proc for BOMB ON BOARD
