const A32NX_Util = {};

A32NX_Util.createDeltaTimeCalculator = (startTime = Date.now()) => {
    let lastTime = startTime;

    return () => {
        const nowTime = Date.now();
        const deltaTime = nowTime - lastTime;
        lastTime = nowTime;

        return deltaTime;
    };
};

A32NX_Util.createFrameCounter = (interval = 5) => {
    let count = 0;
    return () => {
        const c = count++;
        if (c == interval) {
            count = 0;
        }
        return c;
    };
};

A32NX_Util.createMachine = (machineDef) => {
    const machine = {
        value: machineDef.init,
        action(event) {
            const currStateDef = machineDef[machine.value];
            const destTransition = currStateDef.transitions[event];
            if (!destTransition) {
                return;
            }
            const destState = destTransition.target;

            machine.value = destState;
        },
        setState(newState) {
            const valid = machineDef[newState];
            if (valid) {
                machine.value = newState;
            }
        }
    };
    return machine;
};

/**
 * Compute a true heading from a magnetic heading
 * @param {Number} heading true heading
 * @param {Number=} magVar falls back to current aircraft position magvar
 * @returns magnetic heading
 */
A32NX_Util.trueToMagnetic = (heading, magVar) => {
    return (360 + heading - (magVar || SimVar.GetSimVarValue("MAGVAR", "degree"))) % 360;
};

/**
 * Compute a magnetic heading from a true heading
 * @param {Number} heading magnetic heading
 * @param {Number=} magVar falls back to current aircraft position magvar
 * @returns true heading
 */
A32NX_Util.magneticToTrue = (heading, magVar) => {
    return (360 + heading + (magVar || SimVar.GetSimVarValue("MAGVAR", "degree"))) % 360;
};

/**
 * Takes a LatLongAlt or LatLong and returns a vector of spherical co-ordinates
 * @param {(LatLong | LatLongAlt)} ll
 */
A32NX_Util.latLonToSpherical = (ll) => {
    return [
        Math.cos(ll.lat * Avionics.Utils.DEG2RAD) * Math.cos(ll.long * Avionics.Utils.DEG2RAD),
        Math.cos(ll.lat * Avionics.Utils.DEG2RAD) * Math.sin(ll.long * Avionics.Utils.DEG2RAD),
        Math.sin(ll.lat * Avionics.Utils.DEG2RAD)
    ];
};

/**
 * Takes a vector of spherical co-ordinates and returns a LatLong
 * @param {[x: number, y: number, z: number]} s
 * @returns {LatLong}
 */
A32NX_Util.sphericalToLatLon = (s) => {
    return new LatLong(Math.asin(s[2]) * Avionics.Utils.RAD2DEG, Math.atan2(s[1], s[0]) * Avionics.Utils.RAD2DEG);
};

/**
 * Computes the intersection point of two (true) bearings on a great circle
 * @param {(LatLong | LatLongAlt)} latlon1
 * @param {number} brg1
 * @param {(LatLong | LatLongAlt)} latlon2
 * @param {number} brg2
 * @returns {LatLong}
 */
A32NX_Util.greatCircleIntersection = (latlon1, brg1, latlon2, brg2) => {
    // c.f. https://blog.mbedded.ninja/mathematics/geometry/spherical-geometry/finding-the-intersection-of-two-arcs-that-lie-on-a-sphere/
    const Pa11 = A32NX_Util.latLonToSpherical(latlon1);
    const latlon12 = Avionics.Utils.bearingDistanceToCoordinates(brg1 % 360, 100, latlon1.lat, latlon1.long);
    const Pa12 = A32NX_Util.latLonToSpherical(latlon12);
    const Pa21 = A32NX_Util.latLonToSpherical(latlon2);
    const latlon22 = Avionics.Utils.bearingDistanceToCoordinates(brg2 % 360, 100, latlon2.lat, latlon2.long);
    const Pa22 = A32NX_Util.latLonToSpherical(latlon22);

    const N1 = math.cross(Pa11, Pa12);
    const N2 = math.cross(Pa21, Pa22);

    const L = math.cross(N1, N2);
    const l = math.norm(L);

    const I1 = math.divide(L, l);
    const I2 = math.multiply(I1, -1);

    const s1 = A32NX_Util.sphericalToLatLon(I1);
    const s2 = A32NX_Util.sphericalToLatLon(I2);

    const brgTos1 = Avionics.Utils.computeGreatCircleHeading(latlon1, s1);
    const brgTos2 = Avionics.Utils.computeGreatCircleHeading(latlon1, s2);

    const delta1 = Math.abs(brg1 - brgTos1);
    const delta2 = Math.abs(brg1 - brgTos2);

    return delta1 < delta2 ? s1 : s2;
};
/**
 * Computes the sunrise time in UTC at location given by lat/lon on a given day.
 * @param {number} lat
 * @param {number} long
 * @param {number} dayOfMonth
 * @param {number} monthOfYear
 * @param {number} year
 * @returns {number}
 */
A32NX_Util.computeSunriseTime = (lat, lon, dayOfMonth, monthOfYear, year) => {
    const fitToRange = (value, min, max) => {
        const range = max - min;

        if (value < min) {
            return value + range;
        } else if (value >= max) {
            return value - range;
        }

        return value;
    };

    const sin = arg => Math.sin(arg * Avionics.Utils.DEG2RAD);
    const cos = arg => Math.cos(arg * Avionics.Utils.DEG2RAD);
    const tan = arg => Math.tan(arg * Avionics.Utils.DEG2RAD);

    const asin = arg => Math.asin(arg) * Avionics.Utils.RAD2DEG;
    const acos = arg => Math.acos(arg) * Avionics.Utils.RAD2DEG;
    const atan = arg => Math.atan(arg) * Avionics.Utils.RAD2DEG;

    const zenith = 90.5; // "Official" sunrise

    // 1. first calculate the day of the year
    const N1 = Math.floor(275 * monthOfYear / 9);
    const N2 = Math.floor((monthOfYear + 9) / 12);
    const N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));

    const N = N1 - (N2 * N3) + dayOfMonth - 30;

    // 2. convert the longitude to hour value and calculate an approximate time
    const lngHour = lon / 15;
    const t = N + ((6 - lngHour) / 24);

    // 3. calculate the Sun's mean anomaly
    const M = (0.9856 * t) - 3.289;

    // 4. calculate the Sun's true longitude
    const L = fitToRange(M + (1.916 * sin(M)) + (0.020 * sin(2 * M)) + 282.634, 0, 360);

    // 5a. calculate the Sun's right ascension
    let RA = fitToRange(atan(0.91764 * tan(L)), 0, 360);

    // 5b. right ascension value needs to be in the same quadrant as L
    const Lquadrant = (Math.floor(L / 90)) * 90;
    const RAquadrant = (Math.floor(RA / 90)) * 90;
    RA = RA + (Lquadrant - RAquadrant);

    // 5c. right ascension value needs to be converted into hours
    RA = RA / 15;

    // 6. calculate the Sun's declination
    const sinDec = 0.39782 * sin(L);
    const cosDec = cos(asin(sinDec));

    // 7a. calculate the Sun's local hour angle
    const cosH = (cos(zenith) - (sinDec * sin(lat))) / (cosDec * cos(lat));

    if (cosH > 1) {
        // the sun never rises on this location (on the specified date)"
        return Number.POSITIVE_INFINITY;
    } else if (cosH < -1) {
        // the sun never sets on this location (on the specified date)
        return Number.NEGATIVE_INFINITY;
    }

    // 7b. finish calculating H and convert into hours
    const H = (360 - acos(cosH)) / 15;

    // 8. calculate local mean time of rising/setting
    const T = H + RA - (0.06571 * t) - 6.622;

    // 9. adjust back to UTC
    const UT = fitToRange(T - lngHour, 0, 24);
    return UT;
};
/**
 * Computes the sunset time in UTC at location given by lat/lon on a given day.
 * @param {number} lat
 * @param {number} long
 * @param {number} dayOfMonth
 * @param {number} monthOfYear
 * @param {number} year
 * @returns {number}
 */
A32NX_Util.computeSunsetTime = (lat, lon, dayOfMonth, monthOfYear, year) => {
    const fitToRange = (value, min, max) => {
        const range = max - min;

        if (value < min) {
            return value + range;
        } else if (value >= max) {
            return value - range;
        }

        return value;
    };

    const sin = arg => Math.sin(arg * Avionics.Utils.DEG2RAD);
    const cos = arg => Math.cos(arg * Avionics.Utils.DEG2RAD);
    const tan = arg => Math.tan(arg * Avionics.Utils.DEG2RAD);

    const asin = arg => Math.asin(arg) * Avionics.Utils.RAD2DEG;
    const acos = arg => Math.acos(arg) * Avionics.Utils.RAD2DEG;
    const atan = arg => Math.atan(arg) * Avionics.Utils.RAD2DEG;

    const zenith = 90.5; // "Official" sunset

    // 1. first calculate the day of the year
    const N1 = Math.floor(275 * monthOfYear / 9);
    const N2 = Math.floor((monthOfYear + 9) / 12);
    const N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));

    const N = N1 - (N2 * N3) + dayOfMonth - 30;

    // 2. convert the longitude to hour value and calculate an approximate time
    const lngHour = lon / 15;
    const t = N + ((18 - lngHour) / 24);

    // 3. calculate the Sun's mean anomaly
    const M = (0.9856 * t) - 3.289;

    // 4. calculate the Sun's true longitude
    const L = fitToRange(M + (1.916 * sin(M)) + (0.020 * sin(2 * M)) + 282.634, 0, 360);

    // 5a. calculate the Sun's right ascension
    let RA = fitToRange(atan(0.91764 * tan(L)), 0, 360);

    // 5b. right ascension value needs to be in the same quadrant as L
    const Lquadrant = (Math.floor(L / 90)) * 90;
    const RAquadrant = (Math.floor(RA / 90)) * 90;
    RA = RA + (Lquadrant - RAquadrant);

    // 5c. right ascension value needs to be converted into hours
    RA = RA / 15;

    // 6. calculate the Sun's declination
    const sinDec = 0.39782 * sin(L);
    const cosDec = cos(asin(sinDec));

    // 7a. calculate the Sun's local hour angle
    const cosH = (cos(zenith) - (sinDec * sin(lat))) / (cosDec * cos(lat));

    // No sunset
    if (cosH > 1) {
        return Number.POSITIVE_INFINITY;
    } else if (cosH < -1) {
        return Number.NEGATIVE_INFINITY;
    }

    // 7b. finish calculating H and convert into hours
    const H = acos(cosH) / 15;

    // 8. calculate local mean time of rising/setting
    const T = H + RA - (0.06571 * t) - 6.622;

    // 9. adjust back to UTC
    const UT = fitToRange(T - lngHour, 0, 24);
    return UT;
};

/**
 * Utility class to throttle instrument updates
 */
class UpdateThrottler {

    /**
     * @param {number} intervalMs Interval between updates, in milliseconds
     */
    constructor(intervalMs) {
        this.intervalMs = intervalMs;
        this.currentTime = 0;
        this.lastUpdateTime = 0;

        // Take a random offset to space out updates from different instruments among different
        // frames as much as possible.
        this.refreshOffset = Math.floor(Math.random() * intervalMs);
        this.refreshNumber = 0;
    }

    /**
     * Checks whether the instrument should be updated in the current frame according to the
     * configured update interval.
     *
     * @param {number} deltaTime
     * @param {boolean} [forceUpdate = false] - True if you want to force an update during this frame.
     * @returns -1 if the instrument should not update, or the time elapsed since the last
     *          update in milliseconds
     */
    canUpdate(deltaTime, forceUpdate = false) {
        this.currentTime += deltaTime;
        const number = Math.floor((this.currentTime + this.refreshOffset) / this.intervalMs);
        const update = number > this.refreshNumber;
        this.refreshNumber = number;
        if (update || forceUpdate) {
            const accumulatedDelta = this.currentTime - this.lastUpdateTime;
            this.lastUpdateTime = this.currentTime;
            return accumulatedDelta;
        } else {
            return -1;
        }
    }
}
