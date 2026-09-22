// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export class McduMessage {
  public isTypeTwo = false;

  constructor(
    public text: string,
    public isAmber = false,
    public replace = '',
  ) {}
}

export class TypeIMessage extends McduMessage {
  constructor(text: string, isAmber = false, replace = '') {
    super(text, isAmber, replace);
  }

  /**
   * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
   * t {string} replaces defined elements, see this.replace
   */
  getModifiedMessage(t: string): TypeIMessage {
    return new TypeIMessage(t ? this.text.replace(this.replace, `${t}`) : this.text, this.isAmber, this.replace);
  }
}

export enum TypeIIMessageType {
  AREA_RNP_IS,
  CRZ_FL_ABOVE_MAX,
  CHECK_MIN_FUEL_DEST,
  CHECK_SPEED_MODE,
  CHECK_TO_DATA,
  CHECK_ZFW,
  COMPANY_FPLN_RECIEVED,
  COMPANY_FPLN_INVALID,
  CONSTRAINTS_BEFORE_DELETED,
  DATABASE_CODING_ERROR,
  DEST_EFOB_BELOW_MIN,
  ENTER_DEST_DATA,
  INITIALIZE_ZFW_ZFWCG,
  LATERAL_DISC_AHEAD,
  NAV_PRIMARY,
  NAV_PRIMARY_LOST,
  NEW_ACC_ALT,
  NEW_THR_RED,
  NEW_CRZ_ALT,
  PROC_RNP_IS,
  RUNWAY_LS_DISAGREE,
  SET_HOLD_SPD,
  TD_REACHED,
  SPD_LIMIT_EXCEEDED,
  STEP_ABOVE_MAX,
  STEP_AHEAD,
  STEP_DELETED,
  TOO_STEEP_PATH,
  VSPEEDS_TOO_LOW,
  VSPEEDS_DISAGREE,
}

export class TypeIIMessage extends McduMessage {
  constructor(
    private readonly type: TypeIIMessageType,
    readonly text: string,
    isAmber = false,
    replace = '',
    public isResolved = () => false,
    public onClear = () => {},
  ) {
    super(text, isAmber, replace);

    this.isTypeTwo = true;
  }

  /**
   * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
   * t {string} replaces defined elements, see this.replace
   * isResolved {function} overrides present function
   * onClear {function} overrides present function
   */
  getModifiedMessage(
    t: string,
    isResolved: (() => boolean) | undefined = undefined,
    onClear: (() => void) | undefined = undefined,
  ) {
    return new TypeIIMessage(
      this.type,
      t ? this.text.replace(this.replace, `${t}`) : this.text,
      this.isAmber,
      this.replace,
      isResolved || this.isResolved,
      onClear || this.onClear,
    );
  }

  isSameMessage(other: McduMessage): boolean {
    return isTypeIIMessage(other) && other.type === this.type;
  }
}

export class ATCCOMMessage extends McduMessage {
  constructor(text: string, isAmber = false, replace = '') {
    super(text, isAmber, replace);
  }

  /**
   * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
   * t {string} replaces defined elements, see this.replace
   */
  getModifiedMessage(t: string): ATCCOMMessage {
    return new ATCCOMMessage(t ? this.text.replace(this.replace, `${t}`) : this.text, this.isAmber, this.replace);
  }
}

/**
 NXSystemMessages only holds real messages
 */
export const NXSystemMessages = {
  areaRnpis: new TypeIIMessage(TypeIIMessageType.AREA_RNP_IS, 'AREA RNP IS XX.XX', true, 'XX.XX'),
  awyWptDisagree: new TypeIMessage('AIRWAY / WPT DISAGREE'),
  crzFlAboveMaxFL: new TypeIIMessage(TypeIIMessageType.CRZ_FL_ABOVE_MAX, 'CRZ FL ABOVE MAX FL', false),
  cancelAtisUpdate: new TypeIMessage('CANCEL AUTO UPDATE FIRST'),
  checkMinFuelAtDest: new TypeIIMessage(TypeIIMessageType.CHECK_MIN_FUEL_DEST, 'CHECK MIN FUEL AT DEST'),
  checkSpeedMode: new TypeIIMessage(TypeIIMessageType.CHECK_SPEED_MODE, 'CHECK SPD MODE'),
  checkToData: new TypeIIMessage(TypeIIMessageType.CHECK_TO_DATA, 'CHECK T.O. DATA', true),
  checkZfw: new TypeIIMessage(TypeIIMessageType.CHECK_ZFW, 'CHECK ZFW', true),
  comFplnReceivedPendingInsertion: new TypeIIMessage(
    TypeIIMessageType.COMPANY_FPLN_RECIEVED,
    'COMPANY F-PLN RECEIVED\nWAITING FOR INSERTION',
    false,
  ),
  comDatalinkNotAvail: new TypeIMessage('COM DATALINK NOT AVAIL'),
  cstrDelUpToWpt: new TypeIIMessage(
    TypeIIMessageType.CONSTRAINTS_BEFORE_DELETED,
    'CONSTRAINTS BEFORE WWWWW : DELETED',
    false,
    'WWWWW',
  ),
  databaseCodingError: new TypeIIMessage(TypeIIMessageType.DATABASE_CODING_ERROR, 'DATABASE CODING ERROR'),
  destEfobBelowMin: new TypeIIMessage(TypeIIMessageType.DEST_EFOB_BELOW_MIN, 'DEST EFOB BELOW MIN', true),
  enterDestData: new TypeIIMessage(TypeIIMessageType.ENTER_DEST_DATA, 'ENTER DEST DATA', true),
  entryOutOfRange: new TypeIMessage('ENTRY OUT OF RANGE'),
  formatError: new TypeIMessage('FORMAT ERROR'),
  fplnElementRetained: new TypeIMessage('F-PLN ELEMENT RETAINED'),
  initializeZfwOrZfwCg: new TypeIIMessage(TypeIIMessageType.INITIALIZE_ZFW_ZFWCG, 'INITIALIZE ZFW / ZFWCG', true),
  newAccAlt: new TypeIIMessage(TypeIIMessageType.NEW_ACC_ALT, 'NEW ACCEL ALT: HHHHH', false, 'HHHHH'),
  newCrzAlt: new TypeIIMessage(TypeIIMessageType.NEW_CRZ_ALT, 'NEW CRZ ALT: HHHHH', false, 'HHHHH'),
  newThrRedAlt: new TypeIIMessage(TypeIIMessageType.NEW_THR_RED, 'NEW THR RED ALT: HHHHH', false, 'HHHHH'),
  noIntersectionFound: new TypeIMessage('NO INTERSECTION FOUND'),
  notAllowed: new TypeIMessage('NOT ALLOWED'),
  notAllowedInNav: new TypeIMessage('NOT ALLOWED IN NAV'),
  notInDatabase: new TypeIMessage('NOT IN DATABASE'),
  receivedCpnyFplnNotValid: new TypeIIMessage(
    TypeIIMessageType.COMPANY_FPLN_INVALID,
    'RECEIVED COMPANY F-PLN NOT VALID',
    false,
  ),
  rwyLsDisagree: new TypeIIMessage(TypeIIMessageType.RUNWAY_LS_DISAGREE, 'RUNWAY / LS DISAGREE', true),
  setHoldSpeed: new TypeIIMessage(TypeIIMessageType.SET_HOLD_SPD, 'SET HOLD SPD'),
  tdReached: new TypeIIMessage(TypeIIMessageType.TD_REACHED, 'T/D REACHED'),
  spdLimExceeded: new TypeIIMessage(TypeIIMessageType.SPD_LIMIT_EXCEEDED, 'SPD LIMIT EXCEEDED', true),
  toSpeedTooLow: new TypeIIMessage(TypeIIMessageType.VSPEEDS_TOO_LOW, 'T.O SPEED TOO LOW - CHECK TOW & T.O DATA', true),
  vToDisagree: new TypeIIMessage(TypeIIMessageType.VSPEEDS_DISAGREE, 'V1/VR/V2 DISAGREE', true),
  xxxIsDeselected: new TypeIMessage('XXXX IS DESELECTED', false, 'XXXX'),
  stepAboveMaxFl: new TypeIIMessage(TypeIIMessageType.STEP_ABOVE_MAX, 'STEP ABOVE MAX FL'),
  stepAhead: new TypeIIMessage(TypeIIMessageType.STEP_AHEAD, 'STEP AHEAD'),
  stepDeleted: new TypeIIMessage(TypeIIMessageType.STEP_DELETED, 'STEP DELETED'),
  tooSteepPathAhead: new TypeIIMessage(TypeIIMessageType.TOO_STEEP_PATH, 'TOO STEEP PATH AHEAD'),
  navprimary: new TypeIIMessage(TypeIIMessageType.NAV_PRIMARY, 'NAV PRIMARY'),
  navprimaryLost: new TypeIIMessage(TypeIIMessageType.NAV_PRIMARY_LOST, 'NAV PRIMARY LOST', true),
  sqwkCodeNotValid: new TypeIMessage('SQWK CODE NOT VALID'),
  lrcInUse: new TypeIMessage('LRC MODE IN USE'),
  lateralDiscontinuityAhead: new TypeIIMessage(
    TypeIIMessageType.LATERAL_DISC_AHEAD,
    'LATERAL DISCONTINUITY AHEAD',
    true,
  ),
  procedureRnpIs: new TypeIIMessage(TypeIIMessageType.PROC_RNP_IS, 'PROC RNP IS XX.XX', true, 'XX.XX'),
};

export const NXFictionalMessages = {
  noNavigraphUser: new TypeIMessage('NO NAVIGRAPH USER'),
  internalError: new TypeIMessage('INTERNAL ERROR'),
  noAirportSpecified: new TypeIMessage('NO AIRPORT SPECIFIED'),
  fltNbrInUse: new TypeIMessage('FLT NBR IN USE'),
  fltNbrMissing: new TypeIMessage('ENTER ATC FLT NBR'),
  notYetImplemented: new TypeIMessage('NOT YET IMPLEMENTED'),
  recipientNotFound: new TypeIMessage('RECIPIENT NOT FOUND'),
  authErr: new TypeIMessage('AUTH ERR'),
  invalidMsg: new TypeIMessage('INVALID MSG'),
  unknownDownlinkErr: new TypeIMessage('UNKNOWN DOWNLINK ERR'),
  telexNotEnabled: new TypeIMessage('TELEX NOT ENABLED'),
  freeTextDisabled: new TypeIMessage('FREE TEXT DISABLED'),
  freetextEnabled: new TypeIMessage('FREE TEXT ENABLED'),
  enabledFltNbrInUse: new TypeIMessage('ENABLED. FLT NBR IN USE'),
  noOriginApt: new TypeIMessage('NO ORIGIN AIRPORT'),
  noOriginSet: new TypeIMessage('NO ORIGIN SET'),
  secondIndexNotFound: new TypeIMessage('2ND INDEX NOT FOUND'),
  firstIndexNotFound: new TypeIMessage('1ST INDEX NOT FOUND'),
  noRefWpt: new TypeIMessage('NO REF WAYPOINT'),
  noWptInfos: new TypeIMessage('NO WAYPOINT INFOS'),
  emptyMessage: new TypeIMessage(''),
  reloadPlaneApply: new TypeIMessage('RELOAD A/C TO APPLY'),
  noAcarsConnection: new TypeIMessage('NO ACARS CONNECTION'),
  unknownAtsuMessage: new TypeIMessage('UNKNOWN ATSU MESSAGE'),
  reverseProxy: new TypeIMessage('REVERSE PROXY ERROR'),
  simBriefNoUser: new TypeIMessage('NO SIMBRIEF PILOT ID PROVIDED'),
};

export function isTypeIIMessage(message: McduMessage): message is TypeIIMessage {
  return message instanceof TypeIIMessage;
}

export const ATCCOMMessages = {
  cancelAutoUpdateFirst: new ATCCOMMessage('CANCEL AUTO UPDATE FIRST'),
  comDatalinkNotAvail: new ATCCOMMessage('COM DATALINK NOT AVAIL'),
  datisGroundMsg: new ATCCOMMessage('D-ATIS GROUND MSG'),
  datisNoReply: new ATCCOMMessage('D-ATIS NO REPLY'),
  datisReceived: new ATCCOMMessage('D-ATIS RECEIVED'),
  datisSendFailed: new ATCCOMMessage('D-ATIS SEND FAILED'),
  datisUpdated: new ATCCOMMessage('D-ATIS UPDATED - READ AGAIN'),
  datisUsedOffside: new ATCCOMMessage('D-ATIS USED OFFSIDE'),
  entryOutOfRange: new ATCCOMMessage('ENTRY OUT OF RANGE'),
  formatError: new ATCCOMMessage('FORMAT ERROR'),
  identicalDatisRequest: new ATCCOMMessage('IDENTICAL D-ATIS REQUEST'),
  lastMsgElement: new ATCCOMMessage('LAST MSG ELEMENT'),
  mailboxFull: new ATCCOMMessage('MAILBOX FULL - SEND OR CANCEL SOME MSG'),
  msgAbortedActiveAtcDisconnected: new ATCCOMMessage('MSG ABORTED - ACTIVE ATC DISCONNECTED'),
  msgAbortedNotSupportedByCurrentATC: new ATCCOMMessage('MSG ABORTED - NOT SUPPORTED BY CURRENT ATC'),
  msgRecordLost: new ATCCOMMessage('MSG RECORD LOST'),
  msgRecordUsedOffside: new ATCCOMMessage('MSG RECORD USED OFFSIDE'),
  newDatisGroundMsg: new ATCCOMMessage('NEW D-ATIS GROUND MSG - READ AGAIN'),
  noSysData: new ATCCOMMessage('NO SYS DATA'),
  notifNotAvailAcftPosNotAvail: new ATCCOMMessage('NOTIFICATION NOT AVAIL - ACFT POSITION NOT AVAIL'),
  notifNotAvailChckFltNbr: new ATCCOMMessage('NOTIFICATION NOT AVAIL - CHECK FLT NBR IN FMS INIT PAGE'),
  notifNotAvailChckFromTo: new ATCCOMMessage('NOTIFICATION NOT AVAIL - CHECK FROM/TO IN FMS INIT PAGE'),
  notifNotAvailWithThisAtcCtr: new ATCCOMMessage('NOTIFICATION NOT AVAIL - WITH THIS ATC CENTER'),
  pleaseWaitUpdateInProgress: new ATCCOMMessage('PLEASE WAIT: UPDATE IN PROGRESS'),
  printerNotAvail: new ATCCOMMessage('PRINTER NOT AVAIL'),
  printing: new ATCCOMMessage('PRINTING'),
  sendingMaydayWillSwitchAdscToEmergency: new ATCCOMMessage('SENDING MAYDAY WILL SWITCH ADS-C TO EMERGENCY'),
};
