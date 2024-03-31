// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { getAircraftType } from '@flybywiresim/fbw-sdk';

enum ChecklistItemType {
    ITEM,
    LINE,
    SUBLISTHEADER,
    SUBLISTITEM
}

interface ChecklistItem {
    item: string;
    result: string;
    type?: ChecklistItemType;
    action?: string;
    condition?: string;
}

interface ChecklistJsonDefinition {
    name: string;
    items: ChecklistItem[];
}

export class ChecklistReader {
    private static readonly commentKey = '//';

    aircraft: string;

    constructor() {
        this.aircraft = getAircraftType();
        console.log(`Aircraft type: ${this.aircraft}`);
    }

    public async readChecklist() {
        const checklistJsonFile = `${this.aircraft}_checklists.json`;
        await fetch(`/VFS/${checklistJsonFile}`).then((response) => {
            response.json().then((json) => {
                this.processChecklists(json);
            }).catch((error) => {
                console.error(`Failed to read ${checklistJsonFile} checklists json: `, error);
            });
        });
    }

    public processChecklists(json: any) {
        console.log('Checklist: ', json);

        json = this.removeComments(json);

        console.log('Cleaned: ', json);
    }

    // =============================================================================================
    // Private methods
    // =============================================================================================

    private removeComments(json: any) :any {
        if (typeof json !== 'object') return json;

        // remove comments from this level
        const props = Object.getOwnPropertyNames(json);
        for (const prop of props) {
            if (prop === ChecklistReader.commentKey) {
                console.log('Comment: ', json[prop]);
                delete json[prop];
            }
        }

        // remove comments from nested objects
        for (const prop of props) {
            if (typeof json[prop] === 'object') {
                json[prop] = this.removeComments(json[prop]);
            }
        }

        return json;
    }
}
