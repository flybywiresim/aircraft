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
export const EcamAbnormalSensedAta2930: { [n: number]: AbnormalProcedure } = {
  // ATA 29 Hydraulics
  290800001: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ELEC PMP A FAULT',
    sensed: true,
    items: [
      {
        name: 'G ELEC PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800002: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ELEC PMP B FAULT',
    sensed: true,
    items: [
      {
        name: 'G ELEC PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800003: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ELEC PMP A FAULT',
    sensed: true,
    items: [
      {
        name: 'Y ELEC PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800004: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ELEC PMP B FAULT',
    sensed: true,
    items: [
      {
        name: 'Y ELEC PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800005: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 1 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800006: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 1 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800007: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 2 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 2 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800008: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 2 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 2 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800009: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 3 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800010: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 3 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800011: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 4 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 4 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800012: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 4 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 4 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
    ],
  },
  290800013: {
    title: '\x1b<4m\x1b4mHYD\x1bm G FUEL HEAT EXCHANGER VLV FAULT',
    sensed: true,
    items: [],
  },
  290800014: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y FUEL HEAT EXCHANGER VLV FAULT',
    sensed: true,
    items: [],
  },
  290800015: {
    title: '\x1b<4m\x1b4mHYD\x1bm G HEAT EXCHANGER AIR LEAK',
    sensed: true,
    items: [],
  },
  290800016: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y HEAT EXCHANGER AIR LEAK',
    sensed: true,
    items: [],
  },
  290800017: {
    title: '\x1b<4m\x1b4mHYD\x1bm G HEAT EXCHANGER AIR LEAK DET FAULT',
    sensed: true,
    items: [],
  },
  290800018: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y HEAT EXCHANGER AIR LEAK DET FAULT',
    sensed: true,
    items: [],
  },
  290800019: {
    title: '\x1b<4m\x1b4mHYD\x1bm G RSVR AIR PRESS LO',
    sensed: true,
    items: [
      {
        name: 'IF G SYS PRESSURE FLUCTUATES',
        sensed: false,
      },
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  290800020: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y RSVR AIR PRESS LO',
    sensed: true,
    items: [
      {
        name: 'IF Y SYS PRESSURE FLUCTUATES',
        sensed: false,
      },
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  290800021: {
    title: '\x1b<4m\x1b4mHYD\x1bm G  RSVR LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'G ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },

      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800022: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y  RSVR LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 3 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'Y ENG 4 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },

      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800023: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS CHAN A OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800024: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS CHAN  B OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800025: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS CHAN A OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800026: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS CHAN B OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800027: {
    title: '\x1b<4m\x1b4mHYD\x1bm G  SYS COOLING FAULT',
    sensed: true,
    items: [],
  },
  290800028: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y  SYS COOLING FAULT',
    sensed: true,
    items: [],
  },
  290800029: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  290800030: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  290800031: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS OVERHEAT',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'G ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800032: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS OVERHEAT',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 3 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'Y ENG 4 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800033: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800034: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800035: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS PRESS LO',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'FLAPS SLOW',
        sensed: false,
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      {
        // if prim3 also failed
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      {
        name: 'FOR TAXI : STEER ENDURANCE LIMITED',
        sensed: false,
      },
    ],
  },
  290800036: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS PRESS LO',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'FLAPS SLOW',
        sensed: false,
      },
      {
        // if prim2 also failed
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
    ],
  },
  290800037: {
    title: '\x1b<4m\x1b4mHYD\x1bm G SYS TEMP HI',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },

      // if not succesfull
      {
        name: 'G ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'G ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
    ],
  },
  290800038: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y SYS TEMP HI',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if not succesfull
      {
        name: 'Y ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'Y ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
    ],
  },
  290800039: {
    title: '\x1b<4m\x1b4mHYD\x1bm G+Y SYS PRESS LO',
    sensed: true,
    items: [
      {
        name: 'ALL ENG PMPs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if flaps less than 3
      {
        name: '[MFD SURV] TAWS FLAP MODE',
        sensed: true,
        labelNotCompleted: 'OFF',
      },

      {
        name: 'SLATS SLOW',
        sensed: false,
      },

      {
        name: 'FOR LDG : FLAP LVR 3',
        sensed: false,
      },

      {
        name: 'L/G GRVTY EXTN ONLY',
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
        // if prim3 also failed
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        style: ChecklistLineStyle.Green,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      {
        name: 'FOR TAXI : STEER ENDURANCE LIMITED',
        sensed: false,
      },
    ],
  },
  290800040: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ELEC PMP A+B OFF',
    sensed: true,
    items: [],
  },
};
