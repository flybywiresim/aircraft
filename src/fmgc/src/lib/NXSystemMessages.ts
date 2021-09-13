/**
 NXSystemMessages only holds real messages
 */
import { ScratchpadMessage } from './ScratchpadMessage';

export const NXSystemMessages = {
    aocActFplnUplink: new ScratchpadMessage('AOC ACT F-PLN UPLINK', false, true),
    awyWptMismatch: new ScratchpadMessage('AWY/WPT MISMATCH', false, false),
    checkMinDestFob: new ScratchpadMessage('CHECK MIN DEST FOB', false, true),
    checkToData: new ScratchpadMessage('CHECK TAKE OFF DATA', true, true),
    destEfobBelowMin: new ScratchpadMessage('DEST EFOB BELOW MIN', true, true),
    enterDestData: new ScratchpadMessage('ENTER DEST DATA', true, true),
    entryOutOfRange: new ScratchpadMessage('ENTRY OUT OF RANGE', false, false),
    formatError: new ScratchpadMessage('FORMAT ERROR', false, false),
    // gpsPrimary:             new ScratchpadMessage("GPS PRIMARY", false, true),
    gpsPrimaryLost: new ScratchpadMessage('GPS PRIMARY LOST', true, true),
    initializeWeightOrCg: new ScratchpadMessage('INITIALIZE WEIGHT/CG', true, true),
    newCrzAlt: new ScratchpadMessage('NEW CRZ ALT - HHHHH', false, true),
    noIntersectionFound: new ScratchpadMessage('NO INTERSECTION FOUND', false, false),
    notAllowed: new ScratchpadMessage('NOT ALLOWED', false, false),
    notInDatabase: new ScratchpadMessage('NOT IN DATABASE', false, false),
    selectDesiredSystem: new ScratchpadMessage('SELECT DESIRED SYSTEM', false, false),
    uplinkInsertInProg: new ScratchpadMessage('UPLINK INSERT IN PROG', false, true),
    vToDisagree: new ScratchpadMessage('V1/VR/V2 DISAGREE', true, true),
    waitForSystemResponse: new ScratchpadMessage('WAIT FOR SYSTEM RESPONSE', false, false),
};

export const NXFictionalMessages = {
    noSimBriefUser: new ScratchpadMessage('NO SIMBRIEF USER', false, false),
    noAirportSpecified: new ScratchpadMessage('NO AIRPORT SPECIFIED', false, false),
    fltNbrInUse: new ScratchpadMessage('FLT NBR IN USE', false, false),
    notYetImplemented: new ScratchpadMessage('NOT YET IMPLEMENTED', false, false),
    recipientNotFound: new ScratchpadMessage('RECIPIENT NOT FOUND', false, false),
    authErr: new ScratchpadMessage('AUTH ERR', false, false),
    internalError: new ScratchpadMessage('INTERNAL ERROR', false, false),
    invalidMsg: new ScratchpadMessage('INVALID MSG', false, false),
    unknownDownlinkErr: new ScratchpadMessage('UNKNOWN DOWNLINK ERR', false, false),
    telexNotEnabled: new ScratchpadMessage('TELEX NOT ENABLED', false, false),
    freeTextDisabled: new ScratchpadMessage('FREE TEXT DISABLED', false, false),
    freetextEnabled: new ScratchpadMessage('FREE TEXT ENABLED', false, false),
    enabledFltNbrInUse: new ScratchpadMessage('ENABLED. FLT NBR IN USE', false, false),
    noOriginApt: new ScratchpadMessage('NO ORIGIN AIRPORT', false, false),
    noOriginSet: new ScratchpadMessage('NO ORIGIN SET', false, false),
    secondIndexNotFound: new ScratchpadMessage('2ND INDEX NOT FOUND', false, false),
    firstIndexNotFound: new ScratchpadMessage('1ST INDEX NOT FOUND', false, false),
    noRefWpt: new ScratchpadMessage('NO REF WAYPOINT', false, false),
    noWptInfos: new ScratchpadMessage('NO WAYPOINT INFOS', false, false),
    emptyMessage: new ScratchpadMessage('', false, false),
    reloadPlaneApply: new ScratchpadMessage('RELOAD A/C TO APPLY', true, true),
};
