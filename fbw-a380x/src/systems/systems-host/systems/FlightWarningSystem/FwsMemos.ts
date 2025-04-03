// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamMemos } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { MappedSubject, Subscribable, SubscribableMapFunctions } from '@microsoft/msfs-sdk';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

interface EwdMemoItem {
  flightPhaseInhib: number[];
  /** warning is active */
  simVarIsActive: Subscribable<boolean>;
  whichCodeToReturn: () => any[];
  codesToReturn: string[];
  memoInhibit: () => boolean;
  leftSide?: boolean;
}

export interface EwdMemoDict {
  [key: keyof typeof EcamMemos]: EwdMemoItem;
}

export class FwsMemos {
  constructor(private fws: FwsCore) {}
  /** MEMOs on right side of EWD */
  ewdMemos: EwdMemoDict = {
    210000001: {
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.highLandingFieldElevation,
      whichCodeToReturn: () => [0],
      codesToReturn: ['210000001'],
      memoInhibit: () => false,
    },
    271000001: {
      // GND SPLRs ARMED
      flightPhaseInhib: [2, 9, 10],
      simVarIsActive: this.fws.spoilersArmed,
      whichCodeToReturn: () => [0],
      codesToReturn: ['271000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '280000001': {
      // CROSSFEED OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7],
      simVarIsActive: this.fws.crossFeedOpenMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['280000001'],
      memoInhibit: () => false,
    },
    280000003: {
      // DEFUEL IN PROGRESS
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.defuelInProgress,
      whichCodeToReturn: () => [0],
      codesToReturn: ['280000003'],
      memoInhibit: () => false,
    },
    280000009: {
      // REFUEL IN PROGRESS
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.refuelInProgress,
      whichCodeToReturn: () => [0],
      codesToReturn: ['280000009'],
      memoInhibit: () => false,
    },
    '280000010': {
      // REFUEL PNL DOOR OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.refuelPanelOpen,
      whichCodeToReturn: () => (this.fws.oneEngineRunning.get() ? [1] : [0]),
      memoInhibit: () => false,
      codesToReturn: ['280000010', '280000011'],
    },
    '280000013': {
      // CROSSFEED OPEN during TO or GA
      flightPhaseInhib: [1, 2, 8, 9, 10, 11, 12],
      simVarIsActive: this.fws.crossFeedOpenMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['280000013'],
      memoInhibit: () => false,
    },
    '300000001': {
      // ENG ANTI ICE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.or(),
        this.fws.eng1AntiIce,
        this.fws.eng2AntiIce,
        this.fws.eng3AntiIce,
        this.fws.eng4AntiIce,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['300000001'],
      memoInhibit: () => false,
    },
    '300000002': {
      // WING ANTI ICE
      flightPhaseInhib: [],
      simVarIsActive: this.fws.wingAntiIce,
      whichCodeToReturn: () => [0],
      codesToReturn: ['300000002'],
      memoInhibit: () => false,
    },
    '300000003': {
      // ICE NOT DETECTED
      flightPhaseInhib: [1, 2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([iceNotDetTimer2Status, aircraftOnGround]) => iceNotDetTimer2Status && !aircraftOnGround,
        this.fws.iceNotDetTimer2Status,
        this.fws.aircraftOnGround,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['300000003'],
      memoInhibit: () => false,
    },
    '0000170': {
      // APU AVAIL
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([apuAvail, apuBleedValveOpen]) => apuAvail === 1 && !apuBleedValveOpen,
        this.fws.apuAvail,
        this.fws.apuBleedValveOpen,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000017001'],
      memoInhibit: () => false,
    },
    '0000180': {
      // APU BLEED
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([apuAvail, apuBleedValveOpen]) => apuAvail === 1 && apuBleedValveOpen,
        this.fws.apuAvail,
        this.fws.apuBleedValveOpen,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000018001'],
      memoInhibit: () => false,
    },
    '0000290': {
      // SWITCHING PNL
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(([ndXfrKnob]) => ndXfrKnob !== 1, this.fws.ndXfrKnob),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000029001'],
      memoInhibit: () => false,
    },
    '230000001': {
      // CAPT ON RMP 3
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r1Off && !r3Off && !r2Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000001'],
      memoInhibit: () => false,
    },
    // 22 - Flight guidance
    220000001: {
      // A/THR OFF
      flightPhaseInhib: [],
      simVarIsActive: this.fws.autoPilotOffShowMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['220000001'],
      memoInhibit: () => false,
    },
    220000002: {
      // A/THR OFF
      flightPhaseInhib: [],
      simVarIsActive: this.fws.autoThrustOffVoluntary,
      whichCodeToReturn: () => [0],
      codesToReturn: ['220000002'],
      memoInhibit: () => false,
    },
    '230000002': {
      // F/O ON RMP 3
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r2Off && !r3Off && !r1Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000002'],
      memoInhibit: () => false,
    },
    '230000003': {
      // CAPT+F/O ON RMP 3
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r1Off && r2Off && !r3Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000003'],
      memoInhibit: () => false,
    },
    '230000009': {
      // RMP 1+2+3 OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000009'],
      memoInhibit: () => false,
    },
    '230000010': {
      // RMP 1+3 OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r1Off && r3Off && !r2Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000010'],
      memoInhibit: () => false,
    },
    '230000011': {
      // RMP 2+3 OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r2Off && r3Off && !r1Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000011'],
      memoInhibit: () => false,
    },
    '230000012': {
      // RMP 3 OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([r1Off, r2Off, r3Off]) => r3Off && !r1Off && !r2Off,
        this.fws.rmp1Off,
        this.fws.rmp2Off,
        this.fws.rmp3Off,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000012'],
      memoInhibit: () => false,
    },
    '230000015': {
      // VHF3 VOICE
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fws.voiceVhf3,
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000015'],
      memoInhibit: () => false,
    },

    // ATA 24
    '241000001': {
      // ELEC EXT PWR
      flightPhaseInhib: [3, 4, 5, 6, 7, 8],
      simVarIsActive: this.fws.extPwrConnected,
      whichCodeToReturn: () => [
        [
          this.fws.engine1Running.get(),
          this.fws.engine2Running.get(),
          this.fws.engine3Running.get(),
          this.fws.engine4Running.get(),
        ].filter(Boolean).length > 1
          ? 0
          : 1,
      ],
      codesToReturn: ['241000001', '241000002'],
      memoInhibit: () => false,
    },
    '242000001': {
      // RAT OUT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.ratDeployed.map((v) => v > 0),
      whichCodeToReturn: () => [this.fws.flightPhase1211.get() ? 1 : 0],
      codesToReturn: ['242000001', '242000002'],
      memoInhibit: () => false,
    },
    // ATA 29
    '290000001': {
      // G ELEC PMP A CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.greenAPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000001'],
      memoInhibit: () => false,
    },
    '290000002': {
      // G ELEC PMP B CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.greenBPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000002'],
      memoInhibit: () => false,
    },
    '290000003': {
      // Y ELEC PMP A CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.yellowAPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000003'],
      memoInhibit: () => false,
    },
    '290000004': {
      // Y ELEC PMP A CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.yellowBPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000004'],
      memoInhibit: () => false,
    },
    // 31 INDICATING RECORDING
    314000001: {
      // T.O. INHIBIT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.showTakeoffInhibit,
      whichCodeToReturn: () => [0],
      codesToReturn: ['314000001'],
      memoInhibit: () => false,
    },
    314000002: {
      // LDG INHIBIT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.showLandingInhibit,
      whichCodeToReturn: () => [0],
      codesToReturn: ['314000002'],
      memoInhibit: () => false,
    },
    // 32 LANDING GEAR
    320000001: {
      // AUTO BRK OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
      simVarIsActive: this.fws.autoBrakeOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['320000001'],
      memoInhibit: () => false,
    },
    // ATA 32
    '322000001': {
      // N/W STEER DISC
      flightPhaseInhib: [3, 4, 5, 7, 8, 9, 9, 10],
      simVarIsActive: this.fws.nwSteeringDisc,
      whichCodeToReturn: () => [
        [
          this.fws.engine1Running.get(),
          this.fws.engine2Running.get(),
          this.fws.engine3Running.get(),
          this.fws.engine4Running.get(),
        ].filter(Boolean).length > 1
          ? 0
          : 1,
      ],
      codesToReturn: ['322000001', '322000002'],
      memoInhibit: () => false,
    },
    '320000002': {
      // PARK BRK ON
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.parkBrake,
      whichCodeToReturn: () => [0],
      codesToReturn: ['320000002'],
      memoInhibit: () => false,
    },
    '333000001': {
      // STROBE LIGHT OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, strobeLightsOn]) => !!(!aircraftOnGround && strobeLightsOn === 2),
        this.fws.aircraftOnGround,
        this.fws.strobeLightsOn,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['333000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '335000001': {
      // SEAT BELTS
      flightPhaseInhib: [2, 9, 10],
      simVarIsActive: this.fws.seatBelt.map((v) => !!v),
      whichCodeToReturn: () => [0],
      codesToReturn: ['335000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '335000003': {
      // NO MOBILE
      flightPhaseInhib: [],
      simVarIsActive: this.fws.noMobileSwitchPosition.map((pos) => pos === 0),
      whichCodeToReturn: () => [0],
      codesToReturn: ['335000003'],
      memoInhibit: () => false,
    },
    '340000001': {
      // TRUE NORTH REF
      flightPhaseInhib: [],
      simVarIsActive: this.fws.trueNorthRef,
      whichCodeToReturn: () => [0],
      codesToReturn: ['340000001'],
      memoInhibit: () => false,
    },
    '340003001': {
      // IR IN ALIGN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([adirsRemainingAlignTime, ir1Align, ir2Align, ir3Align]) => {
          const remainingTimeAbove240 = adirsRemainingAlignTime >= 240;
          const allInAlign = ir1Align && ir2Align && ir3Align;
          return remainingTimeAbove240 && allInAlign;
        },
        this.fws.adirsRemainingAlignTime,
        this.fws.ir1Align,
        this.fws.ir2Align,
        this.fws.ir3Align,
      ),
      whichCodeToReturn: () => [
        this.fws.adirsMessage1(
          this.fws.adirsRemainingAlignTime.get(),
          (this.fws.engine1State.get() > 0 && this.fws.engine1State.get() < 4) ||
            (this.fws.engine2State.get() > 0 && this.fws.engine2State.get() < 4) ||
            (this.fws.engine3State.get() > 0 && this.fws.engine3State.get() < 4) ||
            (this.fws.engine4State.get() > 0 && this.fws.engine4State.get() < 4),
        ),
      ],
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
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '340003101': {
      // IR IN ALIGN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([adirsRemainingAlignTime, ir1Align, ir2Align, ir3Align]) => {
          const remainingTimeAbove0 = adirsRemainingAlignTime > 0;
          const remainingTimeBelow240 = adirsRemainingAlignTime < 240;
          const allInAlign = ir1Align && ir2Align && ir3Align;
          return remainingTimeAbove0 && remainingTimeBelow240 && allInAlign;
        },
        this.fws.adirsRemainingAlignTime,
        this.fws.ir1Align,
        this.fws.ir2Align,
        this.fws.ir3Align,
      ),
      whichCodeToReturn: () => [
        this.fws.adirsMessage2(
          this.fws.adirsRemainingAlignTime.get(),
          (this.fws.engine1State.get() > 0 && this.fws.engine1State.get() < 4) ||
            (this.fws.engine2State.get() > 0 && this.fws.engine2State.get() < 4) ||
            (this.fws.engine3State.get() > 0 && this.fws.engine3State.get() < 4) ||
            (this.fws.engine4State.get() > 0 && this.fws.engine4State.get() < 4),
        ),
      ],
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
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '340068001': {
      // ADIRS SWTG
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([airKnob, attKnob]) => attKnob !== 1 || airKnob !== 1,
        this.fws.airKnob,
        this.fws.attKnob,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['340068001'],
      memoInhibit: () => false,
    },

    '341000001': {
      // GPWS OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.gpwsSysOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['341000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '341000002': {
      // TAWS FLAP MODE OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.gpwsFlapModeOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['341000002'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },
    '341000003': {
      // TAWS G/S MODE OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.gpwsGsOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['341000003'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
    },

    '343000001': {
      // TCAS STBY
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.tcasStandbyMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['343000001'],
      memoInhibit: () => false,
    },
    '343000002': {
      // ALT RPTG OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.xpdrAltReporting.map((v) => !v),
      whichCodeToReturn: () => [0],
      codesToReturn: ['343000002'],
      memoInhibit: () => false,
    },
    '343000003': {
      // XPDR STBY
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.xpdrStby,
      whichCodeToReturn: () => [0],
      codesToReturn: ['343000003'],
      memoInhibit: () => false,
    },
    '350000001': {
      // OXY PAX SYS ON
      flightPhaseInhib: [],
      simVarIsActive: this.fws.paxOxyMasksDeployed,
      whichCodeToReturn: () => [0],
      codesToReturn: [
        !this.fws.aircraftOnGround.get() && this.fws.excessCabinAltitude.get() ? '350000001' : '350000002',
      ],
      memoInhibit: () => false,
    },
    '460000001': {
      // COMPANY MSG
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.compMesgCount.map((c) => c > 0),
      whichCodeToReturn: () => [0],
      codesToReturn: ['460000001'],
      memoInhibit: () => false,
    },
    '709000001': {
      // IGNITION
      flightPhaseInhib: [],
      simVarIsActive: this.fws.engSelectorPosition.map((v) => v === 2),
      whichCodeToReturn: () => [0],
      codesToReturn: ['709000001'],
      memoInhibit: () => false,
    },
  };

  /** MEMOs on lower left side of EWD (TO and LDG memos only) */
  ewdToLdgMemos: EwdMemoDict = {
    '0000010': {
      // T.O MEMO
      flightPhaseInhib: [1, 3, 8, 12],
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
      memoInhibit: () => false,
      leftSide: true,
    },
    '0000020': {
      // LANDING MEMO
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 11, 12],
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
      memoInhibit: () => false,
      leftSide: true,
    },
  };
}
