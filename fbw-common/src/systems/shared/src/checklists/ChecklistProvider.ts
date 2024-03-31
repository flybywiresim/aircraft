// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { getAircraftType } from '@flybywiresim/fbw-sdk';
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
        let json: any;
        try {
            json = JSON5.parse(rawData);
            this.processChecklists(json);
        } catch (error) {
            this.handleJsonParseError(error);
        }
    }

    private processChecklists(json: any) {
        const checklists:ChecklistJsonDefinition[] = json.checklists;
        checklists.forEach((cl, _) => {
            const checklistItems = [];
            const items:ChecklistItem[] = cl.items;
            items.forEach((item, _) => {
                if (this.isValidChecklistItem(item)) {
                    checklistItems.push(item);
                    return;
                }
                console.warn(`Invalid checklist in list ${cl.name}: `, item);
            });
            this.checklists.push({
                name: cl.name,
                items: checklistItems,
            });
        });
    }

    private handleJsonParseError(error: Error) {
        console.error(`Failed to parse ${this.configFilename} checklists as JSON5: `, error);
    }

    private isValidChecklistItem(object: any): object is ChecklistItem {
        if (object.item === undefined || typeof object.item !== 'string') {
            console.warn('Error in ChecklistItem definition: missing or invalid item: ', object);
            return false;
        }

        if (object.result === undefined || typeof object.result !== 'string') {
            console.warn('Error in ChecklistItem definition: missing or invalid result: ', object);
            return false;
        }

        if (object.action !== undefined && typeof object.action !== 'string') {
            console.warn('Error in ChecklistItem definition: invalid action: ', object);
            return false;
        }

        if (object.condition !== undefined && typeof object.condition !== 'object') {
            console.warn('Error in ChecklistItem definition: invalid condition: ', object);
            return false;
        }

        if (object.type !== undefined && typeof object.type !== 'string'
            && object.type !== 'ITEM'
            && object.type !== 'LINE'
            && object.type !== 'SUBLISTHEADER'
            && object.type !== 'SUBLISTITEM') {
            console.warn('Error in ChecklistItem definition: invalid type: ', object);
            return false;
        }

        return true;
    }
}
