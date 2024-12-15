// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, SimVarValueType, Subject, SubscribableMapEventType } from '@microsoft/msfs-sdk';
import { ChecklistState, FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import {
  deferredProcedureIds,
  EcamNormalProcedures,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import {
  DeferredProcedureType,
  EcamDeferredProcedures,
  NormalProcedure,
  WD_NUM_LINES,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import {
  ProcedureLinesGenerator,
  ProcedureType,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

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

  public readonly checklistState = MapSubject.create<number, ChecklistState>();

  /** ALL PHASES, TOP OF DESCENT, FOR APPROACH, FOR LANDING */
  private readonly hasDeferred = [false, false, false, false];

  /** ALL PHASES, TOP OF DESCENT, FOR APPROACH, FOR LANDING */
  private readonly deferredIsCompleted = [false, false, false, false];

  /** ID of active deferred procedure */
  public readonly activeDeferredProcedureId = Subject.create<string | null>(null);

  private deferredProcedures: ProcedureLinesGenerator[] = [];

  private activeProcedure: ProcedureLinesGenerator;

  constructor(private fws: FwsCore) {
    this.checklistState.sub(
      (
        map: ReadonlyMap<number, ChecklistState>,
        _type: SubscribableMapEventType,
        _key: number,
        _value: ChecklistState,
      ) => {
        const flattened: ChecklistState[] = [];
        map.forEach((val, key) =>
          flattened.push({
            id: key.toString(),
            procedureCompleted: val.procedureCompleted,
            itemsChecked: val.itemsChecked,
            itemsActive: val.itemsActive,
            itemsToShow: val.itemsToShow,
          }),
        );
        this.pub.pub('fws_normal_checklists', flattened, true);
      },
      true,
    );
    this.checklistId.sub((id) => {
      if (id !== 0 && !deferredProcedureIds.includes(id)) {
        const clState = this.checklistState.getValue(id);
        const procGen = new ProcedureLinesGenerator(
          clState.id,
          Subject.create(true),
          ProcedureType.Normal,
          clState,
          (newState) => {
            this.checklistState.setValue(this.checklistId.get(), newState);
          },
          (newState) => {
            this.checklistState.setValue(this.checklistId.get(), newState);
            this.resetFollowingChecklists();
          },
          (newState) => {
            this.checklistState.setValue(this.checklistId.get(), newState);
            this.showChecklistRequested.set(false);
          },
        );
        this.activeProcedure = procGen;
        this.activeProcedure.selectedItemIndex.pipe(this.selectedLine);
      } else if (deferredProcedureIds.includes(id)) {
        this.deferredProcedures = [];
        const firstProcedureKey = Object.keys(this.fws.activeDeferredProceduresList.get())[0];
        this.fws.activeDeferredProceduresList.get().forEach((proc, key) => {
          const procGen = new ProcedureLinesGenerator(
            proc.id,
            Subject.create(proc.id === firstProcedureKey),
            ProcedureType.Deferred,
            proc,
            (newState) => {
              this.fws.activeDeferredProceduresList.setValue(key, newState);
            },
          );
          this.deferredProcedures.push(procGen);
        });

        this.activeDeferredProcedureId.set(firstProcedureKey);
        this.activeProcedure = this.deferredProcedures[0];
        this.activeProcedure.selectedItemIndex.pipe(this.selectedLine);
      }
      this.pub.pub('fws_normal_checklists_id', id, true);
    }, true);

    this.fws.activeDeferredProceduresList.sub(
      (
        map: ReadonlyMap<string, ChecklistState>,
        _type: SubscribableMapEventType,
        _key: string,
        _value: ChecklistState,
      ) => {
        const flattened: ChecklistState[] = [];
        map.forEach((val, key) =>
          flattened.push({
            id: key,
            procedureCompleted: val.procedureCompleted,
            itemsChecked: val.itemsChecked,
            itemsActive: val.itemsActive,
            itemsToShow: val.itemsToShow,
          }),
        );
        this.pub.pub('fws_deferred_procedures', flattened, true);
      },
      true,
    );

    // Populate checklistState
    const keys = this.getNormalProceduresKeysSorted();
    keys.forEach((k) => {
      const proc = EcamNormalProcedures[k] as NormalProcedure;
      this.checklistState.setValue(k, {
        id: k.toString(),
        procedureCompleted: proc.deferred ? true : false,
        itemsChecked: Array(proc.items.length).fill(false),
        itemsActive: Array(proc.items.length).fill(true),
        itemsToShow: Array(proc.items.length).fill(true),
      });
    });

    this.checklistState.setValue(0, {
      id: '0',
      procedureCompleted: false,
      itemsChecked: Array(Object.keys(EcamNormalProcedures).length).fill(false),
      itemsActive: Array(Object.keys(EcamNormalProcedures).length).fill(true),
      itemsToShow: Array(Object.keys(EcamNormalProcedures).length).fill(true),
    });

    this.selectedLine.sub(() => this.scrollToSelectedLine());
  }

  getNormalProceduresKeysSorted(onlyVisible = false) {
    return Object.keys(EcamNormalProcedures)
      .map((v) => parseInt(v))
      .filter((v, index) => {
        if (onlyVisible && deferredProcedureIds.includes(v) && this.checklistState.getValue(0)?.itemsToShow[index]) {
          return false;
        } else {
          return true;
        }
      })
      .sort((a, b) => a - b);
  }

  selectFirst() {
    if (this.checklistId.get() === 0) {
      // Find first non-completed checklist
      const keys = this.getNormalProceduresKeysSorted(true);
      let firstIncompleteChecklist = 0;
      keys.some((key, index) => {
        if (!this.checklistState.getValue(key).procedureCompleted) {
          firstIncompleteChecklist = index;
          return true;
        }
      });
      this.selectedLine.set(firstIncompleteChecklist);
    } else {
      this.activeProcedure.selectFirst();
    }
  }

  moveUp() {
    if (this.checklistId.get() === 0) {
      const shownItems = this.getNormalProceduresKeysSorted()
        .map((_, index) => (this.checklistState.getValue(0).itemsToShow[index] ? index : null))
        .filter((v) => v !== null);
      this.selectedLine.set(Math.max(shownItems[shownItems.indexOf(this.selectedLine.get()) - 1] ?? 0, 0));
    } else {
      this.activeProcedure.moveUp();
    }
  }

  moveDown(skipCompletedSensed = true) {
    if (this.checklistId.get() === 0) {
      const shownItems = this.getNormalProceduresKeysSorted()
        .map((_, index) => (this.checklistState.getValue(0).itemsToShow[index] ? index : null))
        .filter((v) => v !== null);
      this.selectedLine.set(
        Math.min(
          shownItems[shownItems.indexOf(this.selectedLine.get()) + 1] ??
            this.getNormalProceduresKeysSorted(true).length,
          this.getNormalProceduresKeysSorted(true).length,
        ),
      );
    } else {
      this.activeProcedure.moveDown(skipCompletedSensed);
    }
  }

  resetFollowingChecklists() {
    // Reset all following checklists
    const fromId = this.getNormalProceduresKeysSorted().findIndex((v) => v === this.checklistId.get());
    const ids = this.getNormalProceduresKeysSorted();

    if (fromId !== -1) {
      for (let id = fromId + 1; id < ids.length; id++) {
        const idFollowing = ids[id];
        const clFollowing = this.checklistState.getValue(idFollowing);
        const procFollowing = EcamNormalProcedures[idFollowing];
        const clStateFollowing: ChecklistState = {
          id: idFollowing.toString(),
          procedureCompleted: procFollowing.deferred ? true : false,
          itemsChecked: [...clFollowing.itemsChecked].map((val, index) =>
            procFollowing.items[index].sensed ? val : false,
          ),
          itemsActive: clFollowing.itemsActive,
          itemsToShow: clFollowing.itemsToShow,
        };
        this.checklistState.setValue(idFollowing, clStateFollowing);
      }
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
        this.activeProcedure.checkSelected();
      }
    }

    // Update sensed items
    const ids = this.getNormalProceduresKeysSorted();

    for (let id = 0; id < ids.length; id++) {
      let changed = false;
      const procId = ids[id];
      const cl = this.checklistState.getValue(procId);
      const proc = EcamNormalProcedures[procId];

      if (!this.sensedItems[procId] || deferredProcedureIds.includes(procId)) {
        continue;
      }
      const sensedResult = this.sensedItems[procId].whichItemsChecked();
      const changedEntries = sensedResult.map((val, index) =>
        val !== null && val !== cl.itemsChecked[index] ? index : null,
      );
      if (changedEntries.some((v) => v !== null)) {
        changed = true;

        if (changedEntries.includes(this.selectedLine.get()) && sensedResult[this.selectedLine.get()]) {
          this.moveDown();
        }
      }
      const clState: ChecklistState = {
        id: procId.toString(),
        procedureCompleted: cl.procedureCompleted,
        itemsChecked: [...cl.itemsChecked].map((val, index) =>
          proc.items[index].sensed && sensedResult[index] != null ? sensedResult[index] : val,
        ),
        itemsActive: cl.itemsActive,
        itemsToShow: cl.itemsToShow,
      };
      if (changed) {
        this.checklistState.setValue(procId, clState);
      }
    }

    // Update deferred proc status
    for (let i = 0; i < 3; i++) {
      this.hasDeferred[i] = false;
      this.deferredIsCompleted[i] = true;
    }
    this.fws.activeDeferredProceduresList.get().forEach((val) => {
      switch (EcamDeferredProcedures[val.id]?.type) {
        case DeferredProcedureType.ALL_PHASES:
          this.hasDeferred[0] = true;
          if (!val.procedureCompleted) {
            this.deferredIsCompleted[0] = false;
          }
          break;
        case DeferredProcedureType.AT_TOP_OF_DESCENT:
          this.hasDeferred[1] = true;
          if (!val.procedureCompleted) {
            this.deferredIsCompleted[1] = false;
          }
          break;
        case DeferredProcedureType.FOR_APPROACH:
          this.hasDeferred[2] = true;
          if (!val.procedureCompleted) {
            this.deferredIsCompleted[2] = false;
          }
          break;
        case DeferredProcedureType.FOR_LANDING:
          this.hasDeferred[3] = true;
          if (!val.procedureCompleted) {
            this.deferredIsCompleted[3] = false;
          }
          break;
      }
    });
    const overviewState = this.checklistState.getValue(0);
    overviewState.itemsChecked[Object.keys(EcamNormalProcedures).indexOf('1000007')] = this.deferredIsCompleted[0];
    overviewState.itemsChecked[Object.keys(EcamNormalProcedures).indexOf('1000008')] = this.deferredIsCompleted[1];
    overviewState.itemsChecked[Object.keys(EcamNormalProcedures).indexOf('1000009')] = this.deferredIsCompleted[2];
    overviewState.itemsChecked[Object.keys(EcamNormalProcedures).indexOf('1000011')] = this.deferredIsCompleted[3];
    overviewState.itemsToShow[Object.keys(EcamNormalProcedures).indexOf('1000007')] = this.hasDeferred[0];
    overviewState.itemsToShow[Object.keys(EcamNormalProcedures).indexOf('1000008')] = this.hasDeferred[1];
    overviewState.itemsToShow[Object.keys(EcamNormalProcedures).indexOf('1000009')] = this.hasDeferred[2];
    overviewState.itemsToShow[Object.keys(EcamNormalProcedures).indexOf('1000011')] = this.hasDeferred[3];

    this.checklistState.setValue(0, overviewState);
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
      whichItemsChecked: () => [null],
    },
    1000008: {
      whichItemsChecked: () => [null],
    },
    1000009: {
      whichItemsChecked: () => [null],
    },
    1000010: {
      whichItemsChecked: () => [null, SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'), null, null],
    },
    1000011: {
      whichItemsChecked: () => [null],
    },
    1000012: {
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
    1000013: {
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
    1000014: {
      whichItemsChecked: () => [
        SimVar.GetSimVarValue('L:PUSH_OVHD_OXYGEN_CREW', 'bool'),
        SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_Position', 'number') === 2,
        null,
        null,
      ],
    },
  };
}
