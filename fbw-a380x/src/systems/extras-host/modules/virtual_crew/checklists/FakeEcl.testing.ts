// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Checklist } from './Checklists';
import { ECL_CL_COMPLETE_LINE, EclState, EcpButton } from './ChecklistRunner';

/** IDs of the normal procedures of the ECL (EcamNormalProcedures), listed in the menu by ascending ID */
const FIRST_ECL_ID = 1000001;
const LAST_ECL_ID = 1000014;

const CL_RESET_LINE = -6;

/** Test helper: minimal model of the normal checklists of the FWS (FwsNormalChecklists / ProcedureLinesGenerator) */
export class FakeEcl {
  public shown = false;

  public checklistId = 0;

  public selectedLine = 0;

  public readonly states = new Map<number, { itemsChecked: boolean[]; procedureCompleted: boolean }>();

  /** Values of the sensed items by ECL ID */
  public readonly sensed = new Map<number, (boolean | null)[]>();

  public frozen = false;

  /** Sub headlines by ECL ID, not selectable */
  private readonly headlines = new Map<number, boolean[]>();

  /**
   * @param checklists the checklists of the ECL; the menu also lists the other normal procedures of the ECL (e.g. the
   * deferred procedures), as the FWS does, from {@link FIRST_ECL_ID} to {@link LAST_ECL_ID}
   */
  constructor(checklists: Checklist[]) {
    for (let id = FIRST_ECL_ID; id <= LAST_ECL_ID; id++) {
      this.states.set(id, { itemsChecked: [], procedureCompleted: false });
      this.sensed.set(id, []);
      this.headlines.set(id, []);
    }
    for (const checklist of checklists) {
      this.states.set(checklist.eclId, {
        itemsChecked: checklist.items.map(() => false),
        procedureCompleted: false,
      });
      this.sensed.set(
        checklist.eclId,
        checklist.items.map((item) => (item.sensed ? false : null)),
      );
      this.headlines.set(
        checklist.eclId,
        checklist.items.map((item) => !!item.headline),
      );
    }
  }

  public get state(): EclState {
    this.updateSensed();
    return {
      shown: this.shown,
      checklistId: this.checklistId,
      selectedLine: this.selectedLine,
      checklists: this.states,
    };
  }

  public setSensed(eclId: number, index: number, value: boolean): void {
    this.sensed.get(eclId)![index] = value;
    this.updateSensed();
  }

  public press(button: EcpButton): void {
    if (this.frozen) {
      return;
    }
    const ids = [...this.states.keys()].sort((a, b) => a - b);
    switch (button) {
      case 'CL':
        this.shown = !this.shown;
        this.checklistId = 0;
        this.selectFirst();
        break;
      case 'DOWN':
        if (this.checklistId === 0) {
          this.selectedLine = Math.min(this.selectedLine + 1, ids.length - 1);
        } else {
          this.moveDown();
        }
        break;
      case 'UP':
        if (this.checklistId === 0) {
          this.selectedLine = Math.max(this.selectedLine - 1, 0);
        } else if (this.selectedLine === CL_RESET_LINE) {
          this.selectedLine = ECL_CL_COMPLETE_LINE;
        } else {
          const selectable = this.selectable();
          const previous = selectable.filter((i) => i < this.selectedLine || this.selectedLine < 0);
          this.selectedLine = previous[previous.length - 1] ?? 0;
        }
        break;
      case 'CHECK': {
        if (this.checklistId === 0) {
          this.checklistId = ids[this.selectedLine];
          this.selectFirst();
          break;
        }
        const state = this.states.get(this.checklistId)!;
        const sensed = this.sensed.get(this.checklistId)!;
        if (this.selectedLine >= 0 && sensed[this.selectedLine] === null) {
          state.itemsChecked[this.selectedLine] = !state.itemsChecked[this.selectedLine];
          this.moveDown();
        } else if (this.selectedLine === ECL_CL_COMPLETE_LINE) {
          state.procedureCompleted = true;
          state.itemsChecked = state.itemsChecked.map((value, i) => (sensed[i] === null ? true : value));
        }
        break;
      }
    }
  }

  private updateSensed(): void {
    this.sensed.forEach((values, eclId) => {
      const state = this.states.get(eclId)!;
      values.forEach((value, i) => {
        if (value !== null) {
          state.itemsChecked[i] = value;
        }
      });
    });
  }

  private selectable(): number[] {
    const state = this.states.get(this.checklistId)!;
    const sensed = this.sensed.get(this.checklistId)!;
    const headlines = this.headlines.get(this.checklistId) ?? [];
    return state.itemsChecked
      .map((_, i) => i)
      .filter((i) => !headlines[i] && !(sensed[i] !== null && state.itemsChecked[i]));
  }

  private selectFirst(): void {
    if (this.checklistId === 0) {
      const ids = [...this.states.keys()].sort((a, b) => a - b);
      const first = ids.findIndex((id) => !this.states.get(id)!.procedureCompleted);
      this.selectedLine = first === -1 ? 0 : first;
      return;
    }
    const state = this.states.get(this.checklistId)!;
    if (state.procedureCompleted) {
      this.selectedLine = CL_RESET_LINE;
      return;
    }
    const unchecked = this.selectable().filter((i) => !state.itemsChecked[i]);
    this.selectedLine = unchecked[0] ?? ECL_CL_COMPLETE_LINE;
  }

  private moveDown(): void {
    const selectable = this.selectable();
    if (this.selectedLine === ECL_CL_COMPLETE_LINE) {
      this.selectedLine = CL_RESET_LINE;
    } else if (this.selectedLine >= 0) {
      this.selectedLine = selectable.find((i) => i > this.selectedLine) ?? ECL_CL_COMPLETE_LINE;
    }
  }
}
