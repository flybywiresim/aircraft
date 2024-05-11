// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConditionType } from '@flybywiresim/fbw-sdk';
import JSON5 from 'json5';
import { ChecklistItem, ChecklistJsonDefinition } from './ChecklistInterfaces';

/**
 * @brief ChecklistReader is a singleton class that reads checklist data from a JSON file.
 *
 * Get the singleton instance via getInstance()
 */
export class ChecklistProvider {
  private readonly configFilename: string;

  private static instance: ChecklistProvider = undefined;

  private checklists: ChecklistJsonDefinition[] = [];

  /**
   * Returns the singleton instance of the ChecklistProvider class.
   *
   * @returns {ChecklistProvider} The ChecklistProvider instance.
   */
  public static getInstance(): ChecklistProvider {
    if (this.instance) return this.instance;
    this.instance = new ChecklistProvider();
    return this.instance;
  }

  /**
   * Reads the checklist from a JSON file.
   *
   * The checklist is read and processed only once and cached for subsequent calls.
   *
   * @return {Promise<ChecklistJsonDefinition[]>} A promise that resolves with an array of ChecklistJsonDefinition
   *                                              objects representing the checklists.
   */
  public async readChecklist(): Promise<ChecklistJsonDefinition[]> {
    if (this.checklists.length > 0) {
      return this.checklists;
    }

    await fetch(this.configFilename).then((response) => {
      response
        .text()
        .then((rawData) => {
          this.processChecklistJson(rawData);
        })
        .catch((error) => {
          console.error(`Failed to read ${this.configFilename} checklists raw data: `, error);
        });
    });
    return this.checklists;
  }

  // =============================================================================================
  // Private methods
  // =============================================================================================

  private constructor() {
    this.configFilename = `/VFS/config/${process.env.AIRCRAFT_PROJECT_PREFIX}/${process.env.AIRCRAFT_VARIANT}/checklists.json5`;
  }

  /**
   * Process the checklist JSON5 data and issue a warning if the JSON5 data is invalid.
   *
   * @param {string} rawData - The raw JSON data to process.
   */
  private processChecklistJson(rawData: string) {
    try {
      const json = JSON5.parse(rawData);
      this.processChecklists(json);
    } catch (error) {
      console.error(`Failed to parse ${this.configFilename} checklists as JSON5: `, error);
    }
  }

  /**
   * Processes the checklists from the given JSON object.
   *
   * The checklists are processed and added to the checklists-array.
   * Invalid checklists are logged as warnings and ignored..
   *
   * @param {any} json - The JSON object containing the checklists.
   */
  private processChecklists(json: any) {
    const checklists: ChecklistJsonDefinition[] = json.checklists;
    // check each checklist's items for validity and add valid checklists to the checklist's array
    checklists.forEach((checklist, _) => {
      const checklistItems = [];
      const items: ChecklistItem[] = checklist.items;
      items.forEach((checklistItem, _) => {
        if (this.isValidChecklistItem(checklistItem)) {
          checklistItems.push(checklistItem);
          return;
        }
        console.warn(`Invalid checklist item in list ${checklist.name}: `, checklistItem);
      });
      this.checklists.push({
        name: checklist.name,
        items: checklistItems,
        flightphase: checklist.flightphase,
      });
    });
  }

  /**
   * Verifying a json checklist item for correct definition
   *
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
        if (
          c.varName === undefined ||
          c.result === undefined ||
          (c.comp !== undefined &&
            c.comp !== 'NE' &&
            c.comp !== 'LT' &&
            c.comp !== 'LE' &&
            c.comp !== 'EQ' &&
            c.comp !== 'GE' &&
            c.comp !== 'GT')
        ) {
          console.warn('Error in ChecklistItem definition: invalid condition: ', condition);
          return false;
        }
        return true;
      });
    }

    if (
      checklistItem.type !== undefined &&
      typeof checklistItem.type !== 'string' &&
      checklistItem.type !== 'ITEM' &&
      checklistItem.type !== 'LINE' &&
      checklistItem.type !== 'SUBLISTHEADER' &&
      checklistItem.type !== 'SUBLISTITEM'
    ) {
      console.warn('Error in ChecklistItem definition: invalid type: ', checklistItem);
      return false;
    }

    return true;
  }
}
