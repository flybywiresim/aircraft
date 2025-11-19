// Copyright (c) 2021-2023 FlyByWire Simulations
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

export class TypeIIMessage extends McduMessage {
  constructor(
    text: string,
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
      t ? this.text.replace(this.replace, `${t}`) : this.text,
      this.isAmber,
      this.replace,
      isResolved || this.isResolved,
      onClear || this.onClear,
    );
  }
}

/**
 NXSystemMessages only holds real messages
 */
export const NXSystemMessages = {
  awyWptDisagree: new TypeIMessage('AIRWAY / WPT DISAGREE'),
  cancelAtisUpdate: new TypeIMessage('CANCEL AUTO UPDATE FIRST'),
  checkMinFuelAtDest: new TypeIIMessage('CHECK MIN FUEL AT DEST'),
  checkSpeedMode: new TypeIIMessage('CHECK SPD MODE'),
  checkToData: new TypeIIMessage('CHECK T.O. DATA', true),
  comFplnRecievedPendingInsertion: new TypeIIMessage('COMPANY F-PLN RECEIVED WAITING FOR INSERTION', false),
  comDatalinkNotAvail: new TypeIMessage('COM DATALINK NOT AVAIL'),
  cstrDelUpToWpt: new TypeIIMessage('CONSTRAINTS BEFORE WWWWW : DELETED', false, 'WWWWW'),
  costIndexInUse: new TypeIMessage('COST INDEX-NNN IN USE', false, 'NNN'),
  databaseCodingError: new TypeIIMessage('DATABASE CODING ERROR'),
  destEfobBelowMin: new TypeIIMessage('DEST EFOB BELOW MIN', true),
  enterDestData: new TypeIIMessage('ENTER DEST DATA', true),
  entryOutOfRange: new TypeIMessage('ENTRY OUT OF RANGE'),
  formatError: new TypeIMessage('FORMAT ERROR'),
  fplnElementRetained: new TypeIMessage('F-PLN ELEMENT RETAINED'),
  initializeZfwOrZfwCg: new TypeIIMessage('INITIALIZE ZFW / ZFWCG', true),
  newAccAlt: new TypeIIMessage('NEW ACCEL ALT: HHHHH', false, 'HHHHH'),
  newCrzAlt: new TypeIIMessage('NEW CRZ ALT: HHHHH', false, 'HHHHH'),
  newThrRedAlt: new TypeIIMessage('NEW THR RED ALT: HHHHH', false, 'HHHHH'),
  noIntersectionFound: new TypeIMessage('NO INTERSECTION FOUND'),
  notAllowed: new TypeIMessage('NOT ALLOWED'),
  notInDatabase: new TypeIMessage('NOT IN DATABASE'),
  rwyLsDisagree: new TypeIIMessage('RUNWAY / LS DISAGREE', true),
  setHoldSpeed: new TypeIIMessage('SET HOLD SPD'),
  tdReached: new TypeIIMessage('T/D REACHED'),
  spdLimExceeded: new TypeIIMessage('SPD LIMIT EXCEEDED', true),
  toSpeedTooLow: new TypeIIMessage('T.O SPEED TOO LOW - CHECK TOW & T.O DATA', true),
  vToDisagree: new TypeIIMessage('V1/VR/V2 DISAGREE', true),
  xxxIsDeselected: new TypeIMessage('XXXX IS DESELECTED', false, 'XXXX'),
  stepAboveMaxFl: new TypeIIMessage('STEP ABOVE MAX FL'),
  stepAhead: new TypeIIMessage('STEP AHEAD'),
  stepDeleted: new TypeIIMessage('STEP DELETED'),
  tooSteepPathAhead: new TypeIIMessage('TOO STEEP PATH AHEAD'),
  navprimary: new TypeIIMessage('NAV PRIMARY'),
  navprimaryLost: new TypeIIMessage('NAV PRIMARY LOST', true),
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
  reloadPlaneApply: new TypeIIMessage('RELOAD A/C TO APPLY', true),
  noHoppieConnection: new TypeIMessage('NO HOPPIE CONNECTION'),
  unknownAtsuMessage: new TypeIMessage('UNKNOWN ATSU MESSAGE'),
  reverseProxy: new TypeIMessage('REVERSE PROXY ERROR'),
  simBriefNoUser: new TypeIMessage('NO SIMBRIEF PILOT ID PROVIDED'),
};

export function isTypeIIMessage(message: McduMessage): message is TypeIIMessage {
  return message instanceof TypeIIMessage;
}
