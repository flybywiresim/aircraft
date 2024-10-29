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
  failure: number;
  sysPage: number;
  side: string;
}

export interface EwdMemoDict {
  [key: keyof typeof EcamMemos]: EwdMemoItem;
}

export class FwsMemos {
  constructor(private fws: FwsCore) {}
  /** MEMOs on lower right side of EWD */
  ewdMemos: EwdMemoDict = {
    '0000050': {
      // REFUELING
      flightPhaseInhib: [],
      simVarIsActive: this.fws.usrStartRefueling,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000005001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    271000001: {
      // GND SPLRs ARMED
      flightPhaseInhib: [2, 9, 10],
      simVarIsActive: this.fws.spoilersArmed,
      whichCodeToReturn: () => [0],
      codesToReturn: ['271000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000060': {
      // SPEED BRK
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([speedBrakeCommand, fwcFlightPhase]) => speedBrakeCommand && ![1, 8, 9, 10].includes(fwcFlightPhase),
        this.fws.speedBrakeCommand,
        this.fws.fwcFlightPhase,
      ),
      whichCodeToReturn: () => [this.fws.amberSpeedBrake.get() ? 1 : 0],
      codesToReturn: ['000006001', '000006002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '280000001': {
      // CROSSFEED OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7],
      simVarIsActive: this.fws.crossFeedOpenMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['280000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '280000013': {
      // CROSSFEED OPEN during TO or GA
      flightPhaseInhib: [1, 2, 8, 9, 10, 11, 12],
      simVarIsActive: this.fws.crossFeedOpenMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['280000013'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '300000001': {
      // ENG ANTI ICE
      flightPhaseInhib: [3, 4, 5, 7, 8],
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '300000002': {
      // WING ANTI ICE
      flightPhaseInhib: [],
      simVarIsActive: this.fws.wingAntiIce,
      whichCodeToReturn: () => [0],
      codesToReturn: ['300000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000290': {
      // SWITCHING PNL
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(([ndXfrKnob]) => ndXfrKnob !== 1, this.fws.ndXfrKnob),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000029001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000230': {
      // MAN LANDING ELEVATION
      flightPhaseInhib: [],
      simVarIsActive: this.fws.manLandingElevation,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000023001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    // 22 - Flight guidance
    220000001: {
      // A/THR OFF
      flightPhaseInhib: [],
      simVarIsActive: this.fws.autoPilotOffShowMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['220000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    220000002: {
      // A/THR OFF
      flightPhaseInhib: [],
      simVarIsActive: this.fws.autoThrustOffVoluntary,
      whichCodeToReturn: () => [0],
      codesToReturn: ['220000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '230000015': {
      // VHF3 VOICE
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fws.voiceVhf3,
      whichCodeToReturn: () => [0],
      codesToReturn: ['230000015'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '242000001': {
      // RAT OUT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.ratDeployed.map((v) => v > 0),
      whichCodeToReturn: () => [[1, 2].includes(this.fws.fwcFlightPhase.get()) ? 0 : 1],
      codesToReturn: ['242000001', '242000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    // ATA 29
    '290000001': {
      // G ELEC PMP A CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.greenAPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '290000002': {
      // G ELEC PMP B CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.greenBPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '290000003': {
      // Y ELEC PMP A CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.yellowAPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000003'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '290000004': {
      // Y ELEC PMP A CTL
      flightPhaseInhib: [],
      simVarIsActive: this.fws.yellowBPumpOn,
      whichCodeToReturn: () => [0],
      codesToReturn: ['290000004'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    // 31 INDICATING RECORDING
    314000001: {
      // T.O. INHIBIT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.showTakeoffInhibit,
      whichCodeToReturn: () => [0],
      codesToReturn: ['314000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    314000002: {
      // LDG INHIBIT
      flightPhaseInhib: [],
      simVarIsActive: this.fws.showLandingInhibit,
      whichCodeToReturn: () => [0],
      codesToReturn: ['314000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    // 32 LANDING GEAR
    320000001: {
      // AUTO BRK OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
      simVarIsActive: this.fws.autoBrakeOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['320000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '320000002': {
      // PARK BRK ON
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.fws.parkBrake,
      whichCodeToReturn: () => [0],
      codesToReturn: ['320000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '335000001': {
      // SEAT BELTS
      flightPhaseInhib: [2, 9, 10],
      simVarIsActive: this.fws.seatBelt.map((v) => !!v),
      whichCodeToReturn: () => [0],
      codesToReturn: ['335000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '335000003': {
      // NO MOBILE
      flightPhaseInhib: [2, 9, 10],
      simVarIsActive: this.fws.noMobileSwitchPosition.map((pos) => pos === 0),
      whichCodeToReturn: () => [0],
      codesToReturn: ['335000003'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '340000001': {
      // TRUE NORTH REF
      flightPhaseInhib: [],
      simVarIsActive: this.fws.trueNorthRef,
      whichCodeToReturn: () => [0],
      codesToReturn: ['340000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },

    '341000001': {
      // GPWS OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.gpwsSysOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['341000001'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '341000002': {
      // TAWS FLAP MODE OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.gpwsFlapModeOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['341000002'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '341000003': {
      // TAWS G/S MODE OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.gpwsGsOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['341000003'],
      memoInhibit: () => this.fws.toMemo.get() === 1 || this.fws.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },

    '343000001': {
      // TCAS STBY
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.tcasStandbyMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['343000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '343000002': {
      // ALT RPTG OFF
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.xpdrAltReporting.map((v) => !v),
      whichCodeToReturn: () => [0],
      codesToReturn: ['343000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '343000003': {
      // XPDR STBY
      flightPhaseInhib: [1, 12],
      simVarIsActive: this.fws.xpdrStby,
      whichCodeToReturn: () => [0],
      codesToReturn: ['343000003'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '350000001': {
      // OXY PAX SYS ON
      flightPhaseInhib: [],
      simVarIsActive: this.fws.paxOxyMasksDeployed,
      whichCodeToReturn: () => [0],
      codesToReturn: [!this.fws.aircraftOnGround.get() && this.fws.excessPressure.get() ? '350000001' : '350000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '460000001': {
      // COMPANY MSG
      flightPhaseInhib: [3, 4, 5, 6, 7, 9, 10],
      simVarIsActive: this.fws.compMesgCount.map((c) => c > 0),
      whichCodeToReturn: () => [0],
      codesToReturn: ['460000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '709000001': {
      // IGNITION
      flightPhaseInhib: [],
      simVarIsActive: this.fws.engSelectorPosition.map((v) => v === 2),
      whichCodeToReturn: () => [0],
      codesToReturn: ['709000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
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
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
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
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
  };
}

/**
 * Contains the activation checks for each of the abnormal sensed procedures (formerly left column of A32NX EWD memos).
 * Legacy, just for looking up the A32NX implementation. Will be moved to new structure (ID for checklist, array of bools for state of lines).
 */
/* ewdAbnormalSensedLegacy: any = {
    2900310: {
      // *HYD  - Blue
      flightPhaseInhib: [1, 4, 5, 10],
      simVarIsActive: MappedSubject.create(
        ([blueRvrOvht, blueRvrLow, blueElecPumpPBAuto, dcESSBusPowered, ac1BusPowered, blueLP, emergencyGeneratorOn]) =>
          !(blueRvrOvht || blueRvrLow || !blueElecPumpPBAuto) &&
          (!dcESSBusPowered || !ac1BusPowered) &&
          blueLP &&
          !emergencyGeneratorOn,
        this.blueRvrOvht,
        this.blueRvrLow,
        this.blueElecPumpPBAuto,
        this.dcESSBusPowered,
        this.ac1BusPowered,
        this.blueLP,
        this.emergencyGeneratorOn,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['290031001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
    },
    2900312: {
      // *HYD  - Green Engine 1 //
      flightPhaseInhib: [1, 2, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([greenLP, eng1pumpPBisAuto, emergencyGeneratorOn]) =>
          greenLP &&
          // && ENG 1 OUT - not implemented
          eng1pumpPBisAuto &&
          !emergencyGeneratorOn,
        this.greenLP,
        this.eng1pumpPBisAuto,
        this.emergencyGeneratorOn,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['290031201'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
    },
    // 34 - NAVIGATION & SURVEILLANCE

    7700027: {
      // DUAL ENGINE FAILURE
      flightPhaseInhib: [],
      simVarIsActive: this.engDualFault,
      whichItemToReturn: () => [
        0,
        !this.emergencyGeneratorOn.get() ? 1 : null,
        5,
        !(this.apuMasterSwitch.get() === 1 || this.apuAvail.get() === 1) && this.radioAlt.get() < 2500 ? 6 : null,
        this.throttle1Position.get() > 0 || this.throttle2Position.get() > 0 ? 7 : null,
        this.fac1Failed.get() === 1 ? 8 : null,
        9,
        10,
        11,
      ],
      codeToReturn: [
        '770002701',
        '770002702',
        '770002703',
        '770002704',
        '770002705',
        '770002706',
        '770002707',
        '770002708',
        '770002709',
        '770002710',
        '770002711',
        '770002712',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 0,
    },
    2600010: {
      // ENG 1 FIRE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([eng1FireTest, fireButton1]) => eng1FireTest || fireButton1,
        this.eng1FireTest,
        this.fireButton1,
      ),
      whichItemToReturn: () => [
        0,
        this.throttle1Position.get() !== 0 && !this.aircraftOnGround.get() ? 1 : null,
        (this.throttle1Position.get() !== 0 || this.throttle2Position.get() !== 0) && this.aircraftOnGround.get()
          ? 2
          : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 3 : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 4 : null,
        this.aircraftOnGround.get() ? 5 : null,
        this.aircraftOnGround.get() ? 6 : null,
        !this.engine1ValueSwitch.get() ? null : 7,
        !this.fireButton1.get() ? 8 : null,
        !this.aircraftOnGround.get() && this.agent1Eng1Discharge.get() === 1 && !this.eng1Agent1PB.get() ? 9 : null,
        this.agent1Eng1Discharge.get() === 2 && !this.aircraftOnGround.get() && !this.eng1Agent1PB.get() ? 10 : null,
        !this.eng1Agent1PB.get() && this.aircraftOnGround.get() ? 11 : null,
        !this.eng1Agent2PB.get() && this.aircraftOnGround.get() ? 12 : null,
        this.aircraftOnGround.get() ? 13 : null,
        !this.aircraftOnGround.get() ? 14 : null,
        this.agent2Eng1Discharge.get() === 1 && !this.eng1Agent2PB.get() ? 15 : null,
        (this.agent2Eng1Discharge.get() === 1 && !this.eng1Agent2PB.get()) ||
        (this.agent2Eng1Discharge.get() === 2 && !this.eng1Agent2PB.get())
          ? 16
          : null,
      ],
      codeToReturn: [
        '260001001',
        '260001002',
        '260001003',
        '260001004',
        '260001005',
        '260001006',
        '260001007',
        '260001008',
        '260001009',
        '260001010',
        '260001011',
        '260001012',
        '260001013',
        '260001014',
        '260001015',
        '260001016',
        '260001017',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 0,
    },
    2600020: {
      // ENG 2 FIRE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([eng2FireTest, fireButton2]) => eng2FireTest || fireButton2,
        this.eng2FireTest,
        this.fireButton2,
      ),
      whichItemToReturn: () => [
        0,
        this.throttle2Position.get() !== 0 && !this.aircraftOnGround.get() ? 1 : null,
        (this.throttle1Position.get() !== 0 || this.throttle2Position.get() !== 0) && this.aircraftOnGround.get()
          ? 2
          : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 3 : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 4 : null,
        this.aircraftOnGround.get() ? 5 : null,
        this.aircraftOnGround.get() ? 6 : null,
        !this.engine2ValueSwitch.get() ? null : 7,
        !this.fireButton2.get() ? 8 : null,
        !this.aircraftOnGround.get() && this.agent1Eng2Discharge.get() === 1 && !this.eng2Agent1PB.get() ? 9 : null,
        this.agent1Eng2Discharge.get() === 2 && !this.aircraftOnGround.get() && !this.eng2Agent1PB.get() ? 10 : null,
        !this.eng2Agent1PB.get() && this.aircraftOnGround.get() ? 11 : null,
        !this.eng2Agent2PB.get() && this.aircraftOnGround.get() ? 12 : null,
        this.aircraftOnGround.get() ? 13 : null,
        !this.aircraftOnGround.get() ? 14 : null,
        this.agent2Eng2Discharge.get() === 1 && !this.eng2Agent2PB.get() ? 15 : null,
        (this.agent2Eng2Discharge.get() === 1 && !this.eng2Agent2PB.get()) ||
        (this.agent2Eng2Discharge.get() === 2 && !this.eng2Agent2PB.get())
          ? 16
          : null,
      ],
      codeToReturn: [
        '260002001',
        '260002002',
        '260002003',
        '260002004',
        '260002005',
        '260002006',
        '260002007',
        '260002008',
        '260002009',
        '260002010',
        '260002011',
        '260002012',
        '260002013',
        '260002014',
        '260002015',
        '260002016',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 0,
    },
    2600030: {
      // APU FIRE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([apuFireTest, fireButtonAPU]) => apuFireTest || fireButtonAPU,
        this.apuFireTest,
        this.fireButtonAPU,
      ),
      whichItemToReturn: () => [
        0,
        !this.fireButtonAPU.get() ? 1 : null,
        this.agentAPUDischarge.get() === 1 && !this.apuAgentPB.get() ? 2 : null,
        this.agentAPUDischarge.get() === 2 && !this.apuAgentPB.get() ? 3 : null,
        this.apuMasterSwitch.get() === 1 ? 4 : null,
      ],
      codeToReturn: ['260003001', '260003002', '260003003', '260003004', '260003005'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 6,
    },
    2700052: {
      // FLAP LVR NOT ZERO
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.flapsLeverNotZeroWarning,
      whichItemToReturn: () => [0],
      codeToReturn: ['270005201'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
    },
    2700110: {
      // ELAC 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.elac1FaultConfirmNodeOutput,
      whichItemToReturn: () => [
        0,
        this.elac1FaultLine123Display.get() ? 1 : null,
        this.elac1FaultLine123Display.get() ? 2 : null,
        this.elac1FaultLine123Display.get() ? 3 : null,
        this.elac1FaultLine45Display.get() ? 4 : null,
        this.elac1FaultLine45Display.get() ? 5 : null,
      ],
      codeToReturn: ['270011001', '270011002', '270011003', '270011004', '270011005', '270011006'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700120: {
      // ELAC 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.elac2FaultConfirmNodeOutput,
      whichItemToReturn: () => [
        0,
        this.elac2FaultLine123Display.get() ? 1 : null,
        this.elac2FaultLine123Display.get() ? 2 : null,
        this.elac2FaultLine123Display.get() ? 3 : null,
        this.elac2FaultLine45Display.get() ? 4 : null,
        this.elac2FaultLine45Display.get() ? 5 : null,
      ],
      codeToReturn: ['270012001', '270012002', '270012003', '270012004', '270012005', '270012006'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700210: {
      // SEC 1 FAULT
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.sec1FaultCondition,
      whichItemToReturn: () => [
        0,
        this.sec1FaultLine123Display.get() ? 1 : null,
        this.sec1FaultLine123Display.get() ? 2 : null,
        this.sec1FaultLine123Display.get() ? 3 : null,
        this.sec1FaultLine45Display.get() ? 4 : null,
      ],
      codeToReturn: ['270021001', '270021002', '270021003', '270021004', '270021005'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700220: {
      // SEC 2 FAULT
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.sec2FaultCondition,
      whichItemToReturn: () => [
        0,
        this.sec2FaultLine123Display.get() ? 1 : null,
        this.sec2FaultLine123Display.get() ? 2 : null,
        this.sec2FaultLine123Display.get() ? 3 : null,
      ],
      codeToReturn: ['270022001', '270022002', '270022003', '270022004'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700230: {
      // SEC 3 FAULT
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.sec3FaultCondition,
      whichItemToReturn: () => [
        0,
        this.sec3FaultLine123Display.get() ? 1 : null,
        this.sec3FaultLine123Display.get() ? 2 : null,
        this.sec3FaultLine123Display.get() ? 3 : null,
      ],
      codeToReturn: ['270023001', '270023002', '270023003', '270023004'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700340: {
      // SPD BRK NOT RETRACTED
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.speedbrakesConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.speedbrakesConfigWarning,
      whichItemToReturn: () => [0, 1],
      codeToReturn: ['270034001', '270034002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
    },
    2700360: {
      // FCDC 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 7],
      simVarIsActive: this.fcdc12FaultCondition,
      whichItemToReturn: () => [0, 1],
      codeToReturn: ['270036001', '270036002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700365: {
      // DIRECT LAW
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.directLawCondition,
      whichItemToReturn: () => [0, 1, 2, 3, 4, null, 6, 7],
      codeToReturn: [
        '270036501',
        '270036502',
        '270036503',
        '270036504',
        '270036505',
        '270036506',
        '270036507',
        '270036508',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700373: {
      // RUDDER TRIM CONFIG
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.rudderTrimNotToAudio.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.rudderTrimNotToWarning,
      whichItemToReturn: () => [0, 1],
      codeToReturn: ['270037301', '270037302'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
    },
    2700375: {
      // ALTN 2
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.altn2LawConfirmNodeOutput,
      whichItemToReturn: () => [0, 1, null, 3, 4, null, 6],
      codeToReturn: ['270037501', '270037502', '270037503', '270037504', '270037505', '270037506', '270037507'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700390: {
      // ALTN 1
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.altn1LawConfirmNodeOutput,
      whichItemToReturn: () => [0, 1, null, 3, 4, null, 6],
      codeToReturn: ['270039001', '270039002', '270039003', '270039004', '270039005', '270039006', '270039007'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
    },
    2700400: {
      // L+R ELEV FAULT
      flightPhaseInhib: [],
      simVarIsActive: this.lrElevFaultCondition,
      whichItemToReturn: () => [0, 1, 2, null, null, 5],
      codeToReturn: ['270040001', '270040002', '270040003', '270040004', '270040005', '270040006'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
    },
    2700502: {
      // SPD BRK STILL OUT
      flightPhaseInhib: [1, 2, 3, 4, 5, 8, 9, 10],
      simVarIsActive: this.speedBrakeStillOutWarning,
      whichItemToReturn: () => [0],
      codeToReturn: ['270050201'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    2700555: {
      // FCDC 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcdc1FaultCondition,
      whichItemToReturn: () => [0],
      codeToReturn: ['270055501'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2700557: {
      // FCDC 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcdc2FaultCondition,
      whichItemToReturn: () => [0],
      codeToReturn: ['270055701'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2700870: {
      // GND SPLR NOT ARMED
      flightPhaseInhib: [1, 2, 3, 4, 5, 8, 9, 10],
      simVarIsActive: this.groundSpoilerNotArmedWarning,
      whichItemToReturn: () => [0],
      codeToReturn: ['270087001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    2131221: {
      // EXCESS CAB ALT
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, excessPressure]) => !aircraftOnGround && excessPressure,
        this.aircraftOnGround,
        this.excessPressure,
      ),
      // TODO no separate slats indication
      whichItemToReturn: () => [
        0,
        this.cabAltSetResetState1.get() ? 1 : null,
        this.cabAltSetResetState2.get() && this.seatBelt.get() !== 1 ? 2 : null,
        this.cabAltSetResetState2.get() ? 3 : null,
        this.cabAltSetResetState1.get() ? 4 : null,
        this.cabAltSetResetState2.get() &&
        (this.throttle1Position.get() !== 0 || this.throttle2Position.get() !== 0) &&
        this.autoThrustStatus.get() !== 2
          ? 5
          : null,
        this.cabAltSetResetState2.get() && !this.speedBrakeCommand.get() ? 6 : null,
        this.cabAltSetResetState2.get() ? 7 : null,
        this.cabAltSetResetState2.get() && this.engSelectorPosition.get() !== 2 ? 8 : null,
        this.cabAltSetResetState2.get() ? 9 : null,
        this.cabAltSetResetState1.get() && !this.cabAltSetResetState2.get() ? 10 : null,
        this.cabAltSetResetState2.get() ? 11 : null,
        this.cabAltSetResetState2.get() ? 12 : null,
        this.cabAltSetResetState2.get() ? 13 : null,
        14,
        15,
        16,
      ],
      codeToReturn: [
        '213122101',
        '213122102',
        '213122103',
        '213122104',
        '213122105',
        '213122106',
        '213122107',
        '213122108',
        '213122109',
        '213122110',
        '213122111',
        '213122112',
        '213122113',
        '213122114',
        '213122115',
        '213122116',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 2,
    },
    2131222: {
      // SYS 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([cpc1Fault, cpc2Fault]) => cpc1Fault && !cpc2Fault,
        this.cpc1Fault,
        this.cpc2Fault,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['213122201'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: 2,
    },
    2131223: {
      // SYS 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([cpc1Fault, cpc2Fault]) => !cpc1Fault && cpc2Fault,
        this.cpc1Fault,
        this.cpc2Fault,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['213122301'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: 2,
    },
    2131224: {
      // SYS 1+2 FAULT
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.bothCpcFaultOutput,
      whichItemToReturn: () => [0, this.pressurizationAuto.get() ? 1 : null, 2],
      codeToReturn: ['213122401', '213122402', '213122403'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
    },
    2131231: {
      // LO DIFF PR
      flightPhaseInhib: [2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.lowDiffPress,
      whichItemToReturn: () => [0, 1, 2],
      codeToReturn: ['213123101', '213123102', '213123103'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
    },
    2131232: {
      // OFV NOT OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8],
      simVarIsActive: this.outflowValveNotOpenOutput,
      whichItemToReturn: () => [
        0,
        this.pressurizationAuto.get() ? 1 : null,
        this.outflowValveOpenAmount.get() < 95 ? 2 : null,
        this.pack1On.get() || this.pack2On.get() ? 3 : null,
        this.pack1On.get() ? 4 : null,
        this.pack2On.get() ? 5 : null,
      ],
      codeToReturn: ['213123201', '213123202', '213123203', '213123204', '213123205', '213123206'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
    },
    2131233: {
      // SAFETY VALVE OPEN
      flightPhaseInhib: [4, 5, 7, 8, 9, 10],
      simVarIsActive: this.safetyValveNotClosedOutput,
      whichItemToReturn: () => [
        0,
        this.cabinDeltaPressure.get() < 1 ? 1 : null,
        this.cabinDeltaPressure.get() < 1 ? 2 : null,
        this.cabinDeltaPressure.get() < 1 && !this.excessPressure.get() ? 3 : null,
        this.cabinDeltaPressure.get() > 4 && this.pressurizationAuto.get() ? 4 : null,
        this.cabinDeltaPressure.get() > 4 ? 5 : null,
        this.cabinDeltaPressure.get() > 4 ? 6 : null,
        this.cabinDeltaPressure.get() > 4 ? 7 : null,
        this.cabinDeltaPressure.get() > 4 ? 8 : null,
      ],
      codeToReturn: [
        '213123301',
        '213123302',
        '213123303',
        '213123304',
        '213123305',
        '213123306',
        '213123307',
        '213123308',
        '213123309',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
    },
    2131235: {
      // EXCES RESIDUAL PR
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: this.excessResidualPr,
      whichItemToReturn: () => [0, this.pack1On.get() ? 1 : null, this.pack2On.get() ? 2 : null, 3],
      codeToReturn: ['213123501', '213123502', '213123503', '213123504'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 2,
    },
    2161206: {
      // PACK 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.pack1And2Fault,
      whichItemToReturn: () => [
        0,
        this.pack1On.get() ? 1 : null,
        this.pack2On.get() ? 2 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 3 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 4 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 5 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 6 : null,
        !this.aircraftOnGround.get() ? 7 : null,
      ],
      codeToReturn: [
        '216120601',
        '216120602',
        '216120603',
        '216120604',
        '216120605',
        '216120606',
        '216120607',
        '216120608',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
    },
    2161202: {
      // PACK 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.acsc1Fault,
      whichItemToReturn: () => [0, this.pack1On.get() ? 1 : null],
      codeToReturn: ['216120201', '216120202'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
    },
    2161203: {
      // PACK 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.acsc2Fault,
      whichItemToReturn: () => [0, this.pack2On.get() ? 1 : null],
      codeToReturn: ['216120301', '216120302'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
    },
    2161207: {
      // PACK 1 ABNORMALLY OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.packOffNotFailed1Status,
      whichItemToReturn: () => [0],
      codeToReturn: ['216120701'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
    },
    2161208: {
      // PACK 2 ABNORMALLY OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.packOffNotFailed2Status,
      whichItemToReturn: () => [0],
      codeToReturn: ['216120801'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
    },
    2161291: {
      // COND CTL 1-A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc1Lane1Fault, acsc1Lane2Fault]) => acsc1Lane1Fault && !acsc1Lane2Fault,
        this.acsc1Lane1Fault,
        this.acsc1Lane2Fault,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['216129101'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2161297: {
      // COND CTL 1-B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc1Lane1Fault, acsc1Lane2Fault]) => !acsc1Lane1Fault && acsc1Lane2Fault,
        this.acsc1Lane1Fault,
        this.acsc1Lane2Fault,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['216129701'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2161294: {
      // COND CTL 2-A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc2Lane1Fault, acsc2Lane2Fault]) => acsc2Lane1Fault && !acsc2Lane2Fault,
        this.acsc2Lane1Fault,
        this.acsc2Lane2Fault,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['216129401'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2161298: {
      // COND CTL 2-B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc2Lane1Fault, acsc2Lane2Fault]) => !acsc2Lane1Fault && acsc2Lane2Fault,
        this.acsc2Lane1Fault,
        this.acsc2Lane2Fault,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['216129801'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2163210: {
      // CKPT DUCT OVHT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.ckptDuctOvht,
      whichItemToReturn: () => [0, 1, null, 3], // TODO: Add support for Fahrenheit
      codeToReturn: ['216321001', '216321002', '216321003', '216321004'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
    },
    2163211: {
      // FWD DUCT OVHT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fwdDuctOvht,
      whichItemToReturn: () => [0, 1, null, 3], // TODO: Add support for Fahrenheit
      codeToReturn: ['216321101', '216321102', '216321103', '216321104'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
    },
    2163212: {
      // AFT DUCT OVHT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.aftDuctOvht,
      whichItemToReturn: () => [0, 1, null, 3], // TODO: Add support for Fahrenheit
      codeToReturn: ['216321201', '216321202', '216321203', '216321204'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
    },
    2163218: {
      // L+R CAB FAN FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([cabFanHasFault1, cabFanHasFault2]) => cabFanHasFault1 && cabFanHasFault2,
        this.cabFanHasFault1,
        this.cabFanHasFault2,
      ),
      whichItemToReturn: () => [0, 1],
      codeToReturn: ['216321801', '216321802'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
    },
    2163260: {
      // LAV+GALLEY FAN FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.lavGalleyFanFault,
      whichItemToReturn: () => [0],
      codeToReturn: ['216326001'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2163290: {
      // HOT AIR FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.hotAirDisagrees,
      whichItemToReturn: () => [
        0,
        this.hotAirPbOn.get() ? 1 : null,
        this.anyDuctOvht.get() && this.hotAirPbOn.get() ? 2 : null,
        this.anyDuctOvht.get() && this.pack1On.get() ? 3 : null,
        this.anyDuctOvht.get() && this.pack2On.get() ? 4 : null,
      ],
      codeToReturn: ['216329001', '216329002', '216329003', '216329004', '216329005'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
    },
    2163305: {
      // TRIM AIR SYS FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.trimAirFault,
      whichItemToReturn: () => [
        0,
        this.ckptTrimFault.get() ? 1 : null,
        this.fwdTrimFault.get() ? 2 : null,
        this.aftTrimFault.get() ? 3 : null,
        this.trimAirHighPressure.get() ? 4 : null,
      ],
      codeToReturn: ['216330501', '216330502', '216330503', '216330504', '216330505'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    2600150: {
      // SMOKE FWD CARGO SMOKE
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.cargoFireTest,
      // TODO no separate slats indication
      whichItemToReturn: () => [
        0,
        SimVar.GetSimVarValue('L:A32NX_OVHD_VENT_CAB_FANS_PB_IS_ON', 'bool') === 1 ? 2 : null,
        [1, 10].includes(this.fwcFlightPhase.get()) && !this.cargoFireAgentDisch.get() ? 3 : null,
        !this.cargoFireAgentDisch.get() ? 4 : null,
        !this.aircraftOnGround.get() ? 5 : null,
        !this.aircraftOnGround.get() ? 6 : null,
        this.aircraftOnGround.get() ? 7 : null,
        this.aircraftOnGround.get() ? 8 : null,
      ],
      codeToReturn: [
        '260015001',
        '260015002',
        '260015003',
        '260015004',
        '260015005',
        '260015006',
        '260015007',
        '260015008',
        '260015009',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
    },
    7700647: {
      // THR LEVERS NOT SET  (on ground)
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 10],
      simVarIsActive: MappedSubject.create(
        ([throttle1Position, throttle2Position, thrustLeverNotSet]) =>
          (throttle1Position !== 35 && thrustLeverNotSet) || (throttle2Position !== 35 && thrustLeverNotSet),
        this.throttle1Position,
        this.throttle2Position,
        this.thrustLeverNotSet,
      ),
      whichItemToReturn: () => [
        0,
        this.autothrustLeverWarningFlex.get() ? 1 : null,
        this.autothrustLeverWarningToga.get() ? 2 : null,
      ],
      codeToReturn: ['770064701', '770064702', '770064703'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    3200050: {
      // PK BRK ON
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([fwcFlightPhase, parkBrake]) => fwcFlightPhase === 3 && parkBrake,
        this.fwcFlightPhase,
        this.parkBrake,
      ),
      // TODO no separate slats indication
      whichItemToReturn: () => [0],
      codeToReturn: ['320005001'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
    },
    3200060: {
      // NW ANTI SKID INACTIVE
      flightPhaseInhib: [4, 5],
      simVarIsActive: this.antiskidActive.map((v) => !v),
      whichItemToReturn: () => [0, 1],
      codeToReturn: ['320006001', '320006002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 9,
    },
    3200150: {
      // GEAR NOT DOWN
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.lgNotDownNoCancel,
      whichItemToReturn: () => [0],
      codeToReturn: ['320015001'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      cancel: false,
    },
    3200155: {
      // GEAR NOT DOWN
      flightPhaseInhib: [3, 4, 5, 6],
      simVarIsActive: MappedSubject.create(
        ([noCancel, lgNotDown]) => !noCancel && lgNotDown,
        this.lgNotDownNoCancel,
        this.lgNotDown,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['320015501'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      cancel: true,
    },
    3200180: {
      // LGCIU 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([lgciu1Fault, lgciu2Fault, dcESSBusPowered]) =>
          lgciu1Fault && !(lgciu1Fault && lgciu2Fault) && dcESSBusPowered,
        this.lgciu1Fault,
        this.lgciu2Fault,
        this.dcESSBusPowered,
      ),
      whichItemToReturn: () => [0, !SimVar.GetSimVarValue('L:A32NX_GPWS_SYS_OFF', 'Bool') ? 1 : null],
      codeToReturn: ['320018001', '320018002'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    3200190: {
      // LGCIU 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([lgciu1Fault, lgciu2Fault, dc2BusPowered]) => lgciu2Fault && !(lgciu1Fault && lgciu2Fault) && dc2BusPowered,
        this.lgciu1Fault,
        this.lgciu2Fault,
        this.dc2BusPowered,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['320019001'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
    },
    3200195: {
      // LGCIU 1+2 FAULT
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([lgciu1Fault, lgciu2Fault, dc2BusPowered, dcESSBusPowered]) =>
          lgciu1Fault && lgciu2Fault && dc2BusPowered && dcESSBusPowered,
        this.lgciu1Fault,
        this.lgciu2Fault,
        this.dc2BusPowered,
        this.dcESSBusPowered,
      ),
      whichItemToReturn: () => [0, 1, !SimVar.GetSimVarValue('L:A32NX_GPWS_SYS_OFF', 'Bool') ? 2 : null],
      codeToReturn: ['320019501', '320019502', '320019503'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 9,
    },
    3400140: {
      // RA 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([height1Failed, ac1BusPowered]) => height1Failed && ac1BusPowered,
        this.height1Failed,
        this.ac1BusPowered,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['340014001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    3400150: {
      // RA 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([height2Failed, ac2BusPowered]) => height2Failed && ac2BusPowered,
        this.height2Failed,
        this.ac2BusPowered,
      ),
      whichItemToReturn: () => [0],
      codeToReturn: ['340015001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    3400500: {
      // TCAS FAULT
      flightPhaseInhib: [1, 3, 4, 5, 7, 8, 10],
      simVarIsActive: this.tcasFault,
      whichItemToReturn: () => [0],
      codeToReturn: ['340050001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    3400507: {
      // NAV TCAS STBY (in flight)
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.tcasSensitivity.map((v) => v === 1),
      whichItemToReturn: () => [0],
      codeToReturn: ['340050701'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    3200010: {
      // L/G-BRAKES OVHT
      flightPhaseInhib: [4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([toConfigNormal, fwcFlightPhase, brakesHot]) => (toConfigNormal || fwcFlightPhase === 3) && brakesHot,
        this.toConfigNormal,
        this.fwcFlightPhase,
        this.brakesHot,
      ),
      whichItemToReturn: () => [
        0,
        !this.aircraftOnGround.get() ? 1 : null,
        [1, 10].includes(this.fwcFlightPhase.get()) ? 2 : null,
        !this.aircraftOnGround.get() ? 3 : null,
        [1, 2].includes(this.fwcFlightPhase.get()) && !this.brakeFan.get() ? 4 : null,
        this.aircraftOnGround.get() ? 5 : null,
        !this.aircraftOnGround.get() ? 6 : null,
        !this.aircraftOnGround.get() ? 7 : null,
        !this.aircraftOnGround.get() ? 8 : null,
      ],
      codeToReturn: [
        '320001001',
        '320001002',
        '320001003',
        '320001004',
        '320001005',
        '320001006',
        '320001007',
        '320001008',
        '320001009',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 9,
    },
    3081186: {
      // SEVERE ICE DETECTED
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.iceSevereDetectedTimerStatus,
      whichItemToReturn: () => [0, !this.wingAntiIce.get() ? 1 : null, this.engSelectorPosition.get() !== 2 ? 2 : null],
      codeToReturn: ['308128001', '308128002', '308128003'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    3081280: {
      // ICE DETECTED
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.iceDetectedTimer2Status,
      whichItemToReturn: () => [0, !this.eng1AntiIce.get() ? 1 : null, !this.eng2AntiIce.get() ? 2 : null],
      codeToReturn: ['308128001', '308128002', '308128003'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
    },
    2900126: {
      // *HYD  - Blue reservoir overheat
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.blueRvrOvht,
      whichItemToReturn: () => [0, this.blueElecPumpPBAuto.get() ? 1 : null],
      codeToReturn: ['290012601', '290012602'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
    },
    2900127: {
      // *HYD  - Yellow reservoir overheat
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.yellowRvrOvht,
      whichItemToReturn: () => [
        0,
        this.ptuAuto.get() ? 1 : null,
        this.eng2pumpPBisAuto.get() ? 2 : null,
        !this.yepumpPBisAuto.get() ? 3 : null,
      ],
      codeToReturn: ['290012701', '290012702', '290012703', '290012704'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
    },
    2900128: {
      // *HYD  - Green reservoir overheat
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.greenRvrOvht,
      whichItemToReturn: () => [0, this.ptuAuto.get() ? 1 : null, this.eng1pumpPBisAuto.get() ? 2 : null],
      codeToReturn: ['290012801', '290012802', '290012803'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
    },
    2800145: {
      // L+R WING TK LO LVL
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.lrTankLow,
      whichItemToReturn: () => [
        0,
        1,
        !this.leftFuelPump1Auto.get() ? 2 : null,
        !this.leftFuelPump2Auto.get() ? 3 : null,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump1Auto.get() ? 4 : null,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump1Auto.get() ? 5 : null,
        this.rightFuelPump1Auto.get() ? null : 6,
        this.rightFuelPump2Auto.get() ? null : 7,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump2Auto.get() ? 8 : null,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump2Auto.get() ? 9 : null,
        !this.fuelXFeedPBOn.get() ? 10 : null,
        !this.fuelXFeedPBOn.get() ? 11 : null,
        this.fuelXFeedPBOn.get() ? 12 : null, // TODO: Gravity feed signals
        this.fuelXFeedPBOn.get() ? 13 : null, // TODO: Gravity feed signals
      ],
      codeToReturn: [
        '280014501',
        '280014502',
        '280014503',
        '280014504',
        '280014505',
        '280014506',
        '280014507',
        '280014508',
        '280014509',
        '280014510',
        '280014511',
        '280014512',
        '280014513',
        '280014514',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 5,
    },
    2800130: {
      // L WING TK LO LVL
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.leftFuelLow,
      whichItemToReturn: () => [
        0,
        !this.fuelCtrTankModeSelMan.get() ? 1 : null,
        !this.fuelXFeedPBOn.get() ? 2 : null,
        !this.fuelXFeedPBOn.get() ? 3 : null,
        !this.fuelXFeedPBOn.get() ? 4 : null,
        this.leftFuelPump1Auto.get() ? 5 : null,
        this.leftFuelPump2Auto.get() ? 6 : null,
      ],
      codeToReturn: ['280013001', '280013002', '280013003', '280013004', '280013005', '280013006', '280013007'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 5,
    },
    2800140: {
      // R WING TK LO LVL
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.rightFuelLow,
      whichItemToReturn: () => [
        0,
        !this.fuelCtrTankModeSelMan.get() ? 1 : null,
        !this.fuelXFeedPBOn.get() ? 2 : null,
        !this.fuelXFeedPBOn.get() ? 3 : null,
        !this.fuelXFeedPBOn.get() ? 4 : null,
        this.rightFuelPump1Auto.get() ? 5 : null,
        this.rightFuelPump2Auto.get() ? 6 : null,
      ],
      codeToReturn: ['280014001', '280014002', '280014003', '280014004', '280014005', '280014006', '280014007'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 5,
    },
  };*/
