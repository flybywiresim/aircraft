/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 NXSystemMessages only holds real messages
 */
const NXSystemMessages = {
    aocActFplnUplink:       {text: "AOC ACT F-PLN UPLINK", isAmber: false, isTypeTwo: true},
    awyWptMismatch:         {text: "AWY/WPT MISMATCH", isAmber: false, isTypeTwo: false},
    checkMinDestFob:        {text: "CHECK MIN DEST FOB", isAmber: false, isTypeTwo: true},
    checkToData:            {text: "CHECK TAKE OFF DATA", isAmber: true, isTypeTwo: true},
    destEfobBelowMin:       {text: "DEST EFOB BELOW MIN", isAmber: true, isTypeTwo: true},
    enterDestData:          {text: "ENTER DEST DATA", isAmber: true, isTypeTwo: true},
    entryOutOfRange:        {text: "ENTRY OUT OF RANGE", isAmber: false, isTypeTwo: false},
    formatError:            {text: "FORMAT ERROR", isAmber: false, isTypeTwo: false},
    gpsPrimary:             {text: "GPS PRIMARY", isAmber: false, isTypeTwo: true},
    gpsPrimaryLost:         {text: "GPS PRIMARY LOST", isAmber: true, isTypeTwo: true},
    initializeWeightOrCg:   {text: "INITIALIZE WEIGHT/CG", isAmber: true, isTypeTwo: true},
    newCrzAlt:              {text: "NEW CRZ ALT-", isAmber: false, isTypeTwo: true},
    noIntersectionFound:    {text: "NO INTERSECTION FOUND", isAmber: false, isTypeTwo: false},
    notAllowed:             {text: "NOT ALLOWED", isAmber: false, isTypeTwo: false},
    notInDatabase:          {text: "NOT IN DATABASE", isAmber: false, isTypeTwo: false},
    selectDesiredSystem:    {text: "SELECT DESIRED SYSTEM", isAmber: false, isTypeTwo: false},
    uplinkInsertInProg:     {text: "UPLINK INSERT IN PROG", isAmber: false, isTypeTwo: true},
    vToDisagree:            {text: "V1/VR/V2 DISAGREE", isAmber: true, isTypeTwo: true},
    waitForSystemResponse:  {text: "WAIT FOR SYSTEM RESPONSE", isAmber: false, isTypeTwo: false}
};

const NXFictionalMessages = {
    noSimBriefUser:         {text: "NO SIMBRIEF USER", isAmber: false, isTypeTwo: false},
    fltNbrInUse:            {text: "FLT NBR IN USE", isAmber: false, isTypeTwo: false},
    notYetImplemented:      {text: "NOT YET IMPLEMENTED", isAmber: false, isTypeTwo: false},
    recipientNotFound:      {text: "RECIPIENT NOT FOUND", isAmber: false, isTypeTwo: false},
    authErr:                {text: "AUTH ERR", isAmber: false, isTypeTwo: false},
    invalidMsg:             {text: "INVALID MSG", isAmber: false, isTypeTwo: false},
    unknownDownlinkErr:     {text: "UNKNOWN DOWNLINK ERR", isAmber: false, isTypeTwo: false},
    telexNotEnabled:        {text: "TELEX NOT ENABLED", isAmber: false, isTypeTwo: false},
    freeTextDisabled:       {text: "FREE TEXT DISABLED", isAmber: false, isTypeTwo: false},
    freetextEnabled:        {text: "FREE TEXT ENABLED", isAmber: false, isTypeTwo: false},
    enabledFltNbrInUse:     {text: "ENABLED. FLT NBR IN USE", isAmber: false, isTypeTwo: false},
    noOriginApt:            {text: "NO ORIGIN AIRPORT", isAmber: false, isTypeTwo: false},
    noOriginSet:            {text: "NO ORIGIN SET", isAmber: false, isTypeTwo: false},
    secondIndexNotFound:    {text: "2ND INDEX NOT FOUND", isAmber: false, isTypeTwo: false},
    firstIndexNotFound:     {text: "1ST INDEX NOT FOUND", isAmber: false, isTypeTwo: false},
    noRefWpt:               {text: "NO REF WAYPOINT", isAmber: false, isTypeTwo: false},
    noWptInfos:             {text: "NO WAYPOINT INFOS", isAmber: false, isTypeTwo: false},
    emptyMessage:           {text: "", isAmber: false, isTypeTwo: false},
    weightUnitChanged:      {text: "UNIT CHANGED RELOAD A/C", isAmber: true, isTypeTwo: true}
};
