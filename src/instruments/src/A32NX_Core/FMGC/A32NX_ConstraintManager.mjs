export default class A32NX_ConstraintManager {
    /**
     * Returns valid altitude constraint
     * @param flightPhase {FlightPhase} current flight phase
     * @param fcuSelAlt {number} FCUs selected altitude
     * @param constraintAlt {number} current cached constraint altitude
     * @returns {number} valid constraint altitude
     */
    static getDisplayedConstraintAltitude(flightPhase, fcuSelAlt, constraintAlt) {
        if (!constraintAlt || flightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            return 0;
        }
        if (flightPhase === FlightPhase.FLIGHT_PHASE_DESCENT || flightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            return fcuSelAlt > constraintAlt ? 0 : constraintAlt;
        }
        return fcuSelAlt < constraintAlt ? 0 : constraintAlt;
    }

    /**
     * Calculates altitude constraint
     * @param flightPhase {FlightPhase} current flight phase
     * @param fpm {FlightPlanManager} flight plan manager in use
     * @param curConstraintAlt {number} current altitude constraint
     * @param crzAlt {number} cruise altitude
     * @returns {number} new cached altitude constraint
     */
    static getConstraintAltitude(flightPhase, fpm, curConstraintAlt, crzAlt) {
        if (fpm.getIsDirectTo() || flightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            return 0;
        }
        if (flightPhase === FlightPhase.FLIGHT_PHASE_DESCENT || flightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            return Math.round(this._getAltitudeConstraintDescent(fpm, curConstraintAlt));
        }
        return Math.round(this._getAltitudeConstraintAscent(fpm, crzAlt));
    }

    static _getAltitudeConstraintAscent(fpm, crzAlt) {
        const rte = fpm.getWaypoints(0);
        if (rte.length === 0) {
            return 0;
        }
        const min = Simplane.getAltitude();
        const activeWpIdx = Math.max(0, fpm.getActiveWaypointIndex());
        for (let i = activeWpIdx; i < rte.length; i++) {
            const wpt = rte[i];
            if (typeof wpt === 'undefined' || !isFinite(wpt.legAltitude1)) {
                continue;
            }
            if (wpt.legAltitudeDescription === 0 || wpt.legAltitudeDescription === 2) {
                // Predict altitude in flight plan to predict TOC
                if (Math.floor(min + (wpt.cumulativeDistanceInFP * 572.41)) < crzAlt - 50) {
                    continue;
                }
                return 0;
            }
            // Get current waypoints altitude constraint, if type 4, get correct (highest) altitude
            let cur = wpt.legAltitude1;
            if (wpt.legAltitudeDescription === 4 && wpt.legAltitude1 < wpt.legAltitude2) {
                cur = wpt.legAltitude2;
            }
            // Continue search if constraint alt is invalid (too low)
            if (cur < min) {
                continue;
            }
            // Abort search and return valid constraint
            return cur;
        }
        return 0;
    }

    static _getAltitudeConstraintDescent(fpm, curConstraintAlt) {
        const waypointsWithDiscontinuities = [];
        let first;
        if (fpm.isActiveApproach()) {
            first = fpm.getWaypointsCount() - 1;
        } else {
            first = Math.max(0, fpm.getActiveWaypointIndex() - 1);
        }
        for (let i = first; i < fpm.getWaypointsCount(); i++) {
            const prev = waypointsWithDiscontinuities[waypointsWithDiscontinuities.length - 1];
            const wp = fpm.getWaypoint(i);
            if (!prev || (prev.wp && prev.wp.ident !== wp.ident)) {
                waypointsWithDiscontinuities.push({ wp: fpm.getWaypoint(i), fpIndex: i });
            }
        }
        const approachWaypoints = fpm.getApproachWaypoints();
        waypointsWithDiscontinuities.pop();
        for (let i = 0; i < approachWaypoints.length; i++) {
            const prev = waypointsWithDiscontinuities[waypointsWithDiscontinuities.length - 1];
            const wp = approachWaypoints[i];
            if (!prev || (prev.wp && prev.wp.ident !== wp.ident)) {
                waypointsWithDiscontinuities.push({
                    wp,
                    fpIndex: -42,
                });
            }
        }
        const activeIdent = fpm.getActiveWaypointIdent();
        const activeIndex = waypointsWithDiscontinuities.findIndex((w) => w.wp && w.wp.ident === activeIdent);
        if (waypointsWithDiscontinuities.length === 0) {
            return 0;
        }
        const max = curConstraintAlt || Simplane.getAltitude() + 50;
        let last = 0;
        for (let i = waypointsWithDiscontinuities.length - 1; i >= activeIndex; i--) {
            const wpt = waypointsWithDiscontinuities[i].wp;
            if (typeof wpt === 'undefined' || !isFinite(wpt.legAltitude1) || wpt.legAltitudeDescription === 0 || wpt.legAltitudeDescription === 3) {
                continue;
            }
            // Get current waypoints altitude constraint, if type 4, get correct (lowest) altitude
            let cur = wpt.legAltitude1;
            if (wpt.legAltitudeDescription === 4 && wpt.legAltitude1 > wpt.legAltitude2) {
                cur = wpt.legAltitude2;
            }
            // Continue search if constraint alt is invalid (too low)
            if (cur <= last) {
                continue;
            }
            // Abort search and return last valid constraint
            if (cur > max) {
                return last;
            }
            // Continue search and update last valid constraint
            last = cur;
        }
        return last;
    }
}
