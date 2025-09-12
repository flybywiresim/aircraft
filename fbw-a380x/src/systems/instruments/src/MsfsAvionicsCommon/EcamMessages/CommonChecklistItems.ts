// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ChecklistSpecialItem, ChecklistLineStyle } from '.';

export const FMS_PRED_UNRELIABLE_CHECKLIST_ITEM: ChecklistSpecialItem = {
  name: 'FMS PRED UNRELIABLE', // TODO Replace with FMS PRED UNRELIABLE WITHOUT ACCURATE FMS FUEL PENALTY INSERTION once multiple lines supported
  sensed: false,
  style: ChecklistLineStyle.Green,
};

export const SLATS_SLOW_CHECKLIST_ITEM: ChecklistSpecialItem = {
  name: 'SLATS SLOW',
  sensed: false,
};

export const FLAPS_SLOW_CHECKLIST_ITEM: ChecklistSpecialItem = {
  name: 'FLAPS SLOW',
  sensed: false,
};

export const LDG_PERF_AFFECTED_CHECKLIST_ITEM: ChecklistSpecialItem = {
  name: 'LDG PERF AFFECTED',
  sensed: false,
};

export const FUEL_CONSUMPT_INCRSD_CHECKLIST_ITEM: ChecklistSpecialItem = {
  name: 'FUEL CONSUMPT INCRSD',
  sensed: false,
};

export const STEER_ENDURANCE_LIMITED_CHECKLIST_ITEM: ChecklistSpecialItem = {
  name: 'FOR TAXI: STEER ENDURANCE LIMITED',
  sensed: false,
};
