class A320_Neo_CDU_AirwaysFromWaypointPage {
    static ShowPage(mcdu, reviseIndex, pendingAirway, lastIndex) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AirwaysFromWaypointPage;

        const waypoint = mcdu.flightPlanManager.getWaypoint(reviseIndex);
        const fpIsTmpy = mcdu.flightPlanManager.getCurrentFlightPlanIndex() === FlightPlans.Temporary;
        let prevIcao = waypoint.infos.icao;
        let prevFpIndex = reviseIndex;

        const rows = [["----"], [""], [""], [""], [""]];
        const subRows = [["VIA", ""], [""], [""], [""], [""]];
        const allRows = lastIndex ? A320_Neo_CDU_AirwaysFromWaypointPage._GetAllRows(mcdu, reviseIndex, lastIndex) : [];
        let rowBottomLine = ["<RETURN"];
        if (fpIsTmpy) {
            rowBottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];
            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.copyAirwaySelections();
                    mcdu.updateConstraints();
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            };
        }
        mcdu.onLeftInput[5] = async () => {
            mcdu.eraseTemporaryFlightPlan(() => {
                CDUFlightPlanPage.ShowPage(mcdu, 0);
            });
        };
        let showInput = false;
        for (let i = 0; i < rows.length; i++) {
            if (allRows[i]) {
                const [airwayIdent, termIdent, fromIcao, fromIndex] = allRows[i];
                rows[i] = [airwayIdent, termIdent];
                subRows[i] = ["\xa0VIA", "TO\xa0"];
                prevIcao = fromIcao;
                prevFpIndex = fromIndex;
            } else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    subRows[i] = ["\xa0VIA", ""];
                    rows[i] = ["[\xa0\xa0\xa0][color]cyan", ""];
                    mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
                        if (value.length > 0) {
                            mcdu.ensureCurrentFlightPlanIsTemporary(async () => {
                                const airway = await this._getAirway(mcdu, prevFpIndex, value).catch(console.error);
                                if (airway) {
                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, airway, lastIndex);
                                } else {
                                    mcdu.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
                                    scratchpadCallback();
                                }
                            });
                        }
                    };
                } else if (pendingAirway) {
                    subRows[i] = ["\xa0VIA", "TO\xa0"];
                    rows[i] = [`${pendingAirway.name}[color]cyan`, "[\xa0\xa0\xa0][color]cyan"];
                    mcdu.onRightInput[i] = (value, scratchpadCallback) => {
                        if (value.length > 0) {
                            mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                                mcdu.insertWaypointsAlongAirway(value, prevFpIndex + 1, pendingAirway.name).then((result) => {
                                    if (result >= 0) {
                                        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, undefined, result);
                                    } else {
                                        mcdu.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
                                        scratchpadCallback();
                                    }
                                }).catch(console.error);
                            });
                        }
                    };
                    if (i + 1 < rows.length) {
                        rows[i + 1] = ["[\xa0\xa0\xa0][color]cyan", ""];
                        subRows[i + 1] = ["\xa0VIA", ""];
                        mcdu.onLeftInput[i + 1] = async (value, scratchpadCallback) => {
                            if (value.length > 0) {
                                const toWp = await this._getFirstIntersection(mcdu, pendingAirway, prevIcao, value).catch(console.error);
                                if (toWp) {
                                    mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                                        mcdu.insertWaypointsAlongAirway(toWp, prevFpIndex + 1, pendingAirway.name, true).then(async (result) => {
                                            if (result >= 0) {
                                                const airway = await this._getAirway(mcdu, result, value).catch(console.error);
                                                if (airway) {
                                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, airway, result);
                                                } else {
                                                    mcdu.setScratchpadMessage(NXSystemMessages.noIntersectionFound);
                                                    scratchpadCallback();
                                                }
                                            } else {
                                                mcdu.setScratchpadMessage(NXSystemMessages.noIntersectionFound);
                                                scratchpadCallback();
                                            }
                                        }).catch(console.error);
                                    });
                                } else {
                                    mcdu.setScratchpadMessage(NXSystemMessages.noIntersectionFound);
                                    scratchpadCallback();
                                }
                            } else {
                                mcdu.setScratchpadMessage(NXSystemMessages.noIntersectionFound);
                                scratchpadCallback();
                            }
                        };
                    }
                }
            }
        }
        mcdu.setTemplate([
            ["AIRWAYS {small}FROM {end}{green}" + waypoint.ident + "{end}"],
            subRows[0],
            rows[0],
            subRows[1],
            rows[1],
            subRows[2],
            rows[2],
            subRows[3],
            rows[3],
            subRows[4],
            rows[4],
            [""],
            rowBottomLine
        ]);
    }
    static _GetAllRows(mcdu, reviseIndex, lastIndex) {
        const allRows = [];
        for (let i = reviseIndex + 1; i <= lastIndex; i++) {
            const wp = mcdu.flightPlanManager.getWaypoint(i);
            if (wp) {
                if (wp.infos.airwayIn !== wp.infos.airwayOut) {
                    allRows.push([`{cyan}${wp.infos.airwayIn}{end}`, `{cyan}${wp.additionalData.smartAirway ? '{small}' : '{big}'}${wp.ident}{end}{end}`, wp.infos.icao, i]);
                }
            }
        }
        return allRows;
    }

    static async _getAirway(mcdu, fromFpIndex, value) {
        const lastWaypoint = mcdu.flightPlanManager.getWaypoint(fromFpIndex);
        await lastWaypoint.infos.UpdateAirway(value).catch(console.error);
        if (lastWaypoint.infos instanceof IntersectionInfo || lastWaypoint.infos instanceof VORInfo || lastWaypoint.infos instanceof NDBInfo) {
            return lastWaypoint.infos.airways.find(a => {
                return a.name === value;
            });
        }
    }

    /**
     * Distance is measured in number of fixes, not a real distance unit.
     * Searching around current fixes index.
     */
    static async _getFirstIntersection(mcdu, prevAirway, prevAirwayFromIcao, nextAirwayIdent) {
        const prevIcaos = prevAirway.icaos;

        const prevAirwayStartIndex = prevIcaos.findIndex(icao => icao === prevAirwayFromIcao);
        if (prevAirwayStartIndex < 0) {
            throw new Error(`Cannot find waypoint ${icao} in airway ${prevAirway.name}`);
        }

        for (let i = 0; i < prevIcaos.length; i++) {
            if ((prevAirwayStartIndex + i) < prevIcaos.length) {
                const res = await this._getRoute(mcdu, nextAirwayIdent, prevIcaos[prevAirwayStartIndex + i]).catch(console.error);
                if (res) {
                    return prevIcaos[prevAirwayStartIndex + i].substring(4).trim();
                }
            }
            if ((prevAirwayStartIndex - i) >= 0) {
                const res = await this._getRoute(mcdu, nextAirwayIdent, prevIcaos[prevAirwayStartIndex - i]).catch(console.error);
                if (res) {
                    return prevIcaos[prevAirwayStartIndex - i].substring(4).trim();
                }
            }
        }
    }

    static async _getRoute(mcdu, value, icao) {
        return (await mcdu.facilityLoader.getIntersectionData(icao)).routes.find(a => {
            return a.name === value;
        });
    }
}
