/**
 NXSystemMessages only holds real messages
 */
const NXSystemMessages = {
    typeOne: {
        awyWptMismatch:         {text: "AWY/WPT MISMATCH", isAmber: false},
        entryOutOfRange:        {text: "ENTRY OUT OF RANGE", isAmber: false},
        formatError:            {text: "FORMAT ERROR", isAmber: false},
        noIntersectionFound:    {text: "NO INTERSECTION FOUND", isAmber: false},
        notAllowed:             {text: "NOT ALLOWED", isAmber: false},
        notInDatabase:          {text: "NOT IN DATABASE", isAmber: false},
        selectDesiredSystem:    {text: "SELECT DESIRED SYSTEM", isAmber: false},
        waitForSystemResponse:  {text: "WAIT FOR SYSTEM RESPONSE", isAmber: false}
    },
    typeTwo: {
        aocActFplnUplink:       {text: "AOC ACT F-PLN UPLINK", isAmber: false},
        checkMinDestFob:        {text: "CHECK MIN DEST FOB", isAmber: false},
        destEfobBelowMin:       {text: "DEST EFOB BELOW MIN", isAmber: true},
        enterDestData:          {text: "ENTER DEST DATA", isAmber: true},
        gpsPrimary:             {text: "GPS PRIMARY", isAmber: false},
        gpsPrimaryLost:         {text: "GPS PRIMARY LOST", isAmber: true},
        newCrzAlt:              {text: "NEW CRZ ALT-", isAmber: false},
        uplinkInsertInProg:     {text: "UPLINK INSERT IN PROG", isAmber: false},
        toSpeedsDisagree:       {text: "V1/VR/V2 DISAGREE", isAmber: true}
    }
};
