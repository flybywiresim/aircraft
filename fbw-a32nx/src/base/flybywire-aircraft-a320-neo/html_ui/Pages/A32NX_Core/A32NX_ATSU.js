// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

function translateAtsuMessageType(type) {
    switch (type) {
        case AtsuCommon.AtsuMessageType.Freetext:
            return "FREETEXT";
        case AtsuCommon.AtsuMessageType.METAR:
            return "METAR";
        case AtsuCommon.AtsuMessageType.TAF:
            return "TAF";
        case AtsuCommon.AtsuMessageType.ATIS:
            return "ATIS";
        default:
            return "UNKNOWN";
    }
}

function fetchTimeValue() {
    let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    if (timeValue) {
        const seconds = Number.parseInt(timeValue);
        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
        timeValue = displayTime.toString();
        return timeValue.substring(0, 5);
    }
    return null;
}

/**
 *  Converts lbs to kg
 * @param {string | number} value
 */
const lbsToKg = (value) => {
    return (+value * 0.4535934).toString();
};

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu FMCMainDisplay
 * @param {() => void} updateView
 * @return {Promise<ISimbriefData>}
 */
const getSimBriefOfp = (mcdu, updateView, callback = () => {}) => {
    const navigraphUsername = NXDataStore.get("NAVIGRAPH_USERNAME", "");
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
        mcdu.setScratchpadMessage(NXFictionalMessages.noNavigraphUser);
        throw new Error("No Navigraph username provided");
    }

    mcdu.simbrief["sendStatus"] = "REQUESTING";

    updateView();

    return Fmgc.SimBriefUplinkAdapter.downloadOfpForUserID(navigraphUsername, overrideSimBriefUserID)
        .then(data => {
            mcdu.simbrief["units"] = data.units;
            mcdu.simbrief["route"] = data.route;
            mcdu.simbrief["cruiseAltitude"] = data.cruiseAltitude;
            mcdu.simbrief["originIcao"] = data.origin.icao;
            mcdu.simbrief["originTransAlt"] = parseInt(data.origin.transAlt, 10);
            mcdu.simbrief["originTransLevel"] = parseInt(data.origin.transLevel, 10);
            mcdu.simbrief["destinationIcao"] = data.destination.icao;
            mcdu.simbrief["destinationTransAlt"] = parseInt(data.destination.transAlt, 10);
            mcdu.simbrief["destinationTransLevel"] = parseInt(data.destination.transLevel, 10);
            mcdu.simbrief["blockFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.planRamp : lbsToKg(data.fuel.planRamp);
            mcdu.simbrief["payload"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.payload : lbsToKg(data.weights.payload);
            mcdu.simbrief["estZfw"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.estZeroFuelWeight : lbsToKg(data.weights.estZeroFuelWeight);
            mcdu.simbrief["paxCount"] = data.weights.passengerCount;
            mcdu.simbrief["bagCount"] = data.weights.bagCount;
            mcdu.simbrief["paxWeight"] = data.weights.passengerWeight;
            mcdu.simbrief["bagWeight"] = data.weights.bagWeight;
            mcdu.simbrief["freight"] = data.weights.freight;
            mcdu.simbrief["cargo"] = data.weights.cargo;
            mcdu.simbrief["costIndex"] = data.costIndex;
            mcdu.simbrief["navlog"] = data.navlog;
            mcdu.simbrief["callsign"] = data.flightNumber;
            let alternate = data.alternate;
            if (Array.isArray(data.alternate)) {
                alternate = data.alternate[0];
            }
            mcdu.simbrief["alternateIcao"] = alternate.icao_code;
            mcdu.simbrief["alternateTransAlt"] = parseInt(alternate.transAlt, 10);
            mcdu.simbrief["alternateTransLevel"] = parseInt(alternate.transLevel, 10);
            mcdu.simbrief["alternateAvgWindDir"] = parseInt(alternate.averageWindDirection, 10);
            mcdu.simbrief["alternateAvgWindSpd"] = parseInt(alternate.averageWindSpeed, 10);
            mcdu.simbrief["avgTropopause"] = data.averageTropopause;
            mcdu.simbrief["ete"] = data.times.estTimeEnroute;
            mcdu.simbrief["blockTime"] = data.times.estBlock;
            mcdu.simbrief["outTime"] = data.times.estOut;
            mcdu.simbrief["onTime"] = data.times.estOn;
            mcdu.simbrief["inTime"] = data.times.estIn;
            mcdu.simbrief["offTime"] = data.times.estOff;
            mcdu.simbrief["taxiFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.taxi : lbsToKg(data.fuel.taxi);
            mcdu.simbrief["tripFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.enrouteBurn : lbsToKg(data.fuel.enrouteBurn);
            mcdu.simbrief["sendStatus"] = "DONE";

            callback();

            updateView();

            return data;
        })
        .catch(_err => {
            console.log(_err.message);

            mcdu.simbrief["sendStatus"] = "READY";
            updateView();
        });
};
