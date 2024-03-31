// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * Enumeration for item types in a checklist.
 *
 * ITEM - Represents a normal checklist item.
 * LINE - Represents a line break in the checklist.
 * SUBLISTHEADER - Represents a header for a sublist in the checklist.
 * SUBLISTITEM - Represents an item inside a sublist in the checklist.
 */
export enum ChecklistItemType {
    ITEM,
    LINE,
    SUBLISTHEADER,
    SUBLISTITEM
}

/**
 * The ConditionType interface represents a condition and its associated result.
 *
 * @field condition - SimVar or LVar name which will be read as Number
 * @field result - the desired result for the SimVar/LVar for the condition to be true
 */
export interface ConditionType {
    varName: string;
    result: number;
}

/**
 * Interface for an item in a checklist.
 *
 * @field item - The text description of the checklist item.
 * @field result - The string for the expected result for the checklist item.
 * @field type - optional - The type of the checklist item (See {@link ChecklistItemType}).
 * @field action - option - The string for the action to be performed (if not defined the result string is used).
 * @field condition - optional - list of pairs of SimVar or LVar names and desired results - all need to evaluate
 *                               to true for the condition to be true.
 */
export interface ChecklistItem {
    item: string;
    result: string;
    type?: ChecklistItemType;
    action?: string;
    condition?: ConditionType[];
}

/**
 * Interface for JSON definition of a checklist.
 *
 * @field name - The name of the checklist.
 * @field items - The array of checklist items in the checklist.
 * Each item follows the structure defined in {@link ChecklistItem}.
 */
export interface ChecklistJsonDefinition {
    name: string;
    items: ChecklistItem[];
}
