class McduMessage {
    constructor(text, isAmber = false, replace = "") {
        this.text = text;
        this.isAmber = isAmber;
        this.replace = replace;
        this.isTypeTwo = false;
    }
}

class TypeIMessage extends McduMessage {
    constructor(text, isAmber = false, replace = "") {
        super(text, isAmber, replace);
    }

    /**
     * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
     * t {string} replaces defined elements, see this.replace
     */
    getModifiedMessage(t) {
        return new McduMessage(
            !!t ? this.text.replace(this.replace, "" + t) : this.text,
            this.isAmber,
            this.replace,
        );
    }
}

class TypeIIMessage extends McduMessage {
    constructor(text, isAmber = false, replace = "", isResolved = () => false, onClear = () => {}) {
        super(text, isAmber, replace);

        this.isTypeTwo = true;
        this.isResolved = isResolved;
        this.onClear = onClear;
    }

    /**
     * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
     * t {string} replaces defined elements, see this.replace
     * isResolved {function} overrides present function
     * onClear {function} overrides present function
     */
    getModifiedMessage(t, isResolved = undefined, onClear = undefined) {
        return new TypeIIMessage(
            !!t ? this.text.replace(this.replace, "" + t) : this.text,
            this.isAmber,
            this.replace,
            isResolved || this.isResolved,
            onClear || this.onClear
        );
    }
}

/**
 NXSystemMessages only holds real messages
 */
const NXSystemMessages = {
    aocActFplnUplink:       new TypeIIMessage("AOC ACT F-PLN UPLINK"),
    arptTypeAlreadyInUse:   new TypeIMessage("ARPT/TYPE ALREADY USED"),
    awyWptMismatch:         new TypeIMessage("AWY/WPT MISMATCH"),
    cancelAtisUpdate:       new TypeIMessage("CANCEL UPDATE BEFORE"),
    checkMinDestFob:        new TypeIIMessage("CHECK MIN DEST FOB"),
    checkToData:            new TypeIIMessage("CHECK TAKE OFF DATA", true),
    checkWeight:            new TypeIIMessage("CHECK WEIGHT", true),
    comUnavailable:         new TypeIMessage("COM UNAVAILABLE"),
    databaseCodingError:    new TypeIIMessage("DATABASE CODING ERROR"),
    dcduFileFull:           new TypeIMessage("DCDU FILE FULL"),
    destEfobBelowMin:       new TypeIIMessage("DEST EFOB BELOW MIN", true),
    enterDestData:          new TypeIIMessage("ENTER DEST DATA", true),
    entryOutOfRange:        new TypeIMessage("ENTRY OUT OF RANGE"),
    mandatoryFields:        new TypeIMessage("ENTER MANDATORY FIELDS"),
    formatError:            new TypeIMessage("FORMAT ERROR"),
    fplnElementRetained:    new TypeIMessage("F-PLN ELEMENT RETAINED"),
    initializeWeightOrCg:   new TypeIIMessage("INITIALIZE WEIGHT/CG", true),
    keyNotActive:           new TypeIMessage("KEY NOT ACTIVE"),
    latLonAbreviated:       new TypeIMessage("LAT/LON DISPL ABREVIATED"),
    listOf99InUse:          new TypeIMessage("LIST OF 99 IN USE"),
    newAtisReceived:        new TypeIMessage("NEW ATIS: READ AGAIN"),
    newCrzAlt:              new TypeIIMessage("NEW CRZ ALT - HHHHH", false, "HHHHH"),
    noAtc:                  new TypeIMessage("NO ACTIVE ATC"),
    noAtisReceived:         new TypeIMessage("NO ATIS REPORT RECEIVED"),
    noIntersectionFound:    new TypeIMessage("NO INTERSECTION FOUND"),
    noPreviousAtis:         new TypeIMessage("NO PREVIOUS ATIS STORED"),
    notAllowed:             new TypeIMessage("NOT ALLOWED"),
    notAllowedInNav:        new TypeIMessage("NOT ALLOWED IN NAV"),
    notInDatabase:          new TypeIMessage("NOT IN DATABASE"),
    rwyLsMismatch:          new TypeIIMessage("RWY/LS MISMATCH", true),
    selectDesiredSystem:    new TypeIMessage("SELECT DESIRED SYSTEM"),
    setHoldSpeed:           new TypeIIMessage("SET HOLD SPEED"),
    spdLimExceeded:         new TypeIIMessage("SPD LIM EXCEEDED", true),
    systemBusy:             new TypeIMessage("SYSTEM BUSY-TRY LATER"),
    uplinkInsertInProg:     new TypeIIMessage("UPLINK INSERT IN PROG"),
    vToDisagree:            new TypeIIMessage("V1/VR/V2 DISAGREE", true),
    waitForSystemResponse:  new TypeIMessage("WAIT FOR SYSTEM RESPONSE")
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
