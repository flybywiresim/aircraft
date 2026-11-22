// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewTestActionId } from '../../../shared/src/VirtualCrew';
import { CrewAction, SimVarReader } from './VirtualCrewTypes';

/*
 * Cockpit controls operated by the virtual crew. The actions are those of the aircraft presets of the flyPad
 * (config/a380x/a380-842/aircraft_preset_procedures.xml), which operate the switches reliably, or the events of the
 * MFD SURV page for the transponder and the TCAS. They can be tested from the flyPad (Settings > Virtual Crew).
 */

/** L:LIGHTING_STROBE_0: 0 = ON, 1 = AUTO, 2 = OFF */
const STROBE_POSITIONS = { ON: 0, AUTO: 1, OFF: 2 } as const;

/** Index of the light circuits used with the light events */
const NOSE_LIGHT = 1;
const LANDING_LIGHTS = 2;
const RUNWAY_TURNOFF_LIGHTS = [2, 3];

/** L:A32NX_AUTOBRAKES_SELECTED_MODE, position of the autobrake selector */
export enum AutobrakeSelector {
  Disarm = 0,
  Btv = 1,
  Low = 2,
  L2 = 3,
  L3 = 4,
  High = 5,
}

/** L:A32NX_AUTOBRAKES_ARMED_MODE of the RTO mode */
export const AUTOBRAKE_ARMED_MODE_RTO = 6;

/** Alert level of the TCAS (mfd_tcas_alert_level) */
const TCAS_ALERT_LEVEL = { STBY: 0, TA: 1, TARA: 2 } as const;

/**
 * Electrical circuits of the fuel pumps (aircraft presets): feed tanks 1 to 4 main and standby (2, 3, 64 to 69), outer,
 * mid and inner tanks (70 to 79), trim tank (80, 81)
 */
const FUEL_PUMP_CIRCUITS = [2, 3, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81];

export const CockpitControls = {
  /**
   * Fuel pumps of the tanks (feed, outer, mid and inner tanks, trim tank), as in the presets of the flyPad: each pump is
   * an electrical circuit connected to its bus
   * @param on true to switch the pumps on
   * @param read reads the state of the circuits, only the pumps in the other position are switched
   */
  fuelPumps: (on: boolean, read: SimVarReader): CrewAction[] =>
    FUEL_PUMP_CIRCUITS.filter((circuit) => (read(`A:CIRCUIT CONNECTION ON:${circuit}`) === 1) !== on).map(
      (circuit) => ({
        type: 'KEY_EVENT',
        name: 'ELECTRICAL_BUS_TO_CIRCUIT_CONNECTION_TOGGLE',
        value: circuit,
        value2: 1,
      }),
    ),

  /** Engine anti ice of an engine, toggled if not in the requested position */
  engineAntiIce: (engine: number, on: boolean, read: SimVarReader): CrewAction[] =>
    (read(`A:ENG ANTI ICE:${engine}`) === 1) !== on
      ? [{ type: 'KEY_EVENT', name: `ANTI_ICE_TOGGLE_ENG${engine}` }]
      : [],

  /** Wing anti ice, toggled if not in the requested position */
  wingAntiIce: (on: boolean, read: SimVarReader): CrewAction[] =>
    (read('A:STRUCTURAL DEICE SWITCH') === 1) !== on ? [{ type: 'KEY_EVENT', name: 'TOGGLE_STRUCTURAL_DEICE' }] : [],

  /** Pitch trim to the position, in degrees */
  pitchTrim: (degrees: number): CrewAction[] => [{ type: 'PITCH_TRIM', degrees }],

  /**
   * Barometric reference of one side of the FCU: on the A380 the knob is pushed for STD and pulled for QNH (unlike
   * the A320), then set to the value (sent in sixteenths of hectopascal, like KOHLSMAN_SET)
   * @param side the side of the FCU
   * @param std true for STD, false for QNH
   * @param hpa the QNH, in hectopascals
   * @param currentlyStd true if the side is currently on STD
   */
  baro: (side: 'L' | 'R', std: boolean, hpa: number, currentlyStd: boolean): CrewAction[] =>
    std
      ? [{ type: 'KEY_EVENT', name: `A32NX.FCU_EFIS_${side}_BARO_PUSH` }]
      : [
          ...(currentlyStd ? [{ type: 'KEY_EVENT', name: `A32NX.FCU_EFIS_${side}_BARO_PULL` } as const] : []),
          { type: 'KEY_EVENT', name: `A32NX.FCU_EFIS_${side}_BARO_SET`, value: Math.round(hpa * 16) },
        ],
  strobe: (position: keyof typeof STROBE_POSITIONS): CrewAction[] => [
    { type: 'SET_LOCAL_VAR', name: 'L:LIGHTING_STROBE_0', value: STROBE_POSITIONS[position] },
  ],

  landingLights: (on: boolean): CrewAction[] => [
    { type: 'KEY_EVENT', name: on ? 'LANDING_LIGHTS_ON' : 'LANDING_LIGHTS_OFF', value: LANDING_LIGHTS },
  ],

  /** Nose light switch: T.O illuminates the takeoff and the taxi lights, TAXI only the taxi light */
  noseLight: (position: 'TO' | 'TAXI' | 'OFF'): CrewAction[] => {
    switch (position) {
      case 'TO':
        return [
          { type: 'KEY_EVENT', name: 'TAXI_LIGHTS_ON', value: NOSE_LIGHT },
          { type: 'KEY_EVENT', name: 'LANDING_LIGHTS_ON', value: NOSE_LIGHT },
        ];
      case 'TAXI':
        return [
          { type: 'KEY_EVENT', name: 'LANDING_LIGHTS_OFF', value: NOSE_LIGHT },
          { type: 'KEY_EVENT', name: 'TAXI_LIGHTS_ON', value: NOSE_LIGHT },
        ];
      default:
        return [
          { type: 'KEY_EVENT', name: 'LANDING_LIGHTS_OFF', value: NOSE_LIGHT },
          { type: 'KEY_EVENT', name: 'TAXI_LIGHTS_OFF', value: NOSE_LIGHT },
        ];
    }
  },

  runwayTurnoffLights: (on: boolean): CrewAction[] =>
    RUNWAY_TURNOFF_LIGHTS.map((index) => ({
      type: 'KEY_EVENT',
      name: on ? 'TAXI_LIGHTS_ON' : 'TAXI_LIGHTS_OFF',
      value: index,
    })),

  /** Transponder AUTO (with altitude reporting) or STBY, as on the MFD SURV page */
  transponderAuto: (auto: boolean): CrewAction[] => [
    { type: 'BUS_EVENT', topic: 'mfd_xpdr_set_auto', value: auto },
    ...(auto ? [{ type: 'BUS_EVENT', topic: 'mfd_xpdr_set_alt_reporting', value: true } as CrewAction] : []),
  ],

  tcas: (level: keyof typeof TCAS_ALERT_LEVEL): CrewAction[] => [
    { type: 'BUS_EVENT', topic: 'mfd_tcas_alert_level', value: TCAS_ALERT_LEVEL[level] },
  ],

  seatBelts: (on: boolean): CrewAction[] => [{ type: 'SEAT_BELTS', on }],

  wingLights: (on: boolean): CrewAction[] => [{ type: 'WING_LIGHTS', on }],

  apuMaster: (on: boolean): CrewAction[] => [
    { type: 'SET_LOCAL_VAR', name: 'L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', value: on ? 1 : 0 },
  ],

  apuStart: (): CrewAction[] => [{ type: 'SET_LOCAL_VAR', name: 'L:A32NX_OVHD_APU_START_PB_IS_ON', value: 1 }],

  apuBleed: (on: boolean): CrewAction[] => [
    { type: 'SET_LOCAL_VAR', name: 'L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', value: on ? 1 : 0 },
  ],

  /** Pushes the flight director pushbutton of the FCU (toggle) */
  flightDirectorPush: (): CrewAction[] => [{ type: 'KEY_EVENT', name: 'A32NX.FCU_FD_PUSH' }],

  /** Pushes the LS pushbutton of an EFIS control panel (toggle) */
  lsPush: (side: 'L' | 'R'): CrewAction[] => [{ type: 'KEY_EVENT', name: `A32NX.FCU_EFIS_${side}_LS_PUSH` }],

  /** Overlay of the ND (WX, TERR) of an EFIS control panel: 0 = none */
  ndOverlayOff: (side: 'L' | 'R'): CrewAction[] => [
    { type: 'SET_LOCAL_VAR', name: `L:A380X_EFIS_${side}_ACTIVE_OVERLAY`, value: 0 },
  ],

  groundSpoilersArm: (arm: boolean): CrewAction[] => [
    { type: 'KEY_EVENT', name: 'SPOILERS_ARM_SET', value: arm ? 1 : 0 },
  ],

  autobrakeRto: (): CrewAction[] => [{ type: 'PULSE_LOCAL_VAR', name: 'L:A32NX_OVHD_AUTOBRK_RTO_ARM_IS_PRESSED' }],

  autobrakeSelector: (position: AutobrakeSelector): CrewAction[] => [
    { type: 'SET_LOCAL_VAR', name: 'L:A32NX_AUTOBRAKES_SELECTED_MODE', value: position },
  ],

  takeoffConfigTest: (): CrewAction[] => [{ type: 'PULSE_LOCAL_VAR', name: 'L:A32NX_BTN_TOCONFIG' }],

  flaps: (index: number): CrewAction[] => [{ type: 'FLAPS_SET', index }],

  gearDown: (): CrewAction[] => [{ type: 'GEAR_DOWN' }],
};

/** Variables read by the crew to verify the cockpit controls */
export const CockpitStates = {
  strobe: 'L:LIGHTING_STROBE_0',
  landingLights: 'A:LIGHT LANDING:2',
  noseTakeoffLight: 'A:LIGHT LANDING:1',
  noseTaxiLight: 'A:LIGHT TAXI:1',
  runwayTurnoffLights: 'A:LIGHT TAXI:2',
  beacon: 'A:LIGHT BEACON',
  wingLights: 'A:LIGHT WING',
  /** 0 dawn, 1 day, 2 dusk, 3 night */
  timeOfDay: 'E:TIME OF DAY',
  apuAvailable: 'L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE',
  apuMaster: 'L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON',
  apuBleed: 'L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON',
  flightDirector: 'L:A32NX_FCU_FD_LIGHT_ON',
  lsButton: (side: 'L' | 'R') => `L:A380X_EFIS_${side}_LS_BUTTON_IS_ON`,
  ndOverlay: (side: 'L' | 'R') => `L:A380X_EFIS_${side}_ACTIVE_OVERLAY`,
  seatBelts: 'A:CABIN SEATBELTS ALERT SWITCH',
  groundSpoilersArmed: 'L:A32NX_SPOILERS_ARMED',
  autobrakeArmedMode: 'L:A32NX_AUTOBRAKES_ARMED_MODE',
  autobrakeSelector: 'L:A32NX_AUTOBRAKES_SELECTED_MODE',
  tcasMode: 'L:A32NX_TCAS_MODE',
  parkingBrake: 'L:A32NX_PARK_BRAKE_LEVER_POS',
  /** In radians */
  rudderTrim: 'A:RUDDER TRIM',
  engineAntiIce: (engine: number) => `A:ENG ANTI ICE:${engine}`,
  wingAntiIce: 'A:STRUCTURAL DEICE SWITCH',
  engineState: (engine: number) => `L:A32NX_ENGINE_STATE:${engine}`,
  flapsLever: 'L:A32NX_FLAPS_HANDLE_INDEX',
  gearLever: 'L:A32NX_GEAR_HANDLE_POSITION',
  decisionHeight: 'L:AIRLINER_DECISION_HEIGHT',
  minimumDescentAltitude: 'L:AIRLINER_MINIMUM_DESCENT_ALTITUDE',
} as const;

/** Actions of the test section of the flyPad */
export const TestActions: Record<VirtualCrewTestActionId, CrewAction[]> = {
  strobeOn: CockpitControls.strobe('ON'),
  strobeAuto: CockpitControls.strobe('AUTO'),
  landingLightsOn: CockpitControls.landingLights(true),
  landingLightsOff: CockpitControls.landingLights(false),
  noseTakeoff: CockpitControls.noseLight('TO'),
  noseTaxi: CockpitControls.noseLight('TAXI'),
  noseOff: CockpitControls.noseLight('OFF'),
  runwayTurnoffOn: CockpitControls.runwayTurnoffLights(true),
  runwayTurnoffOff: CockpitControls.runwayTurnoffLights(false),
  xpdrAuto: CockpitControls.transponderAuto(true),
  xpdrStby: CockpitControls.transponderAuto(false),
  tcasTaRa: CockpitControls.tcas('TARA'),
  tcasStby: CockpitControls.tcas('STBY'),
  // the double cycle is a workflow, tested here with its first two toggles
  seatBeltsCycle: [...CockpitControls.seatBelts(false), ...CockpitControls.seatBelts(true)],
  spoilersArm: CockpitControls.groundSpoilersArm(true),
  spoilersDisarm: CockpitControls.groundSpoilersArm(false),
  autobrakeRto: CockpitControls.autobrakeRto(),
  autobrakeLow: CockpitControls.autobrakeSelector(AutobrakeSelector.Low),
  autobrakeDisarm: CockpitControls.autobrakeSelector(AutobrakeSelector.Disarm),
  toConfigTest: CockpitControls.takeoffConfigTest(),
  wingLightsOn: CockpitControls.wingLights(true),
  wingLightsOff: CockpitControls.wingLights(false),
  apuBleedOn: CockpitControls.apuBleed(true),
  flightDirectorPush: CockpitControls.flightDirectorPush(),
  lsPush: [...CockpitControls.lsPush('L'), ...CockpitControls.lsPush('R')],
};
