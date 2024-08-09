// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamAbnormalSensedProcedures } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { MappedSubject, Subscribable, SubscribableMapFunctions } from '@microsoft/msfs-sdk';
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
  whichItemsCompleted: () => boolean[];
  /** Returns a boolean vector (same length as number of items). Optional, defaults to true. If true, item is shown as activated */
  whichItemsActive?: () => boolean[];
  /** 3 = master warning, 2 = master caution */
  failure: number;
  /** Index of ECAM page to be displayed on SD */
  sysPage: number;
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
  constructor(private fws: FwsCore) {}

  public ewdAbnormalSensed: EwdAbnormalDict = {
    // 22 - AUTOFLIGHT
    221800001: {
      // FMC-A FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10, 11],
      simVarIsActive: this.fws.fmcAFault,
      notActiveWhenFaults: ['221800004', '221800005', '221800006'],
      whichItemsToShow: () => [true],
      whichItemsCompleted: () => [this.fws.fmsSwitchingKnob.get() === 1],
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
      whichItemsCompleted: () => [this.fws.fmsSwitchingKnob.get() === 1],
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
      whichItemsCompleted: () => [this.fws.fmsSwitchingKnob.get() === 1],
      failure: 1,
      sysPage: -1,
      redundLoss: () => ['221300003'],
    },
    221800004: {
      // FMS 1 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10],
      simVarIsActive: this.fws.fms1Fault,
      notActiveWhenFaults: ['221800006'],
      whichItemsToShow: () => [true, false, false, true], // simplified, update when improved FMS swtchg logic
      whichItemsCompleted: () => [true, true, true, this.fws.fmsSwitchingKnob.get() === 0],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['221300004'],
    },
    221800005: {
      // FMS 2 FAULT
      flightPhaseInhib: [3, 4, 5, 6, 7, 10],
      simVarIsActive: this.fws.fms2Fault,
      notActiveWhenFaults: ['221800006'],
      whichItemsToShow: () => [true, false, false, true], // simplified, update when improved FMS swtchg logic
      whichItemsCompleted: () => [true, true, true, this.fws.fmsSwitchingKnob.get() === 2],
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
      whichItemsCompleted: () => [
        true,
        this.fws.fmsSwitchingKnob.get() === 1,
        false,
        false,
        this.fws.gpwsFlapMode.get() === 1,
      ],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['221300006', '340300003'],
      info: () => ['220200003'],
    },
    221800007: {
      // TO SPEEDS NOT INSERTED
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.toSpeedsNotInsertedWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
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
      whichItemsCompleted: () => [this.fws.rmp1Off.get()],
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
      whichItemsCompleted: () => [this.fws.rmp2Off.get()],
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
      whichItemsCompleted: () => [this.fws.rmp3Off.get()],
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
      whichItemsCompleted: () => [this.fws.rmp1Off.get(), this.fws.rmp2Off.get()],
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
      whichItemsCompleted: () => [this.fws.rmp1Off.get(), this.fws.rmp3Off.get()],
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
      whichItemsCompleted: () => [this.fws.rmp2Off.get(), this.fws.rmp3Off.get()],
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
      whichItemsCompleted: () => [
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
    // ATA 27 FLIGHT CONTROLS
    271800003: {
      // PITCH TRIM NOT IN TO RANGE
      flightPhaseInhib: [5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.pitchTrimNotToWarning,
      auralWarning: this.fws.pitchTrimNotToAudio.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
      failure: 3,
      sysPage: 12,
      inopSysAllPhases: () => [],
    },
    271800032: {
      // PITCH TRIM FMS DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.pitchTrimMcduCgDisagree,
      notActiveWhenFaults: ['271800003'],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => [],
    },
    271800005: {
      // SPD BRK NOT RETRACTED
      flightPhaseInhib: [5, 6, 7, 8, 9, 10],
      auralWarning: this.fws.speedbrakesConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.speedbrakesConfigWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
      failure: 3,
      sysPage: 12,
      inopSysAllPhases: () => [],
    },
    272800001: {
      // SLAT NOT IN TO CONFIG
      flightPhaseInhib: [5, 6, 7, 8, 9, 10, 12],
      auralWarning: this.fws.slatConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.slatConfigWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
      failure: 3,
      sysPage: 12,
      inopSysAllPhases: () => [],
    },
    272800002: {
      // FLAPS NOT IN TO CONFIG
      flightPhaseInhib: [5, 6, 7, 8, 9, 10, 12],
      auralWarning: this.fws.flapConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.fws.flapConfigWarning,
      notActiveWhenFaults: [],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
      failure: 3,
      sysPage: 12,
      inopSysAllPhases: () => [],
    },
    272800028: {
      // TO FLAPS FMS DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10, 12],
      simVarIsActive: this.fws.flapsMcduDisagree,
      notActiveWhenFaults: ['272800002'],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
      failure: 2,
      sysPage: 12,
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
      whichItemsCompleted: () => [false, false, false, false, false, false, false],
      failure: 3,
      sysPage: -1,
      inopSysAllPhases: () => [],
    },
    // 34 NAVIGATION
    340800001: {
      // ADR 1 FAULT
      flightPhaseInhib: [4, 5, 10],
      simVarIsActive: this.fws.adr1Fault,
      notActiveWhenFaults: ['340800004', '340800008', '340800005'],
      whichItemsToShow: () => [true, true, true, true],
      whichItemsCompleted: () => [
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
      simVarIsActive: this.fws.adr2Fault,
      notActiveWhenFaults: ['340800004', '340800008', '340800006'],
      whichItemsToShow: () => [true, true],
      whichItemsCompleted: () => [
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
      simVarIsActive: this.fws.adr3Fault,
      notActiveWhenFaults: ['340800005', '340800006', '340800008'],
      whichItemsToShow: () => [true, true, true, true],
      whichItemsCompleted: () => [
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
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr1Fault, this.fws.adr2Fault),
      notActiveWhenFaults: ['340800008'],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true],
      whichItemsCompleted: () => [
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
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr1Fault, this.fws.adr3Fault),
      notActiveWhenFaults: ['340800008'],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true],
      whichItemsCompleted: () => [
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
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr2Fault, this.fws.adr3Fault),
      notActiveWhenFaults: ['340800008'],
      whichItemsToShow: () => [true, true, true, true, true, true, true, true],
      whichItemsCompleted: () => [
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
        this.fws.adr1Fault,
        this.fws.adr2Fault,
        this.fws.adr3Fault,
      ),
      notActiveWhenFaults: ['340800010', '340800071'],
      whichItemsToShow: () => [true, true, true],
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [SimVar.GetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'Bool')],
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
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [
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
      whichItemsCompleted: () => [true, true, true, true, true, true, true],
      failure: 2,
      sysPage: -1,
    },
    340800053: {
      // RA SYS A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed && this.fws.ac2BusPowered,
      ),
      notActiveWhenFaults: ['340800059', '340800060', '340800062'],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
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
        this.fws.height2Failed && this.fws.ac4BusPowered,
      ),
      notActiveWhenFaults: ['340800059', '340800061', '340800062'],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
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
        this.fws.height3Failed && this.fws.acESSBusPowered,
      ),
      notActiveWhenFaults: ['340800060', '340800061', '340800062'],
      whichItemsToShow: () => [],
      whichItemsCompleted: () => [],
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
      whichItemsCompleted: () => [],
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
      whichItemsCompleted: () => [],
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
      whichItemsCompleted: () => [],
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
      whichItemsCompleted: () => [],
      failure: 2,
      sysPage: -1,
      inopSysAllPhases: () => ['340300029', '340300003', '341300003'],
      inopSysApprLdg: () => ['320300007', '320300022', '340300028', '310300001', '220300009', '220300010', '220300021'],
      info: () => ['220200007', '220200008', '220200009'],
    },
  };
}
