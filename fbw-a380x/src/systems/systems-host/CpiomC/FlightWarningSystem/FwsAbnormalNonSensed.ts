// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MapSubject, SimVarValueType, Subject, Subscription } from '@microsoft/msfs-sdk';
import { ChecklistState, FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwcAuralWarning, FwsCore } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';
import { EcamAbNormalSensedSubMenuVector, WD_NUM_LINES } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { AbnormalNonSensedProceduresOverview } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalNonSensedProcedures';
import { EwdAbnormalDict } from 'systems-host/CpiomC/FlightWarningSystem/FwsAbnormalSensed';
import { SdPages } from '@shared/EcamSystemPages';

export class FwsAbnormalNonSensed {
  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

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
      limitationsApprLdg: () => ['320400004', '700400001', '800400002'],
      inopSysApprLdg: () => ['320300007'],
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
        ...(this.fws.flapsHandle.get() < 3 ? ['220400001', '800400004', '800400003'] : ''),
      ],
      inopSysApprLdg: () => ['320300007'],
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
      limitationsApprLdg: (checked) => (checked[2] ? ['270400004', '220400001', '800400004', '800400003'] : []),
      inopSysApprLdg: () => ['320300007'],
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
      limitationsApprLdg: () => ['800400002'],
      inopSysApprLdg: () => ['320300007'],
      info: () => ['800200003'],
    },
    700900001: {
      // ENG // RELIGHT IN FLIGHT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(700900001)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
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
        true,
        true,
        true,
      ],
      whichItemsChecked: () => [
        false,
        false,
        false,
        false,
        false,
        this.fws.xBleedSelectorKnob.get() === 2,
        !this.fws.wingAntiIce.get(),
        false,
        this.fws.engSelectorPosition.get() === 2,
        false,
        false,
        false,
        false,
        this.fws.engSelectorPosition.get() === 1,
        this.fws.tcasTaRa.get(),
        this.fws.xBleedSelectorKnob.get() === 1,
        false,
        false,
        false,
        this.fws.engSelectorPosition.get() === 2,
        false,
        false,
        this.fws.xBleedSelectorKnob.get() === 2,
        !this.fws.wingAntiIce.get(),
        false,
        false,
        false,
        this.fws.flightLevel.get() < 200,
        this.fws.apuStartSwitch.get() === 1,
        this.fws.apuAvail.get(),
        false,
        false,
        this.fws.apuBleedPbOn.get(),
        false,
        false,
        false,
        false,
        false,
        this.fws.engSelectorPosition.get() === 1,
        this.fws.xBleedSelectorKnob.get() === 1,
        false,
        false,
        this.fws.tcasTaRa.get(),
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      redundLoss: () => [],
    },
    700900002: {
      // ENG // TAIL PIPE FIRE
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(700900002)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
        true,
        this.fws.oneEngineRunning.get(),
        !this.fws.oneEngineRunning.get(),
        !this.fws.oneEngineRunning.get()) && this.fws.apuAvail.get(),
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
        this.fws.xBleedSelectorKnob.get() === 2,
        this.fws.apuAvail.get(),
        this.fws.apuBleedPbOn.get(),
        false,
        this.fws.engSelectorPosition.get() === 0,
        false,
        false,
        false,
        this.fws.engSelectorPosition.get() === 1,
        this.fws.xBleedSelectorKnob.get() === 1,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      redundLoss: () => [],
    },
    990900001: {
      // BOMB ON BOARD
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(990900001)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
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
        true,
        true,
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
        false,
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO', SimVarValueType.Bool),
        !SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO', SimVarValueType.Bool),
        false,
        this.fws.flapsHandle.get() > 0,
        this.fws.gearLeverPos.get(),
        false,
        false,
        false,
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      limitationsAllPhases: (checked) => (checked[6] ? ['800400005', '800400001'] : []),
      info: () => ['800200001'],
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
      limitationsApprLdg: () => ['800400002'],
    },
    990900010: {
      // SEVERE TURBULENCE
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(990900010)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true, true, true],
      whichItemsChecked: () => [
        !!this.fws.seatBelt.get(),
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        !!(this.fws.autoThrustStatus.get() === 0),
        false,
      ],
      failure: 1,
      auralWarning: Subject.create(FwcAuralWarning.None),
      sysPage: SdPages.None,
      limitationsAllPhases: () => ['800400008', '800400006', '800400007'],
    },
    990900011: {
      // VOLCANIC ASH ENCOUNTER
      flightPhaseInhib: [],
      simVarIsActive: this.fws.activeAbnormalNonSensedKeys.map((set) => set.has(990900011)),
      notActiveWhenItemActive: [],
      whichItemsToShow: () => [
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
        true,
        true,
        true,
        true,
        true,
      ],
      whichItemsChecked: () => [
        false,
        false,
        !!(this.fws.autoThrustStatus.get() === 0),
        false,
        false,
        false,
        false,
        !!this.fws.eng1AntiIce.get() &&
          !!this.fws.eng2AntiIce.get() &&
          !!this.fws.eng3AntiIce.get() &&
          !!this.fws.eng4AntiIce.get(),
        !!this.fws.wingAntiIce.get(),
        !!(this.fws.flowSelectorKnob.get() === 3),
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
