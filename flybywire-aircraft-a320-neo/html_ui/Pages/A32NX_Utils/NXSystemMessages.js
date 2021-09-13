class McduMessage {
    constructor(_text, _isAmber = false, _isTypeTwo = false, _replace = "") {
        this.cText = _text;
        this.isAmber = _isAmber;
        this.isTypeTwo = _isTypeTwo;
        this.replace = _replace;
    }

    /**
     * `set text(_t) {}` is not allowed to ensure thread safety, editing the original definition should never be allowed
     * Both NXSystemMessages and NXFictionalMessages messages shall always be readable ONLY
     */

    get text() {
        return this.cText;
    }

    /**
     * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
     */
    getSetMessage(t) {
        return {
            text: !!t ? this.cText.replace(this.replace, "" + t) : this.cText,
            isAmber: this.isAmber,
            isTypeTwo: this.isTypeTwo
        };
    }
}

/**
 NXSystemMessages only holds real messages
 */
const NXSystemMessages = {
    aocActFplnUplink:       new McduMessage("AOC ACT F-PLN UPLINK", false, true),
    awyWptMismatch:         new McduMessage("AWY/WPT MISMATCH", false, false),
    checkMinDestFob:        new McduMessage("CHECK MIN DEST FOB", false, true),
    checkToData:            new McduMessage("CHECK TAKE OFF DATA", true, true),
    destEfobBelowMin:       new McduMessage("DEST EFOB BELOW MIN", true, true),
    enterDestData:          new McduMessage("ENTER DEST DATA", true, true),
    entryOutOfRange:        new McduMessage("ENTRY OUT OF RANGE", false, false),
    formatError:            new McduMessage("FORMAT ERROR", false, false),
    // gpsPrimary:             new McduMessage("GPS PRIMARY", false, true),
    gpsPrimaryLost:         new McduMessage("GPS PRIMARY LOST", true, true),
    initializeWeightOrCg:   new McduMessage("INITIALIZE WEIGHT/CG", true, true),
    newCrzAlt:              new McduMessage("NEW CRZ ALT - HHHHH", false, true, "HHHHH"),
    noIntersectionFound:    new McduMessage("NO INTERSECTION FOUND", false, false),
    notAllowed:             new McduMessage("NOT ALLOWED", false, false),
    notAllowedInNav:        new McduMessage("NOT ALLOWED IN NAV", false, false),
    notInDatabase:          new McduMessage("NOT IN DATABASE", false, false),
    selectDesiredSystem:    new McduMessage("SELECT DESIRED SYSTEM", false, false),
    uplinkInsertInProg:     new McduMessage("UPLINK INSERT IN PROG", false, true),
    vToDisagree:            new McduMessage("V1/VR/V2 DISAGREE", true, true),
    waitForSystemResponse:  new McduMessage("WAIT FOR SYSTEM RESPONSE", false, false)
};

const NXFictionalMessages = {
    noSimBriefUser:         new McduMessage("NO SIMBRIEF USER", false, false),
    noAirportSpecified:     new McduMessage("NO AIRPORT SPECIFIED", false, false),
    fltNbrInUse:            new McduMessage("FLT NBR IN USE", false, false),
    notYetImplemented:      new McduMessage("NOT YET IMPLEMENTED", false, false),
    recipientNotFound:      new McduMessage("RECIPIENT NOT FOUND", false, false),
    authErr:                new McduMessage("AUTH ERR", false, false),
    invalidMsg:             new McduMessage("INVALID MSG", false, false),
    unknownDownlinkErr:     new McduMessage("UNKNOWN DOWNLINK ERR", false, false),
    telexNotEnabled:        new McduMessage("TELEX NOT ENABLED", false, false),
    freeTextDisabled:       new McduMessage("FREE TEXT DISABLED", false, false),
    freetextEnabled:        new McduMessage("FREE TEXT ENABLED", false, false),
    enabledFltNbrInUse:     new McduMessage("ENABLED. FLT NBR IN USE", false, false),
    noOriginApt:            new McduMessage("NO ORIGIN AIRPORT", false, false),
    noOriginSet:            new McduMessage("NO ORIGIN SET", false, false),
    secondIndexNotFound:    new McduMessage("2ND INDEX NOT FOUND", false, false),
    firstIndexNotFound:     new McduMessage("1ST INDEX NOT FOUND", false, false),
    noRefWpt:               new McduMessage("NO REF WAYPOINT", false, false),
    noWptInfos:             new McduMessage("NO WAYPOINT INFOS", false, false),
    emptyMessage:           new McduMessage(""),
    reloadPlaneApply:       new McduMessage("RELOAD A/C TO APPLY", true, true)
};
