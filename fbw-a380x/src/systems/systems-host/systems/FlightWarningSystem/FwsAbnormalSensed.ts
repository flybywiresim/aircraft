// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamAbnormalSensedProcedures } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import {
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapEventType,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { SdPages } from '@shared/EcamSystemPages';
import { FwsEwdAbnormalSensedEntry, FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwcAuralWarning, FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

export interface EwdAbnormalItem {
  flightPhaseInhib: number[];
  /** warning is active */
  simVarIsActive: Subscribable<boolean>;
  /** This alert won't be shown if the following alert(s) are active */
  notActiveWhenFaults: string[];
  /** aural warning, defaults to simVarIsActive and SC for level 2 or CRC for level 3 if not provided */
  auralWarning?: Subscribable<FwcAuralWarning>;
  /** Returns a boolean vector (same length as number of items). If true, item is shown in ECAM actions */
  whichItemsToShow: () => boolean[];
  /** Returns a boolean vector (same length as number of items). If true, item is marked as completed */
  whichItemsChecked: () => boolean[];
  /** Returns a boolean vector (same length as number of items). Optional, defaults to true. If true, item is shown as activated */
  whichItemsActive?: () => boolean[];
  /** 3 = master warning, 2 = master caution */
  failure: number;
  /** Index of ECAM page to be displayed on SD */
  sysPage: SdPages;
  /** Cancel flag for level 3 warning audio (only emergency cancel can cancel if false), defaults to true. */
  cancel?: boolean;
  /** Optional for now: Message IDs of INOP SYS to be displayed on STS page for ALL PHASES */
  inopSysAllPhases?: () => string[];
  /** Optional for now: Message IDs of INOP SYS to be displayed on STS page for APPR&LDG */
  inopSysApprLdg?: () => string[];
  /** Optional for now: Message IDs of INFO to be displayed on STS page */
  info?: () => string[];
  /** Optional for now: Message IDs of REDUND LOSS systems to be displayed on STS page */
  redundLoss?: () => string[];
  /** Optional for now: Message IDs of LIMITATIONS to be displayed on the EWD for ALL PHASES */
  limitationsAllPhases?: () => string[];
  /** Optional for now: Message IDs of LIMITATIONS to be displayed on the EWD for APPR&LDG */
  limitationsApprLdg?: () => string[];
  /** Optional for now: Message IDs of LIMITATIONS to be displayed on the PFD lower area */
  limitationsPfd?: () => string[];
}

export interface EwdAbnormalDict {
  [key: keyof typeof EcamAbnormalSensedProcedures]: EwdAbnormalItem;
}

export class FwsAbnormalSensed {
  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

  public readonly showAbnormalSensed = Subject.create(false);

  /** Marked with cyan box */
  public readonly selectedLine = Subject.create(1);

  /** For overflowing checklists */
  public readonly showFromLine = Subject.create(0);

  constructor(private fws: FwsCore) {
    this.showAbnormalSensed.sub((v) => this.pub.pub('fws_show_abn_sensed', v, true), true);
    this.fws.activeAbnormalSensedList.sub(
      (
        map: ReadonlyMap<string, FwsEwdAbnormalSensedEntry>,
        _type: SubscribableMapEventType,
        _key: string,
        _value: FwsEwdAbnormalSensedEntry,
      ) => {
        const flattened: FwsEwdAbnormalSensedEntry[] = [];
        map.forEach((val, key) =>
          flattened.push({
            id: key,
            itemsChecked: val.itemsChecked,
            itemsActive: val.itemsActive,
            itemsToShow: val.itemsToShow,
          }),
        );
        this.pub.pub('fws_abn_sensed_procedures', flattened, true);
      },
      true,
    );
    this.selectedLine.sub((line) => this.pub.pub('fws_active_line', line, true), true);
    this.showFromLine.sub((line) => this.pub.pub('fws_show_from_line', line, true), true);
  }

  getAbnormalProceduresKeysSorted() {
    return Object.keys(EcamAbnormalSensedProcedures).map((v) => v);
  }

  moveUp() {
    /* const numItems = EcamNormalProcedures[this.checklistId.get()].items.length;
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
    this.showFromLine.set(Math.max(0, this.selectedLine.get() - WD_NUM_LINES + 2));*/
  }

  moveDown() {
    /* if (this.checklistId.get() === 0) {
      this.selectedLine.set(
        Math.min(this.selectedLine.get() + 1, this.getAbnormalProceduresKeysSorted().length - 1, WD_NUM_LINES - 1),
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
    this.showFromLine.set(Math.max(0, this.selectedLine.get() - WD_NUM_LINES + 2));*/
  }

  checkCurrentItem() {
    /* const cl = this.checklistState.getValue(this.checklistId.get());
    const clState: ChecklistState = {
      id: cl.id,
      checklistCompleted: cl.checklistCompleted,
      itemsCompleted: [...cl.itemsCompleted],
    };
    if (this.selectedLine.get() < clState.itemsCompleted.length) {
      clState.itemsCompleted[this.selectedLine.get()] = !clState.itemsCompleted[this.selectedLine.get()];
      this.checklistState.setValue(this.checklistId.get(), clState);
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
      const fromId = this.getAbnormalProceduresKeysSorted().findIndex((v) => v === this.checklistId.get());
      const ids = this.getAbnormalProceduresKeysSorted();

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
      this.checklistState.setValue(this.checklistId.get(), clState);
      this.selectFirst();
    }*/
  }

  /**
   * The majority of ECAM fault logic is still inside FwsCore (due to dependencies to MEMOs, and general flow)
   * This block deals mostly with the pilot interaction through the ECAM CP and transmission to the CDS/EWD
   */
  update() {
    if (this.fws.activeAbnormalSensedList.get().size > 0) {
      this.showAbnormalSensed.set(true);
      this.fws.normalChecklists.showChecklist.set(false);

      // Update selected line: CLEAR of first procedure
      const firstKey = this.fws.activeAbnormalSensedList.get().keys().next().value;
      const numItems = this.fws.activeAbnormalSensedList
        .getValue(firstKey)
        .itemsToShow.filter((v) => v === true).length;
      this.selectedLine.set(numItems + 1);
    } else {
      this.showAbnormalSensed.set(false);
    }

    /*if (this.fws.clDownPulseNode.read()) {
      if (!this.showAbnormalSensed.get()) {
        return;
      }
      this.moveDown();
    }

    if (this.fws.clUpPulseNode.read()) {
      if (!this.showAbnormalSensed.get()) {
        return;
      }
      this.moveUp();
    }*/

    if (this.fws.clCheckPulseNode.read()) {
      if (!this.showAbnormalSensed.get()) {
        return;
      }

      // Only CLEAR implemented atm
      this.fws.presentedFailures.splice(0, 1);
      this.fws.recallFailures = this.fws.allCurrentFailures.filter(
        (item) => !this.fws.presentedFailures.includes(item),
      );
    }
  }

  public ewdAbnormalSensed: EwdAbnormalDict = {
    // 21 - AIR CONDITIONING AND PRESSURIZATION
    211800001: {
      // PACK 1 CTL 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.fdac1Channel1Failure,
      notActiveWhenFaults: ['211800009', '211800021'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      redundLoss: () => ['210300001'],
    },
    211800002: {
      // PACK 1 CTL 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.fdac1Channel2Failure,
      notActiveWhenFaults: ['211800009', '211800021'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      redundLoss: () => ['210300002'],
    },
    211800003: {
      // PACK 2 CTL 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.fdac2Channel1Failure,
      notActiveWhenFaults: ['211800010', '211800021'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      redundLoss: () => ['210300003'],
    },
    211800004: {
      // PACK 2 CTL 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.fdac2Channel2Failure,
      notActiveWhenFaults: ['211800010', '211800021'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      redundLoss: () => ['210300004'],
    },
    211800005: {
      // PACK 1 CTL DEGRADED
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.pack1Degraded,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      inopSysAllPhases: () => ['210300005'],
    },
    211800006: {
      // PACK 2 CTL DEGRADED
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.pack2Degraded,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      inopSysAllPhases: () => ['210300006'],
    },
    211800007: {
      // PACK 1 CTL REDUNDANCY LOST
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.pack1RedundLost,
      notActiveWhenFaults: ['211800005'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      redundLoss: () => ['210300007'],
    },
    211800008: {
      // PACK 2 CTL REDUNDANCY LOST
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.pack2RedundLost,
      notActiveWhenFaults: ['211800006'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Bleed,
      redundLoss: () => ['210300008'],
    },
    211800009: {
      // PACK 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([fdac1fault, fdac2fault]) => fdac1fault && fdac2fault,
        this.fws.fdac1Channel1Failure,
        this.fws.fdac1Channel2Failure,
      ),
      notActiveWhenFaults: ['211800021'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [false, !this.fws.pack1On.get()],
      failure: 2,
      sysPage: SdPages.Bleed,
      inopSysAllPhases: () => ['210300009'],
    },
    211800010: {
      // PACK 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([fdac1fault, fdac2fault]) => fdac1fault && fdac2fault,
        this.fws.fdac2Channel1Failure,
        this.fws.fdac2Channel2Failure,
      ),
      notActiveWhenFaults: ['211800021'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [false, !this.fws.pack2On.get()],
      failure: 2,
      sysPage: SdPages.Bleed,
      inopSysAllPhases: () => ['210300010'],
    },
    211800011: {
      // PACK 1 OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: this.fws.pack1Off,
      notActiveWhenFaults: ['211800009', '211800021'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Bleed,
      inopSysAllPhases: () => ['210300009'],
    },
    211800012: {
      // PACK 2 OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: this.fws.pack2Off,
      notActiveWhenFaults: ['211800010', '211800021'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Bleed,
      inopSysAllPhases: () => ['210300010'],
    },
    211800021: {
      // PACK 1+2 FAULT
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.pack1And2Fault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        false,
        false,
        true,
        true,
        false,
        false,
        false,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() <= 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() <= 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() <= 100,
      ], // TODO: Add logic for doors on ground and pack overheat
      whichItemsChecked: () => [
        false,
        false,
        !this.fws.pack1On.get(),
        !this.fws.pack2On.get(),
        false,
        false,
        false,
        false,
        false,
        false,
        this.fws.ramAirOn.get(),
        this.fws.cabinAirExtractOn.get(),
        false,
        this.fws.ramAirOn.get(),
        this.fws.cabinAirExtractOn.get(),
      ],
      failure: 2,
      sysPage: SdPages.Bleed,
      limitationsAllPhases: () => ['2', '210400001'],
      limitationsPfd: () => ['2', '210400001'],
      inopSysAllPhases: () => ['210300011'],
    },
    211800023: {
      // ALL PRIMARY CABIN FANS FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.allCabinFansFault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300012'],
    },
    211800025: {
      // BULK CARGO HEATER FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.bulkCargoHeaterFault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['210300013'],
    },
    211800026: {
      // BULK CARGO ISOL FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([bulkIsolOpen, bulkIsolFault]) => bulkIsolOpen && bulkIsolFault,
        this.fws.bulkIsolValveOpen,
        this.fws.bulkIsolValveFault,
      ),
      notActiveWhenFaults: ['211800027'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.bulkIsolValvePbOn.get()],
      failure: 2,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['210300014'],
    },
    211800027: {
      // BULK CARGO VENT FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([bulkIsolOpen, bulkIsolFault]) => !bulkIsolOpen && bulkIsolFault,
        this.fws.bulkIsolValveOpen,
        this.fws.bulkIsolValveFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['210300013', '210300015'],
    },
    211800029: {
      // FWD CARGO ISOL FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([fwdIsolOpen, fwdIsolFault]) => fwdIsolOpen && fwdIsolFault,
        this.fws.fwdIsolValveOpen,
        this.fws.fwdIsolValveFault,
      ),
      notActiveWhenFaults: ['211800031'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.fwdIsolValvePbOn.get()],
      failure: 2,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['210300016'],
    },
    211800031: {
      // FWD CARGO VENT FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([fwdIsolOpen, fwdIsolFault]) => !fwdIsolOpen && fwdIsolFault,
        this.fws.fwdIsolValveOpen,
        this.fws.fwdIsolValveFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      info: () => ['210200002', '210200003'],
      inopSysAllPhases: () => ['210300017', '210300018'],
    },
    211800032: {
      // HOT AIR 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([hotAirDisagrees, hotAirOpen]) => hotAirDisagrees && !hotAirOpen,
        this.fws.hotAir1Disagrees,
        this.fws.hotAir1Open,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300019', '210300020'],
    },
    211800033: {
      // HOT AIR 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([hotAirDisagrees, hotAirOpen]) => hotAirDisagrees && !hotAirOpen,
        this.fws.hotAir2Disagrees,
        this.fws.hotAir2Open,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300019', '210300020'],
    },
    211800046: {
      // HOT AIR 1 OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: MappedSubject.create(([hotAirPbOn]) => !hotAirPbOn, this.fws.hotAir1PbOn),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300019', '210300020'],
    },
    211800047: {
      // HOT AIR 2 OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: MappedSubject.create(([hotAirPbOn]) => !hotAirPbOn, this.fws.hotAir2PbOn),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300019', '210300020'],
    },
    211800048: {
      // HOT AIR 1 VLV OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([hotAirDisagrees, hotAirOpen]) => hotAirDisagrees && hotAirOpen,
        this.fws.hotAir1Disagrees,
        this.fws.hotAir1Open,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => [],
    },
    211800049: {
      // HOT AIR 2 VLV OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([hotAirDisagrees, hotAirOpen]) => hotAirDisagrees && hotAirOpen,
        this.fws.hotAir2Disagrees,
        this.fws.hotAir2Open,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => [],
    },
    211800035: {
      // ONE PRIMARY CABIN FAN FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([numberOfFanFailures]) => numberOfFanFailures === 1,
        this.fws.numberOfCabinFanFaults,
      ),
      notActiveWhenFaults: ['211800023', '211800043', '211800044'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['210300025'],
    },
    211800039: {
      // TEMP CTL 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.taddChannel1Failure,
      notActiveWhenFaults: ['211800041'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['210300021'],
    },
    211800040: {
      // TEMP CTL 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.taddChannel2Failure,
      notActiveWhenFaults: ['211800041'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['210300022'],
    },
    211800050: {
      // TEMP CTL DEGRADED
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.tempCtrDegraded,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['210300028'],
    },
    211800041: {
      // TEMP CTL FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.tempCtlFault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      info: () => ['210200003'],
      inopSysAllPhases: () => ['210300023'],
    },
    211800042: {
      // TEMP CTL REDUNDANCY LOST
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.oneTcsAppFailed,
      notActiveWhenFaults: ['211800050'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['210300024'],
    },
    211800043: {
      // THREE PRIMARY CABIN FANS FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([numberOfFanFailures]) => numberOfFanFailures === 3,
        this.fws.numberOfCabinFanFaults,
      ),
      notActiveWhenFaults: ['211800023'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300027'],
    },
    211800044: {
      // TWO PRIMARY CABIN FANS FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([numberOfFanFailures]) => numberOfFanFailures === 2,
        this.fws.numberOfCabinFanFaults,
      ),
      notActiveWhenFaults: ['211800023', '211800043'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['210300026'],
    },
    212800001: {
      // AFT VENT CTL 1 FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.vcmAftChannel1Failure,
      notActiveWhenFaults: ['212800004'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['212300001'],
    },
    212800002: {
      // AFT VENT CTL 2 FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.vcmAftChannel2Failure,
      notActiveWhenFaults: ['212800004'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['212300002'],
    },
    212800003: {
      // AFT VENT CTL DEGRADED
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.aftVentCtrDegraded,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['212300003'],
    },
    212800004: {
      // AFT VENT CTL FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([channel1, channel2]) => channel1 && channel2,
        this.fws.vcmAftChannel1Failure,
        this.fws.vcmAftChannel2Failure,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['212300004', '212300005'],
    },
    212800005: {
      // AFT VENT CTL REDUNDANCY LOST
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.aftVentRedundLost,
      notActiveWhenFaults: ['212800003'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['212300006'],
    },
    212800007: {
      // FWD VENT CTL 1 FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.vcmFwdChannel1Failure,
      notActiveWhenFaults: ['212800010'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['212300007'],
    },
    212800008: {
      // FWD VENT CTL 2 FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.vcmFwdChannel2Failure,
      notActiveWhenFaults: ['212800010'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      redundLoss: () => ['212300008'],
    },
    212800009: {
      // FWD VENT CTL DEGRADED
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.fwdVentCtrDegraded,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: SdPages.Cond,
      inopSysAllPhases: () => ['212300009'],
    },
    212800010: {
      // FWD VENT CTL FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([channel1, channel2]) => channel1 && channel2,
        this.fws.vcmFwdChannel1Failure,
        this.fws.vcmFwdChannel2Failure,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [true], // TODO IFEC overhead PB
      failure: 2,
      sysPage: SdPages.Cond,
      info: () => ['210200001'],
      inopSysAllPhases: () => ['212300010', '212300011', '212300012'],
    },
    212800011: {
      // FWD VENT CTL REDUNDANCY LOST
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.fwdVentRedundLost,
      notActiveWhenFaults: ['212800009'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['212300013'],
    },
    213800001: {
      // EXCESS CAB ALT
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: this.fws.excessCabinAltitude,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        this.fws.flightLevel.get() > 100,
        this.fws.flightLevel.get() > 100 && this.fws.flightLevel.get() < 160,
        this.fws.flightLevel.get() > 100 && this.fws.flightLevel.get() < 160,
        this.fws.flightLevel.get() > 160, // Emer descent
        this.fws.flightLevel.get() > 160, // Emer descent announce
        this.fws.flightLevel.get() > 160, // Emer descent initiate
        this.fws.flightLevel.get() > 160, // All trust levers idle
        this.fws.flightLevel.get() > 160, // Speed brake lever
        this.fws.flightLevel.get() > 160, // Speed max
        this.fws.flightLevel.get() > 160, // Atc notify
        this.fws.flightLevel.get() > 160, // Atc squawk
        this.fws.flightLevel.get() > 160, // Atc emergency msg
        true, // Max 100MEA
        true, // If cab alt above 14000
        true, // Pax oxy mask on
        this.fws.flightLevel.get() > 100, // When descent stablished
        this.fws.flightLevel.get() > 100, // Crew oxy mask dilution
        true, // When diff Pr <2 psi
        true, // Ram air on
        true, // If diff press > 1 PSI
        true, // Cabin air extract on
        true, // When all outflow valves open
        true, // Cabin air extract deselect
      ],
      whichItemsChecked: () => [
        false, // Crew oxy masks
        false, // Crew advice
        false, // Descent initiate
        false, // Emer descent
        false, // Emer descent announce
        false, // Descent initiate
        this.fws.allThrottleIdle.get(), // All trust levers idle
        // Fixme. The speed break should use the lever position instead of the command signal from the FCDC.
        this.fws.speedBrakeCommand.get(), // Speed brake lever
        false, // Speed max
        false, // Atc notify
        false, // Atc squawk
        false, // Atc emergency msg
        false, // Max 100MEA
        false, // If cab alt above 14000
        this.fws.paxOxyMasksDeployed.get(), // Pax oxy mask on
        false, // When descent stablished
        false, // Crew oxy mask dilution
        false, // When diff Pr <2 psi
        this.fws.ramAirOn.get(), // Ram air on
        false, // If diff press > 1 PSI
        this.fws.cabinAirExtractOn.get() || (!this.fws.cabinAirExtractOn.get() && this.fws.allOutflowValvesOpen.get()), // Cabin air extract on
        false, // When all outflow valves open
        !this.fws.cabinAirExtractOn.get() && this.fws.allOutflowValvesOpen.get(), // Cabin air extract deselect
      ],
      failure: 3,
      sysPage: 2,
      limitationsAllPhases: () => ['210400002'],
      limitationsPfd: () => ['210400002'],
    },
    213800002: {
      // EXCESS DIFF PRESS
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: this.fws.excessDiffPressure,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, this.fws.flightLevel.get() > 100, true, true, true, true],
      whichItemsChecked: () => [
        !this.fws.pack1On.get(),
        !this.fws.pack2On.get(),
        false,
        false,
        false,
        this.fws.ramAirOn.get(),
        this.fws.cabinAirExtractOn.get(),
      ],
      failure: 3,
      sysPage: 2,
      limitationsAllPhases: () => ['210400002', '210400001'],
      limitationsPfd: () => ['210400002', '210400001'],
    },
    213800005: {
      // PRESS AUTO CTL FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.ocsmAutoCtlFault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        true,
        // TODO: Sensor failure is not simulated, so the manual system is not available
        true,
        true,
        true,
        true,
        true,
        // TODO: Ambient pressure not available
        false,
        false,
        false,
        false,
        // TODO: Manual pressure available (only when sensor failure)
        false,
        false,
      ],
      whichItemsChecked: () => [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        this.fws.manCabinAltMode.get(),
        false,
      ],
      failure: 2,
      sysPage: 2,
      limitationsAllPhases: () => ['210400003'],
      limitationsPfd: () => ['210400004'],
    },
    213800006: {
      // PRESS CTL REDUNDANCY LOST
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.pressRedundLost,
      notActiveWhenFaults: ['213800005'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => [],
    },
    213800011: {
      // PRESS OUTFLW VLV CTL 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm1Failure,
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800023', '213800024', '213800025'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300001'],
    },
    213800012: {
      // PRESS OUTFLW VLV CTL 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm2Failure,
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800022', '213800023', '213800026', '213800027'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300002'],
    },
    213800013: {
      // PRESS OUTFLW VLV CTL 3 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm3Failure,
      notActiveWhenFaults: ['213800017', '213800019', '213800021', '213800022', '213800024', '213800026', '213800028'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300003'],
    },
    213800014: {
      // PRESS OUTFLW VLV CTL 4 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm4Failure,
      notActiveWhenFaults: ['213800017', '213800020', '213800021', '213800022', '213800025', '213800027', '213800028'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300004'],
    },
    213800017: {
      // PRESS SYS FAULT
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.pressSysFault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get() && this.fws.flightLevel.get() > 100,
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        this.fws.aircraftOnGround.get(),
        this.fws.aircraftOnGround.get(),
        this.fws.aircraftOnGround.get(),
        this.fws.aircraftOnGround.get(),
        this.fws.aircraftOnGround.get(),
      ],
      whichItemsChecked: () => [
        this.fws.flowSelectorKnob.get() == 3,
        false,
        false,
        !this.fws.pack1On.get(),
        !this.fws.pack2On.get(),
        false,
        false,
        false,
        this.fws.ramAirOn.get(),
        this.fws.cabinAirExtractOn.get(),
        this.fws.ramAirOn.get(),
        this.fws.cabinAirExtractOn.get(),
        false,
        !this.fws.pack1On.get(),
        !this.fws.pack2On.get(),
        false,
        false,
      ],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['210400001', '2'],
      limitationsAllPhases: () => ['210400001', '2'],
      limitationsPfd: () => ['210400004'],
    },
    213800019: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 1+2+3
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm2, ocsm3]) => ocsm1 && ocsm2 && ocsm3,
        this.fws.ocsm1Failure,
        this.fws.ocsm2Failure,
        this.fws.ocsm3Failure,
      ),
      notActiveWhenFaults: ['213800017'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300011'],
    },
    213800020: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 1+2+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm2, ocsm4]) => ocsm1 && ocsm2 && ocsm4,
        this.fws.ocsm1Failure,
        this.fws.ocsm2Failure,
        this.fws.ocsm4Failure,
      ),
      notActiveWhenFaults: ['213800017'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300012'],
    },
    213800021: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 1+3+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm3, ocsm4]) => ocsm1 && ocsm3 && ocsm4,
        this.fws.ocsm1Failure,
        this.fws.ocsm3Failure,
        this.fws.ocsm4Failure,
      ),
      notActiveWhenFaults: ['213800017'],
      whichItemsToShow: () => [
        true,
        // TODO: Only when manual press is available
        true,
        true,
        // TODO: Only when ambient pressure is not available
        false,
        false,
        false,
        false,
      ],
      whichItemsChecked: () => [false, this.fws.manCabinAltMode.get(), false, false, false, false, false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300013'],
    },
    213800022: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 2+3+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm2, ocsm3, ocsm4]) => ocsm2 && ocsm3 && ocsm4,
        this.fws.ocsm2Failure,
        this.fws.ocsm3Failure,
        this.fws.ocsm4Failure,
      ),
      notActiveWhenFaults: ['213800017'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300014'],
    },
    213800023: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 1+2
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm2]) => ocsm1 && ocsm2,
        this.fws.ocsm1Failure,
        this.fws.ocsm2Failure,
      ),
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800022'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300006'],
    },
    213800024: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 1+3
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm3]) => ocsm1 && ocsm3,
        this.fws.ocsm1Failure,
        this.fws.ocsm3Failure,
      ),
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800022'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300007'],
    },
    213800025: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 1+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm4]) => ocsm1 && ocsm4,
        this.fws.ocsm1Failure,
        this.fws.ocsm4Failure,
      ),
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800022'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300008'],
    },
    213800026: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 2+3
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm2, ocsm3]) => ocsm2 && ocsm3,
        this.fws.ocsm2Failure,
        this.fws.ocsm3Failure,
      ),
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800022'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300009'],
    },
    213800027: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 2+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm2, ocsm4]) => ocsm2 && ocsm4,
        this.fws.ocsm2Failure,
        this.fws.ocsm4Failure,
      ),
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800022'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300010'],
    },
    213800028: {
      // PRESS OUTFLW VLV CTL FAULT OUTFLW VLV 3+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm3, ocsm4]) => ocsm3 && ocsm4,
        this.fws.ocsm3Failure,
        this.fws.ocsm4Failure,
      ),
      notActiveWhenFaults: ['213800017', '213800019', '213800020', '213800021', '213800022'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: 2,
      inopSysAllPhases: () => ['213300015'],
    },
    213800029: {
      // PRESS AUTO CTL FAULT SYS 1
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm1AutoFailure,
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800033', '213800034', '213800035'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016'],
    },
    213800030: {
      // PRESS AUTO CTL FAULT SYS 2
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm2AutoFailure,
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800042', '213800033', '213800036', '213800037'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300017'],
    },
    213800031: {
      // PRESS AUTO CTL FAULT SYS 3
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm3AutoFailure,
      notActiveWhenFaults: ['213800005', '213800039', '213800041', '213800042', '213800034', '213800036', '213800038'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300018'],
    },
    213800032: {
      // PRESS AUTO CTL FAULT SYS 4
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.ocsm4AutoFailure,
      notActiveWhenFaults: ['213800005', '213800040', '213800041', '213800042', '213800035', '213800037', '213800038'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300019'],
    },
    213800033: {
      // PRESS AUTO CTL FAULT SYS 1+2
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm2]) => ocsm1 && ocsm2,
        this.fws.ocsm1AutoFailure,
        this.fws.ocsm2AutoFailure,
      ),
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800042'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016', '213300017'],
    },
    213800034: {
      // PRESS AUTO CTL FAULT SYS 1+3
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm3]) => ocsm1 && ocsm3,
        this.fws.ocsm1AutoFailure,
        this.fws.ocsm3AutoFailure,
      ),
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800042'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016', '213300018'],
    },
    213800035: {
      // PRESS AUTO CTL FAULT SYS 1+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm4]) => ocsm1 && ocsm4,
        this.fws.ocsm1AutoFailure,
        this.fws.ocsm4AutoFailure,
      ),
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800042'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016', '213300019'],
    },
    213800036: {
      // PRESS AUTO CTL FAULT SYS 2+3
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm2, ocsm3]) => ocsm2 && ocsm3,
        this.fws.ocsm2AutoFailure,
        this.fws.ocsm3AutoFailure,
      ),
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800042'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300017', '213300018'],
    },
    213800037: {
      // PRESS AUTO CTL FAULT SYS 2+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm2, ocsm4]) => ocsm2 && ocsm4,
        this.fws.ocsm2AutoFailure,
        this.fws.ocsm4AutoFailure,
      ),
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800042'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300017', '213300019'],
    },
    213800038: {
      // PRESS AUTO CTL FAULT SYS 3+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm3, ocsm4]) => ocsm3 && ocsm4,
        this.fws.ocsm3AutoFailure,
        this.fws.ocsm4AutoFailure,
      ),
      notActiveWhenFaults: ['213800005', '213800039', '213800040', '213800041', '213800042'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300018', '213300019'],
    },
    213800039: {
      // PRESS AUTO CTL FAULT SYS 1+2+3
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm2, ocsm3]) => ocsm1 && ocsm2 && ocsm3,
        this.fws.ocsm1AutoFailure,
        this.fws.ocsm2AutoFailure,
        this.fws.ocsm3AutoFailure,
      ),
      notActiveWhenFaults: ['213800005'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016', '213300017', '213300018'],
    },
    213800040: {
      // PRESS AUTO CTL FAULT SYS 1+2+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm2, ocsm4]) => ocsm1 && ocsm2 && ocsm4,
        this.fws.ocsm1AutoFailure,
        this.fws.ocsm2AutoFailure,
        this.fws.ocsm4AutoFailure,
      ),
      notActiveWhenFaults: ['213800005'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016', '213300017', '213300019'],
    },
    213800041: {
      // PRESS AUTO CTL FAULT SYS 1+3+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm1, ocsm3, ocsm4]) => ocsm1 && ocsm3 && ocsm4,
        this.fws.ocsm1AutoFailure,
        this.fws.ocsm3AutoFailure,
        this.fws.ocsm4AutoFailure,
      ),
      notActiveWhenFaults: ['213800005'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300016', '213300018', '213300019'],
    },
    213800042: {
      // PRESS AUTO CTL FAULT SYS 2+3+4
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        ([ocsm2, ocsm3, ocsm4]) => ocsm2 && ocsm3 && ocsm4,
        this.fws.ocsm2AutoFailure,
        this.fws.ocsm3AutoFailure,
        this.fws.ocsm4AutoFailure,
      ),
      notActiveWhenFaults: ['213800005'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 1,
      sysPage: 2,
      inopSysAllPhases: () => ['213300017', '213300018', '213300019'],
    },
    // 22 - FLIGHT GUIDANCE
    220800001: {
      // AP OFF involuntary
      flightPhaseInhib: [],
      simVarIsActive: this.fws.autoPilotOffInvoluntary,
      auralWarning: this.fws.autoPilotOffInvoluntary.map((a) =>
        a ? FwcAuralWarning.CavalryCharge : FwcAuralWarning.None,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 3,
      cancel: true,
      sysPage: -1,

      info: () => [],
    },
    220800004: {
      // A/THR OFF involuntary
      flightPhaseInhib: [3, 4, 5, 10],
      simVarIsActive: this.fws.autoThrustOffInvoluntary,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [false],
      whichItemsChecked: () => [SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_MODE_MESSAGE', 'number') !== 1],
      failure: 2,
      sysPage: -1,
      info: () => [],
    },
    // 22 - AUTOFLIGHT
    221800001: {
      // FMC-A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.fmcAFault,
      notActiveWhenFaults: ['221800004', '221800005', '221800006'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [this.fws.fmsSwitchingKnob.get() === 1],
      failure: 1,
      sysPage: -1,
      info: () => ['220200001'],
      redundLoss: () => ['221300001'],
    },
    221800002: {
      // FMC-B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.fmcBFault,
      notActiveWhenFaults: ['221800004', '221800005', '221800006'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [this.fws.fmsSwitchingKnob.get() === 1],
      failure: 1,
      sysPage: -1,
      info: () => ['220200002'],
      redundLoss: () => ['221300002'],
    },
    221800003: {
      // FMC-C FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.fmcCFault,
      notActiveWhenFaults: ['221800004', '221800005', '221800006'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [this.fws.fmsSwitchingKnob.get() === 1],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['221300003'],
    },
    221800004: {
      // FMS 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10],
      simVarIsActive: this.fws.fms1Fault,
      notActiveWhenFaults: ['221800006'],
      whichItemsToShow: () => [
        this.fws.fmcAFault.get() && this.fws.fmcCFault.get(),
        this.fws.fmcAFault.get() && this.fws.fmcBFault.get(),
        this.fws.fmcAFault.get() && !this.fws.fmcBFault.get() && !this.fws.fmcCFault.get(),
        true,
      ], // simplified, update when improved FMS swtchg logic
      whichItemsChecked: () => [true, true, true, this.fws.fmsSwitchingKnob.get() === 0],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['221300004'],
    },
    221800005: {
      // FMS 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10],
      simVarIsActive: this.fws.fms2Fault,
      notActiveWhenFaults: ['221800006'],
      whichItemsToShow: () => [
        this.fws.fmcAFault.get() && this.fws.fmcBFault.get(),
        this.fws.fmcBFault.get() && this.fws.fmcCFault.get(),
        this.fws.fmcBFault.get() && !this.fws.fmcAFault.get() && !this.fws.fmcCFault.get(),
        true,
      ], // simplified, update when improved FMS swtchg logic
      whichItemsChecked: () => [true, true, true, this.fws.fmsSwitchingKnob.get() === 2],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['221300005'],
    },
    221800006: {
      // FMS 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.fms1Fault, this.fws.fms2Fault),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true], // simplified, update when improved FMS swtchg logic
      whichItemsChecked: () => [
        true,
        this.fws.fmsSwitchingKnob.get() === 1,
        false,
        false,
        !this.fws.gpwsFlapModeOff.get(),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['221300006', '340300003'],
      info: () => ['220200003'],
    },
    221800007: {
      // TO SPEEDS NOT INSERTED
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.toSpeedsNotInsertedWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
    },
    221800008: {
      // TO SPEEDS TOO LOW
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.toSpeedsTooLowWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: -1,
    },
    221800009: {
      // TO V1/VR/V2 DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.toV2VRV2DisagreeWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
    },
    // 23 - COMMUNICATION
    230800012: {
      // RMP 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.rmp1Fault,
      notActiveWhenFaults: ['230800015', '230800016', '230800018'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [this.fws.rmp1Off.get()],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300009'],
    },
    230800013: {
      // RMP 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.rmp2Fault,
      notActiveWhenFaults: ['230800015', '230800017', '230800018'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [this.fws.rmp2Off.get()],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300010'],
    },
    230800014: {
      // RMP 3 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.rmp3Fault,
      notActiveWhenFaults: ['230800016', '230800017', '230800018'],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [this.fws.rmp3Off.get()],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300011'],
    },
    230800015: {
      // RMP 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.rmp1Fault, this.fws.rmp2Fault),
      notActiveWhenFaults: ['230800018'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [this.fws.rmp1Off.get(), this.fws.rmp2Off.get()],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300012', '230300015'],
    },
    230800016: {
      // RMP 1+3 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.rmp1Fault, this.fws.rmp3Fault),
      notActiveWhenFaults: ['230800018'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [this.fws.rmp1Off.get(), this.fws.rmp3Off.get()],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300013'],
    },
    230800017: {
      // RMP 2+3 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.rmp2Fault, this.fws.rmp3Fault),
      notActiveWhenFaults: ['230800018'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [this.fws.rmp2Off.get(), this.fws.rmp3Off.get()],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300014'],
    },
    230800018: {
      // RMP 1+2+3 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.rmp1Fault,
        this.fws.rmp2Fault,
        this.fws.rmp3Fault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, false, false, true],
      whichItemsChecked: () => [
        this.fws.rmp1Off.get(),
        this.fws.rmp2Off.get(),
        this.fws.rmp3Off.get(),
        false,
        false,
        false,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['230300016', '230300017', '230300018', '230300019', '230300006', '230300015'],
      limitationsAllPhases: () => ['230400001'],
    },
    // 26 - FIRE PROTECTION
    260800001: {
      // APU FIRE
      flightPhaseInhib: [5, 6],
      simVarIsActive: this.fws.apuFireDetected,
      auralWarning: this.fws.apuFireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [!this.fws.fireTestPb.get(), !this.fws.fireTestPb.get(), !this.fws.fireTestPb.get()],
      whichItemsChecked: () => [
        this.fws.fireButtonAPU.get(),
        this.fws.apuAgentDischarged.get(),
        this.fws.apuMasterSwitch.get() === 0,
      ],
      failure: 3,
      sysPage: SdPages.Apu,
    },
    260800002: {
      // APU FIRE DET FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.apuLoopAFault,
        this.fws.apuLoopBFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['260300001'],
    },
    260800003: {
      // APU FIRE LOOP A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.apuLoopAFault,
      notActiveWhenFaults: ['260800002'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260200025'],
    },
    260800004: {
      // APU FIRE LOOP B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.apuLoopBFault,
      notActiveWhenFaults: ['260800002'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260200026'],
    },
    260800005: {
      // ENG 1 FIRE (IN FLIGHT)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng1Fire]) => !aircraftOnGround && eng1Fire,
        this.fws.aircraftOnGround,
        this.fws.eng1FireDetected,
      ),
      auralWarning: this.fws.eng1FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.throttle1Position.get() == 0 && !this.fws.fireButtonEng1.get(),
        !this.fws.engine1ValueSwitch.get(),
        this.fws.fireButtonEng1.get(),
        !this.fws.apuBleedValveOpen.get(),
        false,
        this.fws.eng1Agent1Discharged.get(),
        false,
        false,
        this.fws.eng1Agent2Discharged.get(),
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300002', '260300006'],
      limitationsAllPhases: () => ['260400001'], // Fixme: should only come on when the ENG 1 fire button is pushed
    },
    260800006: {
      // ENG 2 FIRE (IN FLIGHT)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng2Fire]) => !aircraftOnGround && eng2Fire,
        this.fws.aircraftOnGround,
        this.fws.eng2FireDetected,
      ),
      auralWarning: this.fws.eng2FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.throttle2Position.get() == 0 && !this.fws.fireButtonEng2.get(),
        !this.fws.engine2ValueSwitch.get(),
        this.fws.fireButtonEng2.get(),
        this.fws.eng2Agent1Discharged.get(),
        false,
        false,
        this.fws.eng2Agent2Discharged.get(),
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300003'],
    },
    260800007: {
      // ENG 3 FIRE (IN FLIGHT)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng3Fire]) => !aircraftOnGround && eng3Fire,
        this.fws.aircraftOnGround,
        this.fws.eng3FireDetected,
      ),
      auralWarning: this.fws.eng3FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.throttle3Position.get() == 0 && !this.fws.fireButtonEng3.get(),
        !this.fws.engine3ValueSwitch.get(),
        this.fws.fireButtonEng3.get(),
        this.fws.eng3Agent1Discharged.get(),
        false,
        false,
        this.fws.eng3Agent2Discharged.get(),
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300004'],
    },
    260800008: {
      // ENG 4 FIRE (IN FLIGHT)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng4Fire]) => !aircraftOnGround && eng4Fire,
        this.fws.aircraftOnGround,
        this.fws.eng4FireDetected,
      ),
      auralWarning: this.fws.eng4FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.throttle4Position.get() == 0 && !this.fws.fireButtonEng4.get(),
        !this.fws.engine4ValueSwitch.get(),
        this.fws.fireButtonEng4.get(),
        this.fws.eng4Agent1Discharged.get(),
        false,
        false,
        this.fws.eng4Agent2Discharged.get(),
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300005'],
    },
    260800009: {
      // ENG 1 FIRE (ON GROUND)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng1Fire]) => aircraftOnGround && eng1Fire,
        this.fws.aircraftOnGround,
        this.fws.eng1FireDetected,
      ),
      auralWarning: this.fws.eng1FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
      ],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.allThrottleIdle.get() && !this.fws.fireButtonEng1.get(),
        false,
        this.fws.parkBrake.get(),
        false,
        false,
        !this.fws.engine1ValueSwitch.get(),
        this.fws.fireButtonEng1.get(),
        this.fws.eng1Agent1Discharged.get() && this.fws.eng1Agent2Discharged.get(),
        this.fws.allEngineSwitchOff.get(),
        this.fws.allFireButtons.get(),
        false,
        false,
        !this.fws.evacCommand.get(),
        this.fws.allBatteriesOff.get(),
        false,
        false,
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300002'],
    },
    260800010: {
      // ENG 2 FIRE (ON GROUND)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng2Fire]) => aircraftOnGround && eng2Fire,
        this.fws.aircraftOnGround,
        this.fws.eng2FireDetected,
      ),
      auralWarning: this.fws.eng2FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
      ],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.allThrottleIdle.get() && !this.fws.fireButtonEng2.get(),
        false,
        this.fws.parkBrake.get(),
        false,
        false,
        !this.fws.engine2ValueSwitch.get(),
        this.fws.fireButtonEng2.get(),
        this.fws.eng2Agent1Discharged.get() && this.fws.eng2Agent2Discharged.get(),
        this.fws.allEngineSwitchOff.get(),
        this.fws.allFireButtons.get(),
        false,
        false,
        !this.fws.evacCommand.get(),
        this.fws.allBatteriesOff.get(),
        false,
        false,
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300003'],
    },
    260800011: {
      // ENG 3 FIRE (ON GROUND)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng3Fire]) => aircraftOnGround && eng3Fire,
        this.fws.aircraftOnGround,
        this.fws.eng3FireDetected,
      ),
      auralWarning: this.fws.eng3FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
      ],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.allThrottleIdle.get() && !this.fws.fireButtonEng3.get(),
        false,
        this.fws.parkBrake.get(),
        false,
        false,
        !this.fws.engine3ValueSwitch.get(),
        this.fws.fireButtonEng3.get(),
        this.fws.eng3Agent1Discharged.get() && this.fws.eng3Agent2Discharged.get(),
        this.fws.allEngineSwitchOff.get(),
        this.fws.allFireButtons.get(),
        false,
        false,
        !this.fws.evacCommand.get(),
        this.fws.allBatteriesOff.get(),
        false,
        false,
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300004'],
    },
    260800012: {
      // ENG 4 FIRE (ON GROUND)
      flightPhaseInhib: [5, 6],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, eng4Fire]) => aircraftOnGround && eng4Fire,
        this.fws.aircraftOnGround,
        this.fws.eng4FireDetected,
      ),
      auralWarning: this.fws.eng4FireDetectedAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
        !this.fws.fireTestPb.get(),
      ],
      whichItemsChecked: () => [
        // When the fire pb is released, the FADEC is not powered and the throttle position is unknown which resets this condition
        this.fws.allThrottleIdle.get() && !this.fws.fireButtonEng4.get(),
        false,
        this.fws.parkBrake.get(),
        false,
        false,
        !this.fws.engine4ValueSwitch.get(),
        this.fws.fireButtonEng4.get(),
        this.fws.eng4Agent1Discharged.get() && this.fws.eng4Agent2Discharged.get(),
        this.fws.allEngineSwitchOff.get(),
        this.fws.allFireButtons.get(),
        false,
        false,
        !this.fws.evacCommand.get(),
        this.fws.allBatteriesOff.get(),
        false,
        false,
      ],
      failure: 3,
      sysPage: SdPages.Eng,
      inopSysAllPhases: () => ['260300005'],
    },
    260800013: {
      // ENG 1 FIRE DET FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.eng1LoopAFault,
        this.fws.eng1LoopBFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['260300010'],
    },
    260800014: {
      // ENG 2 FIRE DET FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.eng2LoopAFault,
        this.fws.eng2LoopBFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['260300011'],
    },
    260800015: {
      // ENG 3 FIRE DET FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.eng3LoopAFault,
        this.fws.eng3LoopBFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['260300012'],
    },
    260800016: {
      // ENG 4 FIRE DET FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.eng4LoopAFault,
        this.fws.eng4LoopBFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['260300013'],
    },
    260800017: {
      // ENG 1 FIRE LOOP A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng1LoopAFault,
      notActiveWhenFaults: ['260800013'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300014'],
    },
    260800018: {
      // ENG 1 FIRE LOOP B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng1LoopBFault,
      notActiveWhenFaults: ['260800013'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300015'],
    },
    260800019: {
      // ENG 2 FIRE LOOP A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng2LoopAFault,
      notActiveWhenFaults: ['260800014'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300016'],
    },
    260800020: {
      // ENG 2 FIRE LOOP B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng2LoopBFault,
      notActiveWhenFaults: ['260800014'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300017'],
    },
    260800021: {
      // ENG 3 FIRE LOOP A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng3LoopAFault,
      notActiveWhenFaults: ['260800015'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300018'],
    },
    260800022: {
      // ENG 3 FIRE LOOP B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng3LoopBFault,
      notActiveWhenFaults: ['260800015'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300019'],
    },
    260800023: {
      // ENG 4 FIRE LOOP A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng4LoopAFault,
      notActiveWhenFaults: ['260800016'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300020'],
    },
    260800024: {
      // ENG 4 FIRE LOOP B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.eng4LoopBFault,
      notActiveWhenFaults: ['260800016'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300021'],
    },
    260800025: {
      // MLG BAY FIRE
      flightPhaseInhib: [5],
      simVarIsActive: this.fws.mlgFireDetected,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        !this.fws.fireTestPb.get() &&
          (this.fws.computedAirSpeedToNearest2.get() > 250 || this.fws.machSelectedFromAdr.get() > 0.55),
        !this.fws.fireTestPb.get() && true,
        !this.fws.fireTestPb.get() && true,
        !this.fws.fireTestPb.get() && true,
        !this.fws.fireTestPb.get() && true,
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
        !this.fws.fireTestPb.get() && this.fws.aircraftOnGround.get(),
      ],
      whichItemsChecked: () => [
        false,
        this.fws.gearLeverPos.get(),
        false,
        false,
        false,
        this.fws.allThrottleIdle.get(),
        false,
        this.fws.parkBrake.get(),
        false,
        false,
        this.fws.allEngineSwitchOff.get(),
        false,
        false,
        !this.fws.evacCommand.get(),
        this.fws.apuMasterSwitch.get() === 0,
        this.fws.allBatteriesOff.get(),
        false,
        false,
      ],
      failure: 3,
      sysPage: SdPages.Wheel, // WHEEL SD PAGE
      limitationsAllPhases: () => ['260400002'],
      limitationsPfd: () => ['260400002'],
    },
    260800026: {
      // MLG BAY FIRE DET FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.mlgLoopAFault,
        this.fws.mlgLoopBFault,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['260300022'],
    },
    260800027: {
      // MLG BAY FIRE LOOP A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.mlgLoopAFault,
      notActiveWhenFaults: ['260800026'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300023'],
    },
    260800028: {
      // MLG BAY FIRE LOOP B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.mlgLoopBFault,
      notActiveWhenFaults: ['260800026'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['260300024'],
    },

    // ATA 27 FLIGHT CONTROLS
    271800003: {
      // PITCH TRIM NOT IN TO RANGE
      flightPhaseInhib: [5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.pitchTrimNotToWarning,
      auralWarning: this.fws.pitchTrimNotToAudio.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 3,
      sysPage: SdPages.Fctl,
      inopSysAllPhases: () => [],
    },
    271800032: {
      // PITCH TRIM FMS DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.pitchTrimMcduCgDisagree,
      notActiveWhenFaults: ['271800003'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [],
    },
    271800004: {
      // RUDDER TRIM NOT IN TO RANGE
      flightPhaseInhib: [5, 6, 7, 8, 9, 10],
      auralWarning: this.fws.rudderTrimNotToAudio.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.rudderTrimNotToWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 3,
      sysPage: SdPages.Fctl,
      inopSysAllPhases: () => [],
    },
    271800005: {
      // SPD BRK NOT RETRACTED
      flightPhaseInhib: [5, 6, 7, 8, 9, 10],
      auralWarning: this.fws.speedbrakesConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.speedbrakesConfigWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 3,
      sysPage: SdPages.Fctl,
      inopSysAllPhases: () => [],
    },

    272800001: {
      // SLAT NOT IN TO CONFIG
      flightPhaseInhib: [5, 6, 7, 8, 9, 10, 12],
      auralWarning: this.fws.slatConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.slatConfigWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 3,
      sysPage: SdPages.Fctl,
      inopSysAllPhases: () => [],
    },
    272800002: {
      // FLAPS NOT IN TO CONFIG
      flightPhaseInhib: [5, 6, 7, 8, 9, 10, 12],
      auralWarning: this.fws.flapConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.flapConfigWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 3,
      sysPage: SdPages.Fctl,
      inopSysAllPhases: () => [],
    },
    272800028: {
      // TO FLAPS FMS DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.flapsMcduDisagree,
      notActiveWhenFaults: ['272800002'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: SdPages.Fctl,
      inopSysAllPhases: () => [],
    },
    271800069: {
      // OVERSPEED
      flightPhaseInhib: [2, 3, 4, 5, 10, 11, 12],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.or(),
        this.fws.overspeedVmo,
        this.fws.overspeedVle,
        this.fws.overspeedVfeConf1,
        this.fws.overspeedVfeConf1F,
        this.fws.overspeedVfeConf2,
        this.fws.overspeedVfeConf3,
        this.fws.overspeedVfeConfFull,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        this.fws.overspeedVmo.get(),
        this.fws.overspeedVle.get(),
        this.fws.overspeedVfeConf1.get(),
        this.fws.overspeedVfeConf1F.get(),
        this.fws.overspeedVfeConf2.get(),
        this.fws.overspeedVfeConf3.get(),
        this.fws.overspeedVfeConfFull.get(),
      ],
      whichItemsChecked: () => [false, false, false, false, false, false, false],
      failure: 3,
      sysPage: -1,
      inopSysAllPhases: () => [],
    },
    // 29 FUEL
    281800002: {
      // ALL FEED TKs LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.feedTank1Low,
        this.fws.feedTank2Low,
        this.fws.feedTank3Low,
        this.fws.feedTank4Low,
      ),
      whichItemsToShow: () => [true, true, false, false, false, false, false],
      whichItemsChecked: () => [
        this.fws.allCrossFeedValvesOpen.get(),
        this.fws.allFeedTankPumpsOn.get(),
        false,
        false,
        false,
        false,
        false,
      ],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: [],
      inopSysAllPhases: () => [],
      limitationsAllPhases: () => ['2'],
      limitationsPfd: () => ['2'],
    },
    281800023: {
      // FEED TK 1 LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.feedTank1Low,
      whichItemsToShow: () => [true, true, true, false, false, false, false, false],
      whichItemsChecked: () => [false, false, false, false, false, false, false, false],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: ['281800102', '281800002'],
      inopSysAllPhases: () => [],
    },
    281800024: {
      // FEED TK 2 LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.feedTank2Low,
      whichItemsToShow: () => [true, true, true, false, false, false, false, false],
      whichItemsChecked: () => [
        false,
        this.fws.crossFeed1ValveOpen.get(),
        this.fws.crossFeed2ValveOpen.get(),
        false,
        false,
        false,
        false,
        false,
      ],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: ['281800102', '281800002'],
      inopSysAllPhases: () => [],
    },
    281800025: {
      // FEED TK 3 LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.feedTank3Low,
      whichItemsToShow: () => [true, true, true, false, false, false, false, false],
      whichItemsChecked: () => [
        false,
        this.fws.crossFeed3ValveOpen.get(),
        this.fws.crossFeed4ValveOpen.get(),
        false,
        false,
        false,
        false,
        false,
      ],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: ['281800103', '281800002'],
      inopSysAllPhases: () => [],
    },
    281800026: {
      // FEED TK 4 LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.feedTank4Low,
      whichItemsToShow: () => [true, true, true, false, false, false, false, false],
      whichItemsChecked: () => [
        false,
        this.fws.crossFeed3ValveOpen.get(),
        this.fws.crossFeed4ValveOpen.get(),
        false,
        false,
        false,
        false,
        false,
      ],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: ['281800103', '281800002'],
      inopSysAllPhases: () => [],
    },
    281800102: {
      // FEED TKs 1+2 LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.feedTank1Low,
        this.fws.feedTank2Low,
      ),
      whichItemsToShow: () => [true, true, false, false, false, false, false],
      whichItemsChecked: () => [false, this.fws.allCrossFeedValvesOpen.get(), false, false, false, false, false],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: ['281800002'],
      inopSysAllPhases: () => [],
    },
    281800103: {
      // FEED TKs 3+4 LEVEL LO
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.feedTank3Low,
        this.fws.feedTank4Low,
      ),
      whichItemsToShow: () => [true, true, false, false, false, false, false],
      whichItemsChecked: () => [false, this.fws.allCrossFeedValvesOpen.get(), false, false, false, false, false],
      failure: 2,
      sysPage: SdPages.Fuel,
      notActiveWhenFaults: ['281800002'],
      inopSysAllPhases: () => [],
    },
    281800076: {
      // NO ZFW OR ZFWCG DATA
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: this.fws.fmsZfwOrZfwCgNotSet,
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: -1,
      notActiveWhenFaults: [],
      inopSysAllPhases: () => [],
    },
    // 29 Hydraulic
    290800001: {
      // G ELEC PMP A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.greenAPumpFault,
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.greenAPumpAuto.get()],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
      inopSysAllPhases: () => ['290300001'],
    },
    290800002: {
      // G ELEC PMP B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.greenBPumpFault,
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.greenBPumpAuto.get()],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
      inopSysAllPhases: () => ['290300002'],
    },
    290800003: {
      // Y ELEC PMP A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.yellowAPumpFault,
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.yellowAPumpAuto.get()],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
      inopSysAllPhases: () => ['290300003'],
    },
    290800004: {
      // Y ELEC PMP B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: this.fws.yellowBPumpFault,
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.yellowBPumpAuto.get()],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
      inopSysAllPhases: () => ['290300004'],
    },
    290800005: {
      // G ENG 1 PMP A PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng1APumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng1APumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800006: {
      // G ENG 1 PMP B PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng1BPumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng1BPumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800007: {
      // G ENG 2 PMP A PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng2APumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng2APumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800008: {
      // G ENG 2 PMP B PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng2BPumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng2BPumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800009: {
      // Y ENG 3 PMP A PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng3APumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng3APumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800010: {
      // Y ENG 3 PMP B PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng3BPumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng3BPumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800011: {
      // Y ENG 4 PMP A PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng4APumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng4APumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800012: {
      // Y ENG 4 PMP B PRESS LO
      flightPhaseInhib: [1, 4, 5, 6, 7, 9, 10, 12],
      simVarIsActive: this.fws.eng4BPumpFault,
      whichItemsToShow: () => [true, this.fws.aircraftOnGround.get() && this.fws.threeYellowPumpsFailed.get()],
      whichItemsChecked: () => [!this.fws.eng4BPumpAuto.get(), false],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800019: {
      // G RSVR AIR PRESS LO
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.greenRsvLoAirPressure,
      whichItemsToShow: () => [
        true,
        this.fws.engine1Running.get(),
        this.fws.engine2Running.get(),
        this.fws.enginesOffAndOnGroundSignal.read(),
      ],
      whichItemsChecked: () => [
        false,
        !this.fws.eng1APumpAuto.get() && !this.fws.eng1BPumpAuto.get(),
        !this.fws.eng2APumpAuto.get() && !this.fws.eng2BPumpAuto.get(),
        !this.fws.greenAPumpAuto.get() && !this.fws.greenBPumpAuto.get(),
      ],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800020: {
      // Y RSVR AIR PRESS LO
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.yellowRsvLoAirPressure,
      whichItemsToShow: () => [
        true,
        this.fws.engine3Running.get(),
        this.fws.engine4Running.get(),
        this.fws.enginesOffAndOnGroundSignal.read(),
      ],
      whichItemsChecked: () => [
        false,
        !this.fws.eng3APumpAuto.get() && !this.fws.eng3BPumpAuto.get(),
        !this.fws.eng4APumpAuto.get() && !this.fws.eng4BPumpAuto.get(),
        !this.fws.yellowAPumpAuto.get() && !this.fws.yellowBPumpAuto.get(),
      ],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800021: {
      // G RSVR LEVEL LO
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.greenRsvLoLevel,
      whichItemsToShow: () => [
        this.fws.engine1Running.get(),
        this.fws.engine2Running.get(),
        true,
        true,
        this.fws.enginesOffAndOnGroundSignal.read(),
      ],
      whichItemsChecked: () => [
        !this.fws.eng1APumpAuto.get() && !this.fws.eng1BPumpAuto.get(),
        !this.fws.eng2APumpAuto.get() && !this.fws.eng2BPumpAuto.get(),
        this.fws.eng1PumpDisc.get(),
        this.fws.eng2PumpDisc.get(),
        !this.fws.yellowAPumpAuto.get() && !this.fws.yellowBPumpAuto.get(),
      ],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800022: {
      // Y RSVR LEVEL LO
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.yellowRsvLoLevel,
      whichItemsToShow: () => [
        this.fws.engine3Running.get(),
        this.fws.engine4Running.get(),
        true,
        true,
        this.fws.enginesOffAndOnGroundSignal.read(),
      ],
      whichItemsChecked: () => [
        !this.fws.eng3APumpAuto.get() && !this.fws.eng3BPumpAuto.get(),
        !this.fws.eng4APumpAuto.get() && !this.fws.eng4BPumpAuto.get(),
        this.fws.eng3PumpDisc.get(),
        this.fws.eng4PumpDisc.get(),
        !this.fws.yellowAPumpAuto.get() && !this.fws.yellowBPumpAuto.get(),
      ],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800031: {
      // G SYS OVHT
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.greenRsvOverheat,
      whichItemsToShow: () => [
        this.fws.engine1Running.get(),
        this.fws.engine2Running.get(),
        true,
        true,
        this.fws.enginesOffAndOnGroundSignal.read(),
      ],
      whichItemsChecked: () => [
        !this.fws.eng1APumpAuto.get() && !this.fws.eng1BPumpAuto.get(),
        !this.fws.eng2APumpAuto.get() && !this.fws.eng2BPumpAuto.get(),
        this.fws.eng1PumpDisc.get(),
        this.fws.eng2PumpDisc.get(),
        !this.fws.yellowAPumpAuto.get() && !this.fws.yellowBPumpAuto.get(),
      ],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800032: {
      // Y SYS OVHT
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.yellowRsvOverheat,
      whichItemsToShow: () => [
        this.fws.engine3Running.get(),
        this.fws.engine4Running.get(),
        true,
        true,
        this.fws.enginesOffAndOnGroundSignal.read(),
      ],
      whichItemsChecked: () => [
        !this.fws.eng3APumpAuto.get() && !this.fws.eng3BPumpAuto.get(),
        !this.fws.eng4APumpAuto.get() && !this.fws.eng4BPumpAuto.get(),
        this.fws.eng3PumpDisc.get(),
        this.fws.eng4PumpDisc.get(),
        !this.fws.yellowAPumpAuto.get() && !this.fws.yellowBPumpAuto.get(),
      ],
      failure: 2,
      sysPage: SdPages.Hyd,
      notActiveWhenFaults: [],
    },
    290800035: {
      // G SYS LO PRESS
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.greenAbnormLoPressure,
      whichItemsToShow: () => [
        this.fws.taxiInFlap0Check.read(),
        true,
        true,
        true,
        !this.fws.prim3Healthy,
        !this.fws.prim3Healthy,
        true,
        true,
      ],
      whichItemsChecked: () => [false, false, false, false, false, false, false, false],
      failure: 2,
      limitationsPfd: () => ['320400001'],
      limitationsAllPhases: () => [!this.fws.prim3Healthy ? '800400001' : ''],
      limitationsApprLdg: () => ['320400001', '290400001', '290400002', '320400002', '320400003', '800400002'],
      info: () => ['800200001', '800200002', '220200005'],
      notActiveWhenFaults: ['290800039'],
      sysPage: SdPages.Hyd,
    },
    290800036: {
      // Y SYS LO PRESS
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.yellowAbnormLoPressure,
      whichItemsToShow: () => [
        this.fws.taxiInFlap0Check.read(),
        true,
        !this.fws.prim2Healthy,
        !this.fws.prim2Healthy,
        true,
      ],
      whichItemsChecked: () => [false, false, false, false, false],
      failure: 2,
      limitationsAllPhases: () => [!this.fws.prim2Healthy ? '800400001' : ''],
      limitationsApprLdg: () => ['800400002'],
      info: () => ['800400003', '800200004', '800200004', '220200005'],
      notActiveWhenFaults: ['290800039'],
      sysPage: SdPages.Hyd,
    },
    290800039: {
      // G + Y SYS LO PRESS
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.greenYellowAbnormLoPressure,
      whichItemsToShow: () => [
        true,
        this.fws.flapsHandle.get() <= 3, // fix me use actual flap angle
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ],
      whichItemsChecked: () => [
        !this.fws.eng1APumpAuto.get() &&
          !this.fws.eng1BPumpAuto.get() &&
          !this.fws.eng2APumpAuto.get() &&
          !this.fws.eng2BPumpAuto.get() &&
          !this.fws.eng3APumpAuto.get() &&
          !this.fws.eng3BPumpAuto.get() &&
          !this.fws.eng4APumpAuto.get() &&
          !this.fws.eng4BPumpAuto.get(),
        this.fws.gpwsFlapModeOff.get(),
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
      failure: 2,
      limitationsPfd: () => ['320400001'],
      limitationsAllPhases: () => ['800400001'],
      limitationsApprLdg: () => [
        '320400001',
        '270400001',
        '290400001',
        '320400002',
        '220400001',
        '800400004',
        '320400003',
        '800400003',
      ],
      info: () => ['340200002', '800200001', '320200001', '800200004', '800200005'],
      notActiveWhenFaults: [],
      sysPage: SdPages.Hyd,
    },
    290800040: {
      // Y ELEC PMP A+B OFF
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.yellowElecAandBPumpOff,
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      notActiveWhenFaults: [],
      failure: -1,
      sysPage: -1,
    },
    // 32 Landing Gear & Brakes
    320800008: {
      // BRAKES A_SKID OFF
      flightPhaseInhib: [4, 5, 6, 7],
      simVarIsActive: this.fws.antiSkidSwitchOff, // TODO check for power source & fault signal
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [false, false],
      notActiveWhenFaults: [],
      failure: 2,
      sysPage: SdPages.Wheel,
      limitationsApprLdg: () => ['800400002'],
      inopSysAllPhases: () => ['320300001', '320300002', '220300008'],
      info: () => [
        '320200002',
        '320200003',
        this.fws.oneEngineRunning.get() ? '800200003' : '',
        '800200005',
        '220200005',
      ],
    },
    320800018: {
      // BRAKES HOT
      flightPhaseInhib: [4, 5, 9, 10, 11, 12],
      simVarIsActive: this.fws.brakesHot,
      whichItemsToShow: () => [
        this.fws.phase112.get(),
        this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
        !this.fws.aircraftOnGround.get(),
      ],
      whichItemsChecked: () => [false, false, false, false, false],
      limitationsPfd: () => [this.fws.aircraftOnGround.get() ? '' : '260400002'],
      limitationsAllPhases: () => [this.fws.aircraftOnGround.get() ? '' : '260400002'],
      notActiveWhenFaults: [],
      failure: 2,
      sysPage: SdPages.Wheel,
    },
    320800022: {
      // BRAKES PARK BRK ON
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12],
      simVarIsActive: this.fws.lgParkBrkOn,
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [!this.fws.parkBrake.get()],
      notActiveWhenFaults: [],
      failure: 2,
      sysPage: -1,
    },
    320800030: {
      // CONFIG PARK BRK ON
      flightPhaseInhib: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      simVarIsActive: this.fws.configParkBrakeOn,
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      notActiveWhenFaults: [],
      failure: 3,
      sysPage: -1,
    },
    320800037: {
      // L/G NOT DOWN NO CANCEL
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12],
      simVarIsActive: this.fws.lgNotDownNoCancel,
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      notActiveWhenFaults: [],
      failure: 3,
      sysPage: SdPages.Wheel,
      cancel: false,
    },
    320800038: {
      // L/G NOT DOWN CANCEL
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12],
      simVarIsActive: MappedSubject.create(
        ([lgNotDown, lgNotDownCancel]) => lgNotDown && !lgNotDownCancel,
        this.fws.lgNotDown,
        this.fws.lgNotDownNoCancel,
      ),
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      notActiveWhenFaults: [],
      failure: 3,
      sysPage: SdPages.Wheel,
      cancel: true,
    },
    // 34 NAVIGATION
    340800001: {
      // ADR 1 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: this.fws.adr1Faulty,
      notActiveWhenFaults: ['340800004', '340800008', '340800005'],
      whichItemsToShow: () => [true, true, true, true],
      whichItemsChecked: () => [
        this.fws.airKnob.get() === 0,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_1_PB_IS_ON', 'Bool'),
        true,
        SimVar.GetSimVarValue('A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'number') === 0,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300004',
        this.fws.airKnob.get() === 0 ? '' : '340300011',
        this.fws.airKnob.get() === 0 ? '' : '340300001',
      ],
      inopSysApprLdg: () => ['220300008'],
      info: () => ['220200005'],
    },
    340800002: {
      // ADR 2 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: this.fws.adr2Faulty,
      notActiveWhenFaults: ['340800004', '340800008', '340800006'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [
        this.fws.airKnob.get() === 2,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_2_PB_IS_ON', 'Bool'),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300005',
        this.fws.airKnob.get() === 2 ? '' : '340300012',
        this.fws.airKnob.get() === 2 ? '' : '340300002',
      ],
      inopSysApprLdg: () => ['220300008'],
      info: () => ['220200005'],
    },
    340800003: {
      // ADR 3 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: this.fws.adr3Faulty,
      notActiveWhenFaults: ['340800005', '340800006', '340800008'],
      whichItemsToShow: () => [true, true, true, true],
      whichItemsChecked: () => [
        this.fws.airKnob.get() === 1,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_3_PB_IS_ON', 'Bool'),
        true,
        SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB', 'number') === 0,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['340300006'],
      inopSysApprLdg: () => ['220300008'],
      info: () => ['220200005'],
    },
    340800004: {
      // ADR 1+2 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr1Faulty, this.fws.adr2Faulty),
      notActiveWhenFaults: ['340800008'],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        this.fws.airKnob.get() === 0,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_1_PB_IS_ON', 'Bool'),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_2_PB_IS_ON', 'Bool'),
        true,
        true,
        true,
        true,
        SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'number') === 0,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300014',
        '340300021',
        '220300007',
        '220300024',
        '340300007',
        this.fws.airKnob.get() === 0 ? '340300012' : '340300029',
        this.fws.airKnob.get() === 0 ? '340300002' : '340300003',
      ],
      inopSysApprLdg: () => ['320300007', '320300022', '220300009', '220300010', '220300025'],
      info: () => ['340200002', '340200003'],
      limitationsApprLdg: () => ['240400001'],
    },
    340800005: {
      // ADR 1+3 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr1Faulty, this.fws.adr3Faulty),
      notActiveWhenFaults: ['340800008'],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        this.fws.airKnob.get() === 1,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_1_PB_IS_ON', 'Bool'),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_3_PB_IS_ON', 'Bool'),
        true,
        true,
        true,
        true,
        SimVar.GetSimVarValue('A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'number') === 0,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300014',
        '340300021',
        '220300007',
        '220300024',
        '340300009',
        '340300011',
        '340300001',
      ],
      inopSysApprLdg: () => ['320300007', '320300022', '220300009', '220300010', '220300025'],
      info: () => ['340200002', '340200003'],
      limitationsApprLdg: () => ['240400001'],
    },
    340800006: {
      // ADR 2+3 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr2Faulty, this.fws.adr3Faulty),
      notActiveWhenFaults: ['340800008'],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        this.fws.airKnob.get() === 1,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_2_PB_IS_ON', 'Bool'),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_3_PB_IS_ON', 'Bool'),
        true,
        true,
        true,
        true,
        SimVar.GetSimVarValue('A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB', 'number') === 0,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300014',
        '340300021',
        '220300007',
        '220300024',
        '340300008',
        '340300012',
        '340300002',
      ],
      inopSysApprLdg: () => ['320300007', '320300022', '220300009', '220300010', '220300025'],
      info: () => ['340200002', '340200003'],
      limitationsApprLdg: () => ['240400001'],
    },
    340800008: {
      // ADR 1+2+3 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.adr1Faulty,
        this.fws.adr2Faulty,
        this.fws.adr3Faulty,
      ),
      notActiveWhenFaults: ['340800010', '340800071'],
      whichItemsToShow: () => [true, true, true],
      whichItemsChecked: () => [
        false,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_1_PB_IS_ON', 'Bool') &&
          !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_2_PB_IS_ON', 'Bool') &&
          !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_ADR_3_PB_IS_ON', 'Bool'),
        true,
      ],
      failure: 3,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300014',
        '340300021',
        '220300007',
        '220300024',
        '340300010',
        '340300029',
        '340300003',
      ],
      inopSysApprLdg: () => ['320300007', '320300022', '220300009', '220300010', '220300021', '220300025'],
      info: () => ['340200002', '340200003', '340200007'],
      limitationsAllPhases: () => ['240400002', '240400003', '240400004', '300400001'],
      limitationsApprLdg: () => ['240400001'],
      limitationsPfd: () => ['240400002', '240400003', '240400004', '300400001'],
    },
    340800021: {
      // EXTREME LATITUDE
      flightPhaseInhib: [4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.extremeLatitudeAlert,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true],
      whichItemsChecked: () => [SimVar.GetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'Bool')],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => [''],
      redundLoss: () => [''],
      info: () => [''],
    },
    340800040: {
      // IR 1 FAULT
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: this.fws.ir1Fault,
      notActiveWhenFaults: ['340800042', '340800043'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [
        this.fws.attKnob.get() === 0,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_PB_IS_ON', 'Bool'),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300030',
        this.fws.attKnob.get() === 0 ? '' : '340300011',
        this.fws.attKnob.get() === 0 ? '' : '340300037',
        this.fws.attKnob.get() === 0 ? '' : '340300039',
        this.fws.attKnob.get() === 0 ? '' : '340300041',
      ],
      info: () => ['220200005'],
    },
    340800041: {
      // IR 2 FAULT
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: this.fws.ir2Fault,
      notActiveWhenFaults: ['340800042', '340800044'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [
        this.fws.attKnob.get() === 2,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_PB_IS_ON', 'Bool'),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300031',
        this.fws.attKnob.get() === 2 ? '' : '340300012',
        this.fws.attKnob.get() === 2 ? '' : '340300038',
        this.fws.attKnob.get() === 2 ? '' : '340300040',
        this.fws.attKnob.get() === 2 ? '' : '340300042',
      ],
      info: () => ['220200005'],
    },
    340800072: {
      // IR 3 FAULT
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: this.fws.ir3Fault,
      notActiveWhenFaults: ['340800043', '340800044'],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [
        this.fws.attKnob.get() === 1,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_PB_IS_ON', 'Bool'),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['340300032'],
      info: () => ['220200005'],
    },
    340800042: {
      // IR 1+2 FAULT
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.ir1Fault, this.fws.ir2Fault),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true],
      whichItemsChecked: () => [
        this.fws.attKnob.get() === 0,
        true,
        true,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_PB_IS_ON', 'Bool'),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_PB_IS_ON', 'Bool'),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300033',
        this.fws.attKnob.get() === 0 ? '340300038' : '340300043',
        this.fws.attKnob.get() === 0 ? '340300012' : '340300029',
        this.fws.attKnob.get() === 0 ? '340300040' : '340300044',
        this.fws.attKnob.get() === 0 ? '340300042' : '340300045',
      ],
      inopSysApprLdg: () => ['220300026'],
      info: () => ['340200002', '220200010'],
    },
    340800043: {
      // IR 1+3 FAULT
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.ir1Fault, this.fws.ir3Fault),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true, true],
      whichItemsChecked: () => [
        this.fws.attKnob.get() === 1,
        true,
        true,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_PB_IS_ON', 'Bool'),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_PB_IS_ON', 'Bool'),
        true,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300034',
        '220300005',
        '220300022',
        '340300037',
        '340300011',
        '340300039',
        '340300041',
      ],
      inopSysApprLdg: () => ['220300026'],
      info: () => ['340200002', '220200010', '340200008'],
    },
    340800044: {
      // IR 2+3 FAULT
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.ir2Fault, this.fws.ir3Fault),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true],
      whichItemsChecked: () => [
        this.fws.attKnob.get() === 1,
        true,
        true,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_PB_IS_ON', 'Bool'),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_PB_IS_ON', 'Bool'),
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [
        '340300013',
        '340300035',
        '220300006',
        '220300023',
        '340300038',
        '340300012',
        '340300040',
        '340300042',
      ],
      inopSysApprLdg: () => ['220300026'],
      info: () => ['340200002', '220200010'],
    },
    340800045: {
      // IR NOT ALIGNED
      flightPhaseInhib: [4, 5, 6, 9, 10],
      simVarIsActive: this.fws.irExcessMotion,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [
        this.fws.ir1MaintWord.bitValueOr(13, false) &&
          !this.fws.ir2MaintWord.bitValueOr(13, false) &&
          !this.fws.ir3MaintWord.bitValueOr(13, false),
        !this.fws.ir1MaintWord.bitValueOr(13, false) &&
          this.fws.ir2MaintWord.bitValueOr(13, false) &&
          !this.fws.ir3MaintWord.bitValueOr(13, false),
        !this.fws.ir1MaintWord.bitValueOr(13, false) &&
          !this.fws.ir2MaintWord.bitValueOr(13, false) &&
          this.fws.ir3MaintWord.bitValueOr(13, false),
        this.fws.ir1MaintWord.bitValueOr(13, false) &&
          this.fws.ir2MaintWord.bitValueOr(13, false) &&
          !this.fws.ir3MaintWord.bitValueOr(13, false),
        this.fws.ir1MaintWord.bitValueOr(13, false) &&
          !this.fws.ir2MaintWord.bitValueOr(13, false) &&
          this.fws.ir3MaintWord.bitValueOr(13, false),
        !this.fws.ir1MaintWord.bitValueOr(13, false) &&
          this.fws.ir2MaintWord.bitValueOr(13, false) &&
          !this.fws.ir3MaintWord.bitValueOr(13, false),
        this.fws.ir1MaintWord.bitValueOr(13, false) &&
          this.fws.ir2MaintWord.bitValueOr(13, false) &&
          this.fws.ir3MaintWord.bitValueOr(13, false),
      ],
      whichItemsChecked: () => [true, true, true, true, true, true, true],
      failure: 2,
      sysPage: -1,
    },
    340800053: {
      // RA SYS A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.ac2BusPowered,
      ),
      notActiveWhenFaults: ['340800059', '340800060', '340800062'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => [''],
      redundLoss: () => ['340300022'],
      info: () => [''],
    },
    340800054: {
      // RA SYS B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height2Failed,
        this.fws.ac4BusPowered,
      ),
      notActiveWhenFaults: ['340800059', '340800061', '340800062'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => ['220300008'],
      redundLoss: () => ['340300023'],
      info: () => ['220200005'],
    },
    340800055: {
      // RA SYS C FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height3Failed,
        this.fws.acESSBusPowered,
      ),
      notActiveWhenFaults: ['340800060', '340800061', '340800062'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 1,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => [''],
      redundLoss: () => ['340300024'],
      info: () => [''],
    },
    340800059: {
      // RA SYS A+B FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.height2Failed,
        this.fws.ac2BusPowered,
        this.fws.ac4BusPowered,
      ),
      notActiveWhenFaults: ['340800062'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => ['340300025', '220300002'],
      info: () => ['220200004'],
    },
    340800060: {
      // RA SYS A+C FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.height3Failed,
        this.fws.ac2BusPowered,
        this.fws.acESSBusPowered,
      ),
      notActiveWhenFaults: ['340800062'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => ['340300026', '220300002'],
      info: () => ['220200004'],
    },
    340800061: {
      // RA SYS B+C FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height2Failed,
        this.fws.height3Failed,
        this.fws.ac4BusPowered,
        this.fws.acESSBusPowered,
      ),
      notActiveWhenFaults: ['340800062'],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [],
      inopSysApprLdg: () => ['340300027', '220300002'],
      info: () => ['220200004'],
    },
    340800062: {
      // RA SYS A+B+C FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.height2Failed,
        this.fws.height3Failed,
        this.fws.ac2BusPowered,
        this.fws.ac4BusPowered,
        this.fws.acESSBusPowered,
      ),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['340300029', '340300003', '341300003'],
      inopSysApprLdg: () => ['320300007', '320300022', '340300028', '310300001', '220300009', '220300010', '220300021'],
      info: () => ['220200007', '220200008', '220200009'],
    },
    // SURVEILLANCE
    341800016: {
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.tcas1Fault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [false], // TODO replace with SURV SYS logic once implemented
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: -1,
    },
    341800017: {
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.tcas2Fault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [false],
      whichItemsChecked: () => [false],
      failure: 2,
      sysPage: -1,
    },
    341800018: {
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.tcas1And2Fault,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
    },
    341800019: {
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      simVarIsActive: this.fws.tcasStandby,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
    },
    341800037: {
      flightPhaseInhib: [1, 3, 4, 5, 6, 7, 10, 12],
      simVarIsActive: this.fws.xpdrStby,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsChecked: () => [],
      failure: 2,
      sysPage: -1,
    },
  };
}
