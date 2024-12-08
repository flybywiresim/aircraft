// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, SimVarValueType, Subject, SubscribableMapEventType } from '@microsoft/msfs-sdk';
import { NormalChecklistState, FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { ChecklistLineStyle, NormalProcedure, WD_NUM_LINES } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export interface NormalEclSensedItems {
  /** Returns a boolean vector (same length as number of items). If true, item is marked as completed. If null, it's a non-sensed item */
  whichItemsChecked: () => boolean[];
}

export interface FwsNormalChecklistsDict {
  [key: keyof typeof EcamNormalProcedures]: NormalEclSensedItems;
}
export class FwsNormalChecklists {
  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

  public readonly checklistShown = Subject.create(false);

  public readonly showChecklistRequested = Subject.create(false);

  /** ID of checklist or 0 for overview */
  public readonly checklistId = Subject.create(0);

  /** Marked with cyan box */
  public readonly selectedLine = Subject.create(0);

  /** For overflowing checklists */
  public readonly showFromLine = Subject.create(0);

  public readonly checklistState = MapSubject.create<number, NormalChecklistState>();

  constructor(private fws: FwsCore) {
    this.checklistState.sub(
      (
        map: ReadonlyMap<number, NormalChecklistState>,
        _type: SubscribableMapEventType,
        _key: number,
        _value: NormalChecklistState,
      ) => {
        const flattened: NormalChecklistState[] = [];
        map.forEach((val, key) =>
          flattened.push({ id: key, checklistCompleted: val.checklistCompleted, itemsCompleted: val.itemsCompleted }),
        );
        this.pub.pub('fws_normal_checklists', flattened, true);
      },
      true,
    );
    this.checklistId.sub((id) => this.pub.pub('fws_normal_checklists_id', id, true), true);

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

    this.selectedLine.sub(() => this.scrollToSelectedLine());
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
        .map((_, index) => (clState.itemsCompleted[index] === false ? index : null))
        .filter((v) => v !== null);
      this.selectedLine.set(
        selectableAndNotChecked[0] !== undefined ? selectableAndNotChecked[0] - 1 : clState.itemsCompleted.length - 1,
      );
    }
    this.moveDown(false);
  }

  moveUp() {
    if (this.checklistId.get() === 0) {
      this.selectedLine.set(Math.max(this.selectedLine.get() - 1, 0));
    } else {
      const numItems = EcamNormalProcedures[this.checklistId.get()].items.length;
      // const selectable = EcamNormalProcedures[this.checklistId.get()].items.map((_, index) => index);
      const selectable = this.selectableItems(true);

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

  /**
   * Used for up/down navigation, to skip not selectable items
   * @param skipCompletedSensed Whether sensed item is only selectable if unchecked. Not sensed items can't be skipped.
   * @returns Procedure item is selectable with arrow keys
   */
  private itemIsSelectable(itemIndex: number, skipCompletedSensed: boolean): boolean {
    const clState = this.checklistState.getValue(this.checklistId.get());
    return (
      (!EcamNormalProcedures[this.checklistId.get()].items[itemIndex].sensed ||
        (!skipCompletedSensed && !clState.itemsCompleted[itemIndex])) &&
      !FwsNormalChecklists.nonSelectableItemStyles.includes(
        EcamNormalProcedures[this.checklistId.get()].items[itemIndex].style,
      )
    );
  }

  private selectableItems(skipCompletedSensed: boolean) {
    return EcamNormalProcedures[this.checklistId.get()].items
      .map((_, index) => (this.itemIsSelectable(index, skipCompletedSensed) ? index : null))
      .filter((v) => v !== null);
  }

  moveDown(skipCompletedSensed = true) {
    if (this.checklistId.get() === 0) {
      this.selectedLine.set(Math.min(this.selectedLine.get() + 1, this.getNormalProceduresKeysSorted().length - 1));
    } else {
      const numItems = EcamNormalProcedures[this.checklistId.get()].items.length;
      const selectable = this.selectableItems(skipCompletedSensed);
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
  }

  checkCurrentItem() {
    const cl = this.checklistState.getValue(this.checklistId.get());
    const clState: NormalChecklistState = {
      id: cl.id,
      checklistCompleted: cl.checklistCompleted,
      itemsCompleted: [...cl.itemsCompleted],
    };
    const proc = EcamNormalProcedures[this.checklistId.get()];
    if (
      this.selectedLine.get() < clState.itemsCompleted.length &&
      proc.items[this.selectedLine.get()]?.sensed === false
    ) {
      clState.itemsCompleted[this.selectedLine.get()] = !clState.itemsCompleted[this.selectedLine.get()];
      this.checklistState.setValue(this.checklistId.get(), clState);
      if (clState.itemsCompleted[this.selectedLine.get()]) {
        this.moveDown(false);
      }
    } else if (this.selectedLine.get() === clState.itemsCompleted.length) {
      // C/L complete
      clState.checklistCompleted = true;
      clState.itemsCompleted = clState.itemsCompleted.map((val, index) => (proc.items[index].sensed ? val : true));
      this.checklistState.setValue(this.checklistId.get(), clState);
      this.showChecklistRequested.set(false);
    } else if (this.selectedLine.get() === clState.itemsCompleted.length + 1) {
      // RESET
      clState.checklistCompleted = false;
      clState.itemsCompleted = clState.itemsCompleted.map((val, index) => (proc.items[index].sensed ? val : false));

      // Reset all following checklists
      const fromId = this.getNormalProceduresKeysSorted().findIndex((v) => v === this.checklistId.get());
      const ids = this.getNormalProceduresKeysSorted();

      if (fromId !== -1) {
        for (let id = fromId + 1; id < ids.length; id++) {
          const idFollowing = ids[id];
          const clFollowing = this.checklistState.getValue(idFollowing);
          const procFollowing = EcamNormalProcedures[idFollowing];
          const clStateFollowing: NormalChecklistState = {
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

  private scrollToSelectedLine() {
    this.showFromLine.set(Math.max(0, this.selectedLine.get() - WD_NUM_LINES + 2));
  }

  update() {
    if (this.fws.clPulseNode.read()) {
      this.navigateToChecklist(0);
      this.showChecklistRequested.set(!this.showChecklistRequested.get());
    }

    if (!this.checklistShown.get()) {
      return;
    }

    if (this.fws.clDownPulseNode.read()) {
      this.moveDown();
    }

    if (this.fws.clUpPulseNode.read()) {
      this.moveUp();
    }

    if (this.fws.clCheckPulseNode.read()) {
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
      const changedEntries = sensedResult.map((val, index) =>
        val !== null && val !== cl.itemsCompleted[index] ? index : null,
      );
      if (changedEntries.some((v) => v !== null)) {
        changed = true;

        if (changedEntries.includes(this.selectedLine.get()) && sensedResult[this.selectedLine.get()]) {
          this.moveDown();
        }
      }
      const clState: NormalChecklistState = {
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
      whichItemsChecked: () => [null, !this.fws.pitchTrimNotTo.get(), this.fws.rudderTrimPosition.get() < 0.35],
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
