// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, SimVarValueType, Subject, Subscription } from '@microsoft/msfs-sdk';
import { ChecklistState, FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwcAuralWarning, FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { EcamAbNormalSensedSubMenuVector, WD_NUM_LINES } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { AbnormalNonSensedProceduresOverview } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalNonSensedProcedures';
import { EwdAbnormalDict } from 'systems-host/systems/FlightWarningSystem/FwsAbnormalSensed';
import { SdPages } from '@shared/EcamSystemPages';

export class FwsAbnormalNonSensed {
  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

  private subs: Subscription[] = [];

  public readonly abnProcShown = Subject.create(false);

  public readonly showAbnProcRequested = Subject.create(false);

  /** ID of checklist or 0 for overview, 1-10 for sub-menus, >10 for procedure preview */
  public readonly checklistId = Subject.create(0);

  /** Marked with cyan box */
  public readonly selectedItem = Subject.create(0);

  /** For overflowing checklists */
  public readonly showFromLine = Subject.create(0);

  public readonly checklistState = MapSubject.create<number, ChecklistState>();

  constructor(private fws: FwsCore) {
    this.subs.push(
      this.checklistId.sub((id) => {
        this.pub.pub('fws_abn_non_sensed_id', id, true);
        if (id > 10) {
          this.pub.pub('fws_abn_non_sensed_current_active', this.fws.activeAbnormalNonSensedKeys.has(id), true);
        }
      }, true),
    );
  }

  getAbnormalNonSensedMenuSize(): number {
    if (this.checklistId.get() === 0) {
      // Overview page
      return (
        AbnormalNonSensedProceduresOverview.map((val) => (val.category === null ? 1 : 0) as number).reduce(
          (accumulator, currentValue) => accumulator + currentValue,
        ) + EcamAbNormalSensedSubMenuVector.length
      );
    } else if (this.checklistId.get() > 0 && this.checklistId.get() <= EcamAbNormalSensedSubMenuVector.length) {
      const category = EcamAbNormalSensedSubMenuVector[this.checklistId.get() - 1];
      return AbnormalNonSensedProceduresOverview.map((val) => (val.category === category ? 1 : 0) as number).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
      );
    }
  }

  moveUp() {
    if (this.checklistId.get() <= 10) {
      this.selectedItem.set(Math.max(this.selectedItem.get() - 1, 0));
    }
  }

  moveDown() {
    if (this.checklistId.get() <= 10) {
      this.selectedItem.set(Math.min(this.selectedItem.get() + 1, this.getAbnormalNonSensedMenuSize() - 1));
    }
  }

  navigateToParent() {
    this.checklistId.set(0);
    this.selectedItem.set(0);
  }

  update() {
    if (this.fws.abnProcPulseNode.read()) {
      this.checklistId.set(0);
      this.selectedItem.set(0);
      this.showAbnProcRequested.set(!this.showAbnProcRequested.get());
    }

    if (!this.abnProcShown.get()) {
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
        const skipProcsFromTopMenu = AbnormalNonSensedProceduresOverview.map(
          (val) => (val.category === null ? 1 : 0) as number,
        ).reduce((accumulator, currentValue) => accumulator + currentValue);
        if (
          this.selectedItem.get() >= skipProcsFromTopMenu &&
          this.selectedItem.get() < this.getAbnormalNonSensedMenuSize()
        ) {
          // Call sub menu
          this.checklistId.set(this.selectedItem.get() - skipProcsFromTopMenu + 1);
          this.selectedItem.set(0);
        } else if (this.selectedItem.get() < skipProcsFromTopMenu) {
          // Preview non-sensed procedure
          this.checklistId.set(AbnormalNonSensedProceduresOverview[this.selectedItem.get()]?.id ?? 0);
          this.selectedItem.set(-1);
        }
      } else if (this.checklistId.get() > 0 && this.checklistId.get() <= 10) {
        // Sub menu
        const subMenuProcsStartAt = AbnormalNonSensedProceduresOverview.findIndex(
          (v) => v.category === EcamAbNormalSensedSubMenuVector[this.checklistId.get() - 1],
        );
        // Preview non-sensed procedure
        this.checklistId.set(AbnormalNonSensedProceduresOverview[subMenuProcsStartAt + this.selectedItem.get()].id);
        this.selectedItem.set(-1);
      } else {
        // Activate or de-activate non-sensed procedure (add to ECAM faults) and close dialog, i.e. return to abnormal procs
        if (!this.fws.activeAbnormalNonSensedKeys.has(this.checklistId.get())) {
          this.fws.activeAbnormalNonSensedKeys.add(this.checklistId.get());
        } else {
          this.fws.activeAbnormalNonSensedKeys.delete(this.checklistId.get());
        }
        this.selectedItem.set(0);
        this.showAbnProcRequested.set(false);
      }
    }
  }

  reset() {
    this.fws.activeAbnormalNonSensedKeys.clear();
    this.checklistState.clear();
    this.showAbnProcRequested.set(false);
  }

  destroy() {
    this.subs.forEach((s) => s.destroy());
  }

  public ewdAbnormalNonSensed: EwdAbnormalDict = {
    260900097: {
      // SMOKE / FUMES
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(260900097)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [true, true, true, true, true, true],
      whichItemsChecked: () => [
        false,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_VENT_CAB_FANS_PB_IS_ON', SimVarValueType.Bool),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO', SimVarValueType.Bool),
        !!this.fws.seatBelt.get(),
        false,
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      redundLoss: () => [],
    },
  };
}
