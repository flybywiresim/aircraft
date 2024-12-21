// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import {
  AbnormalProcedure,
  ChecklistAction,
  ChecklistCondition,
  ChecklistLineStyle,
  ChecklistSpecialItem,
  DeferredProcedure,
  EcamAbnormalProcedures,
  EcamDeferredProcedures,
  isChecklistAction,
  isChecklistCondition,
  NormalProcedure,
  WdLineData,
  WdSpecialLine,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { ChecklistState } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';

export enum ProcedureType {
  Normal,
  Abnormal,
  Deferred,
}

export interface ProcedureItemInfo {
  procedureItem: ChecklistAction | ChecklistCondition | ChecklistSpecialItem;
  isSelected: boolean;
}

// Reserve -1 for moveDown (start before top of list and move down to select first selectable)
const SPECIAL_INDEX_ACTIVATE = -2;
const SPECIAL_INDEX_DEFERRED_PROC_COMPLETE = -3;
const SPECIAL_INDEX_DEFERRED_PROC_RECALL = -4;
const SPECIAL_INDEX_NORMAL_CL_COMPLETE = -5;
const SPECIAL_INDEX_NORMAL_RESET = -6;
const SPECIAL_INDEX_CLEAR = -7;
const HIGHEST_SPECIAL_INDEX = SPECIAL_INDEX_ACTIVATE;

export class ProcedureLinesGenerator {
  public readonly selectedItemIndex = Subject.create(0);

  private procedure: AbnormalProcedure | NormalProcedure | DeferredProcedure;
  private items: (ChecklistAction | ChecklistCondition | ChecklistSpecialItem)[];

  constructor(
    public procedureId: string,
    public procedureIsActive: Subject<boolean>,
    private type: ProcedureType,
    public checklistState: ChecklistState,
    private itemCheckedCallback?: (newState: ChecklistState) => void,
    private procedureClearedOrResetCallback?: (newState: ChecklistState) => void,
    private procedureCompletedCallback?: (newState: ChecklistState) => void,
    private recommendation?: 'LAND ASAP' | 'LAND ANSA' | undefined,
  ) {
    if (type === ProcedureType.Normal) {
      this.procedure = EcamNormalProcedures[procedureId];
    } else if (type === ProcedureType.Abnormal) {
      this.procedure = EcamAbnormalProcedures[procedureId];
    } else if (type === ProcedureType.Deferred) {
      this.procedure = EcamDeferredProcedures[procedureId];
    }
    this.items = this.procedure.items;
  }

  static readonly nonSelectableItemStyles = [
    ChecklistLineStyle.Headline,
    ChecklistLineStyle.OmissionDots,
    ChecklistLineStyle.SeparationLine,
    ChecklistLineStyle.SubHeadline,
    ChecklistLineStyle.Amber,
    ChecklistLineStyle.Cyan,
    ChecklistLineStyle.Green,
  ];

  static conditionalActiveItems(
    proc: AbnormalProcedure | DeferredProcedure | NormalProcedure,
    itemsChecked: boolean[],
    itemsActive: boolean[],
  ) {
    // Additional logic for conditions: Modify itemsActive based on condition activation status
    if (proc.items.some((v) => isChecklistCondition(v))) {
      proc.items.forEach((v, i) => {
        if (v.level) {
          // Look for parent condition(s)
          let active = true;
          for (let recI = i; recI >= 0; recI--) {
            active =
              (proc.items[recI].level ?? 0) < v.level && isChecklistCondition(proc.items[recI])
                ? active && itemsChecked[recI]
                : active;
          }
          itemsActive[i] = active;
        }
      });
    }
    return itemsActive;
  }

  public numLinesUntilSelected(): number {
    return this.getActualShownItems().findIndex((v) => v === this.sii);
  }

  public numTotalLines(): number {
    return this.getActualShownItems().length;
  }

  private get selectedItem() {
    return this.items[this.selectedItemIndex.get()];
  }

  /** Shorthand for this.selectedItemIndex.get() */
  private get sii() {
    return this.selectedItemIndex.get();
  }

  moveUp() {
    if (!this.checklistState.procedureActivated) {
      this.selectedItemIndex.set(SPECIAL_INDEX_ACTIVATE);
      return;
    }

    const selectable = this.selectableItems(true);

    if (selectable.length === 0) {
      this.selectFirst();
      return;
    }
    const sii = this.selectedItemIndex.get();
    if (sii === SPECIAL_INDEX_NORMAL_RESET) {
      this.selectedItemIndex.set(SPECIAL_INDEX_NORMAL_CL_COMPLETE);
    } else if (
      sii === SPECIAL_INDEX_DEFERRED_PROC_COMPLETE ||
      sii === SPECIAL_INDEX_NORMAL_CL_COMPLETE ||
      sii === SPECIAL_INDEX_CLEAR
    ) {
      this.selectedItemIndex.set(selectable[selectable.length - 1]);
    } else if (sii >= 0) {
      const previousElement = () => {
        for (let i = selectable.length - 1; i >= 0; i--) {
          if (selectable[i] < sii) {
            return selectable[i];
          }
        }
        return -1;
      };
      const pEl = previousElement();

      if (pEl >= 0) {
        this.selectedItemIndex.set(Math.max(pEl, 0));
      }
    }
  }

  moveDown(skipCompletedSensed = true) {
    if (!this.checklistState.procedureActivated) {
      this.selectedItemIndex.set(SPECIAL_INDEX_ACTIVATE);
      return;
    }

    const selectable = this.selectableItems(skipCompletedSensed);
    if (selectable.length == 0 || this.selectedItemIndex.get() >= selectable[selectable.length - 1]) {
      // Last element before first special line (CLEAR etc.)
      if (this.type === ProcedureType.Normal) {
        this.selectedItemIndex.set(SPECIAL_INDEX_NORMAL_CL_COMPLETE);
      } else if (this.type === ProcedureType.Abnormal) {
        this.selectedItemIndex.set(SPECIAL_INDEX_CLEAR);
      } else if (this.type === ProcedureType.Deferred) {
        this.selectedItemIndex.set(
          this.checklistState.procedureCompleted
            ? SPECIAL_INDEX_DEFERRED_PROC_RECALL
            : SPECIAL_INDEX_DEFERRED_PROC_COMPLETE,
        );
      }
    } else {
      const sii = this.selectedItemIndex.get();
      // Check for special lines
      if (sii === SPECIAL_INDEX_NORMAL_CL_COMPLETE) {
        // Do nothing
        this.selectedItemIndex.set(SPECIAL_INDEX_NORMAL_RESET);
      } else if (sii > HIGHEST_SPECIAL_INDEX) {
        this.selectedItemIndex.set(
          Math.min(
            selectable.find((v) => v > this.selectedItemIndex.get()) ?? selectable[selectable.length - 1],
            selectable[selectable.length - 1],
          ),
        );
      }
    }
  }

  checkSelected() {
    const clState: ChecklistState = {
      id: this.checklistState.id,
      procedureActivated: this.checklistState.procedureActivated,
      procedureCompleted: this.checklistState.procedureCompleted,
      itemsToShow: [...this.checklistState.itemsToShow],
      itemsChecked: [...this.checklistState.itemsChecked],
      itemsActive: [...this.checklistState.itemsActive],
    };
    if (
      this.selectedItemIndex.get() >= 0 &&
      this.selectedItemIndex.get() < this.getActualShownItems().length &&
      !this.selectedItem?.sensed
    ) {
      clState.itemsChecked[this.sii] = !clState.itemsChecked[this.sii];
      this.itemCheckedCallback(clState);

      if (clState.itemsChecked[this.sii]) {
        if (isChecklistCondition(this.selectedItem) && this.selectedItem.condition) {
          // Force 'active' status update
          ProcedureLinesGenerator.conditionalActiveItems(this.procedure, clState.itemsChecked, clState.itemsActive);
        }
        this.moveDown(false);
      }
    } else if (this.sii === SPECIAL_INDEX_CLEAR) {
      this.procedureClearedOrResetCallback(clState);
    } else if (this.sii === SPECIAL_INDEX_NORMAL_CL_COMPLETE) {
      clState.procedureCompleted = true;
      clState.itemsChecked = clState.itemsChecked.map((val, index) => (this.items[index].sensed ? val : true));
      this.procedureCompletedCallback(clState);
    } else if (this.sii === SPECIAL_INDEX_NORMAL_RESET) {
      clState.procedureCompleted = false;
      clState.itemsChecked = clState.itemsChecked.map((val, index) => (this.items[index].sensed ? val : false));
      this.procedureClearedOrResetCallback(clState);
    } else if (this.sii === SPECIAL_INDEX_ACTIVATE) {
      clState.procedureActivated = true;
      this.procedureClearedOrResetCallback(clState);
    } else if (this.sii === SPECIAL_INDEX_DEFERRED_PROC_COMPLETE) {
      clState.procedureCompleted = true;
      this.selectedItemIndex.set(SPECIAL_INDEX_DEFERRED_PROC_RECALL);
      this.procedureClearedOrResetCallback(clState);
    } else if (this.sii === SPECIAL_INDEX_DEFERRED_PROC_RECALL) {
      clState.procedureCompleted = false;
      this.selectedItemIndex.set(SPECIAL_INDEX_DEFERRED_PROC_COMPLETE);
      this.procedureClearedOrResetCallback(clState);
    }
    this.checklistState = clState;

    if (this.sii === SPECIAL_INDEX_NORMAL_RESET || this.sii === SPECIAL_INDEX_ACTIVATE) {
      this.selectFirst();
    }
  }

  selectFirst() {
    if (!this.checklistState.procedureActivated) {
      this.selectedItemIndex.set(SPECIAL_INDEX_ACTIVATE);
      return;
    } else if (this.type === ProcedureType.Deferred && this.checklistState.procedureCompleted) {
      this.selectedItemIndex.set(SPECIAL_INDEX_DEFERRED_PROC_RECALL);
      return;
    }

    const selectableAndNotChecked = this.selectableItems(false);
    this.selectedItemIndex.set(
      selectableAndNotChecked[0] !== undefined
        ? selectableAndNotChecked[0] - 1
        : this.checklistState.itemsChecked.length - 1,
    );
    this.moveDown(false);
  }

  private selectableItems(skipCompletedSensed: boolean) {
    return this.procedure.items
      .map((_, index: number) => (this.itemIsSelectable(index, skipCompletedSensed) ? index : null))
      .filter((v) => v !== null);
  }

  private getActualShownItems() {
    const lines = [...this.checklistState.itemsToShow]
      .map((value, index) => (value ? index : null))
      .filter((v) => v !== null);
    this.procedure.items.forEach((v, i) => {
      if (isChecklistCondition(v) && !v.sensed) {
        // CONFIRM line
        lines.splice(i, 0, lines[i]);
        lines[i] = NaN;
      }
    });
    if (this.recommendation) {
      lines.splice(0, 0, NaN);
    }

    return lines;
  }

  /**
   * Used for up/down navigation, to skip not selectable items
   * @param skipCompletedSensed Whether sensed item is only selectable if unchecked. Not sensed items can't be skipped.
   * @returns Procedure item is selectable with arrow keys
   */
  private itemIsSelectable(itemIndex: number, skipCompletedSensed: boolean): boolean {
    return (
      (!this.items[itemIndex].sensed || (!skipCompletedSensed && !this.checklistState.itemsChecked[itemIndex])) &&
      this.checklistState.itemsActive[itemIndex] &&
      this.checklistState.itemsToShow[itemIndex] &&
      !ProcedureLinesGenerator.nonSelectableItemStyles.includes(this.items[itemIndex].style)
    );
  }

  public toLineData(): WdLineData[] {
    const lineData: WdLineData[] = [];

    const isAbnormalOrDeferred = this.type === ProcedureType.Abnormal || this.type === ProcedureType.Deferred;
    const isAbnormal = this.type === ProcedureType.Abnormal;
    const isDeferred = this.type === ProcedureType.Deferred;

    lineData.push({
      abnormalProcedure: isAbnormalOrDeferred,
      activeProcedure: this.procedureIsActive.get(),
      sensed: true,
      checked: false,
      text: this.procedure.title,
      style: ChecklistLineStyle.Headline,
      firstLine: !isDeferred,
      lastLine: this.procedureIsActive.get() ? false : true,
    });

    if (!isAbnormal || this.procedureIsActive.get()) {
      if (this.recommendation) {
        lineData.push({
          abnormalProcedure: isAbnormalOrDeferred,
          activeProcedure: this.procedureIsActive.get() || !isAbnormal,
          sensed: true,
          checked: false,
          text: this.recommendation,
          style: this.recommendation === 'LAND ASAP' ? ChecklistLineStyle.LandAsap : ChecklistLineStyle.LandAnsa,
          firstLine: false,
          lastLine: false,
        });
      }

      if (isDeferred && !this.checklistState.procedureCompleted) {
        lineData.push({
          abnormalProcedure: isAbnormalOrDeferred,
          activeProcedure: true,
          sensed: false,
          checked: this.checklistState.procedureActivated ?? false,
          text: `${'\xa0'.repeat(31)}ACTIVATE`,
          style: ChecklistLineStyle.ChecklistItem,
          firstLine: false,
          lastLine: false,
          originalItemIndex: SPECIAL_INDEX_ACTIVATE,
        });
      }

      this.items.forEach((item, itemIndex) => {
        if (
          (isAbnormal && !this.checklistState.itemsToShow[itemIndex]) ||
          (isDeferred && this.checklistState.procedureCompleted)
        ) {
          return;
        }

        let clStyle: ChecklistLineStyle = item.style ? item.style : ChecklistLineStyle.ChecklistItem;
        let text = item.level ? '\xa0'.repeat(item.level) : '';
        if (isChecklistAction(item)) {
          text += clStyle !== ChecklistLineStyle.SubHeadline ? '-' : '';
          text += item.name;
          if (!this.checklistState.itemsActive[itemIndex] && clStyle === ChecklistLineStyle.ChecklistItem) {
            clStyle = ChecklistLineStyle.ChecklistItemInactive;
          }
          if (this.checklistState.itemsChecked[itemIndex] && item.labelCompleted) {
            text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelCompleted}`;
          } else if (this.checklistState.itemsChecked[itemIndex] && item.labelNotCompleted) {
            text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelNotCompleted}`;
          } else if (!this.checklistState.itemsChecked[itemIndex] && item.labelNotCompleted) {
            // Pad to 39 characters max
            const paddingNeeded = Math.max(
              0,
              39 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 1 + 2),
            );

            text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
          }
        } else if (isChecklistCondition(item)) {
          clStyle = ChecklistLineStyle.ChecklistCondition;
          if (item.name.substring(0, 4) === 'WHEN') {
            text += `.${item.name}`;
          } else {
            text += this.checklistState.itemsChecked[itemIndex]
              ? `.AS ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`
              : `.IF ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`;
          }
        } else {
          text += item.name;
        }

        lineData.push({
          abnormalProcedure: isAbnormalOrDeferred,
          activeProcedure: this.procedureIsActive.get() || !isAbnormal,
          sensed: isChecklistCondition(item) ? true : item.sensed,
          checked: this.checklistState.itemsChecked[itemIndex],
          text: text.substring(0, 39),
          style: clStyle,
          firstLine: !this.procedureIsActive.get() && isAbnormal,
          lastLine: !this.procedureIsActive.get() && isAbnormal,
          originalItemIndex: isChecklistCondition(item) ? undefined : itemIndex,
        });

        if (isChecklistCondition(item) && !item.sensed) {
          // Insert CONFIRM <condition>
          const confirmText = `${item.level ? '\xa0'.repeat(item.level) : ''}CONFIRM ${item.name.substring(2)}`;
          lineData.push({
            abnormalProcedure: isAbnormalOrDeferred,
            activeProcedure: this.procedureIsActive.get() || !isAbnormal,
            sensed: item.sensed,
            checked: this.checklistState.itemsChecked[itemIndex],
            text: confirmText,
            style: clStyle,
            firstLine: !this.procedureIsActive.get() && isAbnormal,
            lastLine: !this.procedureIsActive.get() && isAbnormal,
            originalItemIndex: itemIndex,
          });
        }
      });

      if (isAbnormal) {
        lineData.push({
          abnormalProcedure: isAbnormalOrDeferred,
          activeProcedure: true,
          sensed: false,
          checked: false,
          text: `${'\xa0'.repeat(34)}CLEAR`,
          style: ChecklistLineStyle.ChecklistItem,
          firstLine: false,
          lastLine: true,
          originalItemIndex: SPECIAL_INDEX_CLEAR,
        });
      } else if (this.type === ProcedureType.Normal) {
        lineData.push({
          activeProcedure: true,
          sensed: false,
          checked: this.checklistState.procedureCompleted ?? false,
          text: `${'\xa0'.repeat(27)}C/L COMPLETE`,
          style: ChecklistLineStyle.ChecklistItem,
          firstLine: false,
          lastLine: false,
          originalItemIndex: SPECIAL_INDEX_NORMAL_CL_COMPLETE,
        });

        lineData.push({
          activeProcedure: true,
          sensed: false,
          checked: false,
          text: `${'\xa0'.repeat(34)}RESET`,
          style: ChecklistLineStyle.ChecklistItem,
          firstLine: false,
          lastLine: true,
          originalItemIndex: SPECIAL_INDEX_NORMAL_RESET,
        });
      } else if (isDeferred) {
        if (this.checklistState.procedureCompleted) {
          lineData.push({
            activeProcedure: true,
            sensed: false,
            checked: false,
            text: `${'\xa0'.repeat(18)}DEFERRED PROC RECALL`,
            style: ChecklistLineStyle.ChecklistItem,
            firstLine: false,
            lastLine: true,
            originalItemIndex: SPECIAL_INDEX_DEFERRED_PROC_RECALL,
          });
        } else {
          lineData.push({
            activeProcedure: true,
            sensed: false,
            checked: this.checklistState.procedureCompleted ?? false,
            text: `${'\xa0'.repeat(17)}DEFERRED PROC COMPLETE`,
            style: this.checklistState.procedureActivated
              ? ChecklistLineStyle.ChecklistItem
              : ChecklistLineStyle.ChecklistItemInactive,
            firstLine: false,
            lastLine: true,
            originalItemIndex: SPECIAL_INDEX_DEFERRED_PROC_COMPLETE,
          });
        }
      }
    } else {
      // Only three dots for following procedures
      lineData.push({
        abnormalProcedure: isAbnormalOrDeferred,
        activeProcedure: false,
        sensed: true,
        checked: false,
        text: '...',
        style: ChecklistLineStyle.OmissionDots,
        firstLine: true,
        lastLine: true,
      });
    }

    // Empty line after procedure
    lineData.push({
      abnormalProcedure: isAbnormalOrDeferred,
      activeProcedure: this.procedureIsActive.get() || isDeferred,
      sensed: true,
      checked: false,
      text: '',
      style: ChecklistLineStyle.ChecklistItem,
      firstLine: true,
      lastLine: true,
      specialLine: WdSpecialLine.Empty,
    });

    return lineData;
  }
}
