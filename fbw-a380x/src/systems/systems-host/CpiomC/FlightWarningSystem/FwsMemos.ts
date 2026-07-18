// Copyright (c) 2025-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamMemos } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { MappedSubject, SubscribableMapFunctions, Subscription } from '@microsoft/msfs-sdk';
import { FwsCore, FwsSuppressableItem } from './FwsCore';

export enum PfdMemoDisplay {
  PFD,
  EWD_PFD,
}

interface FwsMemo extends FwsSuppressableItem {
  codesToReturn: string[];
}

interface EwdMemoItem extends FwsMemo {
  whichCodeToReturn: () => number;

  /** Whether the memo should be displayed on the PFD, EWD, or both. Defaults to EWD only if undefined */
  displayedOnPfd?: PfdMemoDisplay;
}

export interface EwdMemoDict {
  [key: keyof typeof EcamMemos]: EwdMemoItem;
}

interface SpecialEwdMemoItem extends FwsMemo {
  whichCodeToReturn: () => number[];
}

export interface SpecialEwdMemoDict {
  [key: keyof typeof EcamMemos]: SpecialEwdMemoItem;
}

export class FwsMemos {
  public readonly subscriptions: Subscription[] = [];

  constructor(private fws: FwsCore) {}
  /** MEMOs on right side of EWD */
  ewdMemos: EwdMemoDict = {
    210000001: {
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.highLandingFieldElevation,
      whichCodeToReturn: () => 0,
      codesToReturn: ['210000001'],
    },
    210000002: {
      // RAM AIR
      simVarIsActive: this.fws.ramAirOn,
      whichCodeToReturn: () => (this.fws.flightPhase1Or12.get() ? 0 : 1),
      codesToReturn: ['210000002', '210000003'],
    },
    271000001: {
      // GND SPLRs ARMED
      simVarIsActive: this.fws.spoilersArmedMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['271000001'],
    },
    '280000001': {
      // CROSSFEED OPEN
      simVarIsActive: this.fws.crossFeedOpenMemo,
      whichCodeToReturn: () => (this.fws.flightPhase34567.get() ? 1 : 0),
      codesToReturn: ['280000001', '280000013'],
    },
    280000003: {
      // DEFUEL IN PROGRESS,
      simVarIsActive: this.fws.defuelInProgressMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['280000003'],
    },
    280000009: {
      // REFUEL IN PROGRESS,
      simVarIsActive: this.fws.refuelInProgressMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['280000009'],
    },
    '280000010': {
      // REFUEL PNL DOOR OPEN
      simVarIsActive: this.fws.refuelPanelOpenMemo,
      whichCodeToReturn: () => (!this.fws.flightPhase1Or12.get() ? 1 : 0),
      codesToReturn: ['280000010', '280000011'],
    },
    '300000001': {
      // ENG ANTI ICE
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.or(),
        this.fws.eng1AntiIce,
        this.fws.eng2AntiIce,
        this.fws.eng3AntiIce,
        this.fws.eng4AntiIce,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['300000001'],
      displayedOnPfd: PfdMemoDisplay.EWD_PFD,
    },
    '300000002': {
      // WING ANTI ICE
      simVarIsActive: this.fws.wingAntiIce,
      whichCodeToReturn: () => 0,
      codesToReturn: ['300000002'],
      displayedOnPfd: PfdMemoDisplay.EWD_PFD,
    },
    '300000003': {
      // ICE NOT DETECTED
      flightPhaseInhib: [1, 2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([iceNotDetTimer2Status, aircraftOnGround]) => iceNotDetTimer2Status && !aircraftOnGround,
        this.fws.iceNotDetTimer2Status,
        this.fws.aircraftOnGround,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['300000003'],
    },
    '0000170': {
      // APU AVAIL
      simVarIsActive: MappedSubject.create(
        ([apuAvail, apuBleedValveOpen]) => apuAvail && !apuBleedValveOpen,
        this.fws.apuAvail,
        this.fws.apuBleedValveOpen,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['000017001'],
    },
    '0000180': {
      // APU BLEED
      simVarIsActive: MappedSubject.create(
        ([apuAvail, apuBleedValveOpen]) => apuAvail && apuBleedValveOpen,
        this.fws.apuAvail,
        this.fws.apuBleedValveOpen,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['000018001'],
    },
    '230000001': {
      // CAPT ON RMP 3
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r1Off && !r3Off && !r2Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000001'],
    },
    // 22 - Flight guidance
    220000001: {
      // AP OFF
      simVarIsActive: this.fws.autoPilotOffShowMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['220000001'],
      displayedOnPfd: PfdMemoDisplay.EWD_PFD,
      monitorConfirmTime: 0,
    },
    220000002: {
      // A/THR OFF EWD
      simVarIsActive: this.fws.autoThrustOffVoluntaryEwdMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['220000002'],
      monitorConfirmTime: 0,
    },
    220000003: {
      // A/THR OFF PFD
      simVarIsActive: this.fws.autoThrustoffInvoluntaryPfdMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['220000002'],
      displayedOnPfd: PfdMemoDisplay.PFD,
      monitorConfirmTime: 0,
    },
    // FMS SWTG
    221000001: {
      simVarIsActive: this.fws.fmsSwitchingNotNorm,
      whichCodeToReturn: () => 0,
      codesToReturn: ['221000001'],
    },
    // DEST EFOB
    221000002: {
      simVarIsActive: this.fws.fmsDestEfob,
      whichCodeToReturn: () => 0,
      codesToReturn: ['221000002'],
    },
    '230000002': {
      // F/O ON RMP 3
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r2Off && !r3Off && !r1Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000002'],
    },
    '230000003': {
      // CAPT+F/O ON RMP 3
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r1Off && r2Off && !r3Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000003'],
    },
    '230000009': {
      // RMP 1+2+3 OFF
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000009'],
    },
    '230000010': {
      // RMP 1+3 OFF
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r1Off && r3Off && !r2Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000010'],
    },
    '230000011': {
      // RMP 2+3 OFF
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r2Off && r3Off && !r1Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000011'],
    },
    '230000012': {
      // RMP 3 OFF
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r3Off && !r1Off && !r2Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000012'],
    },
    '230000015': {
      // VHF3 VOICE
      simVarIsActive: this.fws.vhf3VoiceMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['230000015'],
    },

    // ATA 24
    '241000001': {
      // ELEC EXT PWR
      simVarIsActive: this.fws.extPowerMemo,
      whichCodeToReturn: () =>
        [
          this.fws.engine1Running.get(),
          this.fws.engine2Running.get(),
          this.fws.engine3Running.get(),
          this.fws.engine4Running.get(),
        ].filter(Boolean).length > 1
          ? 0
          : 1,
      codesToReturn: ['241000001', '241000002'],
    },
    '242000001': {
      // RAT OUT
      simVarIsActive: this.fws.ratDeployed.map((v) => v > 0),
      whichCodeToReturn: () => (this.fws.flightPhase1211.get() ? 0 : 1),
      codesToReturn: ['242000001', '242000002'],
    },
    // ATA 29
    '290000001': {
      // G ELEC PMP A CTL
      simVarIsActive: this.fws.greenAPumpOn,
      whichCodeToReturn: () => 0,
      codesToReturn: ['290000001'],
    },
    '290000002': {
      // G ELEC PMP B CTL
      simVarIsActive: this.fws.greenBPumpOn,
      whichCodeToReturn: () => 0,
      codesToReturn: ['290000002'],
    },
    '290000003': {
      // Y ELEC PMP A CTL
      simVarIsActive: this.fws.yellowAPumpOn,
      whichCodeToReturn: () => 0,
      codesToReturn: ['290000003'],
    },
    '290000004': {
      // Y ELEC PMP A CTL
      simVarIsActive: this.fws.yellowBPumpOn,
      whichCodeToReturn: () => 0,
      codesToReturn: ['290000004'],
    },
    // 31 INDICATING RECORDING
    314000001: {
      // T.O. INHIBIT
      monitorConfirmTime: 0,
      simVarIsActive: this.fws.takeoffInhibitMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['314000001'],
    },
    314000002: {
      // LDG INHIBIT
      monitorConfirmTime: 0,
      simVarIsActive: this.fws.ldgInhibitMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['314000002'],
    },
    // 32 LANDING GEAR
    320000001: {
      // AUTO BRK OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
      simVarIsActive: this.fws.autoBrakeOff,
      whichCodeToReturn: () => 0,
      codesToReturn: ['320000001'],
      displayedOnPfd: PfdMemoDisplay.EWD_PFD,
      monitorConfirmTime: 0,
    },
    // ATA 32
    '322000001': {
      // N/W STEER DISC
      simVarIsActive: this.fws.nwSteeringDiscMemo,
      whichCodeToReturn: () =>
        [
          this.fws.engine1Running.get(),
          this.fws.engine2Running.get(),
          this.fws.engine3Running.get(),
          this.fws.engine4Running.get(),
        ].filter(Boolean).length > 1
          ? 0
          : 1,
      codesToReturn: ['322000001', '322000002'],
    },
    '320000002': {
      // PARK BRK ON
      simVarIsActive: this.fws.parkingBrakeOnMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['320000002'],
    },
    '333000001': {
      // STROBE LT OFF
      simVarIsActive: MappedSubject.create(
        ([strobeLightsOn, flightPhase]) => strobeLightsOn === 2 && flightPhase === 8,
        this.fws.strobeLightsOn,
        this.fws.flightPhase,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['333000001'],
    },
    '335000001': {
      // SEAT BELTS
      simVarIsActive: this.fws.seatBeltOnMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['335000001'],
    },
    '335000003': {
      // NO MOBILE
      simVarIsActive: this.fws.noMobileSwitchPosition.map((pos) => pos === 0),
      whichCodeToReturn: () => 0,
      codesToReturn: ['335000003'],
    },
    '340000001': {
      // TODO add pulsing on slat/flap extension
      // TRUE NORTH REF
      simVarIsActive: this.fws.trueNorthRef,
      whichCodeToReturn: () => 0,
      codesToReturn: ['340000001'],
    },
    '340003001': {
      // IR IN ALIGN
      simVarIsActive: MappedSubject.create(
        ([adirsRemainingAlignTime, ir1Align, ir2Align, ir3Align, flightphase1Or2Or12]) => {
          const remainingTimeAbove240 = adirsRemainingAlignTime >= 240;
          const allInAlign = ir1Align && ir2Align && ir3Align;
          return remainingTimeAbove240 && allInAlign && flightphase1Or2Or12;
        },
        this.fws.adirsRemainingAlignTime,
        this.fws.ir1Align,
        this.fws.ir2Align,
        this.fws.ir3Align,
        this.fws.flightphase1Or2Or12,
      ),
      whichCodeToReturn: () =>
        this.fws.adirsMessage1(
          this.fws.adirsRemainingAlignTime.get(),
          (this.fws.engine1State.get() > 0 && this.fws.engine1State.get() < 4) ||
            (this.fws.engine2State.get() > 0 && this.fws.engine2State.get() < 4) ||
            (this.fws.engine3State.get() > 0 && this.fws.engine3State.get() < 4) ||
            (this.fws.engine4State.get() > 0 && this.fws.engine4State.get() < 4),
        ),
      codesToReturn: [
        '340003001',
        '340003002',
        '340003003',
        '340003004',
        '340003005',
        '340003006',
        '340003007',
        '340003008',
      ],
    },
    '340003101': {
      // IR IN ALIGN
      simVarIsActive: MappedSubject.create(
        ([adirsRemainingAlignTime, ir1Align, ir2Align, ir3Align, flightphase1Or2Or12]) => {
          const remainingTimeAbove0 = adirsRemainingAlignTime > 0;
          const remainingTimeBelow240 = adirsRemainingAlignTime < 240;
          const allInAlign = ir1Align && ir2Align && ir3Align;
          return remainingTimeAbove0 && remainingTimeBelow240 && allInAlign && flightphase1Or2Or12;
        },
        this.fws.adirsRemainingAlignTime,
        this.fws.ir1Align,
        this.fws.ir2Align,
        this.fws.ir3Align,
        this.fws.flightphase1Or2Or12,
      ),
      whichCodeToReturn: () =>
        this.fws.adirsMessage2(
          this.fws.adirsRemainingAlignTime.get(),
          (this.fws.engine1State.get() > 0 && this.fws.engine1State.get() < 4) ||
            (this.fws.engine2State.get() > 0 && this.fws.engine2State.get() < 4) ||
            (this.fws.engine3State.get() > 0 && this.fws.engine3State.get() < 4) ||
            (this.fws.engine4State.get() > 0 && this.fws.engine4State.get() < 4),
        ),
      codesToReturn: [
        '340003101',
        '340003102',
        '340003103',
        '340003104',
        '340003105',
        '340003106',
        '340003107',
        '340003108',
      ],
    },
    '340068001': {
      // ADIRS SWTG
      simVarIsActive: MappedSubject.create(
        ([airKnob, attKnob]) => attKnob !== 1 || airKnob !== 1,
        this.fws.airKnob,
        this.fws.attKnob,
      ),
      whichCodeToReturn: () => 0,
      codesToReturn: ['340068001'],
    },

    '341000001': {
      // GPWS OFF
      simVarIsActive: this.fws.tawsGpwsOffMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['341000001'],
    },
    '341000002': {
      // TAWS FLAP MODE OFF
      simVarIsActive: this.fws.tawsFlapModeOffMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['341000002'],
    },
    '341000003': {
      // TAWS G/S MODE OFF
      simVarIsActive: this.fws.tawsGsOffMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['341000003'],
    },

    '343000001': {
      // TCAS STBY
      simVarIsActive: this.fws.tcasStandbyMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['343000001'],
    },
    '343000002': {
      // ALT RPTG OFF
      simVarIsActive: this.fws.xpdrAltReportingOffMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['343000002'],
    },
    '343000003': {
      // XPDR STBY
      simVarIsActive: this.fws.xpdrStbymemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['343000003'],
    },
    '350000001': {
      // OXY PAX SYS ON
      simVarIsActive: this.fws.paxOxyMasksDeployedMemo,
      whichCodeToReturn: () => (this.fws.paxOxyMasksDeployedMemoGreen ? 0 : 1),
      codesToReturn: ['350000001', '350000002'],
    },
    '460000001': {
      // COMPANY MSG
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.companyMessageMemo,
      whichCodeToReturn: () => 0,
      codesToReturn: ['460000001'],
    },
    '709000001': {
      // IGNITION
      simVarIsActive: this.fws.engSelectorPosition.map((v) => v === 2),
      whichCodeToReturn: () => 0,
      codesToReturn: ['709000001'],
    },
  };

  /** MEMOs on lower left side of EWD (TO and LDG memos only) */
  ewdToLdgMemos: SpecialEwdMemoDict = {
    '0000010': {
      // T.O MEMO
      simVarIsActive: this.fws.toMemo.map((t) => !!t),
      whichCodeToReturn: () => [
        0,
        SimVar.GetSimVarValue('L:A32NX_NO_SMOKING_MEMO', 'bool') === 1 &&
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1
          ? 2
          : 1,
        this.fws.spoilersArmed.get() ? 4 : 3,
        this.fws.slatFlapSelectionS18F10 || this.fws.slatFlapSelectionS22F15 || this.fws.slatFlapSelectionS22F20
          ? 6
          : 5,
        this.fws.autoBrake.get() === 6 ? 8 : 7,
        this.fws.toConfigNormal.get() ? 10 : 9,
      ],
      codesToReturn: [
        '000001001',
        '000001002',
        '000001003',
        '000001006',
        '000001007',
        '000001008',
        '000001009',
        '000001010',
        '000001011',
        '000001012',
        '000001013',
      ],
    },
    '0000020': {
      // LANDING MEMO
      simVarIsActive: this.fws.ldgMemo.map((t) => !!t),
      whichCodeToReturn: () => [
        0,
        SimVar.GetSimVarValue('L:A32NX_NO_SMOKING_MEMO', 'bool') === 1 &&
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1
          ? 2
          : 1,
        this.fws.isAllGearDownlocked ? 4 : 3,
        this.fws.spoilersArmed.get() ? 6 : 5,
        (!SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'bool') &&
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 4) ||
        (SimVar.GetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'bool') &&
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 3)
          ? 8
          : 7,
      ],
      codesToReturn: [
        '000002001',
        '000002002',
        '000002003',
        '000002006',
        '000002007',
        '000002008',
        '000002009',
        '000002010',
        '000002011',
      ],
    },
  };

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());

    for (const key in this.ewdMemos) {
      const memo = this.ewdMemos[key];
      if ('destroy' in memo.simVarIsActive) {
        memo.simVarIsActive.destroy();
      }
    }

    for (const key in this.ewdToLdgMemos) {
      const memo = this.ewdToLdgMemos[key];
      if ('destroy' in memo.simVarIsActive) {
        memo.simVarIsActive.destroy();
      }
    }
  }
}
