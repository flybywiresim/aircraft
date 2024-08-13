// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, Subject, SubscribableMapEventType } from '@microsoft/msfs-sdk';
import { FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { NormalProcedure, WD_NUM_LINES } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export type ChecklistState = {
  id: number;
  checklistCompleted: boolean;
  itemsCompleted: boolean[];
};
export class FwsNormalChecklists {
  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

  public readonly showChecklist = Subject.create(false);

  /** ID of checklist or 0 for overview */
  public readonly checklistId = Subject.create(0);

  /** Marked with cyan box */
  public readonly selectedLine = Subject.create(0);

  /** For overflowing checklists */
  public readonly showFromLine = Subject.create(0);

  public readonly checklistState = MapSubject.create<number, ChecklistState>();

  constructor(private fws: FwsCore) {
    this.showChecklist.sub((v) => this.pub.pub('fws_show_normal_checklists', v, true), true);
    this.checklistState.sub(
      (
        map: ReadonlyMap<number, ChecklistState>,
        _type: SubscribableMapEventType,
        _key: number,
        _value: ChecklistState,
      ) => {
        const flattened: ChecklistState[] = [];
        map.forEach((val, key) =>
          flattened.push({ id: key, checklistCompleted: val.checklistCompleted, itemsCompleted: val.itemsCompleted }),
        );
        this.pub.pub('fws_normal_checklists', flattened, true);
      },
      true,
    );
    this.checklistId.sub((id) => this.pub.pub('fws_normal_checklists_id', id, true), true);
    this.selectedLine.sub((line) => this.pub.pub('fws_normal_checklists_active_line', line, true), true);
    this.showFromLine.sub((line) => this.pub.pub('fws_normal_checklists_show_from_line', line, true), true);

    // Populate checklistState
    const keys = this.getNormalProceduresKeysSorted();
    keys.forEach((k) => {
      const proc = EcamNormalProcedures[k] as NormalProcedure;
      this.checklistState.setValue(k, {
        id: k,
        checklistCompleted: false,
        itemsCompleted: Array(proc.items.length).fill(false),
      });
    });

    this.checklistState.setValue(0, {
      id: 0,
      checklistCompleted: false,
      itemsCompleted: Array(Object.keys(EcamNormalProcedures).length).fill(false),
    });
  }

  getNormalProceduresKeysSorted() {
    return Object.keys(EcamNormalProcedures)
      .map((v) => parseInt(v))
      .sort((a, b) => a - b);
  }

  selectFirst() {
    if (this.checklistId.get() === 0) {
      // Find first non-completed checklist
      const keys = this.getNormalProceduresKeysSorted();
      let firstIncompleteChecklist = 0;
      keys.some((key, index) => {
        if (!this.checklistState.getValue(key).checklistCompleted) {
          firstIncompleteChecklist = index;
          return true;
        }
      });
      this.selectedLine.set(firstIncompleteChecklist - 1);
    } else {
      const clState = this.checklistState.getValue(this.checklistId.get());
      const selectableAndNotChecked = EcamNormalProcedures[this.checklistId.get()].items
        .map((item, index) => (item.sensed === false && clState.itemsCompleted[index] === false ? index : null))
        .filter((v) => v !== null);
      this.selectedLine.set(
        selectableAndNotChecked[0] !== undefined ? selectableAndNotChecked[0] - 1 : clState.itemsCompleted.length - 1,
      );
    }
    this.moveDown();
  }

  moveUp() {
    if (this.checklistId.get() === 0) {
      this.selectedLine.set(Math.max(this.selectedLine.get() - 1, 0));
    } else {
      const numItems = EcamNormalProcedures[this.checklistId.get()].items.length;
      const selectable = EcamNormalProcedures[this.checklistId.get()].items
        .map((item, index) => (item.sensed === false ? index : null))
        .filter((v) => v !== null);

      if (this.selectedLine.get() == numItems + 1) {
        // RESET
        this.selectedLine.set(this.selectedLine.get() - 1);
      } else {
        if (selectable.length === 0) {
          return;
        }
        const previousElement = () => {
          for (let i = selectable.length - 1; i >= 0; i--) {
            if (selectable[i] < this.selectedLine.get()) {
              return selectable[i];
            }
          }
          return -1;
        };
        const pEl = previousElement();

        if (pEl >= 0) {
          this.selectedLine.set(Math.max(pEl, 0));
        }
      }
    }
    this.showFromLine.set(Math.max(0, this.selectedLine.get() - WD_NUM_LINES + 2));
  }

  moveDown() {
    if (this.checklistId.get() === 0) {
      this.selectedLine.set(
        Math.min(this.selectedLine.get() + 1, this.getNormalProceduresKeysSorted().length - 1, WD_NUM_LINES - 1),
      );
    } else {
      const numItems = EcamNormalProcedures[this.checklistId.get()].items.length;
      const selectable = EcamNormalProcedures[this.checklistId.get()].items
        .map((item, index) => (item.sensed === false ? index : null))
        .filter((v) => v !== null);
      if (this.selectedLine.get() >= selectable[selectable.length - 1] || selectable.length == 0) {
        // Last element before C/L complete
        this.selectedLine.set(Math.max(numItems, Math.min(this.selectedLine.get() + 1, numItems + 1)));
      } else {
        this.selectedLine.set(
          Math.min(
            selectable.find((v) => v > this.selectedLine.get()),
            numItems - 1,
          ),
        );
      }
    }
    this.showFromLine.set(Math.max(0, this.selectedLine.get() - WD_NUM_LINES + 2));
  }

  checkCurrentItem() {
    const cl = this.checklistState.getValue(this.checklistId.get());
    const clState: ChecklistState = {
      id: cl.id,
      checklistCompleted: cl.checklistCompleted,
      itemsCompleted: [...cl.itemsCompleted],
    };
    if (this.selectedLine.get() < clState.itemsCompleted.length) {
      clState.itemsCompleted[this.selectedLine.get()] = !clState.itemsCompleted[this.selectedLine.get()];
    } else if (this.selectedLine.get() === clState.itemsCompleted.length) {
      // C/L complete
      clState.checklistCompleted = true;
      const proc = EcamNormalProcedures[this.checklistId.get()];
      clState.itemsCompleted = clState.itemsCompleted.map((val, index) => (proc.items[index].sensed ? val : true));
    } else if (this.selectedLine.get() === clState.itemsCompleted.length + 1) {
      // RESET
      clState.checklistCompleted = false;
      const proc = EcamNormalProcedures[this.checklistId.get()];
      clState.itemsCompleted = clState.itemsCompleted.map((val, index) => (proc.items[index].sensed ? val : false));

      // Reset all following checklists
      const fromId = this.getNormalProceduresKeysSorted().findIndex((v) => v === this.checklistId.get());
      const ids = this.getNormalProceduresKeysSorted();

      if (fromId !== -1) {
        for (let id = fromId + 1; id < ids.length; id++) {
          const idFollowing = ids[id];
          const clFollowing = this.checklistState.getValue(idFollowing);
          const procFollowing = EcamNormalProcedures[idFollowing];
          const clStateFollowing: ChecklistState = {
            id: idFollowing,
            checklistCompleted: false,
            itemsCompleted: [...clFollowing.itemsCompleted].map((val, index) =>
              procFollowing.items[index].sensed ? val : false,
            ),
          };
          this.checklistState.setValue(idFollowing, clStateFollowing);
        }
      }
    }
    this.checklistState.setValue(this.checklistId.get(), clState);

    if (this.selectedLine.get() === clState.itemsCompleted.length + 1) {
      this.selectFirst();
    }
  }

  navigateToChecklist(id: number) {
    this.checklistId.set(id);
    this.selectFirst();
  }

  onUpdate() {
    if (this.fws.clPulseNode.read()) {
      console.log('C/L');
      this.navigateToChecklist(0);
      this.showChecklist.set(!this.showChecklist.get());
    }

    if (this.fws.clDownPulseNode.read()) {
      if (!this.showChecklist.get()) {
        return;
      }

      console.log('DOWN');
      this.moveDown();
    }

    if (this.fws.clUpPulseNode.read()) {
      if (!this.showChecklist.get()) {
        return;
      }

      console.log('UP');
      this.moveUp();
    }

    if (this.fws.clCheckLeftPulseNode.read() || this.fws.clCheckRightPulseNode.read()) {
      if (!this.showChecklist.get()) {
        return;
      }

      console.log('CHECK');
      if (this.checklistId.get() === 0) {
        // Navigate to check list
        this.navigateToChecklist(this.getNormalProceduresKeysSorted()[this.selectedLine.get()]);
      } else {
        this.checkCurrentItem();
        this.moveDown();
      }
    }
  }
}
