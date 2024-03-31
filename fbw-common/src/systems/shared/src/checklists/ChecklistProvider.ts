// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConditionType, getAircraftType } from '@flybywiresim/fbw-sdk';
import JSON5 from 'json5';
import { ChecklistJsonDefinition, ChecklistItem } from './ChecklistInterfaces';

/**
 * @brief ChecklistReader is a singleton class that reads checklist data from a JSON file.
 *
 * Get the singleton instance via getInstance()
 */
export class ChecklistProvider {
    private readonly configFilename: string;

    private static instance:ChecklistProvider = undefined;

    private checklists: ChecklistJsonDefinition[] = [];

    public static getInstance():ChecklistProvider {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ChecklistProvider();
        return this.instance;
    }

    public async readChecklist(): Promise<ChecklistJsonDefinition[]> {
        if (this.checklists.length > 0) {
            return this.checklists;
        }
        await fetch(this.configFilename).then((response) => {
            response.text().then((rawData) => {
                this.processChecklistJson(rawData);
            }).catch((error) => {
                console.error(`Failed to read ${this.configFilename} checklists raw data: `, error);
            });
        });
        return this.checklists;
    }

    // =============================================================================================
    // Private methods
    // =============================================================================================

    private constructor() {
        const aircraft = getAircraftType();
        this.configFilename = `/VFS/${aircraft}_checklists.json5`;
    }

    private processChecklistJson(rawData: string) {
        try {
            const json = JSON5.parse(rawData);
            this.processChecklists(json);
        } catch (error) {
            this.handleJsonParseError(error);
        }
    }

    private processChecklists(json: any) {
        const checklists:ChecklistJsonDefinition[] = json.checklists;
        checklists.forEach((checklist, _) => {
            const checklistItems = [];
            const items:ChecklistItem[] = checklist.items;
            items.forEach((checklistItem, _) => {
                if (this.isValidChecklistItem(checklistItem)) {
                    checklistItems.push(checklistItem);
                    return;
                }
                console.warn(`Invalid checklist in list ${checklist.name}: `, checklistItem);
            });
            this.checklists.push({
                name: checklist.name,
                items: checklistItems,
            });
        });
    }

    private handleJsonParseError(error: Error) {
        console.error(`Failed to parse ${this.configFilename} checklists as JSON5: `, error);
    }

    /**
     * Smoke testing a json checklist item for correct definition
     *      *
     * @param checklistItem the json checklist item to check
     */
    private isValidChecklistItem(checklistItem: any): checklistItem is ChecklistItem {
        if (checklistItem.item === undefined || typeof checklistItem.item !== 'string') {
            console.warn('Error in ChecklistItem definition: missing or invalid item: ', checklistItem);
            return false;
        }

        if (checklistItem.result === undefined || typeof checklistItem.result !== 'string') {
            console.warn('Error in ChecklistItem definition: missing or invalid result: ', checklistItem);
            return false;
        }

        if (checklistItem.action !== undefined && typeof checklistItem.action !== 'string') {
            console.warn('Error in ChecklistItem definition: invalid action: ', checklistItem);
            return false;
        }

        if (checklistItem.condition !== undefined && typeof checklistItem.condition !== 'object') {
            const condition: ConditionType[] = checklistItem.condition;
            return condition.every((c) => {
                if (c.varName === undefined
                   || c.result === undefined
                   || (c.comp !== undefined
                       && c.comp !== 'NE'
                       && c.comp !== 'LT'
                       && c.comp !== 'LE'
                       && c.comp !== 'EQ'
                       && c.comp !== 'GE'
                       && c.comp !== 'GT')) {
                    console.warn('Error in ChecklistItem definition: invalid condition: ', condition);
                    return false;
                }
                return true;
            });
        }

        if (checklistItem.type !== undefined && typeof checklistItem.type !== 'string'
            && checklistItem.type !== 'ITEM'
            && checklistItem.type !== 'LINE'
            && checklistItem.type !== 'SUBLISTHEADER'
            && checklistItem.type !== 'SUBLISTITEM') {
            console.warn('Error in ChecklistItem definition: invalid type: ', checklistItem);
            return false;
        }

        return true;
    }
}
