// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { verify, Workflow, WorkflowStep } from './Workflow';

/*
 * Workflows of the FBW A380X SOP (3 DEC 2021), "Preliminary Cockpit Preparation" and "Cockpit Preparation".
 * Items are only automated when the cockpit control can be operated reliably through a variable or an event.
 * The other items take the time of the crew member and are marked "(not automated yet)" when they change a setting.
 */

/** IR mode selector: 0 = OFF, 1 = NAV, 2 = ATT */
const irToNav = (id: number): WorkflowStep => ({
  item: `IR ${id} MODE ... NAV`,
  durationMs: 1500,
  condition: (read) => read(`L:A32NX_OVHD_ADIRS_IR_${id}_MODE_SELECTOR_KNOB`) === 0,
  actions: [{ type: 'SET_LOCAL_VAR', name: `L:A32NX_OVHD_ADIRS_IR_${id}_MODE_SELECTOR_KNOB`, value: 1 }],
});

/** SOP p. 5-6, "Aircraft Status Verification" (captain) */
export const AircraftStatusWorkflow: Workflow = {
  id: 'aircraftStatus',
  seat: 'CAPT',
  steps: [
    verify('RCL ... PRESS (3 s)', 4000),
    verify('CLEARED or CANCELLED ALERTS ... CHECK', 6000),
    verify('MEL/CDL ITEMS ... CHECK and NOTE CDL', 8000),
    verify('AIRCRAFT ACCEPTANCE ... PERFORM', 6000),
  ],
};

/**
 * SOP p. 6-7, "Fire tests and APU startup" (first officer).
 * The APU start is left to the captain: APU MASTER SWITCH and APU START are not part of the virtual crew workflow.
 */
export const FireTestsWorkflow: Workflow = {
  id: 'fireTests',
  seat: 'FO',
  steps: [
    verify('RMP 1 and 2 ... ON'),
    verify('COMMUNICATION FREQUENCIES ... TUNE (not automated yet)', 4000),
    verify('APU FIRE ... CHECK IN and GUARDED'),
    verify('APU AGENT ... OFF'),
    verify('ENGINE 1(2)(3)(4) FIRE ... CHECK IN and GUARDED', 4000),
    verify('ENGINE 1(2)(3)(4) AGENT 1 and 2 ... OFF', 3000),
    verify('FIRE TEST ... PRESS and CHECK (not automated yet)', 8000),
    verify('EXTERNAL POWER ... AS REQUIRED'),
  ],
};

/**
 * SOP "Exterior Walkaround", by the first officer after the preliminary cockpit preparation: the first officer goes
 * out, the walkaround itself takes place outside of the cockpit (see {@link WalkaroundReturnWorkflow})
 */
export const WalkaroundWorkflow: Workflow = {
  id: 'walkaround',
  seat: 'FO',
  steps: [
    {
      item: 'EXTERIOR WALKAROUND ... START',
      durationMs: 2000,
      speech: [
        { role: 'PM', line: 'walkaroundGoingOut' },
        { role: 'PF', line: 'okay' },
      ],
    },
  ],
};

/** End of the exterior walkaround: the first officer is back in the cockpit */
export const WalkaroundReturnWorkflow: Workflow = {
  id: 'walkaround',
  seat: 'FO',
  steps: [
    {
      item: 'EXTERIOR WALKAROUND ... COMPLETED',
      durationMs: 1000,
      speech: [
        { role: 'PM', line: 'walkaroundBack' },
        { role: 'PF', line: 'thankYou' },
      ],
    },
  ],
};

/** SOP p. 7-9, "Overhead Panel" (first officer) */
export const OverheadPanelWorkflow: Workflow = {
  id: 'overheadPanel',
  seat: 'FO',
  steps: [
    verify('ALL WHITE LIGHTS ... OFF', 5000),
    {
      item: 'RCDR GND CTL ... ON',
      durationMs: 2000,
      condition: (read) => read('L:A32NX_RCDR_GROUND_CONTROL_ON') === 0,
      actions: [{ type: 'SET_LOCAL_VAR', name: 'L:A32NX_RCDR_GROUND_CONTROL_ON', value: 1 }],
    },
    verify('EVAC CAPT/CAPT & PURS ... CAPTAIN'),
    verify('PROBE & WINDOW HEAT ... AUTO'),
    irToNav(1),
    irToNav(2),
    irToNav(3),
    verify('ELT ... ARMED'),
    verify('RESET BUTTONS (left side) ... CHECK', 3000),
    verify('STROBE ... AUTO (not automated yet)'),
    verify('BEACON ... OFF'),
    verify('NAV ... ON (not automated yet)'),
    verify('SEAT BELTS ... ON (not automated yet)'),
    verify('NO SMOKING ... AUTO (not automated yet)'),
    verify('EMER EXIT LT ... ARM (not automated yet)'),
    verify('ENGINE START ... NORM'),
    verify('AIR FLOW ... NORM'),
    verify('CKPT TEMP ... AS REQUIRED'),
    verify('ELEC DC SD PAGE ... DISPLAY', 3000),
    verify('TRIM TK FEED ... AUTO'),
    verify('MAINTENANCE PANEL LIGHTS ... OFF'),
    verify('CARGO AIR COND ... AS REQUIRED'),
    verify('RMP 3 ... ON'),
    verify('CVR TEST ... PRESS (not automated yet)', 6000),
    verify('RESET BUTTONS (right side) ... CHECK', 3000),
  ],
};

/** SOP p. 9-10, "Main Instrument Panel" and "Pedestal" (first officer) */
export const PedestalWorkflow: Workflow = {
  id: 'pedestal',
  seat: 'FO',
  steps: [
    verify('SWITCHING SELECTORS ... NORM'),
    verify('ISIS ... CHECK', 4000),
    verify('L/G GRVTY ... OFF'),
    verify('CLOCK ... CHECK and SET'),
    verify('A-SKID ... ON (not automated yet)'),
    {
      item: 'PARKING BRAKE ... ON',
      durationMs: 2000,
      condition: (read) => read('L:A32NX_PARK_BRAKE_LEVER_POS') === 0,
      actions: [{ type: 'SET_LOCAL_VAR', name: 'L:A32NX_PARK_BRAKE_LEVER_POS', value: 1 }],
    },
    verify('BODY ACCUMULATORS PRESSURE ... CHECK'),
    verify('THRUST LEVERS ... IDLE'),
    verify('THRUST REVERSER LEVERS ... STOWED'),
    verify('ENGINE MASTER 1, 2, 3 AND 4 ... OFF'),
    verify('COCKPIT DOOR SWITCH ... NORM'),
  ],
};

/** SOP p. 17, "Glareshield", Auto Flight System Control Panel (first officer) */
export const GlareshieldWorkflow: Workflow = {
  id: 'glareshield',
  seat: 'FO',
  steps: [
    {
      item: 'FLIGHT DIRECTOR ... ON',
      durationMs: 2000,
      condition: (read) => read('L:A32NX_FCU_FD_LIGHT_ON') === 0,
      actions: [{ type: 'KEY_EVENT', name: 'A32NX.FCU_FD_PUSH' }],
    },
    verify('NORTH REF ... MAG'),
    verify('SPD/MACH, HDG/TRK, V/S/FPA WINDOWS ... DASHED'),
    verify('ALT WINDOW ... INITIAL EXPECTED CLEARANCE ALTITUDE (not automated yet)', 3000),
  ],
};

/** SOP p. 16-17, FMS initialization and AFS CP crosscheck (captain) */
export const FmsCrosscheckWorkflow: Workflow = {
  id: 'fmsCrosscheck',
  seat: 'CAPT',
  steps: [
    verify('FMS INITIALIZATION ... CROSSCHECK', 15000),
    verify('NAV CHARTS CLIPBOARD ... IMPORT', 5000),
    verify('AUTO FLIGHT SYSTEM CONTROL PANEL ... CROSSCHECK', 4000),
  ],
};
