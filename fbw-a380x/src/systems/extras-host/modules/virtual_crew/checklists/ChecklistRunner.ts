// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewChecklistStep } from '../../../../shared/src/VirtualCrew';
import { CrewAction, CrewRole, CrewSpeech, SimVarReader } from '../VirtualCrewTypes';
import { Checklist, ChecklistItem } from './Checklists';

/** ID of the first normal checklist of the ECL, the ECL menu lists the checklists by ascending ID */
const FIRST_ECL_CHECKLIST_ID = 1000001;

/** Selected line of the "C/L COMPLETE" line of a normal checklist (SPECIAL_INDEX_NORMAL_CL_COMPLETE in the FWS) */
export const ECL_CL_COMPLETE_LINE = -5;

/** Time between two presses on the ECAM control panel, in milliseconds */
const PRESS_INTERVAL_MS = 700;

/** Pause after a response before the pilot monitoring verifies the item, in milliseconds */
const VERIFY_DELAY_MS = 1200;

/** Pause before the next item is read, in milliseconds */
const NEXT_ITEM_DELAY_MS = 800;

/** Number of presses after which the ECL is considered not operable */
const MAX_PRESSES_PER_STEP = 20;

/** Buttons of the ECAM control panel used to operate the ECL */
export type EcpButton = 'CL' | 'CHECK' | 'UP' | 'DOWN';

/** State of the ECL as published by the FWS */
export interface EclState {
  /** The ECL is displayed on the EWD */
  shown: boolean;
  /** Displayed checklist, 0 for the checklist menu */
  checklistId: number;
  /** Selected line: index in the menu or of the item, negative for the special lines (e.g. C/L COMPLETE) */
  selectedLine: number;
  /** State of the normal checklists by ECL ID */
  checklists: ReadonlyMap<number, { itemsChecked: boolean[]; procedureCompleted: boolean }>;
}

export interface ChecklistOutput {
  speech: CrewSpeech[];
  presses: EcpButton[];
  /** Actions of the pilot monitoring on the aircraft, e.g. the T.O CONFIG test while reading the item */
  actions: CrewAction[];
}

/** Phrases of the response of the pilot flying to an item, which can depend on the aircraft */
export function itemResponse(item: ChecklistItem, read: SimVarReader, role: CrewRole = 'PF'): CrewSpeech[] {
  const lines = typeof item.response === 'function' ? item.response(read) : [item.response];
  return lines.map((line, i) => ({
    role,
    line,
    pauseAfterMs: i < lines.length - 1 ? CHAINED_PAUSE_MS : undefined,
  }));
}

/** Pause between the parts of a composed phrase, in milliseconds */
export const CHAINED_PAUSE_MS = 40;

/**
 * Reads a checklist with the pilot flying, the virtual crew member being the pilot monitoring:
 * 1. the pilot monitoring activates the checklist on the ECL with the ECAM control panel
 * 2. for each item, the pilot monitoring reads the challenge and waits for the response of the pilot flying
 *    (primary button)
 * 3. the pilot monitoring verifies the item: a sensed item must be checked by the FWS, a non sensed item is verified
 *    when possible. On a discrepancy, the pilot monitoring asks to check and waits for a new response, or goes on
 *    once they see the item corrected
 * 4. the pilot monitoring checks the item on the ECL, then completes the checklist (C/L COMPLETE)
 *
 * The ECL is operated in a closed loop: at most one button is pressed per step, after which the published ECL state
 * is observed again.
 */
export class ChecklistRunner {
  private checklist: Checklist | undefined;

  private step = VirtualCrewChecklistStep.None;

  private itemIndex = -1;

  /** Time before which nothing is done, in milliseconds */
  private waitUntil = 0;

  private pressesInStep = 0;

  /** Step to return to once the checklist is open again */
  private afterOpening = VirtualCrewChecklistStep.Reading;

  private pendingResponse = false;

  /** The pilot monitoring still has to respond to a "(BOTH)" item, once verified */
  private secondResponsePending = false;

  /** The response has been given, the pilot monitoring verifies the item before checking it */
  private verifyPending = false;

  /** The last checklist completed, read and cleared by {@link takeCompleted} */
  private completedChecklist: Checklist | undefined;

  public get currentChecklist(): Checklist | undefined {
    return this.checklist;
  }

  public get currentStep(): VirtualCrewChecklistStep {
    return this.step;
  }

  public get currentItemIndex(): number {
    return this.itemIndex;
  }

  /** True while a checklist is being read */
  public get running(): boolean {
    return (
      this.checklist !== undefined &&
      this.step !== VirtualCrewChecklistStep.None &&
      this.step !== VirtualCrewChecklistStep.Failed
    );
  }

  /** True while the pilot monitoring waits for the response of the pilot flying */
  public get awaitingResponse(): boolean {
    return (
      this.step === VirtualCrewChecklistStep.AwaitingResponse || this.step === VirtualCrewChecklistStep.Discrepancy
    );
  }

  /**
   * Starts reading a checklist, the pilot flying requests it
   * @param checklist the checklist
   * @param now the current time in milliseconds
   * @returns the request of the pilot flying
   */
  public start(checklist: Checklist, now: number): ChecklistOutput {
    this.checklist = checklist;
    this.itemIndex = ChecklistRunner.firstItemFrom(checklist, 0);
    this.pendingResponse = false;
    this.secondResponsePending = false;
    this.afterOpening = VirtualCrewChecklistStep.Reading;
    this.enter(VirtualCrewChecklistStep.Opening, now + PRESS_INTERVAL_MS);
    return { speech: [{ role: 'PF', line: checklist.request }], presses: [], actions: [] };
  }

  /** Stops reading the current checklist */
  public cancel(): void {
    this.checklist = undefined;
    this.itemIndex = -1;
    this.step = VirtualCrewChecklistStep.None;
  }

  /** The pilot flying responds to the current item (primary button) */
  public respond(): void {
    if (this.awaitingResponse) {
      this.pendingResponse = true;
    }
  }

  /**
   * Advances the checklist
   * @param now the current time in milliseconds
   * @param ecl the state of the ECL
   * @param read reads simulator variables to verify the items
   * @returns the phrases and the presses on the ECAM control panel
   */
  public update(now: number, ecl: EclState, read: SimVarReader): ChecklistOutput {
    const output: ChecklistOutput = { speech: [], presses: [], actions: [] };
    const checklist = this.checklist;

    if (checklist === undefined || !this.running) {
      return output;
    }

    // the response is handled right away, the pilot monitoring then takes a moment to verify
    if (this.pendingResponse) {
      this.pendingResponse = false;
      const item = checklist.items[this.itemIndex];
      output.speech.push(...itemResponse(item, read));
      this.enter(VirtualCrewChecklistStep.Checking, now + VERIFY_DELAY_MS);
      this.verifyPending = true;
      this.secondResponsePending = item.both === true;
      return output;
    }

    if (now < this.waitUntil) {
      return output;
    }

    switch (this.step) {
      case VirtualCrewChecklistStep.Opening:
        this.open(checklist, ecl, now, output);
        break;

      case VirtualCrewChecklistStep.Reading: {
        const item = checklist.items[this.itemIndex];
        if (item.challenge !== undefined) {
          output.speech.push({ role: 'PM', line: item.challenge });
        }
        output.actions.push(...(item.actionsWhenRead ?? []));
        this.enter(VirtualCrewChecklistStep.AwaitingResponse, now);
        break;
      }

      case VirtualCrewChecklistStep.Checking:
        if (this.verifyPending) {
          this.verifyPending = false;
          if (!this.verify(checklist, ecl, read)) {
            output.speech.push({ role: 'PM', line: 'pleaseCheck' });
            this.enter(VirtualCrewChecklistStep.Discrepancy, now);
            break;
          }
        }
        if (this.secondResponsePending) {
          // "(BOTH)": the pilot monitoring responds in turn, then checks the item
          this.secondResponsePending = false;
          output.speech.push(...itemResponse(checklist.items[this.itemIndex], read, 'PM'));
        }
        this.check(checklist, ecl, now, output);
        break;

      case VirtualCrewChecklistStep.Discrepancy:
        // the pilot monitoring goes on as soon as they see the item corrected, without a new response
        if (this.verify(checklist, ecl, read)) {
          this.enter(VirtualCrewChecklistStep.Checking, now + VERIFY_DELAY_MS);
        }
        break;

      case VirtualCrewChecklistStep.Completing:
        this.complete(checklist, ecl, now, output);
        break;

      default:
        break;
    }

    return output;
  }

  /** Verification of the current item by the pilot monitoring */
  private verify(checklist: Checklist, ecl: EclState, read: SimVarReader): boolean {
    const memoItems = checklist.items[this.itemIndex].memoItems ?? 0;
    if (memoItems > 0) {
      // the ECAM memo: every item of the memo, the sub headline itself is never checked by the FWS
      for (let i = this.itemIndex + 1; i <= this.itemIndex + memoItems; i++) {
        if (!this.verifyItem(checklist, i, ecl, read)) {
          return false;
        }
      }
      return true;
    }
    return this.verifyItem(checklist, this.itemIndex, ecl, read);
  }

  private verifyItem(checklist: Checklist, index: number, ecl: EclState, read: SimVarReader): boolean {
    const item = checklist.items[index];
    if (item.sensed) {
      return ecl.checklists.get(checklist.eclId)?.itemsChecked[index] === true || item.verify?.(read) === true;
    }
    return item.verify?.(read) ?? true;
  }

  /** Activates the checklist on the ECL */
  private open(checklist: Checklist, ecl: EclState, now: number, output: ChecklistOutput): void {
    if (ecl.shown && ecl.checklistId === checklist.eclId) {
      this.enter(this.afterOpening, now + NEXT_ITEM_DELAY_MS);
      return;
    }

    if (!ecl.shown) {
      // opens the ECL menu
      this.press('CL', now, output);
    } else if (ecl.checklistId === 0) {
      // the menu lists the checklists by ascending ID
      const index = checklist.eclId - FIRST_ECL_CHECKLIST_ID;
      if (ecl.selectedLine < index) {
        this.press('DOWN', now, output);
      } else if (ecl.selectedLine > index) {
        this.press('UP', now, output);
      } else {
        this.press('CHECK', now, output);
      }
    } else {
      // another checklist is displayed: close the ECL, it opens with the menu again
      this.press('CL', now, output);
    }
  }

  /** Checks the current item on the ECL, then continues with the next item */
  private check(checklist: Checklist, ecl: EclState, now: number, output: ChecklistOutput): void {
    const item = checklist.items[this.itemIndex];
    const checked = ecl.checklists.get(checklist.eclId)?.itemsChecked[this.itemIndex] === true;

    if (checked || item.sensed) {
      this.nextItem(checklist, now);
      return;
    }

    if (!this.ensureOpen(checklist, ecl, now, VirtualCrewChecklistStep.Checking)) {
      return;
    }

    if (ecl.selectedLine === this.itemIndex) {
      this.press('CHECK', now, output);
    } else if (ecl.selectedLine >= 0 && ecl.selectedLine < this.itemIndex) {
      this.press('DOWN', now, output);
    } else {
      this.press('UP', now, output);
    }
  }

  /** Completes the checklist on the ECL (C/L COMPLETE) */
  private complete(checklist: Checklist, ecl: EclState, now: number, output: ChecklistOutput): void {
    if (ecl.checklists.get(checklist.eclId)?.procedureCompleted) {
      output.speech.push({ role: 'PM', line: checklist.complete });
      this.step = VirtualCrewChecklistStep.None;
      this.completedChecklist = checklist;
      this.checklist = undefined;
      this.itemIndex = -1;
      return;
    }

    if (!this.ensureOpen(checklist, ecl, now, VirtualCrewChecklistStep.Completing)) {
      return;
    }

    if (ecl.selectedLine === ECL_CL_COMPLETE_LINE) {
      this.press('CHECK', now, output);
    } else if (ecl.selectedLine >= 0) {
      this.press('DOWN', now, output);
    } else {
      // below C/L COMPLETE (e.g. C/L RESET)
      this.press('UP', now, output);
    }
  }

  /**
   * Returns the checklist completed since the last call
   * @returns the completed checklist, or undefined
   */
  public takeCompleted(): Checklist | undefined {
    const completed = this.completedChecklist;
    this.completedChecklist = undefined;
    return completed;
  }

  /** Reopens the checklist if it is not displayed anymore (e.g. closed by the pilot flying) */
  private ensureOpen(checklist: Checklist, ecl: EclState, now: number, returnTo: VirtualCrewChecklistStep): boolean {
    if (ecl.shown && ecl.checklistId === checklist.eclId) {
      return true;
    }
    this.afterOpening = returnTo;
    this.enter(VirtualCrewChecklistStep.Opening, now);
    return false;
  }

  /** Index of the first item to read from the given index, sub headlines are not read */
  private static firstItemFrom(checklist: Checklist, index: number): number {
    let i = index;
    while (i < checklist.items.length && checklist.items[i].headline) {
      i++;
    }
    return i;
  }

  private nextItem(checklist: Checklist, now: number): void {
    // the items of the ECAM memo were verified with the memo
    const memoItems = checklist.items[this.itemIndex]?.memoItems ?? 0;
    this.itemIndex = ChecklistRunner.firstItemFrom(checklist, this.itemIndex + 1 + memoItems);
    if (this.itemIndex >= checklist.items.length) {
      this.itemIndex = checklist.items.length - 1;
      this.enter(VirtualCrewChecklistStep.Completing, now + NEXT_ITEM_DELAY_MS);
    } else {
      this.afterOpening = VirtualCrewChecklistStep.Reading;
      this.enter(VirtualCrewChecklistStep.Reading, now + NEXT_ITEM_DELAY_MS);
    }
  }

  private press(button: EcpButton, now: number, output: ChecklistOutput): void {
    if (this.pressesInStep >= MAX_PRESSES_PER_STEP) {
      // the ECL does not react, e.g. FWS or ECP not powered
      this.step = VirtualCrewChecklistStep.Failed;
      return;
    }
    this.pressesInStep++;
    output.presses.push(button);
    this.waitUntil = now + PRESS_INTERVAL_MS;
  }

  private enter(step: VirtualCrewChecklistStep, waitUntil: number): void {
    if (step !== this.step) {
      this.pressesInStep = 0;
    }
    this.step = step;
    this.waitUntil = waitUntil;
  }
}
