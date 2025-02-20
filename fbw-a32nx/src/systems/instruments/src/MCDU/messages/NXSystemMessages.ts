// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// FIXME move into FMGC

export class McduMessage {
  public isTypeTwo = false;

  constructor(
    public text,
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
  getModifiedMessage(t?: string | number) {
    return new McduMessage(t ? this.text.replace(this.replace, '' + t) : this.text, this.isAmber, this.replace);
  }
}

export class TypeIIMessage extends McduMessage {
  public isTypeTwo = true;

  constructor(
    text: string,
    isAmber = false,
    replace = '',
    public isResolved: (mcdu: any) => boolean = () => false,
    public onClear = () => {},
  ) {
    super(text, isAmber, replace);
  }

  /**
   * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
   * t {string} replaces defined elements, see this.replace
   * isResolved {function} overrides present function
   * onClear {function} overrides present function
   */
  getModifiedMessage(t?: string | number, isResolved = undefined, onClear = undefined) {
    return new TypeIIMessage(
      t ? this.text.replace(this.replace, '' + t) : this.text,
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
  acPositionInvalid: new TypeIIMessage('A/C POSITION INVALID', true),
  aocActFplnUplink: new TypeIIMessage('AOC ACT F-PLN UPLINK'),
  aocSecFplnUplink: new TypeIIMessage('AOC SEC F-PLN UPLINK'),
  arptTypeAlreadyInUse: new TypeIMessage('ARPT/TYPE ALREADY USED'), // FIXME move out of FMS
  awyWptMismatch: new TypeIMessage('AWY/WPT MISMATCH'),
  cancelAtisUpdate: new TypeIMessage('CANCEL UPDATE BEFORE'), // FIXME move out of FMS
  checkMinDestFob: new TypeIIMessage('CHECK MIN DEST FOB'),
  checkSpeedMode: new TypeIIMessage('CHECK SPEED MODE'),
  checkToData: new TypeIIMessage('CHECK TAKE OFF DATA', true),
  checkWeight: new TypeIIMessage('CHECK WEIGHT', true),
  comUnavailable: new TypeIMessage('COM UNAVAILABLE'), // FIXME move out of FMS
  cstrDelUpToWpt: new TypeIIMessage('CSTR DEL UP TO WWWWW', false, 'WWWWW'),
  databaseCodingError: new TypeIIMessage('DATABASE CODING ERROR'),
  dcduFileFull: new TypeIMessage('DCDU FILE FULL'), // FIXME move out of FMS
  destEfobBelowMin: new TypeIIMessage('DEST EFOB BELOW MIN', true),
  enterDestData: new TypeIIMessage('ENTER DEST DATA', true),
  entryOutOfRange: new TypeIMessage('ENTRY OUT OF RANGE'),
  invalidFplnUplink: new TypeIIMessage('INVALID F-PLN UPLINK', false),
  mandatoryFields: new TypeIMessage('ENTER MANDATORY FIELDS'), // FIXME move out of FMS
  formatError: new TypeIMessage('FORMAT ERROR'),
  fplnElementRetained: new TypeIMessage('F-PLN ELEMENT RETAINED'),
  initializeWeightOrCg: new TypeIIMessage('INITIALIZE WEIGHT/CG', true),
  keyNotActive: new TypeIMessage('KEY NOT ACTIVE'),
  latLonAbreviated: new TypeIMessage('LAT/LON DISPL ABREVIATED'),
  listOf99InUse: new TypeIMessage('LIST OF 99 IN USE'),
  newAccAlt: new TypeIIMessage('NEW ACC ALT-HHHH', false, 'HHHH'),
  newAtisReceived: new TypeIMessage('NEW ATIS: READ AGAIN'), // FIXME move out of FMS
  newCrzAlt: new TypeIIMessage('NEW CRZ ALT - HHHHH', false, 'HHHHH'),
  newThrRedAlt: new TypeIIMessage('NEW THR RED ALT-HHHH', false, 'HHHH'),
  noAtc: new TypeIMessage('NO ACTIVE ATC'), // FIXME move out of FMS
  noAtisReceived: new TypeIMessage('NO ATIS REPORT RECEIVED'), // FIXME move out of FMS
  noIntersectionFound: new TypeIMessage('NO INTERSECTION FOUND'),
  noPreviousAtis: new TypeIMessage('NO PREVIOUS ATIS STORED'), // FIXME move out of FMS
  notAllowed: new TypeIMessage('NOT ALLOWED'),
  notAllowedInNav: new TypeIMessage('NOT ALLOWED IN NAV'),
  notInDatabase: new TypeIMessage('NOT IN DATABASE'),
  rwyLsMismatch: new TypeIIMessage('RWY/LS MISMATCH', true),
  selectDesiredSystem: new TypeIMessage('SELECT DESIRED SYSTEM'), // FIXME move out of FMS (is part of MCDU itself)
  setHoldSpeed: new TypeIIMessage('SET HOLD SPEED'),
  spdLimExceeded: new TypeIIMessage('SPD LIM EXCEEDED', true),
  systemBusy: new TypeIMessage('SYSTEM BUSY-TRY LATER'), // FIXME move out of FMS
  toSpeedTooLow: new TypeIIMessage('TO SPEEDS TOO LOW', true),
  uplinkInsertInProg: new TypeIIMessage('UPLINK INSERT IN PROG'),
  usingCostIndex: new TypeIMessage('USING COST INDEX: NNN', false, 'NNN'),
  vToDisagree: new TypeIIMessage('V1/VR/V2 DISAGREE', true),
  waitForSystemResponse: new TypeIMessage('WAIT FOR SYSTEM RESPONSE'), // FIXME move out of FMS (is part of MCDU itself)
  xxxIsDeselected: new TypeIMessage('XXXX IS DESELECTED', false, 'XXXX'),
  stepAboveMaxFl: new TypeIIMessage('STEP ABOVE MAX FL'),
  stepAhead: new TypeIIMessage('STEP AHEAD'),
  stepDeleted: new TypeIIMessage('STEP DELETED'),
};

// FIXME move ATSU messages out of FMS
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
};
