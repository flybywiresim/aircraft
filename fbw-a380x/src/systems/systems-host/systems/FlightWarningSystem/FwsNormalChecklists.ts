// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, SimVarValueType, Subject, SubscribableMapEventType } from '@microsoft/msfs-sdk';
import { FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { NormalProcedure, WD_NUM_LINES } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export type ChecklistState = {
  id: number;
  checklistCompleted: boolean;
  itemsCompleted: boolean[];
};

export interface NormalEclSensedItems {
  /** Returns a boolean vector (same length as number of items). If true, item is marked as completed. If null, it's a non-sensed item */
  whichItemsChecked: () => boolean[];
}

export interface FwsNormalChecklistsDict {
  [key: keyof typeof EcamNormalProcedures]: NormalEclSensedItems;
}
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
    this.selectedLine.sub((line) => this.pub.pub('fws_active_line', line + 1, true), true); // Start at second line, headline not selectable
    this.showFromLine.sub((line) => this.pub.pub('fws_show_from_line', line, true), true);

    // Populate checklistState
    const keys = this.getNormalProceduresKeysSorted();
    keys.forEach((k) => {
      const proc = EcamNormalProcedures[k] as NormalProcedure;
      this.checklistState.setValue(k, {
        id: k,
        checklistCompleted: proc.deferred ? true : false,
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
      this.selectedLine.set(Math.min(this.selectedLine.get() + 1, this.getNormalProceduresKeysSorted().length - 1));
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
      this.checklistState.setValue(this.checklistId.get(), clState);
      this.moveDown();
    } else if (this.selectedLine.get() === clState.itemsCompleted.length) {
      // C/L complete
      clState.checklistCompleted = true;
      const proc = EcamNormalProcedures[this.checklistId.get()];
      clState.itemsCompleted = clState.itemsCompleted.map((val, index) => (proc.items[index].sensed ? val : true));
      this.checklistState.setValue(this.checklistId.get(), clState);
      this.showChecklist.set(false);
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
            checklistCompleted: procFollowing.deferred ? true : false,
            itemsCompleted: [...clFollowing.itemsCompleted].map((val, index) =>
              procFollowing.items[index].sensed ? val : false,
            ),
          };
          this.checklistState.setValue(idFollowing, clStateFollowing);
        }
      }
      this.checklistState.setValue(this.checklistId.get(), clState);
      this.selectFirst();
    }
  }

  navigateToChecklist(id: number) {
    this.checklistId.set(id);
    this.selectFirst();
  }

  update() {
    if (this.fws.clPulseNode.read()) {
      if (!this.fws.abnormalSensed.showAbnormalSensed.get()) {
        this.navigateToChecklist(0);
        this.showChecklist.set(!this.showChecklist.get());
      }
    }

    if (this.fws.clDownPulseNode.read()) {
      if (!this.showChecklist.get()) {
        return;
      }
      this.moveDown();
    }

    if (this.fws.clUpPulseNode.read()) {
      if (!this.showChecklist.get()) {
        return;
      }
      this.moveUp();
    }

    if (this.fws.clCheckPulseNode.read()) {
      if (!this.showChecklist.get()) {
        return;
      }

      if (this.checklistId.get() === 0) {
        // Navigate to check list
        this.navigateToChecklist(this.getNormalProceduresKeysSorted()[this.selectedLine.get()]);
      } else {
        this.checkCurrentItem();
      }
    }

    // Update sensed items
    const ids = this.getNormalProceduresKeysSorted();

    for (let id = 0; id < ids.length; id++) {
      let changed = false;
      const procId = ids[id];
      const cl = this.checklistState.getValue(procId);
      const proc = EcamNormalProcedures[procId];

      if (!this.sensedItems[procId]) {
        continue;
      }
      const sensedResult = this.sensedItems[procId].whichItemsChecked();
      if (sensedResult.some((val, index) => val !== null && val !== cl.itemsCompleted[index])) {
        changed = true;
      }
      const clState: ChecklistState = {
        id: procId,
        checklistCompleted: cl.checklistCompleted,
        itemsCompleted: [...cl.itemsCompleted].map((val, index) =>
          proc.items[index].sensed && sensedResult[index] != null ? sensedResult[index] : val,
        ),
      };
      if (changed) {
        this.checklistState.setValue(procId, clState);
      }
    }
  }

  public sensedItems: FwsNormalChecklistsDict = {
    1000001: {
      whichItemsChecked: () => [null, null, !!this.fws.seatBelt.get(), null],
    },
    1000002: {
      whichItemsChecked: () => [null, null, SimVar.GetSimVarValue('A:LIGHT BEACON', SimVarValueType.Bool)],
    },
    1000003: {
      whichItemsChecked: () => [
        null,
        !this.fws.pitchTrimNotTo.get(),
        Math.abs(SimVar.GetSimVarValue('L:RUDDER_TRIM_1_COMMANDED_POSITION', SimVarValueType.Number)) < 0.35 &&
          Math.abs(SimVar.GetSimVarValue('L:RUDDER_TRIM_2_COMMANDED_POSITION', SimVarValueType.Number)) < 0.35,
      ],
    },
    1000004: {
      whichItemsChecked: () => [
        null,
        null,
        null,
        false,
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1,
        this.fws.spoilersArmed.get(),
        this.fws.slatFlapSelectionS18F10 || this.fws.slatFlapSelectionS22F15 || this.fws.slatFlapSelectionS22F20,
        this.fws.autoBrake.get() === 6,
        this.fws.toConfigNormal.get(),
      ],
    },
    1000005: {
      whichItemsChecked: () => [null, null, null],
    },
    1000006: {
      whichItemsChecked: () => [null, null, null, null],
    },
    1000007: {
      whichItemsChecked: () => [null, SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'), null, null],
    },
    1000008: {
      whichItemsChecked: () => [
        false,
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'),
        this.fws.isAllGearDownlocked,
        this.fws.spoilersArmed.get(),
        (!SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'bool') &&
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 4) ||
          (SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'bool') &&
            SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 3),
      ],
    },
    1000009: {
      whichItemsChecked: () => [
        null,
        !this.fws.engine1Master.get() &&
          !this.fws.engine2Master.get() &&
          !this.fws.engine3Master.get() &&
          !this.fws.engine4Master.get(),
        null,
        this.fws.allFuelPumpsOff.get(),
      ],
    },
    1000010: {
      whichItemsChecked: () => [
        SimVar.GetSimVarValue('L:PUSH_OVHD_OXYGEN_CREW', 'bool'),
        SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_Position', 'number') === 2,
        null,
        null,
      ],
    },
  };
}
