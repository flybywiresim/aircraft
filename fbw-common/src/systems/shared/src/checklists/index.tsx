/* eslint-disable no-underscore-dangle */
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { getAircraftType } from '@flybywiresim/fbw-sdk';
import {
    afterLandingChecklistA32NX,
    afterStartChecklistA32NX,
    approachChecklistA32NX,
    beforeStartChecklistA32NX,
    cockpitPreparationChecklistA32NX,
    landingChecklistA32NX,
    lineUpChecklistA32NX,
    parkingChecklistA32NX,
    securingAircraftChecklistA32NX,
    taxiChecklistA32NX,
} from './A32NX_Checklists';
import {
    afterLandingChecklistA380X,
    afterStartChecklistA380X,
    afterTakeoffChecklistA380X,
    approachChecklistA380X,
    beforeStartChecklistA380X,
    beforeTakeoffChecklistA380X,
    landingChecklistA380X,
    parkingChecklistA380X,
    securingAircraftChecklistA380X,
} from './A380X_Checklists';

/**
 * @brief Checklist item types.
 *
 * @item A checklist item - this is considered the default type if no type is given.
 * @line A line break (above/below the line).
 * @sublistheader A sublist header.
 * @sublistitem A sublist item
 */
export enum ChecklistItemType {
    ITEM,
    LINE,
    SUBLISTHEADER,
    SUBLISTITEM
}

/**
 * @brief Checklist item definition.
 *
 * @type Type of the item @see ChecklistItemType. If not defined, the default type is assumed to be ITEM.
 * @item The item to be checked.
 * @action An optional string to grammatically correctly describe the action to perform for the item.
 *         If not defined, the result string will be used.
 * @result The result string of the item check.
 * @condition An optional condition to check if the item is completed. If the condition returns true, the item is considered completed.
 */
export interface ChecklistItem {
    type?: ChecklistItemType;
    item: string;
    action?: string;
    result: string;
    condition?: () => boolean;
}

/**
 * @brief Checklist definition.
 *
 * @name Name of the checklist.
 * @items The items in the checklist.
 */
export interface ChecklistDefinition {
    name: string;
    items: ChecklistItem[];
}

export const CHECKLISTS_A32NX: ChecklistDefinition[] = [
    cockpitPreparationChecklistA32NX,
    beforeStartChecklistA32NX,
    afterStartChecklistA32NX,
    taxiChecklistA32NX,
    lineUpChecklistA32NX,
    approachChecklistA32NX,
    landingChecklistA32NX,
    afterLandingChecklistA32NX,
    parkingChecklistA32NX,
    securingAircraftChecklistA32NX,
];

export const CHECKLISTS_A380X: ChecklistDefinition[] = [
    beforeStartChecklistA380X,
    afterStartChecklistA380X,
    beforeTakeoffChecklistA380X,
    afterTakeoffChecklistA380X,
    approachChecklistA380X,
    landingChecklistA380X,
    afterLandingChecklistA380X,
    parkingChecklistA380X,
    securingAircraftChecklistA380X,
];

/**
 * @brief Get the checklists for the current aircraft (A32NX or A380X)
 *
 * FIXME: use the correct getAircraftType function once PR #8500 is merged
 */
export function getAircraftChecklists() {
    switch (getAircraftType()) {
    case 'a32nx':
        return CHECKLISTS_A32NX;
    case 'a380x':
        return CHECKLISTS_A380X;
    default:
        console.error('Unknown aircraft type for checklists');
        return [];
    }
}
