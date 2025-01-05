// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * The ConditionType interface represents a condition and its associated result.
 *
 * @field condition - SimVar or LVar name which will be read as Number
 * @field result - the desired result for the SimVar/LVar for the condition to be true
 * @field comp - comparator to compare the var with the result (one of NE, LT, LE, EQ, GE, GT)
 *
 * @exmaple
 * ```json
 * {
 *   varName: "L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB",
 *   result: 1,
 *   comp: "EQ"
 * },
 * ```
 */
export interface ConditionType {
  varName: string;
  result: number;
  comp?: string;
}

/**
 * Interface for an item in a checklist.
 *
 * @field item - The text description of the checklist item. This is the default and can be omitted.
 * @field result - The string for the expected result for the checklist item.
 * @field type - optional - The type of the checklist item.
 * @field action - option - The string for the action to be performed (if not defined the result string is used).
 * @field condition - optional - list of SimVar or LVar names and desired results pairs - all need to evaluate
 *                               to true for the condition to be true.
 *
 * @example
 * ```json
 * {
 *     "item": "ADIRS NAV",
 *     "action": "SET TO NAV",
 *     "result": "NAV",
 *     "condition": [
 *       {
 *         varName: "L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB",
 *         result: 1
 *       },
 *       {
 *         varName: "L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB",
 *         result: 1
 *       },
 *       {
 *         varName: "L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB",
 *         result: 1
 *       },
 *     ]
 *   },
 * ```
 */
export interface ChecklistItem {
  item: string;
  result: string;
  type?: string;
  action?: string;
  condition?: ConditionType[];
}

/**
 * Interface for JSON definition of a checklist.
 *
 * @field name - The name of the checklist.
 * @field flightPhase - The flight phase for which the checklist is applicable.
 * @field items - The array of checklist items in the checklist.
 * Each item follows the structure defined in {@link ChecklistItem}.
 */
export interface ChecklistJsonDefinition {
  name: string;
  flightphase: number;
  items: ChecklistItem[];
}
