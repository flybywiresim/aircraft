export type FMMessageColor = 'White' | 'Amber';

export interface FMMessage {
  /**
   * Unique ID for this message type
   */
  id: number;

  /**
   * Text on the MCDU scratchpad
   */
  text?: string;

  /**
   * ND message flag, if applicable
   */
  ndFlag?: NdFmMessageFlag;

  /**
   * ND priority, if applicable
   */
  ndPriority?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /**
   * EFIS display text, if different than MCDU scratchpad text
   */
  efisText?: string;

  /**
   * Display color for both MCDU and EFIS
   */
  color: FMMessageColor;

  /**
   * Can the message be cleared by the MCDU CLR key?
   */
  clearable?: boolean;
}

/** See a320-coherent-triggers.md */
export const FMMessageTriggers = {
  SEND_TO_MCDU: 'A32NX_FMGC_SEND_MESSAGE_TO_MCDU',

  RECALL_FROM_MCDU_WITH_ID: 'A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID',

  POP_FROM_STACK: 'A32NX_FMGC_POP_MESSAGE',
};

/* eslint-disable no-multi-spaces */
export enum NdFmMessageFlag {
  None = 0,
  SelectTrueRef = 1 << 0,
  CheckNorthRef = 1 << 1,
  NavAccuracyDowngrade = 1 << 2,
  NavAccuracyUpgradeNoGps = 1 << 3,
  SpecifiedVorDmeUnavailble = 1 << 4,
  NavAccuracyUpgradeGps = 1 << 5,
  GpsPrimary = 1 << 6,
  MapPartlyDisplayed = 1 << 7,
  SetOffsideRangeMode = 1 << 8,
  OffsideFmControl = 1 << 9,
  OffsideFmWxrControl = 1 << 10,
  OffsideWxrControl = 1 << 11,
  GpsPrimaryLost = 1 << 12,
  RtaMissed = 1 << 13,
  BackupNav = 1 << 14,
}
/* eslint-enable no-multi-spaces */

export const FMMessageTypes: Readonly<Record<string, FMMessage>> = {
  SelectTrueRef: {
    id: 1,
    ndFlag: NdFmMessageFlag.SelectTrueRef,
    text: 'SELECT TRUE REF',
    color: 'Amber',
    ndPriority: 1,
    clearable: true,
  },
  CheckNorthRef: {
    id: 2,
    ndFlag: NdFmMessageFlag.CheckNorthRef,
    text: 'CHECK NORTH REF',
    color: 'Amber',
    ndPriority: 1,
    clearable: true,
  },
  NavAccuracyDowngrade: {
    id: 3,
    ndFlag: NdFmMessageFlag.NavAccuracyDowngrade,
    text: 'NAV ACCUR DOWNGRAD',
    color: 'Amber',
    ndPriority: 1,
    clearable: true,
  },
  NavAccuracyUpgradeNoGps: {
    id: 4,
    ndFlag: NdFmMessageFlag.NavAccuracyUpgradeNoGps,
    text: 'NAV ACCUR UPGRAD',
    color: 'Amber',
    ndPriority: 1,
    clearable: true,
  },
  SpecifiedVorDmeUnavailble: {
    id: 5,
    ndFlag: NdFmMessageFlag.SpecifiedVorDmeUnavailble,
    text: 'SPECIF VOR/D UNAVAIL',
    color: 'Amber',
    ndPriority: 1,
    clearable: true,
  },
  NavAccuracyUpgradeGps: {
    id: 6,
    ndFlag: NdFmMessageFlag.NavAccuracyUpgradeGps,
    text: 'NAV ACCUR UPGRAD',
    color: 'White',
    ndPriority: 1,
    clearable: true,
  },
  GpsPrimary: {
    id: 7,
    ndFlag: NdFmMessageFlag.GpsPrimary,
    text: 'GPS PRIMARY',
    color: 'White',
    ndPriority: 1,
    clearable: true,
  },
  MapPartlyDisplayed: {
    id: 8,
    ndFlag: NdFmMessageFlag.MapPartlyDisplayed,
    efisText: 'MAP PARTLY DISPLAYED',
    color: 'Amber',
    ndPriority: 2,
  },
  SetOffsideRangeMode: {
    id: 9,
    ndFlag: NdFmMessageFlag.SetOffsideRangeMode,
    text: 'SET OFFSIDE RNG/MODE',
    color: 'Amber',
    ndPriority: 3,
  },
  OffsideFmControl: {
    id: 10,
    ndFlag: NdFmMessageFlag.OffsideFmControl,
    text: 'OFFSIDE FM CONTROL',
    color: 'Amber',
    ndPriority: 4,
  },
  OffsideFmWxrControl: {
    id: 11,
    ndFlag: NdFmMessageFlag.OffsideFmWxrControl,
    text: 'OFFSIDE FM/WXR CONTROL',
    color: 'Amber',
    ndPriority: 5,
  },
  OffsideWxrControl: {
    id: 12,
    ndFlag: NdFmMessageFlag.OffsideWxrControl,
    text: 'OFFSIDE WXR CONTROL',
    color: 'Amber',
    ndPriority: 6,
  },
  GpsPrimaryLost: {
    id: 13,
    ndFlag: NdFmMessageFlag.GpsPrimaryLost,
    text: 'GPS PRIMARY LOST',
    color: 'Amber',
    ndPriority: 7,
  },
  RtaMissed: {
    id: 14,
    ndFlag: NdFmMessageFlag.RtaMissed,
    text: 'RTA MISSED',
    color: 'Amber',
    ndPriority: 8,
  },
  BackupNav: {
    id: 15,
    ndFlag: NdFmMessageFlag.BackupNav,
    text: 'BACK UP NAV',
    color: 'Amber',
    ndPriority: 9,
  },
  TurnAreaExceedance: {
    id: 16,
    text: 'TURN AREA EXCEEDANCE',
    color: 'Amber',
  },
  TuneNavaid: {
    id: 17,
    text: 'TUNE BBB FFF.FF',
    color: 'Amber',
  },
  SpecifiedNdbUnavailble: {
    id: 18,
    text: 'SPECIF NDB UNAVAIL',
    color: 'Amber',
  },
  RwyLsMismatch: {
    id: 19,
    text: 'RWY/LS MISMATCH',
    color: 'Amber',
  },
  TdReached: {
    id: 17,
    text: 'T/D REACHED',
    color: 'White',
    clearable: true,
  },
  StepAhead: {
    id: 18,
    text: 'STEP AHEAD',
    color: 'White',
    clearable: true,
  },
  StepDeleted: {
    id: 19,
    text: 'STEP DELETED',
    color: 'White',
    clearable: true,
  },
  TooSteepPathAhead: {
    id: 20,
    text: 'TOO STEEP PATH AHEAD',
    color: 'Amber',
    clearable: true,
  },
  NoNavIntercept: {
    id: 21,
    text: 'NO NAV INTERCEPT',
    color: 'Amber',
    clearable: true,
  },
};
