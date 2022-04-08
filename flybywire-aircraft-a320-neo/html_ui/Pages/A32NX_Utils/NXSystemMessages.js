class McduMessage {
    constructor(text, isTypeTwo = false, isAmber = false, replace = "", isResolved = () => false, onClear = () => {}) {
        this.text = text;
        this.isAmber = isAmber;
        this.color = isAmber ? "amber" : "white";
        this.isTypeTwo = isTypeTwo;
        this.replace = replace;

        if (isTypeTwo) {
            this.isResolved = isResolved;
            this.onClear = onClear;
        }
    }

    /**
     * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
     * t {string} replaces defined elements, see this.replace
     * isResolved {function} overrides present function
     * onClear {function} overrides present function
     */
    getModifiedMessage(t, isResolved = undefined, onClear = undefined) {
        return new McduMessage(
            !!t ? this.text.replace(this.replace, "" + t) : this.text,
            this.isTypeTwo,
            this.isAmber,
            this.replace,
            isResolved === undefined ? this.isResolved : isResolved,
            onClear === undefined ? this.isResolved : onClear
        );
    }
}

class TypeIMessage extends McduMessage {
    constructor(text, isAmber = false, replace = "") {
        super(text, false, isAmber, replace);
    }
}

class TypeIIMessage extends McduMessage {
    constructor(text, isAmber = false, replace = "", isResolved = () => false, onClear = () => {}) {
        super(text, true, isAmber, replace, isResolved, onClear);
    }
}

/**
 NXSystemMessages only holds real messages
 */
const NXSystemMessages = {
    aocActFplnUplink:       new TypeIMessage("AOC ACT F-PLN UPLINK", true),
    awyWptMismatch:         new TypeIMessage("AWY/WPT MISMATCH", false),
    checkMinDestFob:        new TypeIMessage("CHECK MIN DEST FOB", true),
    checkToData:            new TypeIIMessage("CHECK TAKE OFF DATA", true),
    databaseCodingError:    new TypeIMessage("DATABASE CODING ERROR", true),
    destEfobBelowMin:       new TypeIIMessage("DEST EFOB BELOW MIN", true),
    enterDestData:          new TypeIIMessage("ENTER DEST DATA", true),
    entryOutOfRange:        new TypeIMessage("ENTRY OUT OF RANGE", false),
    mandatoryFields:        new TypeIMessage("ENTER MANDATORY FIELDS", false),
    formatError:            new TypeIMessage("FORMAT ERROR", false),
    fplnElementRetained:    new TypeIMessage("F-PLN ELEMENT RETAINED", false),
    initializeWeightOrCg:   new TypeIIMessage("INITIALIZE WEIGHT/CG", true),
    listOf99InUse:          new TypeIMessage("LIST OF 99 IN USE", false),
    newCrzAlt:              new TypeIMessage("NEW CRZ ALT - HHHHH", true, "HHHHH"),
    noIntersectionFound:    new TypeIMessage("NO INTERSECTION FOUND", false),
    notAllowed:             new TypeIMessage("NOT ALLOWED", false),
    notAllowedInNav:        new TypeIMessage("NOT ALLOWED IN NAV", false),
    notInDatabase:          new TypeIMessage("NOT IN DATABASE", false),
    rwyLsMismatch:          new TypeIIMessage("RWY/LS MISMATCH", true),
    selectDesiredSystem:    new TypeIMessage("SELECT DESIRED SYSTEM", false),
    setHoldSpeed:           new TypeIMessage("SET HOLD SPEED", true),
    spdLimExceeded:         new TypeIIMessage("SPD LIM EXCEEDED", true),
    uplinkInsertInProg:     new TypeIMessage("UPLINK INSERT IN PROG", true),
    vToDisagree:            new TypeIIMessage("V1/VR/V2 DISAGREE", true),
    waitForSystemResponse:  new TypeIMessage("WAIT FOR SYSTEM RESPONSE", false),
    // FIXME these should be in alphabetical order like the rest
    comUnavailable:         new TypeIMessage("COM UNAVAILABLE", false),
    dcduFileFull:           new TypeIMessage("DCDU FILE FULL", false),
    systemBusy:             new TypeIMessage("SYSTEM BUSY-TRY LATER", false),
    noAtc:                  new TypeIMessage("NO ACTIVE ATC"),
    newAtisReceived:        new TypeIMessage("NEW ATIS: READ AGAIN", false),
    noAtisReceived:         new TypeIMessage("NO ATIS REPORT RECEIVED", false),
    noPreviousAtis:         new TypeIMessage("NO PREVIOUS ATIS STORED", false),
    arptTypeAlreadyInUse:   new TypeIMessage("ARPT/TYPE ALREADY USED", false),
    cancelAtisUpdate:       new TypeIMessage("CANCEL UPDATE BEFORE", false)
};

const NXFictionalMessages = {
    noSimBriefUser:         new TypeIMessage("NO SIMBRIEF USER", false),
    noAirportSpecified:     new TypeIMessage("NO AIRPORT SPECIFIED", false),
    fltNbrInUse:            new TypeIMessage("FLT NBR IN USE", false),
    fltNbrMissing:          new TypeIMessage("ENTER ATC FLT NBR", false),
    notYetImplemented:      new TypeIMessage("NOT YET IMPLEMENTED", false),
    recipientNotFound:      new TypeIMessage("RECIPIENT NOT FOUND", false),
    authErr:                new TypeIMessage("AUTH ERR", false),
    invalidMsg:             new TypeIMessage("INVALID MSG", false),
    unknownDownlinkErr:     new TypeIMessage("UNKNOWN DOWNLINK ERR", false),
    telexNotEnabled:        new TypeIMessage("TELEX NOT ENABLED", false),
    freeTextDisabled:       new TypeIMessage("FREE TEXT DISABLED", false),
    freetextEnabled:        new TypeIMessage("FREE TEXT ENABLED", false),
    enabledFltNbrInUse:     new TypeIMessage("ENABLED. FLT NBR IN USE", false),
    noOriginApt:            new TypeIMessage("NO ORIGIN AIRPORT", false),
    noOriginSet:            new TypeIMessage("NO ORIGIN SET", false),
    secondIndexNotFound:    new TypeIMessage("2ND INDEX NOT FOUND", false),
    firstIndexNotFound:     new TypeIMessage("1ST INDEX NOT FOUND", false),
    noRefWpt:               new TypeIMessage("NO REF WAYPOINT", false),
    noWptInfos:             new TypeIMessage("NO WAYPOINT INFOS", false),
    emptyMessage:           new TypeIMessage(""),
    reloadPlaneApply:       new TypeIIMessage("RELOAD A/C TO APPLY", true),
    noHoppieConnection:     new TypeIMessage("NO HOPPIE CONNECTION", false),
    unknownAtsuMessage:     new TypeIMessage("UNKNOWN ATSU MESSAGE", false),
    reverseProxy:           new TypeIMessage("REVERSE PROXY ERROR", false)
};
