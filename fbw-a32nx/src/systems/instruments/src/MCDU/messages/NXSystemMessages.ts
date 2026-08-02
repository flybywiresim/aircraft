// Copyright (c) 2021-2023, 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
// FIXME move into FMGC

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
  getModifiedMessage(t?: string | number) {
    return new McduMessage(t ? this.text.replace(this.replace, '' + t) : this.text, this.isAmber, this.replace);
  }
}

export class TypeIIMessage extends McduMessage {
  public isTypeTwo = true;

  constructor(
    private readonly id: number,
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
    const copy = new TypeIIMessage(
      this.id,
      t ? this.text.replace(this.replace, '' + t) : this.text,
      this.isAmber,
      this.replace,
      isResolved || this.isResolved,
      onClear || this.onClear,
    );
    return copy;
  }

  public getMessageId(): number {
    return this.id;
  }
}

/**
 NXSystemMessages only holds real messages
 */
export const NXSystemMessages = {
  acPositionInvalid: new TypeIIMessage(0, 'A/C POSITION INVALID', true),
  aocActFplnUplink: new TypeIIMessage(1, 'AOC ACT F-PLN UPLINK'),
  aocSecFplnUplink: new TypeIIMessage(2, 'AOC SEC F-PLN UPLINK'),
  areaRnpIs: new TypeIIMessage(3, 'AREA RNP IS XX.XX', true, 'XX.XX'),
  arptTypeAlreadyInUse: new TypeIMessage('ARPT/TYPE ALREADY USED'), // FIXME move out of FMS
  awyWptMismatch: new TypeIMessage('AWY/WPT MISMATCH'),
  cancelAtisUpdate: new TypeIMessage('CANCEL UPDATE BEFORE'), // FIXME move out of FMS
  checkAltnWind: new TypeIIMessage(4, 'CHECK ALTN WIND'),
  checkMinDestFob: new TypeIIMessage(5, 'CHECK MIN DEST FOB'),
  checkToData: new TypeIIMessage(6, 'CHECK TAKE OFF DATA', true),
  checkWeight: new TypeIIMessage(7, 'CHECK WEIGHT', true),
  comUnavailable: new TypeIMessage('COM UNAVAILABLE'), // FIXME move out of FMS
  cstrDelUpToWpt: new TypeIIMessage(8, 'CSTR DEL UP TO WWWWW', false, 'WWWWW'),
  databaseCodingError: new TypeIIMessage(9, 'DATABASE CODING ERROR'),
  dcduFileFull: new TypeIMessage('DCDU FILE FULL'), // FIXME move out of FMS
  destEfobBelowMin: new TypeIIMessage(10, 'DEST EFOB BELOW MIN', true),
  enterDestData: new TypeIIMessage(11, 'ENTER DEST DATA', true),
  entryOutOfRange: new TypeIMessage('ENTRY OUT OF RANGE'),
  invalidFplnUplink: new TypeIIMessage(12, 'INVALID F-PLN UPLINK', false),
  invalidWindTempUplk: new TypeIIMessage(13, 'INVALID WIND/TEMP UPLK'),
  mandatoryFields: new TypeIMessage('ENTER MANDATORY FIELDS'), // FIXME move out of FMS
  formatError: new TypeIMessage('FORMAT ERROR'),
  fplnElementRetained: new TypeIMessage('F-PLN ELEMENT RETAINED'),
  initializeWeightOrCg: new TypeIIMessage(14, 'INITIALIZE WEIGHT/CG', true),
  keyNotActive: new TypeIMessage('KEY NOT ACTIVE'),
  latLonAbreviated: new TypeIMessage('LAT/LON DISPL ABREVIATED'),
  listOf99InUse: new TypeIMessage('LIST OF 99 IN USE'),
  newAccAlt: new TypeIIMessage(15, 'NEW ACC ALT-HHHH', false, 'HHHH'),
  newAtisReceived: new TypeIMessage('NEW ATIS: READ AGAIN'), // FIXME move out of FMS
  newCrzAlt: new TypeIIMessage(16, 'NEW CRZ ALT - HHHHH', false, 'HHHHH'),
  newThrRedAlt: new TypeIIMessage(17, 'NEW THR RED ALT-HHHH', false, 'HHHH'),
  noAtc: new TypeIMessage('NO ACTIVE ATC'), // FIXME move out of FMS
  noAtisReceived: new TypeIMessage('NO ATIS REPORT RECEIVED'), // FIXME move out of FMS
  noIntersectionFound: new TypeIMessage('NO INTERSECTION FOUND'),
  noPreviousAtis: new TypeIMessage('NO PREVIOUS ATIS STORED'), // FIXME move out of FMS
  notAllowed: new TypeIMessage('NOT ALLOWED'),
  notAllowedInNav: new TypeIMessage('NOT ALLOWED IN NAV'),
  notInDatabase: new TypeIMessage('NOT IN DATABASE'),
  onlySpdEntryAllowed: new TypeIMessage('ONLY SPD ENTRY ALLOWED'),
  procedureRnpIs: new TypeIIMessage(18, 'PROCEDURE RNP IS XX.XX', true, 'XX.XX'),
  rwyLsMismatch: new TypeIIMessage(19, 'RWY/LS MISMATCH', true),
  selectDesiredSystem: new TypeIMessage('SELECT DESIRED SYSTEM'), // FIXME move out of FMS (is part of MCDU itself)
  setHoldSpeed: new TypeIIMessage(20, 'SET HOLD SPEED'),
  setManagedSpeed: new TypeIIMessage(21, 'SET MANAGED SPEED'),
  spdLimExceeded: new TypeIIMessage(22, 'SPD LIM EXCEEDED', true),
  systemBusy: new TypeIMessage('SYSTEM BUSY-TRY LATER'), // FIXME move out of FMS
  toSpeedTooLow: new TypeIIMessage(23, 'TO SPEEDS TOO LOW', true),
  uplinkInsertInProg: new TypeIIMessage(24, 'UPLINK INSERT IN PROG'),
  usingCostIndex: new TypeIMessage('USING COST INDEX: NNN', false, 'NNN'),
  vToDisagree: new TypeIIMessage(25, 'V1/VR/V2 DISAGREE', true),
  waitForSystemResponse: new TypeIMessage('WAIT FOR SYSTEM RESPONSE'), // FIXME move out of FMS (is part of MCDU itself)
  xxxIsDeselected: new TypeIMessage('XXXX IS DESELECTED', false, 'XXXX'),
  stepAboveMaxFl: new TypeIIMessage(26, 'STEP ABOVE MAX FL'),
  stepAhead: new TypeIIMessage(27, 'STEP AHEAD'),
  stepDeleted: new TypeIIMessage(28, 'STEP DELETED'),
  temporaryFplnExists: new TypeIMessage('TEMPORARY F-PLN EXISTS'),
  windTempDataUplk: new TypeIIMessage(29, 'WIND/TEMP DATA UPLK'),
  windTempUplkPending: new TypeIIMessage(30, 'WIND/TEMP UPLK PENDING', true),
  noAnswerToRequest: new TypeIMessage('NO ANSWER TO REQUEST'),
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
  noAcarsConnection: new TypeIMessage('NO ACARS CONNECTION'),
  unknownAtsuMessage: new TypeIMessage('UNKNOWN ATSU MESSAGE'),
  reverseProxy: new TypeIMessage('REVERSE PROXY ERROR'),
};
