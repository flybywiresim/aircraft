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
export const EcamAbnormalSensedAta26: { [n: number]: AbnormalProcedure } = {
  260800001: {
    title: '\x1b<2m\x1b4mAPU FIRE',
    sensed: true,
    items: [
      {
        name: 'APU FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
      },
      {
        name: 'APU AGENT AFTER 10 S',
        sensed: true,
        labelNotCompleted: 'DISCH',
      },
      {
        name: 'APU MASTER SW',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800002: {
    title: '\x1b<4m\x1b4mAPU FIRE\x1bm DET FAULT',
    sensed: true,
    items: [],
  },
  260800003: {
    title: '\x1b<4m\x1b4mAPU FIRE\x1bm LOOP A FAULT',
    sensed: true,
    items: [],
  },
  260800004: {
    title: '\x1b<4m\x1b4mAPU FIRE\x1bm LOOP B FAULT',
    sensed: true,
    items: [],
  },
  260800005: {
    title: '\x1b<2m\x1b4mENG 1\x1bm FIRE', // IN FLIGHT
    sensed: true,
    items: [
      {
        name: 'THR LEVER 1',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: 'ENG 1 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ENG 1 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
      },
      {
        name: 'APU BLEED',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'APU BLEED : DO NOT USE',
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        // When timer elapsed, this should change to 'AGENT 1...DISCH'
        name: 'AGENT 1 AFTER 10 S',
        sensed: true,
        labelNotCompleted: 'DISCH',
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
      },
      {
        // When timer elapsed, this should change to 'AS STILL FIRE AFTER 30 S'
        name: '.IF STILL FIRE AFTER 30 S :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT 2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800006: {
    title: '\x1b<2m\x1b4mENG 2\x1bm FIRE', // IN FLIGHT
    sensed: true,
    items: [
      {
        name: 'THR LEVER 2',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: 'ENG 2 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ENG 2 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
      },
      {
        // When timer elapsed, this should change to 'AGENT 1...DISCH'
        name: 'AGENT 1 AFTER 10 S',
        sensed: true,
        labelNotCompleted: 'DISCH',
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
      },
      {
        // When timer elapsed, this should change to 'AS STILL FIRE AFTER 30 S'
        name: '.IF STILL FIRE AFTER 30 S :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT 2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800007: {
    title: '\x1b<2m\x1b4mENG 3\x1bm FIRE', // IN FLIGHT
    sensed: true,
    items: [
      {
        name: 'THR LEVER 3',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: 'ENG 3 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ENG 3 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
      },
      {
        // When timer elapsed, this should change to 'AGENT 1...DISCH'
        name: 'AGENT 1 AFTER 10 S',
        sensed: true,
        labelNotCompleted: 'DISCH',
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
      },
      {
        // When timer elapsed, this should change to 'AS STILL FIRE AFTER 30 S'
        name: '.IF STILL FIRE AFTER 30 S :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT 2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800008: {
    title: '\x1b<2m\x1b4mENG 4\x1bm FIRE', // IN FLIGHT
    sensed: true,
    items: [
      {
        name: 'THR LEVER 4',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: 'ENG 4 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ENG 4 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
      },
      {
        // When timer elapsed, this should change to 'AGENT 1...DISCH'
        name: 'AGENT 1 AFTER 10 S',
        sensed: true,
        labelNotCompleted: 'DISCH',
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
      },
      {
        // When timer elapsed, this should change to 'AS STILL FIRE AFTER 30 S'
        name: '.IF STILL FIRE AFTER 30 S :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT 2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800009: {
    title: '\x1b<2m\x1b4mENG 1\x1bm FIRE', // ON GROUND
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: '.WHEN ACFT STOPPED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'PARK BRK',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ALERT',
        level: 1,
      },
      {
        name: 'ENG 1 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ENG 1 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: 'ENG 1 AGENT 1+2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'ALL ENG MASTERS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ALL FIRE P/BS (ENG & APU)',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: '.IF EVAC RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'EVAC (PA)',
        sensed: false,
        labelNotCompleted: 'ANNOUNCE',
        level: 2,
      },
      {
        name: 'EVAC COMMAND',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 2,
      },
      {
        name: 'ALL 4 BATS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
      {
        name: '.IF EVAC NOT RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
        level: 2,
      },
    ],
  },
  260800010: {
    title: '\x1b<2m\x1b4mENG 2\x1bm FIRE', // ON GROUND
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: '.WHEN ACFT STOPPED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'PARK BRK',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ALERT',
        level: 1,
      },
      {
        name: 'ENG 2 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ENG 2 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: 'ENG 2 AGENT 1+2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'ALL ENG MASTERS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ALL FIRE P/BS (ENG & APU)',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: '.IF EVAC RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'EVAC (PA)',
        sensed: false,
        labelNotCompleted: 'ANNOUNCE',
        level: 2,
      },
      {
        name: 'EVAC COMMAND',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 2,
      },
      {
        name: 'ALL 4 BATS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
      {
        name: '.IF EVAC NOT RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
        level: 2,
      },
    ],
  },
  260800011: {
    title: '\x1b<2m\x1b4mENG 3\x1bm FIRE', // ON GROUND
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: '.WHEN ACFT STOPPED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'PARK BRK',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ALERT',
        level: 1,
      },
      {
        name: 'ENG 3 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ENG 3 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: 'ENG 3 AGENT 1+2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'ALL ENG MASTERS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ALL FIRE P/BS (ENG & APU)',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: '.IF EVAC RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'EVAC (PA)',
        sensed: false,
        labelNotCompleted: 'ANNOUNCE',
        level: 2,
      },
      {
        name: 'EVAC COMMAND',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 2,
      },
      {
        name: 'ALL 4 BATS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
      {
        name: '.IF EVAC NOT RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
        level: 2,
      },
    ],
  },
  260800012: {
    title: '\x1b<2m\x1b4mENG 4\x1bm FIRE', // ON GROUND
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: '.WHEN ACFT STOPPED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'PARK BRK',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ALERT',
        level: 1,
      },
      {
        name: 'ENG 4 MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ENG 4 FIRE P/B',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: 'ENG 4 AGENT 1+2',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'ALL ENG MASTERS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'ALL FIRE P/BS (ENG & APU)',
        sensed: true,
        labelNotCompleted: 'PUSH',
        level: 1,
      },
      {
        name: '.IF EVAC RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'EVAC (PA)',
        sensed: false,
        labelNotCompleted: 'ANNOUNCE',
        level: 2,
      },
      {
        name: 'EVAC COMMAND',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 2,
      },
      {
        name: 'ALL 4 BATS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
      {
        name: '.IF EVAC NOT RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
        level: 2,
      },
    ],
  },
  260800013: {
    title: '\x1b<4m\x1b4mENG 1\x1bm FIRE DET FAULT',
    sensed: true,
    items: [],
  },
  260800014: {
    title: '\x1b<4m\x1b4mENG 2\x1bm FIRE DET FAULT',
    sensed: true,
    items: [],
  },
  260800015: {
    title: '\x1b<4m\x1b4mENG 3\x1bm FIRE DET FAULT',
    sensed: true,
    items: [],
  },
  260800016: {
    title: '\x1b<4m\x1b4mENG 4\x1bm FIRE DET FAULT',
    sensed: true,
    items: [],
  },
  260800017: {
    title: '\x1b<4m\x1b4mENG 1\x1bm FIRE LOOP A FAULT',
    sensed: true,
    items: [],
  },
  260800018: {
    title: '\x1b<4m\x1b4mENG 1\x1bm FIRE LOOP B FAULT',
    sensed: true,
    items: [],
  },
  260800019: {
    title: '\x1b<4m\x1b4mENG 2\x1bm FIRE LOOP A FAULT',
    sensed: true,
    items: [],
  },
  260800020: {
    title: '\x1b<4m\x1b4mENG 2\x1bm FIRE LOOP B FAULT',
    sensed: true,
    items: [],
  },
  260800021: {
    title: '\x1b<4m\x1b4mENG 3\x1bm FIRE LOOP A FAULT',
    sensed: true,
    items: [],
  },
  260800022: {
    title: '\x1b<4m\x1b4mENG 3\x1bm FIRE LOOP B FAULT',
    sensed: true,
    items: [],
  },
  260800023: {
    title: '\x1b<4m\x1b4mENG 4\x1bm FIRE LOOP A FAULT',
    sensed: true,
    items: [],
  },
  260800024: {
    title: '\x1b<4m\x1b4mENG 4\x1bm FIRE LOOP B FAULT',
    sensed: true,
    items: [],
  },
  260800025: {
    title: '\x1b<2m\x1b4mMLG BAY\x1bm FIRE',
    sensed: true,
    items: [
      // In flight
      {
        // If speed above 250/.55
        name: 'SPEED',
        sensed: false,
        labelNotCompleted: 'REDUCE BELOW 250/.55',
        level: 1,
      },
      {
        name: 'L/G LEVER',
        sensed: true,
        labelNotCompleted: 'DOWN',
      },
      {
        name: 'L/G : KEEP DOWN',
        sensed: false,
        color: 'cyan',
      },
      {
        name: 'ATC',
        sensed: true,
        labelNotCompleted: 'NOTIFY',
      },
      {
        name: 'MAX SPEED : 250/.55',
        sensed: false,
        color: 'cyan',
      },
      // On ground
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'IDLE',
      },
      {
        name: '.WHEN ACFT STOPPED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'PARK BRK',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'ATC',
        sensed: false,
        labelNotCompleted: 'NOTIFY',
        level: 1,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ALERT',
        level: 1,
      },
      {
        name: 'ALL ENG MASTERS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: '.IF EVAC RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'EVAC (PA)',
        sensed: false,
        labelNotCompleted: 'ANNOUNCE',
        level: 2,
      },
      {
        name: 'EVAC COMMAND',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 2,
      },
      {
        name: 'APU MASTER SW',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
      {
        name: 'ALL 4 BATS',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
      {
        name: '.IF EVAC NOT RQRD :',
        sensed: false,
        level: 2,
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
        level: 2,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800026: {
    title: '\x1b<4m\x1b4mMLG BAY\x1bm FIRE DET FAULT',
    sensed: true,
    items: [],
  },
  260800027: {
    title: '\x1b<4m\x1b4mMLG BAY\x1bm FIRE LOOP A FAULT',
    sensed: true,
    items: [],
  },
  260800028: {
    title: '\x1b<4m\x1b4mMLG BAY\x1bm FIRE LOOP B FAULT',
    sensed: true,
    items: [],
  },
  260800029: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm AFT AVNCS DET FAULT',
    sensed: true,
    items: [],
  },
  260800030: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm AFT AVNCS SMOKE',
    sensed: true,
    items: [
      {
        name: 'CREW OXY MASKS (IF RQRD)',
        sensed: false,
        labelNotCompleted: 'USE / 100% / EMER',
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GALLEY',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800031: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm DET FAULT',
    sensed: true,
    items: [
      {
        name: 'IFEC',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CWS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: '.IF NO LIFESTOCK :',
        sensed: false,
        level: 1,
      },
      {
        name: 'FWD ISOL VALVES',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'BULK ISOL VALVES',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'BULK CARGO HEAT',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  260800032: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm IFE BAY DET FAULT',
    sensed: true,
    items: [
      {
        name: 'IFEC',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  260800033: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm IFE BAY SMOKE',
    sensed: true,
    items: [
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'IFEC',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800034: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm L MAIN AVNCS DET FAULT',
    sensed: true,
    items: [],
  },
  260800035: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm R MAIN AVNCS DET FAULT',
    sensed: true,
    items: [],
  },
  260800036: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm L UPPER AVNCS DET FAULT',
    sensed: true,
    items: [],
  },
  260800037: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm R UPPER AVNCS DET FAULT',
    sensed: true,
    items: [],
  },
  260800038: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm L MAIN AVNCS SMOKE',
    sensed: true,
    items: [
      {
        name: 'CREW OXY MASKS (IF RQRD)',
        sensed: false,
        labelNotCompleted: 'USE / 100% / EMER',
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GALLEY',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: '[QRH] SMOKE/FUMES PROC',
        sensed: false,
        labelNotCompleted: 'APPLY',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800039: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm R MAIN AVNCS SMOKE',
    sensed: true,
    items: [
      {
        name: 'CREW OXY MASKS (IF RQRD)',
        sensed: false,
        labelNotCompleted: 'USE / 100% / EMER',
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GALLEY',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: '[QRH] SMOKE/FUMES PROC',
        sensed: false,
        labelNotCompleted: 'APPLY',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800040: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm L UPPER AVNCS SMOKE',
    sensed: true,
    items: [
      {
        name: 'CREW OXY MASKS (IF RQRD)',
        sensed: false,
        labelNotCompleted: 'USE / 100% / EMER',
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GALLEY',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // If L UPPER AVNCS compartment affected
      {
        name: 'NSS MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: '. IF SMOKE PERSISTS :',
        sensed: false,
        level: 1,
      },
      {
        name: '[QRH] SMOKE/FUMES PROC',
        sensed: false,
        labelNotCompleted: 'APPLY',
        level: 1,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800041: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm R UPPER AVNCS SMOKE',
    sensed: true,
    items: [
      {
        name: 'CREW OXY MASKS (IF RQRD)',
        sensed: false,
        labelNotCompleted: 'USE / 100% / EMER',
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GALLEY',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // If L UPPER AVNCS compartment affected
      {
        name: 'NSS MASTER',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: '. IF SMOKE PERSISTS :',
        sensed: false,
        level: 1,
      },
      {
        name: '[QRH] SMOKE/FUMES PROC',
        sensed: false,
        labelNotCompleted: 'APPLY',
        level: 1,
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800042: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm FACILITIES DET FAULT',
    sensed: true,
    items: [
      {
        name: 'CWS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
    ],
  },
  260800043: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm FWD CARGO BOTTLES FAULT',
    sensed: true,
    items: [],
  },
  260800044: {
    title:  '\x1b<4m\x1b4mSMOKE\x1bm AFT CARGO BOTTLES FAULT',
    sensed: true,
    items: [],
  },
  260800045: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm FWD CARGO SMOKE',
    sensed: true,
    items: [
      {
        name: 'FWD ISOL VALVES',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // When all engines are shut down
      {
        name: '.IF FWD CRG CLOSED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT TO FWD',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      // When at least one engine running
      {
        name: 'AGENT TO FWD',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: 'BEFORE CARGO OPENING : PAX DISEMBARK',
        sensed: false,
        color: 'green',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800046: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm AFT CARGO SMOKE',
    sensed: true,
    items: [
      {
        name: 'BULK ISOL VALVES',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // When all engines are shut down
      {
        name: '.IF AFT+BULK CRG CLOSED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT TO AFT',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      // When at least one engine running
      {
        name: 'AGENT TO AFT',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: 'BEFORE CARGO OPENING : PAX DISEMBARK',
        sensed: false,
        color: 'green',
      },
    ],
    recommendation: 'LAND ASAP',
  },
  260800047: {
    title:  '\x1b<2m\x1b4mSMOKE\x1bm BULK CARGO SMOKE',
    sensed: true,
    items: [
      {
        name: 'BULK ISOL VALVES',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // When all engines are shut down
      {
        name: '.IF AFT+BULK CRG CLOSED :',
        sensed: false,
        level: 1,
      },
      {
        name: 'AGENT TO AFT',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      // When at least one engine running
      {
        name: 'AGENT TO AFT',
        sensed: true,
        labelNotCompleted: 'DISCH',
        level: 1,
      },
      {
        name: 'CAB FANS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'SIGNS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CKPT / CABIN COM',
        sensed: false,
        labelNotCompleted: 'ESTABLISH',
      },
      {
        name: 'BEFORE CARGO OPENING : PAX DISEMBARK',
        sensed: false,
        color: 'green',
      },
    ],
    recommendation: 'LAND ASAP',
  },
};
