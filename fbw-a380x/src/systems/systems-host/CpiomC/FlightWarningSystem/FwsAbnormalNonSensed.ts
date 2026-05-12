/* eslint-disable prettier/prettier */
// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, SimVarValueType, Subject, Subscription } from '@microsoft/msfs-sdk';
import { ChecklistState, FwsEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';
import { FwcAuralWarning, FwsCore } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';
import { EcamAbNormalSensedSubMenuVector } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { AbnormalNonSensedProceduresOverview } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalNonSensedProcedures';
import { EwdAbnormalDict } from 'systems-host/CpiomC/FlightWarningSystem/FwsAbnormalSensed';
import { SdPages } from '@shared/EcamSystemPages';

export class FwsAbnormalNonSensed {
  private readonly pub = this.fws.bus.getPublisher<FwsEvents>();

  private readonly subscriptions: Subscription[] = [];

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
    this.subscriptions.push(
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
    } else {
      return 0;
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
    if (this.checklistId.get() === 0) {
      this.showAbnProcRequested.set(false);
    } else {
      this.checklistId.set(0);
      this.selectedItem.set(0);
    }
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
    this.subscriptions.forEach((s) => s.destroy());

    for (const key in this.ewdAbnormalNonSensed) {
      const element = this.ewdAbnormalNonSensed[key];
      if ('destroy' in element.simVarIsActive) {
        element.simVarIsActive.destroy();
      }

      if (element.auralWarning && 'destroy' in element.auralWarning) {
        element.auralWarning.destroy();
      }
    }
  }

  public ewdAbnormalNonSensed: EwdAbnormalDict = {
    260900097: {
      // SMOKE / FUMES
      flightPhaseInhib: [],
      simVarIsActive: this.fws.smokeFumesActivated,
      notActiveWhenItemActive: [],
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
    },
    270900001: {
      // F/CTL RUDDER PEDAL JAMMED
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(270900001)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true],
      whichItemsChecked: () => [false, false, false, false, false, false, false],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.Fctl,
      limitationsApprLdg: () => ['320400004', '700400001'],
      info: () => ['220200013', '220200012', '320200004'],
    },
    270900002: {
      // F/CTL RUDDER TRIM RUNAWAY
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(270900002)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [true, true, true, true, true, true],
      whichItemsChecked: () => [false, false, false, false, false, false],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.Fctl,
      limitationsAllPhases: () => ['270400003'],
      limitationsPfd: () => ['270400003'],
    },
    270900003: {
      // F/CTL SPEED BRAKES LEVER JAMMED
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(270900003)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
        this.fws.speedBrakeCommand.get(),
        this.fws.speedBrakeCommand.get(),
        !this.fws.speedBrakeCommand.get() && !this.fws.spoilersArmed.get(),
        this.fws.spoilersArmed.get(),
      ],
      whichItemsChecked: () => [false, false, false, false],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      info: () => [!this.fws.speedBrakeCommand.get() && !this.fws.spoilersArmed.get() ? '270200002' : ''],
    },
    270900004: {
      // F/CTL LDG WITH FLAPS LEVER JAMMED
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(270900004)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
        this.fws.flapsHandle.get() <= 2,
        this.fws.flapsHandle.get() === 3,
        this.fws.flapsHandle.get() < 2,
        this.fws.flapsHandle.get() < 2,
        true,
        true,
        true,
        true,
      ],
      whichItemsChecked: () => [false, false, this.fws.tawsFlapModeOff.get(), false, false, false, false, false],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      limitationsAllPhases: () => ['800400001'],
      limitationsApprLdg: () => [
        this.fws.flapsHandle.get() === 3 ? '270400001' : '',
        ...(this.fws.flapsHandle.get() < 3 ? ['220400001', '800400004'] : ''),
      ],
      info: () => ['220200011'],
    },
    270900005: {
      // F/CTL LDG WITH NO SLATS NO FLAPS
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(270900005)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        false,
        false,
        false,
        this.fws.tawsFlapModeOff.get(),
        false,
        false,
        false,
        false,
        false,
        this.fws.flapsHandle.get() === 1,
        false,
        false,
        !this.fws.autoThrustEngaged.get(),
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      limitationsAllPhases: () => [],
      limitationsApprLdg: (checked) => (checked[2] ? ['270400004', '220400001', '800400004'] : []),
    },
    320900006: {
      // WHEEL TIRE DAMAGE SUSPECTED
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(320900006)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [true, true],
      whichItemsChecked: () => [false, false],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.Wheel,
      info: () => ['800200003'],
    },
    990900005: {
      // EMER DESCENT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(990900005)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
        true,
        true,
        true,
        this.fws.autoThrustEngaged.get(),
        true,
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
        false,
        !!this.fws.seatBelt.get(),
        false,
        this.fws.allThrottleIdle.get(),
        this.fws.speedBrakeCommand.get(),
        false,
        false,
        false,
        false,
        false,
        false,
        this.fws.paxOxyMasksDeployed.get(),
        false,
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      limitationsAllPhases: () => ['210400001'],
      limitationsPfd: () => ['210400001'],
    },
    990900006: {
      // EMER EVAC
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(990900006)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        false,
        this.fws.parkBrakeSet.get(),
        false,
        false,
        !this.fws.pack1On.get() && !this.fws.pack2On.get(),
        this.fws.allEngineSwitchOff.get(),
        this.fws.allFireButtons.get(),
        false,
        false,
        false,
        !this.fws.evacCommand.get(),
        this.fws.allBatteriesOff.get(),
        false,
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
    },
    990900009: {
      // OVERWEIGHT LDG
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(990900009)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
        true,
        true,
        true,
        true,
        true,
        !this.fws.flapSys1Fault.get() && !this.fws.flapSys2Fault.get() && !this.fws.lrElevFaultCondition.get(),
        true,
        true,
        true,
      ],
      whichItemsChecked: () => [
        false,
        false,
        false,
        (!this.fws.pack1On.get() && !this.fws.pack2On.get()) || this.fws.apuBleedPbOn.get(),
        false,
        false,
        false,
        false,
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
    },
    340900003: {
      // NAV UNRELIABLE AIRSPEED INDICATION
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(340900003)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
        true, // [1]
        true, // [2]
        true, // [3]
        true, // [4]
        this.fws.flightPhase.get() <= 7, // [5]
        this.fws.flightPhase.get() <= 7 && (this.fws.adrPressureAltitude.get() ?? 0) < 10_000, // [6]
        this.fws.flightPhase.get() <= 7 && (this.fws.adrPressureAltitude.get() ?? 0) >= 10_000, // [7]
        false, // [8] //TODO: if derated climb engaged
        this.fws.flightPhase.get() > 7, // [9]
        this.fws.flightPhase.get() > 7 && (this.fws.adrPressureAltitude.get() ?? 0) < 10_000, // [10]
        this.fws.flightPhase.get() > 7 &&
          (this.fws.adrPressureAltitude.get() ?? 0) >= 10_000 &&
          (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [11]
        this.fws.flightPhase.get() > 7 && (this.fws.adrPressureAltitude.get() ?? 0) >= 25_000, // [12]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [13]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [14]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [15]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [16]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [17]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000 && this.fws.flapsHandle.get() === 4, // [18]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [19]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [20]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [21]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [22]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [23]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [24]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [25]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [26]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [27]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [28]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [29]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [30]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [31]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [32] //TODO check if at least two MFP heating failed
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [33]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [34]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [35] //TODO check if soft GA is lost
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [36]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [37]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [38]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [39]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [40]
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000, // [41]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [42]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [43]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [44]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [45]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [46]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [47]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [48]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [49]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [50]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [51]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [52]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [53]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [54]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [55]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [56]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [57]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [58]
        (this.fws.adrPressureAltitude.get() ?? 0) > 25_000, // [59] //TODO check if soft GA is lost
      ],
      whichItemsChecked: () => [
        false, // [1]
        this.fws.apOff.get(), // [2]
        !this.fws.autoThrustEngaged.get(), // [3]
        this.fws.fdOff.get(), // [4]
        this.fws.allThrottleToga.get(), // [5]
        false, // [6]
        false, // [7]
        this.fws.allThrottleMct.get(), // [8]
        this.fws.allThrottleClb.get(), // [9]
        false, // [10]
        false, // [11]
        false, // [12]
        false, // [13]
        false, // [14]
        false, // [15]
        false, // [16]
        false, // [17]
        this.fws.flapsHandle.get() === 3, // [18]
        false, // [19]
        false, // [20]
        false, // [21]
        false, // [22]
        false, // [23]
        false, // [24]
        false, // [25]
        false, // [26]
        false, // [27]
        false, // [28]
        this.fws.allAdrPbsOff.get(), // [29]
        false, // [30]
        false, // [31]
        false, // [32]
        false, // [33]
        this.fws.manCabinAltMode.get(), // [34]
        false, // [35]
        false, // [36]
        false, // [37]
        false, // [38]
        false, // [39]
        false, // [40]
        false, // [41]
        true, // [42]
        this.fws.apOff.get(), // [43]
        !this.fws.autoThrustEngaged.get(), // [44]
        this.fws.fdOff.get(), // [45]
        false, // [46]
        false, // [47]
        false, // [48]
        false, // [49]
        false, // [50]
        false, // [51]
        false, // [52]
        false, // [53]
        false, // [54]
        false, // [55]
        false, // [56]
        false, // [57]
        false, // [58]
        false, // [59]
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      limitationsAllPhases: () => [],
      inopSysAllPhases: () => [],
      info: () => [
        '220200015',
        (this.fws.adrPressureAltitude.get() ?? 0) < 25_000 ? '340200007' : '',
        this.fws.allAdrPbsOff.get() ? '340200006' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200010' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200011' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200012' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200009' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200013' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200014' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200015' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200016' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '340200017' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '220200014' : '',
        (this.fws.adrPressureAltitude.get() ?? 0) <= 25_000 ? '220200011' : '',
      ],
    },
  };
}
