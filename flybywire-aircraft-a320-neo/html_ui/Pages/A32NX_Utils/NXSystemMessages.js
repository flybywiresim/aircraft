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
            onClear === undefined ? this.onClear : onClear
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
    awyWptMismatch:         new TypeIMessage("AWY/WPT MISMATCH"),
    checkMinDestFob:        new TypeIMessage("CHECK MIN DEST FOB", true),
    checkToData:            new TypeIIMessage("CHECK TAKE OFF DATA", true),
    databaseCodingError:    new TypeIMessage("DATABASE CODING ERROR", true),
    destEfobBelowMin:       new TypeIIMessage("DEST EFOB BELOW MIN", true),
    enterDestData:          new TypeIIMessage("ENTER DEST DATA", true),
    entryOutOfRange:        new TypeIMessage("ENTRY OUT OF RANGE"),
    mandatoryFields:        new TypeIMessage("ENTER MANDATORY FIELDS"),
    formatError:            new TypeIMessage("FORMAT ERROR"),
    fplnElementRetained:    new TypeIMessage("F-PLN ELEMENT RETAINED"),
    initializeWeightOrCg:   new TypeIIMessage("INITIALIZE WEIGHT/CG", true),
    listOf99InUse:          new TypeIMessage("LIST OF 99 IN USE"),
    newCrzAlt:              new TypeIMessage("NEW CRZ ALT - HHHHH", true, "HHHHH"),
    noIntersectionFound:    new TypeIMessage("NO INTERSECTION FOUND"),
    notAllowed:             new TypeIMessage("NOT ALLOWED"),
    notAllowedInNav:        new TypeIMessage("NOT ALLOWED IN NAV"),
    notInDatabase:          new TypeIMessage("NOT IN DATABASE"),
    rwyLsMismatch:          new TypeIIMessage("RWY/LS MISMATCH", true),
    selectDesiredSystem:    new TypeIMessage("SELECT DESIRED SYSTEM"),
    setHoldSpeed:           new TypeIMessage("SET HOLD SPEED", true),
    spdLimExceeded:         new TypeIIMessage("SPD LIM EXCEEDED", true),
    uplinkInsertInProg:     new TypeIMessage("UPLINK INSERT IN PROG", true),
    vToDisagree:            new TypeIIMessage("V1/VR/V2 DISAGREE", true),
    waitForSystemResponse:  new TypeIMessage("WAIT FOR SYSTEM RESPONSE"),
    // FIXME these should be in alphabetical order like the rest
    comUnavailable:         new TypeIMessage("COM UNAVAILABLE"),
    dcduFileFull:           new TypeIMessage("DCDU FILE FULL"),
    systemBusy:             new TypeIMessage("SYSTEM BUSY-TRY LATER"),
    noAtc:                  new TypeIMessage("NO ACTIVE ATC"),
    newAtisReceived:        new TypeIMessage("NEW ATIS: READ AGAIN"),
    noAtisReceived:         new TypeIMessage("NO ATIS REPORT RECEIVED"),
    noPreviousAtis:         new TypeIMessage("NO PREVIOUS ATIS STORED"),
    arptTypeAlreadyInUse:   new TypeIMessage("ARPT/TYPE ALREADY USED"),
    cancelAtisUpdate:       new TypeIMessage("CANCEL UPDATE BEFORE")
};

const NXFictionalMessages = {
    noSimBriefUser:         new TypeIMessage("NO SIMBRIEF USER"),
    noAirportSpecified:     new TypeIMessage("NO AIRPORT SPECIFIED"),
    fltNbrInUse:            new TypeIMessage("FLT NBR IN USE"),
    fltNbrMissing:          new TypeIMessage("ENTER ATC FLT NBR"),
    notYetImplemented:      new TypeIMessage("NOT YET IMPLEMENTED"),
    recipientNotFound:      new TypeIMessage("RECIPIENT NOT FOUND"),
    authErr:                new TypeIMessage("AUTH ERR"),
    invalidMsg:             new TypeIMessage("INVALID MSG"),
    unknownDownlinkErr:     new TypeIMessage("UNKNOWN DOWNLINK ERR"),
    telexNotEnabled:        new TypeIMessage("TELEX NOT ENABLED"),
    freeTextDisabled:       new TypeIMessage("FREE TEXT DISABLED"),
    freetextEnabled:        new TypeIMessage("FREE TEXT ENABLED"),
    enabledFltNbrInUse:     new TypeIMessage("ENABLED. FLT NBR IN USE"),
    noOriginApt:            new TypeIMessage("NO ORIGIN AIRPORT"),
    noOriginSet:            new TypeIMessage("NO ORIGIN SET"),
    secondIndexNotFound:    new TypeIMessage("2ND INDEX NOT FOUND"),
    firstIndexNotFound:     new TypeIMessage("1ST INDEX NOT FOUND"),
    noRefWpt:               new TypeIMessage("NO REF WAYPOINT"),
    noWptInfos:             new TypeIMessage("NO WAYPOINT INFOS"),
    emptyMessage:           new TypeIMessage(""),
    reloadPlaneApply:       new TypeIIMessage("RELOAD A/C TO APPLY", true),
    noHoppieConnection:     new TypeIMessage("NO HOPPIE CONNECTION"),
    unknownAtsuMessage:     new TypeIMessage("UNKNOWN ATSU MESSAGE"),
    reverseProxy:           new TypeIMessage("REVERSE PROXY ERROR")
};
