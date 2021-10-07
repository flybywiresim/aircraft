class McduMessage {
    constructor(_text, _isTypeTwo = false, _isAmber = false, _id = -1, _replace = "", _isResolved = () => false, _onClear = () => {}) {
        this.id = _id;
        this.text = _text;
        this.isAmber = _isAmber;
        this.color = _isAmber ? "amber" : "white";
        this.isTypeTwo = _isTypeTwo;
        this.replace = _replace;

        if (_isTypeTwo) {
            this.isResolved = _isResolved;
            this.onClear = _onClear;
        }
    }

    /**
     * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
     * t {string} replaces defined elements, see this.replace
     * _isResolved {function} overrides present function
     * _onClear {function} overrides present function
     */
    modifyMessage(t, _isResolved = undefined, _onClear = undefined) {
        const isResolved = _isResolved === undefined ? this.isResolved : _isResolved;
        const onClear = _onClear === undefined ? this.isResolved : _onClear;
        return new McduMessage(!!t ? this.text.replace(this.replace, "" + t) : this.text, this.isTypeTwo, this.isAmber, this.id, this.replace, isResolved, onClear);
    }
}

class TypeIMessage extends McduMessage {
    constructor(_text, _isAmber = false, _replace = "") {
        super(_text, false, _isAmber, -1, _replace);
    }
}

class TypeIIMessage extends McduMessage {
    constructor(_text, _isAmber = false, _replace = "", _isResolved = () => false, _onClear = () => {}) {
        super(_text, true, _isAmber, -1, _replace, _isResolved, _onClear);
    }
}

class EFISMessage extends McduMessage {
    constructor(_text, _id, _isAmber = false, _replace = "", _isResolved = () => false, _onClear = () => {}) {
        super(_text, true, _isAmber, _id, _replace, _isResolved, _onClear);
    }
}

/**
 NXSystemMessages only holds real messages
 */
const NXSystemMessages = {
    aocActFplnUplink:       new TypeIIMessage("AOC ACT F-PLN UPLINK", false),
    awyWptMismatch:         new TypeIMessage("AWY/WPT MISMATCH"),
    checkMinDestFob:        new TypeIIMessage("CHECK MIN DEST FOB", false),
    checkToData:            new TypeIIMessage("CHECK TAKE OFF DATA", false),
    destEfobBelowMin:       new TypeIIMessage("DEST EFOB BELOW MIN", true, "", (mcdu) => mcdu._EfobBelowMinClr, (mcdu) => mcdu._EfobBelowMinClr = true),
    enterDestData:          new TypeIIMessage("ENTER DEST DATA", true, "", (mcdu) => () => isFinite(mcdu.perfApprQNH) && isFinite(mcdu.perfApprTemp) && isFinite(mcdu.perfApprWindHeading) && isFinite(mcdu.perfApprWindSpeed)),
    entryOutOfRange:        new TypeIMessage("ENTRY OUT OF RANGE"),
    formatError:            new TypeIMessage("FORMAT ERROR"),
    gpsPrimary:             new EFISMessage("GPS PRIMARY", 0, false),
    gpsPrimaryLost:         new EFISMessage("GPS PRIMARY LOST", 1, true),
    initializeWeightOrCg:   new TypeIIMessage("INITIALIZE WEIGHT/CG", true),
    newCrzAlt:              new TypeIIMessage("NEW CRZ ALT - HHHHH", false, "HHHHH"),
    noIntersectionFound:    new TypeIMessage("NO INTERSECTION FOUND"),
    notAllowed:             new TypeIMessage("NOT ALLOWED"),
    notAllowedInNav:        new TypeIMessage("NOT ALLOWED IN NAV"),
    acPositionInvalid:      new TypeIMessage("A/C POSITION INVALID"),
    notInDatabase:          new TypeIMessage("NOT IN DATABASE"),
    selectDesiredSystem:    new TypeIMessage("SELECT DESIRED SYSTEM"),
    uplinkInsertInProg:     new TypeIIMessage("UPLINK INSERT IN PROG", false),
    vToDisagree:            new TypeIIMessage("V1/VR/V2 DISAGREE", true, "", (mcdu) => mcdu._v1Checked && mcdu._vRChecked && mcdu._v2Checked ? (
        (!!mcdu.v1Speed && !!mcdu.vRSpeed ? mcdu.v1Speed <= mcdu.vRSpeed : true)
        && (!!mcdu.vRSpeed && !!mcdu.v2Speed ? mcdu.vRSpeed <= mcdu.v2Speed : true)
        && (!!mcdu.v1Speed && !!mcdu.v2Speed ? mcdu.v1Speed <= mcdu.v2Speed : true)
    ) : true),
    waitForSystemResponse:  new TypeIMessage("WAIT FOR SYSTEM RESPONSE")
};

const NXFictionalMessages = {
    noSimBriefUser:         new TypeIMessage("NO SIMBRIEF USER"),
    noAirportSpecified:     new TypeIMessage("NO AIRPORT SPECIFIED"),
    fltNbrInUse:            new TypeIMessage("FLT NBR IN USE"),
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
    reloadPlaneApply:       new TypeIMessage("RELOAD A/C TO APPLY", true)
};
