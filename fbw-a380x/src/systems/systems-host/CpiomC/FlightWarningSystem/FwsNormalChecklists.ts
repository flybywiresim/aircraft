// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  MappedSubject,
  MapSubject,
  SimVarValueType,
  Subject,
  SubscribableMapEventType,
  SubscribableMapFunctions,
  Subscription,
} from '@microsoft/msfs-sdk';
import { ChecklistState, FwsEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';
import { FwsCore } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';
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
  SPECIAL_INDEX_DEFERRED_PAGE_CLEAR,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

export interface NormalEclSensedItems {
  /** Returns a boolean vector (same length as number of items). If true, item is marked as completed. If null, it's a non-sensed item */
  whichItemsChecked: () => (boolean | null)[];
}

export interface FwsNormalChecklistsDict {
  [key: keyof typeof EcamNormalProcedures]: NormalEclSensedItems;
}
export class FwsNormalChecklists {
  private readonly pub = this.fws.bus.getPublisher<FwsEvents>();

  private readonly subscriptions: Subscription[] = [];

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

  /** ID of active deferred procedure. null means no procedure is selected, but CLEAR at the end of the page is */
  public readonly activeDeferredProcedureId = Subject.create<string | null>(null);

  /** IDs of all visible deferred procedures. */
  public visibleDeferredProcedureKeys: string[] = [];

  private deferredProcedures: ProcedureLinesGenerator[] = [];

  private activeProcedure: ProcedureLinesGenerator | null = null;

  constructor(private fws: FwsCore) {
    this.subscriptions.push(
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
              procedureActivated: val.procedureActivated,
              itemsChecked: val.itemsChecked,
              itemsActive: val.itemsActive,
              itemsToShow: val.itemsToShow,
            }),
          );
          this.pub.pub('fws_normal_checklists', flattened, true);
        },
      ),
    );

    this.subscriptions.push(
      this.checklistId.sub((id) => {
        const clState = this.checklistState.getValue(id);
        if (id !== 0 && !deferredProcedureIds.includes(id) && clState) {
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
              this.reset(this.getNormalProceduresKeysSorted().findIndex((v) => v === this.checklistId.get()));
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

          const currentDeferredType =
            deferredProcedureIds.indexOf(id) !== -1
              ? (deferredProcedureIds.indexOf(id) as DeferredProcedureType)
              : null;
          this.visibleDeferredProcedureKeys = Array.from(this.fws.activeDeferredProceduresList.get().values())
            .filter((v) => currentDeferredType !== null && EcamDeferredProcedures[v.id].type === currentDeferredType)
            .map((v) => v.id);

          if (this.visibleDeferredProcedureKeys.length === 0) {
            this.activeDeferredProcedureId.set(null);
            this.activeProcedure = null;
            return;
          }
          const firstProcedureKey = this.visibleDeferredProcedureKeys[0] ?? null;
          this.activeDeferredProcedureId.set(firstProcedureKey);
          this.visibleDeferredProcedureKeys.forEach((key) => {
            const proc = this.fws.activeDeferredProceduresList.getValue(key);
            if (proc) {
              const procGen = new ProcedureLinesGenerator(
                proc.id,
                this.activeDeferredProcedureId.map((id) => id === proc.id),
                ProcedureType.Deferred,
                proc,
                (newState) => {
                  this.fws.activeDeferredProceduresList.setValue(key, newState);
                },
                (newState) => {
                  // Handle procedure activation/deactivation
                  const whichItemsActive = this.fws.abnormalSensed.ewdDeferredProcs[proc.id].whichItemsActive;
                  const deferredItemsActive = whichItemsActive
                    ? whichItemsActive()
                    : Array(this.fws.abnormalSensed.ewdDeferredProcs[proc.id].whichItemsChecked().length).fill(
                        newState.procedureActivated,
                      );
                  newState.itemsActive = deferredItemsActive;
                  this.fws.activeDeferredProceduresList.setValue(key, newState);
                },
                (newState) => {
                  this.fws.activeDeferredProceduresList.setValue(key, newState);
                },
              );
              this.deferredProcedures.push(procGen);
            }
          });

          this.activeProcedure = this.deferredProcedures[0];
          this.activeProcedure.selectedItemIndex.pipe(this.selectedLine);
        }
        this.pub.pub('fws_normal_checklists_id', id, true);
      }, true),
    );

    this.subscriptions.push(
      this.fws.activeDeferredProceduresList.sub((map: ReadonlyMap<string, ChecklistState>) => {
        const flattened: ChecklistState[] = [];
        map.forEach((val, key) =>
          flattened.push({
            id: key,
            procedureCompleted: val.procedureCompleted,
            procedureActivated: val.procedureActivated,
            itemsChecked: val.itemsChecked,
            itemsActive: val.itemsActive,
            itemsToShow: val.itemsToShow,
          }),
        );
        this.pub.pub('fws_deferred_procedures', flattened, true);

        // If currently active deferred procedure was deleted, refresh page
        const activeProcedureId = this.activeDeferredProcedureId.get();
        if (activeProcedureId !== null && !map.has(activeProcedureId)) {
          this.checklistId.notify();
        }
      }),
    );

    this.subscriptions.push(
      this.activeDeferredProcedureId.sub((id) => {
        if (id !== null && this.deferredProcedures.find((v) => v.procedureId === id)) {
          this.activeProcedure = this.deferredProcedures.find((v) => v.procedureId === id) ?? null;
          this.activeProcedure?.selectedItemIndex.pipe(this.selectedLine);
          this.activeProcedure?.selectFirst();
        } else if (id === null) {
          this.selectedLine.set(SPECIAL_INDEX_DEFERRED_PAGE_CLEAR);
        }
      }),
    );

    this.subscriptions.push(
      this.fws.flightPhase.sub((phase) => {
        if (phase !== 1) {
          this.fws.manualCheckListReset.set(false);
        }
      }),
    );

    MappedSubject.create(SubscribableMapFunctions.or(), this.fws.eng1Or2TakeoffPower, this.fws.eng3Or4TakeoffPower).sub(
      (v) => {
        if (v) {
          this.reset(
            this.getNormalProceduresKeysSorted().findIndex((i) => i === 1000006), // reset starting at departure change,
          );
        }
      },
    );

    // Populate checklistState
    const keys = this.getNormalProceduresKeysSorted();
    keys.forEach((k) => {
      const proc = EcamNormalProcedures[k] as NormalProcedure;
      this.checklistState.setValue(k, {
        id: k.toString(),
        procedureCompleted: proc.onlyActivatedByRequest ? true : false,
        procedureActivated: true,
        itemsChecked: Array(proc.items.length).fill(false),
        itemsActive: Array(proc.items.length).fill(true),
        itemsToShow: Array(proc.items.length).fill(true),
      });
    });

    this.checklistState.setValue(0, {
      id: '0',
      procedureCompleted: false,
      procedureActivated: true,
      itemsChecked: Array(Object.keys(EcamNormalProcedures).length).fill(false),
      itemsActive: Array(Object.keys(EcamNormalProcedures).length).fill(true),
      itemsToShow: Array(Object.keys(EcamNormalProcedures).length).fill(true),
    });

    this.subscriptions.push(this.selectedLine.sub(() => this.scrollToSelectedLine()));
    this.publishInitialState();
  }

  publishInitialState() {
    this.pub.pub('fws_normal_checklists', [], true);
    this.pub.pub('fws_deferred_procedures', [], true);
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
      const firstIncompleteChecklist = keys.findIndex(
        (key, index) =>
          this.checklistState.getValue(0)?.itemsToShow[index] && !this.checklistState.getValue(key)?.procedureCompleted,
      );
      this.selectedLine.set(firstIncompleteChecklist !== -1 ? firstIncompleteChecklist : 0);
    } else {
      this.activeProcedure?.selectFirst();
    }
  }

  moveUp() {
    if (this.checklistId.get() === 0) {
      const shownItems = this.getNormalProceduresKeysSorted()
        .map((_, index) => (this.checklistState.getValue(0)?.itemsToShow[index] ? index : null))
        .filter((v) => v !== null);
      this.selectedLine.set(Math.max(shownItems[shownItems.indexOf(this.selectedLine.get()) - 1] ?? 0, 0));
    } else if (deferredProcedureIds.includes(this.checklistId.get())) {
      const activeDeferredId = this.activeDeferredProcedureId.get();
      if (activeDeferredId !== null) {
        if (this.activeProcedure?.firstLineIsSelected()) {
          const curDefIndex = this.visibleDeferredProcedureKeys.indexOf(activeDeferredId);
          if (curDefIndex !== -1 && curDefIndex > 0) {
            this.activeDeferredProcedureId.set(this.visibleDeferredProcedureKeys[curDefIndex - 1] ?? null);
          }
        } else {
          this.activeProcedure?.moveUp();
        }
      } else {
        // CLEAR of page selected, select last procedure
        this.activeDeferredProcedureId.set(
          this.visibleDeferredProcedureKeys[this.visibleDeferredProcedureKeys.length - 1] ?? null,
        );
      }
    } else {
      this.activeProcedure?.moveUp();
    }
  }

  moveDown(skipCompletedSensed = true) {
    const activeDeferredId = this.activeDeferredProcedureId.get();
    if (this.checklistId.get() === 0) {
      const shownItems = this.getNormalProceduresKeysSorted()
        .map((_, index) => (this.checklistState.getValue(0)?.itemsToShow[index] ? index : null))
        .filter((v) => v !== null);
      this.selectedLine.set(
        Math.min(
          shownItems[shownItems.indexOf(this.selectedLine.get()) + 1] ?? shownItems[shownItems.length - 1],
          shownItems[shownItems.length - 1],
        ),
      );
    } else if (activeDeferredId !== null && this.activeProcedure?.lastLineIsSelected()) {
      const curDefIndex = this.visibleDeferredProcedureKeys.indexOf(activeDeferredId);
      if (curDefIndex !== -1) {
        this.activeDeferredProcedureId.set(
          curDefIndex < this.visibleDeferredProcedureKeys.length - 1
            ? this.visibleDeferredProcedureKeys[curDefIndex + 1]
            : null,
        );
      }
    } else if (this.activeProcedure) {
      this.activeProcedure.moveDown(skipCompletedSensed);
    }
  }

  reset(fromId: number | null) {
    if (fromId !== -1) {
      const ids = this.getNormalProceduresKeysSorted();
      this.fws.manualCheckListReset.set(fromId !== null);
      for (let id = fromId === null ? 0 : fromId + 1; id < ids.length; id++) {
        const idFollowing = ids[id];
        const clFollowing = this.checklistState.getValue(idFollowing);
        const procFollowing = EcamNormalProcedures[idFollowing];
        if (clFollowing) {
          const clStateFollowing: ChecklistState = {
            id: idFollowing.toString(),
            procedureCompleted: procFollowing.onlyActivatedByRequest ? true : false,
            procedureActivated: true,
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
  }

  navigateToChecklist(id: number) {
    this.checklistId.set(id);
    this.selectFirst();
  }

  navigateToParent() {
    if (this.checklistId.get() === 0) {
      this.showChecklistRequested.set(false);
    } else {
      this.navigateToChecklist(0);
    }
  }

  private scrollToSelectedLine() {
    this.showFromLine.set(Math.max(0, this.selectedLine.get() - WD_NUM_LINES + 2));
  }

  private checkIfDeferredAutoDisplay() {
    const approachCondition =
      this.fws.presentedAbnormalProceduresList.get().size === 0 &&
      this.fws.flightPhase.get() === 8 &&
      (this.fws.adrPressureAltitude.get() ?? 0) < 20_000 &&
      this.hasDeferred.some((v) => v) &&
      this.deferredIsCompleted.some((v) => !v);
    const triggerAutoDisplay =
      this.fws.approachAutoDisplayQnhSetPulseNode.read() || this.fws.approachAutoDisplaySlatsExtendedPulseNode.read();

    if (approachCondition && triggerAutoDisplay && !this.showChecklistRequested.get()) {
      this.showChecklistRequested.set(true);
      this.navigateToChecklist(0);
    }
  }

  public openIfDeferredApplicable() {
    const deferredApplicable = this.hasDeferred.some((v) => v) && this.deferredIsCompleted.some((v) => !v);

    if (deferredApplicable && !this.showChecklistRequested.get()) {
      this.showChecklistRequested.set(true);
      this.navigateToChecklist(0);
    }
  }

  update() {
    if (this.fws.clPulseNode.read()) {
      this.navigateToChecklist(0);
      this.showChecklistRequested.set(!this.showChecklistRequested.get());
    }

    // Update deferred proc status
    for (let i = 0; i <= 3; i++) {
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

    this.checkIfDeferredAutoDisplay();

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
      } else if (
        deferredProcedureIds.includes(this.checklistId.get()) &&
        this.activeDeferredProcedureId.get() === null
      ) {
        this.navigateToChecklist(0);
      } else if (this.activeProcedure) {
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

      if (cl) {
        const deferredProcIndex = deferredProcedureIds.indexOf(procId);
        const procCompleted =
          deferredProcIndex !== -1 ? this.deferredIsCompleted[deferredProcIndex] : cl.procedureCompleted;
        const sensedResult = this.sensedItems[procId].whichItemsChecked();
        const changedEntries = sensedResult.map((val, index) =>
          val !== null && val !== cl.itemsChecked[index] ? index : null,
        );
        if (changedEntries.some((v) => v !== null) || procCompleted !== cl.procedureCompleted) {
          changed = true;

          if (changedEntries.includes(this.selectedLine.get()) && sensedResult[this.selectedLine.get()]) {
            this.moveDown();
          }
        }

        const clState: ChecklistState = {
          id: procId.toString(),
          procedureCompleted: procCompleted,
          procedureActivated: cl.procedureActivated,
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
    }

    const overviewState = this.checklistState.getValue(0);
    if (overviewState) {
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
  }

  destroy() {
    this.subscriptions.forEach((s) => s.destroy());
  }

  public sensedItems: FwsNormalChecklistsDict = {
    1000001: {
      whichItemsChecked: () => [null, null, !!this.fws.seatBelt.get(), null],
    },
    1000002: {
      whichItemsChecked: () => [null, null, SimVar.GetSimVarValue('A:LIGHT BEACON', SimVarValueType.Bool)],
    },
    1000003: {
      whichItemsChecked: () => [null, null, this.fws.rudderTrimPosition.get() < 0.35],
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
      whichItemsChecked: () => [null, null],
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
