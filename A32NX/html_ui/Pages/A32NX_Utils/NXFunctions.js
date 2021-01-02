function getNavDataDateRange() {
    return SimVar.GetGameVarValue("FLIGHT NAVDATA DATE RANGE", "string");
}

/**
 * Returns true if an engine is running (FF > 0)
 * @returns {boolean}
 */
function isAnEngineOn() {
    return Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
}

/**
 * Returns true if all engines are running (FF > 0)
 * @returns {boolean}
 */
function isAllEngineOn() {
    return Simplane.getEngineActive(0) && Simplane.getEngineActive(1);
}

/**
 * Returns the ISA temperature for a given altitude
 * @param alt {number} altitude in ft
 * @returns {number} ISA temp in C°
 */
function getIsaTemp(alt = Simplane.getAltitude()) {
    return alt / 1000 * (-1.98) + 15;
}

/**
 * Returns the deviation from ISA temperature and OAT at given altitude
 * @param alt {number} altitude in ft
 * @returns {number} ISA temp deviation from OAT in C°
 */
function getIsaTempDeviation(alt = Simplane.getAltitude()) {
    return SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius") - getIsaTemp(alt);
}

/**
 * Returns the maximum cruise FL for ISA temp and GW
 * @param temp {number} ISA in C°
 * @param gw {number} GW in t
 * @returns {number} MAX FL
 */
function getMaxFL(temp = getIsaTempDeviation(), gw = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000) {
    return Math.round(temp <= 10 ? -2.778 * gw + 578.667 : (temp * (-0.039) - 2.389) * gw + temp * (-0.667) + 585.334);
}

/**
 * Returns the maximum allowed cruise FL considering max service FL
 * @param fl {number} FL to check
 * @returns {number} maximum allowed cruise FL
 */
function getMaxFlCorrected(fl = getMaxFL()) {
    return fl >= MAX_CRUISE_FL ? MAX_CRUISE_FL : fl;
}

function secondsToUTC(seconds) {
    const h = Math.floor(seconds / 3600);
    seconds -= h * 3600;
    const m = Math.floor(seconds / 60);
    return (h % 24).toFixed(0).padStart(2, "0") + m.toFixed(0).padStart(2, "0");
}

function secondsTohhmm(seconds) {
    const h = Math.floor(seconds / 3600);
    seconds -= h * 3600;
    const m = Math.floor(seconds / 60);
    return h.toFixed(0).padStart(2, "0") + m.toFixed(0).padStart(2, "0");
}

function minuteToSeconds(minutes) {
    return minutes * 60;
}

function hhmmToSeconds(hhmm) {
    if (!hhmm) {
        return NaN;
    }
    const h = parseInt(hhmm.substring(0, 2));
    const m = parseInt(hhmm.substring(2, 4));
    return h * 3600 + m * 60;
}

/**
 * Computes hour and minutes when given minutes
 * @param {number} minutes - minutes used to make the conversion
 * @returns {string} A string in the format "HHMM" e.g "0235"
 */
function minutesTohhmm(minutes) {
    const h = Math.floor(minutes / 60);
    minutes -= h * 60;
    const m = minutes;
    return h.toFixed(0).padStart(2,"0") + m.toFixed(0).padStart(2, "0");
}

/**
 * computes minutes when given hour and minutes
 * @param {string} hhmm - string used ot make the conversion
 * @returns {number} numbers in minutes form
 */
function hhmmToMinutes(hhmm) {
    if (!hhmm) {
        return NaN;
    }
    const h = parseInt(hhmm.substring(0, 2));
    const m = parseInt(hhmm.substring(2, 4));
    return h * 60 + m;
}
