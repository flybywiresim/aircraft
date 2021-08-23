const MAX_FIX_ROW = 5;

const Markers = {
    FPLN_DISCONTINUITY: ["---F-PLN DISCONTINUITY--"],
    END_OF_FPLN:        ["------END OF F-PLN------"],
    NO_ALTN_FPLN:       ["-----NO ALTN F-PLN------"],
    END_OF_ALTN_FPLN:   ["---END OF ALT F-PLN----"],
    TOO_STEEP_PATH:     ["-----TOO STEEP PATH-----"]
};

class CDUFlightPlanPage {

    static ShowPage(mcdu, offset = 0) {

        // INIT
        function addLskAt(index, delay, callback) {
            mcdu.leftInputDelay[index] = (typeof delay === 'function') ? delay : () => delay;
            mcdu.onLeftInput[index] = callback;
        }

        function addRskAt(index, delay, callback) {
            mcdu.rightInputDelay[index] = (typeof delay === 'function') ? delay : () => delay;
            mcdu.onRightInput[index] = callback;
        }

        function getRunwayInfo(runway) {
            let runwayText, runwayAlt;
            if (runway) {
                runwayText = Avionics.Utils.formatRunway(runway.designation);
                runwayAlt = (runway.elevation * 3.280).toFixed(0).toString();
            }
            return [runwayText, runwayAlt];
        }

        //mcdu.flightPlanManager.updateWaypointDistances(false /* approach */);
        //mcdu.flightPlanManager.updateWaypointDistances(true /* approach */);
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.FlightPlanPage;
        mcdu.returnPageCallback = () => {
            CDUFlightPlanPage.ShowPage(mcdu, offset);
        };
        mcdu.activeSystem = 'FMGC';
        CDUFlightPlanPage._timer = 0;
        const fpm = mcdu.flightPlanManager;
        const renderedWaypointIndex = fpm.getActiveWaypointIndex();
        mcdu.pageUpdate = () => {
            CDUFlightPlanPage._timer++;
            if (CDUFlightPlanPage._timer >= 100 || fpm.getActiveWaypointIndex() !== renderedWaypointIndex) {
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            }
        };
        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isFlying = flightPhase >= 5 && flightPhase <= 7;

        let showFrom = false;
        let showTMPY = false;
        // TODO Replace with ADIRS getLatitude() getLongitude()
        // TODO Account for no position data
        const ppos = {
            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
            long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
        };
        const stats = fpm.getCurrentFlightPlan().computeWaypointStatistics(ppos);

        // TODO: Move from flightplanpage
        const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        if (fpm.getOrigin()) {
            if (!isFlying) {
                fpm._waypointReachedAt = utcTime;
            }
        }

        const waypointsAndMarkers = [];
        const activeFirst = Math.max(0, fpm.getActiveWaypointIndex() - 1);

        // If we're still on the ground, force the active leg to be the first one even if we're close enough that the
        // FPM is trying to advance to the next one.
        const first = (mcdu.currentFlightPhase <= FmgcFlightPhases.TAKEOFF) ? 0 : activeFirst;

        // Primary F-PLAN
        for (let i = first; i < fpm.getWaypointsCount(); i++) {
            const wp = fpm.getWaypoint(i);
            waypointsAndMarkers.push({ wp: fpm.getWaypoint(i), fpIndex: i});

            if (wp.endsInDiscontinuity) {
                waypointsAndMarkers.push({ marker: Markers.FPLN_DISCONTINUITY, fpIndex: i});
            }
            if (i === fpm.getWaypointsCount() - 1) {
                waypointsAndMarkers.push({ marker: Markers.END_OF_FPLN, fpIndex: i});
                // TODO: Rewrite once alt fpln exists
                waypointsAndMarkers.push({ marker: Markers.NO_ALTN_FPLN, fpIndex: i});
            }
        }
        // TODO: Alt F-PLAN

        // Render F-PLAN Display

        // fprow:   1      | 2     | 3 4   | 5 6   | 7 8   | 9 10  | 11 12   |
        // display: SPD/ALT| R0    | R1    | R2    | R3    | R4    | DEST    | SCRATCHPAD
        // functions:      | F[0]  | F[1]  | F[2]  | F[3]  | F[4]  | F[5]    |
        let rowsCount = 5;

        if (waypointsAndMarkers.length === 0) {
            rowsCount = 0;
            mcdu.setTemplate([
                [`{left}{small}{sp}${showFrom ? "FROM" : "{sp}{sp}{sp}{sp}"}{end}{yellow}{sp}${showTMPY ? "TMPY" : ""}{end}{end}{right}{small}${SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")}{sp}{sp}{sp}{end}{end}`],
                ...emptyFplnPage()
            ]);
            return;
        } else if (waypointsAndMarkers.length >= 5) {
            rowsCount = 5;
        } else {
            rowsCount = waypointsAndMarkers.length;
        }

        // Only examine first 5 (or less) waypoints/markers
        // TODO FIXME: Proper sequencing implementation AMM 22-72-00:59-61 > FROM field (when offset is 0)
        const scrollWindow = [];
        for (let rowI = 0, winI = offset; rowI < rowsCount; rowI++, winI++) {
            winI = winI % (waypointsAndMarkers.length);

            if (waypointsAndMarkers[winI].wp) {
                // Waypoint
                if (waypointsAndMarkers[winI].fpIndex === (fpm.getActiveWaypointIndex() - 1) && offset === 0) {
                    showFrom = true;
                }

                const wpPrev = fpm.getWaypoint(waypointsAndMarkers[winI].fpIndex - 1);
                const activeIndex = fpm.getActiveWaypointIndex();
                const wpActive = (waypointsAndMarkers[winI].fpIndex >= activeIndex);
                let ident = waypointsAndMarkers[winI].wp.ident;
                const isOverfly = waypointsAndMarkers[winI].wp.additionalData && waypointsAndMarkers[winI].wp.additionalData.overfly;

                // Time
                let time;
                let timeCell = "----[s-text]";
                if (ident !== "MANUAL") {
                    if (isFlying) {
                        if (waypointsAndMarkers[winI].wp === fpm.getDestination() || isFinite(waypointsAndMarkers[winI].wp.liveUTCTo) || isFinite(waypointsAndMarkers[winI].wp.waypointReachedAt)) {
                            time = (waypointsAndMarkers[winI].wp === fpm.getDestination() || wpActive || ident === "(DECEL)") ? stats.get(waypointsAndMarkers[winI].fpIndex).etaFromPpos : waypointsAndMarkers[winI].wp.waypointReachedAt;
                            timeCell = `${FMCMainDisplay.secondsToUTC(time)}[s-text]`;
                        }
                    } else {
                        if (waypointsAndMarkers[winI].wp === fpm.getDestination() || isFinite(waypointsAndMarkers[winI].wp.liveETATo)) {
                            time = (waypointsAndMarkers[winI].wp === fpm.getDestination() || wpActive || ident === "(DECEL)") ? stats.get(waypointsAndMarkers[winI].fpIndex).timeFromPpos : 0;
                            timeCell = `${FMCMainDisplay.secondsTohhmm(time)}[s-text]`;
                        }
                    }
                }

                // Color
                let color = "green";
                if (fpm.isCurrentFlightPlanTemporary()) {
                    color = "yellow";
                } else if (waypointsAndMarkers[winI].wp === fpm.getActiveWaypoint() && waypointsAndMarkers[winI].wp !== fpm.getDestination()) {
                    color = "white";
                }

                // Fix Header
                let fixAnnotation;
                const currentApproach = fpm.getApproach();
                if (winI > 0 &&
                    fpm.getDepartureRunway() &&
                    waypointsAndMarkers[winI - 1].wp &&
                    waypointsAndMarkers[winI - 1].wp === fpm.getOrigin()) {
                    fixAnnotation = `${waypointsAndMarkers[winI - 1].wp.ident.substring(0,3)}${fpm.getDepartureRunway().direction.toFixed(0)}`;
                } else if (fpm.getDepartureProcIndex() !== -1 && fpm.getDepartureWaypoints().some(fix => fix === waypointsAndMarkers[winI].wp)) {
                    const departureName = fpm.getDepartureName();
                    fixAnnotation = departureName ? departureName : undefined;
                } else if (fpm.getArrivalProcIndex() !== -1 && fpm.getArrivalWaypoints().some(fix => fix === waypointsAndMarkers[winI].wp)) {
                    const arrival = fpm.getArrival();
                    fixAnnotation = arrival ? arrival.name : undefined;
                } else if (currentApproach !== undefined && fpm.getApproachWaypoints().some(fix => fix === waypointsAndMarkers[winI].wp)) {
                    const finalLegs = currentApproach.finalLegs;
                    if (finalLegs.length > 0) {
                        const finalLegIdents = finalLegs.map(fl => fl.fixIcao.substring(7, 12).trim());
                        const validFinalWaypoints = fpm.getApproachWaypoints().filter(wp => finalLegIdents.includes(wp.ident));
                        if (validFinalWaypoints.length > 0) {
                            if (validFinalWaypoints[0] === waypointsAndMarkers[winI].wp) {
                                fixAnnotation = Avionics.Utils.formatRunway(currentApproach.name.replace(/\s+/g, ''));
                            } else if (fpm.getArrivalProcIndex() !== -1
                                    && !validFinalWaypoints.some(fix => fix === waypointsAndMarkers[winI].wp)) {
                                const arrival = fpm.getArrival();
                                fixAnnotation = arrival ? arrival.name : undefined;
                            }
                        }
                    }
                } else {
                    // Show airway
                    let airwayName = "";
                    if (wpPrev && waypointsAndMarkers[winI].wp) {
                        let airway = undefined;
                        if (wpPrev.infos.airwayOut && wpPrev.infos.airwayOut === waypointsAndMarkers[winI].wp.infos.airwayIn) {
                            airway = {name: wpPrev.infos.airwayOut };
                        } else if (waypointsAndMarkers[winI].wp.infos.airwayIn && wpPrev.infos.airwayOut === undefined) {
                            airway = {name: waypointsAndMarkers[winI].wp.infos.airwayIn };
                        }
                        if (airway) {
                            airwayName = airway.name;
                        }
                    }
                    fixAnnotation = airwayName;
                }

                if (waypointsAndMarkers[winI].wp.additionalData) {
                    // ARINC Leg Types - R1A 610
                    switch (waypointsAndMarkers[winI].wp.additionalData.legType) {
                        case 2: // CA
                            fixAnnotation = `C${waypointsAndMarkers[winI].wp.additionalData.vectorsHeading.toFixed(0).padStart(3,"0")}\u00b0`;
                            break;
                        case 19: // VA
                            fixAnnotation = `H${waypointsAndMarkers[winI].wp.additionalData.vectorsHeading.toFixed(0).padStart(3,"0")}\u00b0`;
                            break;
                        case 11: // FM
                            const prevWp = waypointsAndMarkers[winI - 1].wp;
                            if (prevWp) {
                                fixAnnotation = `${prevWp.ident.substring(0,3)}${waypointsAndMarkers[winI].wp.additionalData.vectorsCourse.toFixed(0).padStart(3,"0")}`;
                            }
                            break;
                        case 17: // RF
                            fixAnnotation = `${("" + Math.round(waypointsAndMarkers[winI].wp.additionalData.radius)).padStart(2, "0")}\xa0ARC`;
                            break;
                        case 22: // VM
                            fixAnnotation = `H${waypointsAndMarkers[winI].wp.additionalData.vectorsHeading.toFixed(0).padStart(3,"0")}\u00b0`;
                            break;
                    }
                }

                const prevWp = waypointsAndMarkers[winI - 1];
                if (!fixAnnotation && prevWp && prevWp.wp && waypointsAndMarkers[winI].wp.ident !== fpm.getDestination().ident) {
                    const magVar = Facilities.getMagVar(prevWp.wp.infos.coordinates);
                    const courseBetween = Avionics.Utils.computeGreatCircleHeading(prevWp.wp.infos.coordinates, waypointsAndMarkers[winI].wp.infos.coordinates);
                    const course = A32NX_Util.trueToMagnetic(courseBetween, magVar);
                    fixAnnotation = `C${course.toFixed(0).padStart(3,"0")}\u00b0`;
                }

                // Bearing/Track
                let bearingTrack = "";
                if (waypointsAndMarkers[winI] &&
                    waypointsAndMarkers[winI].wp &&
                    waypointsAndMarkers[winI - 1] &&
                    waypointsAndMarkers[winI - 1].wp) {
                    const magVar = Facilities.getMagVar(waypointsAndMarkers[winI - 1].wp.infos.coordinates);
                    if (fpm.getActiveWaypoint() === waypointsAndMarkers[winI].wp && rowI === 1) {
                        const br = fpm.getBearingToActiveWaypoint();
                        const bearing = A32NX_Util.trueToMagnetic(br, magVar);
                        bearingTrack = `BRG${bearing.toFixed(0).toString().padStart(3,"0")}\u00b0`;
                    } else if (rowI === 2) {
                        const tr = Avionics.Utils.computeGreatCircleHeading(waypointsAndMarkers[winI - 1].wp.infos.coordinates, waypointsAndMarkers[winI].wp.infos.coordinates);
                        const track = A32NX_Util.trueToMagnetic(tr, magVar);
                        bearingTrack = `{${fpm.isCurrentFlightPlanTemporary() ? "yellow" : "green"}}TRK${track.toFixed(0).padStart(3,"0")}\u00b0{end}`;
                    }
                }
                // Distance
                let distance = "";

                // Active waypoint is live distance, others are distances in the flight plan
                // TODO FIXME: actually use the correct prediction
                if (waypointsAndMarkers[winI].wp !== fpm.getDestination()) {
                    if (waypointsAndMarkers[winI].wp === fpm.getActiveWaypoint()) {
                        distance = stats.get(waypointsAndMarkers[winI].fpIndex).distanceFromPpos.toFixed(0);
                    } else {
                        distance = stats.get(waypointsAndMarkers[winI].fpIndex).distanceInFP.toFixed(0);
                    }
                    if (distance > 9999) {
                        distance = 9999;
                    }
                    distance = distance.toString();
                }

                let speedConstraint = "---";
                if (waypointsAndMarkers[winI].wp.speedConstraint > 10 && ident !== "MANUAL") {
                    speedConstraint = `{magenta}*{end}${waypointsAndMarkers[winI].wp.speedConstraint.toFixed(0)}`;
                }

                let altColor = color;
                let spdColor = color;
                let timeColor = color;

                // Altitude
                let altitudeConstraint = "-----";
                let altPrefix = "\xa0";
                if (waypointsAndMarkers[winI].wp === fpm.getDestination()) {
                    // Only for destination waypoint, show runway elevation.
                    altColor = "white";
                    spdColor = "white";
                    const [rwTxt, rwAlt] = getRunwayInfo(fpm.getApproachRunway());
                    if (rwTxt && rwAlt) {
                        altPrefix = "{magenta}*{end}";
                        ident += rwTxt;
                        altitudeConstraint = (Math.round((parseInt(rwAlt) + 50) / 10) * 10).toString();
                        altColor = color;
                    }
                    altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");

                } else if (waypointsAndMarkers[winI].wp === fpm.getOrigin()) {
                    const [rwTxt, rwAlt] = getRunwayInfo(fpm.getDepartureRunway());
                    if (rwTxt && rwAlt) {
                        ident += rwTxt;
                        altitudeConstraint = rwAlt;
                        altColor = color;
                    }
                    altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                } else if (ident !== "MANUAL") {
                    const firstRouteIndex = 1 + fpm.getDepartureWaypointsCount();
                    const lastRouteIndex = fpm.getLastIndexBeforeApproach();
                    //const departureWp = firstRouteIndex > 1 && fpm.getDepartureWaypoints().indexOf(waypointsAndMarkers[winI].wp) !== -1;

                    if (mcdu.transitionAltitude >= 100 && waypointsAndMarkers[winI].wp.legAltitude1 > mcdu.transitionAltitude) {
                        altitudeConstraint = (waypointsAndMarkers[winI].wp.legAltitude1 / 100).toFixed(0).toString();
                        altitudeConstraint = `FL${altitudeConstraint.padStart(3,"0")}`;
                    } else {
                        altitudeConstraint = waypointsAndMarkers[winI].wp.legAltitude1.toFixed(0).toString().padStart(5,"\xa0");
                    }

                    if (waypointsAndMarkers[winI].wp.legAltitudeDescription !== 0 && ident !== "(DECEL)") {
                        altPrefix = "{magenta}*{end}";
                        if (waypointsAndMarkers[winI].wp.legAltitudeDescription === 4) {
                            altitudeConstraint = ((waypointsAndMarkers[winI].wp.legAltitude1 + waypointsAndMarkers[winI].wp.legAltitude2) * 0.5).toFixed(0).toString();
                            altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                        }
                        // TODO FIXME: remove this and replace with proper altitude constraint implementation
                        // Predict altitude for STAR when constraints are missing
                        /*
                    } else if (departureWp) {
                        altitudeConstraint = Math.floor(waypointsAndMarkers[winI].wp.cumulativeDistanceInFP * 0.14 * 6076.118 / 10).toString();
                        altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                        // Waypoint is the first or the last of the actual route
                        */
                    } else if ((waypointsAndMarkers[winI].fpIndex === firstRouteIndex - 1) || (waypointsAndMarkers[winI].fpIndex === lastRouteIndex + 1)) {
                        if (Object.is(NaN, mcdu.cruiseFlightLevel)) {
                            altitudeConstraint = "-----";
                        } else {
                            altitudeConstraint = `FL${mcdu.cruiseFlightLevel.toString().padStart(3,"0")}`;
                        }

                    // Waypoint is in between on the route
                    } else if (waypointsAndMarkers[winI].fpIndex <= lastRouteIndex && waypointsAndMarkers[winI].fpIndex >= firstRouteIndex) {
                        if (Object.is(NaN, mcdu.cruiseFlightLevel)) {
                            altitudeConstraint = "-----";
                        } else {
                            altitudeConstraint = `FL${mcdu.cruiseFlightLevel.toString().padStart(3,"0")}`;
                        }
                    // Waypoint with no alt constraint
                    } else if (!waypointsAndMarkers[winI].wp.legAltitude1 && !waypointsAndMarkers[winI].wp.legAltitudeDescription) {
                        altitudeConstraint = "-----";
                    }
                }

                if (speedConstraint === "---") {
                    spdColor = "white";
                }

                if (altitudeConstraint === "-----") {
                    altColor = "white";
                }

                if (waypointsAndMarkers[winI].wp === fpm.getDestination()) {
                    timeColor = color;
                } else {
                    timeColor = "white";
                }

                scrollWindow[rowI] = {
                    fpIndex: waypointsAndMarkers[winI].fpIndex,
                    active: wpActive,
                    ident: ident,
                    color: color,
                    distance: distance,
                    spdColor: spdColor,
                    speedConstraint: speedConstraint,
                    altColor: altColor,
                    altitudeConstraint: { alt: altitudeConstraint, altPrefix: altPrefix },
                    timeCell: timeCell,
                    timeColor: timeColor,
                    fixAnnotation: fixAnnotation,
                    bearingTrack: bearingTrack,
                    isOverfly: isOverfly,
                };

                if (waypointsAndMarkers[winI].wp !== fpm.getDestination()) {
                    addLskAt(rowI, (value) => {
                        if (value === "") {
                            if (waypointsAndMarkers[winI].wp) {
                                return mcdu.getDelaySwitchPage();
                            }
                        }
                        return mcdu.getDelayBasic();
                    },
                    (value) => {
                        if (value === "") {
                            if (waypointsAndMarkers[winI].wp) {
                                CDULateralRevisionPage.ShowPage(mcdu, waypointsAndMarkers[winI].wp, waypointsAndMarkers[winI].fpIndex);
                            }
                        } else if (value === FMCMainDisplay.clrValue) {
                            mcdu.removeWaypoint(waypointsAndMarkers[winI].fpIndex, () => {
                                CDUFlightPlanPage.ShowPage(mcdu, offset);
                            }, !fpm.isCurrentFlightPlanTemporary());
                        } else if (value === FMCMainDisplay.ovfyValue) {
                            if (waypointsAndMarkers[winI].wp) {
                                if (waypointsAndMarkers[winI].wp.additionalData.overfly) {
                                    mcdu.removeWaypointOverfly(waypointsAndMarkers[winI].fpIndex, () => {
                                        CDUFlightPlanPage.ShowPage(mcdu, offset);
                                    }, !fpm.isCurrentFlightPlanTemporary());
                                } else {
                                    mcdu.addWaypointOverfly(waypointsAndMarkers[winI].fpIndex, () => {
                                        CDUFlightPlanPage.ShowPage(mcdu, offset);
                                    }, !fpm.isCurrentFlightPlanTemporary());
                                }
                            }
                        } else if (value.length > 0) {
                            mcdu.insertWaypoint(value, waypointsAndMarkers[winI].fpIndex, () => {
                                CDUFlightPlanPage.ShowPage(mcdu, offset);
                            }, !fpm.isCurrentFlightPlanTemporary());
                        }
                    });
                } else {
                    addLskAt(rowI, () => mcdu.getDelaySwitchPage(),
                        (value) => {
                            if (value === "") {
                                CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), waypointsAndMarkers[winI].fpIndex);
                            } else if (value.length > 0) {
                                mcdu.insertWaypoint(value, waypointsAndMarkers[winI].fpIndex, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            }
                        });
                }

                addRskAt(rowI, () => mcdu.getDelaySwitchPage(),
                    async (_value) => {
                        if (waypointsAndMarkers[winI].wp) {
                            CDUVerticalRevisionPage.ShowPage(mcdu, waypointsAndMarkers[winI].wp);
                        }
                    });

            } else if (waypointsAndMarkers[winI].marker) {

                // Marker
                scrollWindow[rowI] = waypointsAndMarkers[winI];
                addLskAt(rowI, 0, (value) => {
                    if (value === FMCMainDisplay.clrValue) {
                        mcdu.clearDiscontinuity(waypointsAndMarkers[winI].fpIndex, () => {
                            CDUFlightPlanPage.ShowPage(mcdu, offset);
                        }, !fpm.isCurrentFlightPlanTemporary());
                        return;
                    }

                    mcdu.insertWaypoint(value, waypointsAndMarkers[winI].fpIndex + 1, () => {
                        CDUFlightPlanPage.ShowPage(mcdu, offset);
                    }, !fpm.isCurrentFlightPlanTemporary());
                });
            }
        }

        // Pass current waypoint data to ND
        if (scrollWindow[1]) {
            mcdu.currentFlightPlanWaypointIndex = scrollWindow[1].fpIndex;
            SimVar.SetSimVarValue("L:A32NX_SELECTED_WAYPOINT", "number", scrollWindow[1].fpIndex);
        } else if (scrollWindow[0]) {
            mcdu.currentFlightPlanWaypointIndex = scrollWindow[0].fpIndex;
            SimVar.SetSimVarValue("L:A32NX_SELECTED_WAYPOINT", "number", scrollWindow[0].fpIndex);
        } else {
            mcdu.currentFlightPlanWaypointIndex = first + offset;
            SimVar.SetSimVarValue("L:A32NX_SELECTED_WAYPOINT", "number", first + offset);
        }

        // Render scrolling data to text >> add ditto marks

        let nmCount = 0;
        const scrollText = [];
        for (let rowI = 0; rowI < scrollWindow.length; rowI++) {
            const currRow = scrollWindow[rowI];
            let spdRepeat = false;
            let altRepeat = false;

            if (rowI > 0 && currRow && !currRow.marker) {
                let dstnc = currRow.distance;
                if (nmCount === 0 && currRow.distance) {
                    dstnc += "NM";
                    nmCount++;
                } else {
                    dstnc += "\xa0\xa0";
                }
                for (let z = 0; z < 9 - dstnc.length; z++) {
                    dstnc += "\xa0";
                }
                dstnc = `${dstnc}[color]${currRow.color}`;
                currRow.distance = dstnc;
            }

            const prevRow = scrollWindow[rowI - 1];
            if (currRow && !currRow.marker && prevRow) {
                if (!prevRow.marker) {
                    if (currRow.speedConstraint !== "---" && currRow.speedConstraint === prevRow.speedConstraint) {
                        spdRepeat = true;
                    }

                    if (currRow.altitudeConstraint.alt !== "-----" &&
                        currRow.altitudeConstraint.alt === prevRow.altitudeConstraint.alt &&
                        currRow.altitudeConstraint.altPrefix === prevRow.altitudeConstraint.altPrefix) {
                        altRepeat = true;
                    }
                } else if (prevRow.marker) {
                    if (currRow.distance.includes("NM")) {
                        nmCount--;
                    };
                    currRow.distance = "";
                    // TODO: investigate if this line should be removed to show fix annotation on first waypoint?
                    currRow.fixAnnotation = "";
                }
            }

            if (!currRow.marker) {
                scrollText[(rowI * 2) - 1] = renderFixHeader(currRow);
                scrollText[(rowI * 2)] = renderFixContent(currRow, spdRepeat, altRepeat);
            } else {
                scrollText[(rowI * 2) - 1] = [];
                scrollText[(rowI * 2)] = currRow.marker;
            }
        }

        // Destination (R6)

        const destText = [];
        if (fpm.isCurrentFlightPlanTemporary()) {
            destText[0] = [" ", " "];
            destText[1] = ["{ERASE[color]amber", "INSERT*[color]amber"];

            showTMPY = true;

            addLskAt(5, 0, async () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            });
            addRskAt(5, 0, async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            });
        } else {
            let destCell = "----";
            let approachRunway = null;
            if (fpm.getDestination()) {
                destCell = fpm.getDestination().ident;
                approachRunway = fpm.getApproachRunway();
                if (approachRunway) {
                    destCell += Avionics.Utils.formatRunway(approachRunway.designation);
                }
            }
            let destTimeCell = "----";
            let destDistCell = "---";
            let destEFOBCell = "---";

            if (fpm.getDestination()) {
                const destStats = stats.get(fpm.getCurrentFlightPlan().waypoints.length - 1);
                destDistCell = destStats.distanceFromPpos.toFixed(0);
                destEFOBCell = (NXUnits.kgToUser(mcdu.getDestEFOB(isFlying))).toFixed(1);
                if (isFlying) {
                    destTimeCell = FMCMainDisplay.secondsToUTC(destStats.etaFromPpos);
                } else {
                    destTimeCell = FMCMainDisplay.secondsTohhmm(destStats.timeFromPpos);
                }
            }
            if (!CDUInitPage.fuelPredConditionsMet(mcdu)) {
                destEFOBCell = "---";
            }

            destText[0] = ["\xa0DEST", "DIST EFOB", isFlying ? "UTC{sp}" : "TIME{sp}{sp}"];
            destText[1] = [destCell, `${destDistCell} ${destEFOBCell}`, `${destTimeCell}{sp}{sp}`];

            addLskAt(5, () => mcdu.getDelaySwitchPage(),
                () => {
                    CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), fpm.getWaypointsCount() - 1);
                });
        }

        // scrollText pad to 9 rows
        while (scrollText.length < 9) {
            scrollText.push([""]);
        }
        mcdu.setTemplate([
            [`{left}{small}{sp}${showFrom ? "FROM" : "{sp}{sp}{sp}{sp}"}{end}{yellow}{sp}${showTMPY ? "TMPY" : ""}{end}{end}{right}{small}${SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")}{sp}{sp}{sp}{end}{end}`],
            ["", "SPD/ALT\xa0\xa0\xa0", isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}"],
            ...scrollText,
            ...destText
        ]);

        const allowScroll = waypointsAndMarkers.length > 4;
        if (allowScroll) {//scroll only if there are more than 5 points
            mcdu.onDown = () => {//on page down decrement the page offset.
                if (offset > 0) { // if page not on top
                    offset--;
                } else { // else go to the bottom
                    offset = waypointsAndMarkers.length - 1;
                }
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            };
            mcdu.onUp = () => {
                if (offset < waypointsAndMarkers.length - 1) { // if page not on bottom
                    offset++;
                } else { // else go on top
                    offset = 0;
                }
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            };
        }
        mcdu.setArrows(allowScroll, allowScroll, true, true);
    }
}

CDUFlightPlanPage._timer = 0;

function renderFixTableHeader(isFlying) {
    return [
        `{sp}\xa0FROM`,
        "SPD/ALT\xa0\xa0\xa0",
        isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}"
    ];
}

function renderFixHeader(rowObj) {
    return [
        `{sp}${(rowObj.fixAnnotation) ? rowObj.fixAnnotation : ""}`,
        rowObj.distance,
        rowObj.bearingTrack,
    ];
}

function renderFixContent(rowObj, spdRepeat = false, altRepeat = false) {

    return [
        `${rowObj.ident}${rowObj.isOverfly ? FMCMainDisplay.ovfyValue : ""}[color]${rowObj.color}`,
        `{${rowObj.spdColor}}${spdRepeat ? "\xa0\"\xa0" : rowObj.speedConstraint}{end}{${rowObj.altColor}}/${altRepeat ? "\xa0\xa0\xa0\"\xa0\xa0" : rowObj.altitudeConstraint.altPrefix + rowObj.altitudeConstraint.alt}{end}[s-text]`,
        `${rowObj.timeCell}{sp}{sp}[color]${rowObj.timeColor}`
    ];
}

function emptyFplnPage() {
    return [
        ["", "SPD/ALT", "TIME{sp}{sp}"],
        ["PPOS[color]green", "---/ -----", "----{sp}{sp}"],
        [""],
        ["---F-PLN DISCONTINUITY---"],
        [""],
        ["------END OF F-PLN-------"],
        [""],
        ["-----NO ALTN F-PLN-------"],
        [""],
        [""],
        ["\xa0DEST", "DIST EFOB", "TIME{sp}{sp}"],
        ["------", "---- ----", "----{sp}{sp}"]
    ];
}
