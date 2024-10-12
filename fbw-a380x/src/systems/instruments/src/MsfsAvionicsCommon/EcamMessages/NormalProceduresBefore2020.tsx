// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// Left this one here if we decide to also implement the older ECL from before 2020.
import { ChecklistLineStyle, NormalProcedure } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

/** All normal procedures (checklists, via ECL) should be here.
 * Display is ordered by ID, ascending. That's why keys need to be numbers. */
export const EcamNormalProceduresBefore2020: { [n: number]: NormalProcedure } = {
  1000001: {
    title: 'COCKPIT PREPARATION',
    items: [
      {
        name: 'CKPT PREP',
        labelNotCompleted: 'COMPLETE (BOTH)',
        labelCompleted: 'COMPLETED',
        sensed: false,
      },
      {
        name: 'GEAR PINS & COVERS',
        labelNotCompleted: 'REMOVE',
        labelCompleted: 'REMOVED',
        sensed: false,
      },
      {
        name: 'FUEL QTY',
        labelNotCompleted: 'CHECK',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'T.O DATA',
        labelNotCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'BARO REF VALUE',
        labelNotCompleted: '--.-- SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'ADIRS',
        labelNotCompleted: 'NAV',
        colonIfCompleted: false,
        sensed: true,
      },
      { name: '', labelNotCompleted: '', sensed: true, style: ChecklistLineStyle.SeparationLine },
      {
        name: 'WINDOWS/DOORS',
        labelNotCompleted: 'CLOSE (BOTH)',
        labelCompleted: 'CLOSED',
        sensed: false,
      },
      {
        name: 'PARK BRK',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'BEACON',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
    ],
  },
  1000002: {
    title: 'AFTER START',
    items: [
      {
        name: 'A-ICE',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'ECAM STS',
        labelNotCompleted: 'CHECK',
        labelCompleted: 'NORMAL',
        sensed: true,
      },
      {
        name: 'F/CTL',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'RUDDER TRIM',
        labelNotCompleted: 'NEUTRAL',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'PITCH TRIM',
        labelNotCompleted: 'CHECK',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
    ],
  },
  1000003: {
    title: 'BEFORE TAKEOFF',
    items: [
      {
        name: 'WX / TERR PB',
        labelNotCompleted: 'AS RQRD (BOTH)',
        labelCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'FLIGHT INSTRUMENTS',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'BRIEFING',
        labelNotCompleted: 'CONFIRM',
        labelCompleted: 'CONFIRMED',
        sensed: false,
      },
      {
        name: 'V1 / VR / V2 / THR RATING',
        labelNotCompleted: 'CHECK (BOTH)',
        labelCompleted: 'CHECKED',
        sensed: false,
      },
      {
        name: 'SQUAWK',
        labelNotCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'T.O',
        style: ChecklistLineStyle.SubHeadline,
        labelNotCompleted: '',
        sensed: true,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'GND SPLRs',
        labelNotCompleted: 'ARM',
        labelCompleted: 'ARM',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: 'T.O',
        sensed: true,
        level: 1,
      },
      {
        name: 'AUTO BRAKE',
        labelNotCompleted: 'RTO',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      {
        name: 'T.O CONFIG',
        labelNotCompleted: 'TEST',
        labelCompleted: 'NORMAL',
        colonIfCompleted: false,
        sensed: true,
        level: 1,
      },
      { name: '', style: ChecklistLineStyle.SeparationLine, labelNotCompleted: '', sensed: true },
      {
        name: 'T.O RWY',
        labelNotCompleted: '--- CONFIRM (BOTH)',
        labelCompleted: 'CONFIRMED',
        sensed: false,
      },
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        labelCompleted: 'ADVISED',
        sensed: false,
      },
      {
        name: 'PACKS 1+2',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
    ],
  },
  1000004: {
    title: 'AFTER TAKEOFF/CLIMB',
    items: [
      {
        name: 'LDG GEAR',
        labelNotCompleted: 'UP',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: '0',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'PACKS 1+2',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'APU MASTER SW',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      { name: '', style: ChecklistLineStyle.SeparationLine, labelNotCompleted: '', sensed: true },
      {
        name: 'BARO REF VALUE',
        labelNotCompleted: '--.-- SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
    ],
  },
  1000005: {
    title: 'APPROACH',
    items: [
      {
        name: 'BRIEFING',
        labelNotCompleted: 'CONFIRM',
        labelCompleted: 'CONFIRMED',
        sensed: false,
      },
      {
        name: 'ECAM STS',
        labelNotCompleted: 'CHECK',
        labelCompleted: 'NORMAL',
        sensed: true,
      },
      {
        name: 'BARO REF VALUE',
        labelNotCompleted: '--.-- SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'MINIMA',
        labelNotCompleted: '--- SET (BOTH)',
        labelCompleted: 'SET',
        sensed: false,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
    ],
  },
  1000006: {
    title: 'LANDING',
    items: [
      {
        name: 'CABIN CREW',
        labelNotCompleted: 'ADVISE',
        labelCompleted: 'ADVISED',
        sensed: false,
      },
      {
        name: 'A/THR',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'AUTO BRK',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      { name: 'LDG', style: ChecklistLineStyle.SubHeadline, sensed: true, labelNotCompleted: '' },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'LDG GEAR',
        labelNotCompleted: 'DOWN',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'GND SPLRs',
        labelNotCompleted: 'ARM',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: 'LDG',
        sensed: true,
      },
    ],
  },
  1000007: {
    title: 'AFTER LANDING',
    items: [
      {
        name: 'GND SPLRs',
        labelNotCompleted: 'DISARM',
        sensed: true,
      },
      {
        name: 'FLAPS',
        labelNotCompleted: '0',
        sensed: true,
      },
      {
        name: 'APU',
        labelNotCompleted: 'START',
        sensed: true,
      },
    ],
  },
  1000008: {
    title: 'PARKING',
    items: [
      {
        name: 'EXT LT',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'PARK BRK / CHOCKS',
        labelNotCompleted: 'AS RQRD',
        sensed: false,
      },
      {
        name: 'APU BLEED',
        labelNotCompleted: 'ON',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'ALL ENGs',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'FUEL PMPs',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'SEAT BELTS',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
    ],
  },
  1000009: {
    title: 'SECURING THE AIRCRAFT',
    items: [
      {
        name: 'ADIRS',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'OXYGEN',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'APU BLEED',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'EMER EXIT LT',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'SIGNS',
        labelNotCompleted: 'OFF',
        colonIfCompleted: false,
        sensed: true,
      },
      {
        name: 'APU',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'ALL 3 LAPTOPS',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
      {
        name: 'ALL 4 BATs',
        labelNotCompleted: 'OFF',
        sensed: false,
      },
    ],
  },
};

/*

public sensedItems: FwsNormalChecklistsDict = {
    1000001: {
      whichItemsChecked: () => [
        null,
        null,
        null,
        null,
        null,
        !!this.fws.seatBelt.get(),
        this.fws.ir1MaintWord.bitValueOr(3, false) &&
          this.fws.ir2MaintWord.bitValueOr(3, false) &&
          this.fws.ir3MaintWord.bitValueOr(3, false),
        false,
        null,
        null,
        SimVar.GetSimVarValue('A:LIGHT BEACON', SimVarValueType.Bool),
      ],
    },
    1000002: {
      whichItemsChecked: () => [
        null,
        this.fws.ecamStsNormal.get(),
        null,
        Math.abs(SimVar.GetSimVarValue('L:RUDDER_TRIM_1_COMMANDED_POSITION', SimVarValueType.Number)) < 0.35 &&
          Math.abs(SimVar.GetSimVarValue('L:RUDDER_TRIM_2_COMMANDED_POSITION', SimVarValueType.Number)) < 0.35,
        null,
      ],
    },
    1000003: {
      whichItemsChecked: () => [
        null,
        null,
        null,
        null,
        null,
        false,
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1,
        this.fws.spoilersArmed.get(),
        this.fws.slatFlapSelectionS18F10 || this.fws.slatFlapSelectionS22F15 || this.fws.slatFlapSelectionS22F20,
        this.fws.autoBrake.get() === 6,
        this.fws.toConfigNormal.get(),
        false,
        null,
        null,
        null,
      ],
    },
    1000004: {
      whichItemsChecked: () => [
        !SimVar.GetSimVarValue('GEAR HANDLE POSITION', 'bool'),
        this.fws.slatFlapSelectionS0F0,
        this.fws.pack1On.get() && this.fws.pack2On.get(),
        !this.fws.apuMasterSwitch.get(),
        false,
        null,
      ],
    },
    1000005: {
      whichItemsChecked: () => [
        null,
        this.fws.ecamStsNormal.get(),
        null,
        null,
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'),
      ],
    },
    1000006: {
      whichItemsChecked: () => [
        null,
        null,
        null,
        false,
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'),
        SimVar.GetSimVarValue('GEAR HANDLE POSITION', 'bool'),
        this.fws.spoilersArmed.get(),
        (!SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'bool') &&
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 4) ||
          (SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'bool') &&
            SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 3),
      ],
    },
    1000007: {
      whichItemsChecked: () => [
        !this.fws.spoilersArmed.get(),
        SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 0,
        !!this.fws.apuMasterSwitch.get(),
      ],
    },
    1000008: {
      whichItemsChecked: () => [
        null,
        null,
        this.fws.apuBleedValveOpen.get(),
        !this.fws.engine1Master.get() &&
          !this.fws.engine2Master.get() &&
          !this.fws.engine3Master.get() &&
          !this.fws.engine4Master.get(),
        this.fws.allFuelPumpsOff.get(),
        !SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'),
      ],
    },
    1000009: {
      whichItemsChecked: () => [
        null,
        SimVar.GetSimVarValue('L:PUSH_OVHD_OXYGEN_CREW', 'bool'),
        !this.fws.apuBleedValveOpen.get(),
        SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_Position', 'number') === 0,
        !SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'),
        null,
        null,
        null,
      ],
    },
  };

*/
