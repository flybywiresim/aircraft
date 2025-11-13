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
    title: '\x1b<4m\x1b4mMISC\x1bm BOMB ON BOARD (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900002: {
    title: '\x1b<4m\x1b4mMISC\x1bm CKPT WINDOW CRACKED',
    sensed: false,
    items: [],
  },
  990900003: {
    title: '\x1b<4m\x1b4mMISC\x1bm CKPT WINDOW ELEC ARCING',
    sensed: false,
    items: [
      { name: 'IF L WINDOW/WINDSHIELD AFFECTED', condition: true, sensed: false },
      { name: 'AICU 1', labelNotCompleted: 'PULL', sensed: true },
      { name: 'IF R WINDOW/WINDSHIELD AFFECTED', condition: true, sensed: false },
      { name: 'AICU 2', labelNotCompleted: 'PULL', sensed: true },
    ],
  },
  990900004: {
    title: '\x1b<2m\x1b4mMISC\x1bm DITCHING',
    sensed: false,
    items: [],
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
    title: '\x1b<2m\x1b4mMISC\x1bm FORCED LANDING',
    sensed: false,
    items: [],
  },
  990900008: {
    title: '\x1b<4m\x1b4mMISC\x1bm OIS FAULT',
    sensed: false,
    items: [
      { name: 'AFFECTED SIDE LAPTOP', labelNotCompleted: 'UNSTOW & VERIFY', sensed: false },
      { name: 'IF LAPTOP NOT AFFECTED', condition: true, sensed: false },
      { name: 'OIT (AFFECTED)', labelNotCompleted: 'OFF 5 S THEN ON', sensed: false, level: 1 },
      { name: 'IF NOT SUCCESSFULL AFTER 4 MIN', condition: true, sensed: false },
      { name: 'USE LAPTOP AS RQRD', sensed: false, level: 1 },
      { name: 'IF LAPTOP AFFECTED', condition: true, sensed: false },
      { name: 'LAPTOP (AFFECTED)', labelNotCompleted: 'OFF', sensed: false, level: 1 },
      { name: 'AFTER 30 S', condition: true, sensed: false },
      { name: 'LAPTOP (AFFECTED)', labelNotCompleted: 'ON', sensed: false, level: 1 },
      { name: 'IF NOT SUCCESSFUL AFTER 5 MIN', condition: true, sensed: false },
      { name: 'USE BACKUP AS RQRD', sensed: false, level: 1 },
    ],
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
    title: '\x1b<4m\x1b4mMISC\x1bm SEVERE TURBULENCE (WIP)',
    sensed: false,
    items: [], // TODO
  },
  990900011: {
    title: '\x1b<4m\x1b4mMISC\x1bm VOLCANIC ASH ENCOUNTER (WIP)',
    sensed: false,
    items: [], // TODO
  },
};
