// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class A320_Neo_CDU_AirwaysFromWaypointPage {
    static ShowPage(mcdu, reviseIndex, pendingAirway, lastIndex, forPlan, inAlternate) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AirwaysFromWaypointPage;

        /** @type {FlightPlan} */
        const targetPlan = mcdu.flightPlan(forPlan, inAlternate);
        const waypoint = targetPlan.legElementAt(reviseIndex);

        const fpIsSec = forPlan >= Fmgc.FlightPlanIndex.FirstSecondary;
        const fpIsTmpy = forPlan === Fmgc.FlightPlanIndex.Active && mcdu.flightPlanService.hasTemporary;

        let prevIcao = waypoint.definition.waypoint.databaseId;
        let prevFpIndex = reviseIndex;

        if (!targetPlan.pendingAirways) {
            mcdu.flightPlanService.startAirwayEntry(reviseIndex, forPlan, inAlternate);
        }

        const rows = [["----"], [""], [""], [""], [""]];
        const subRows = [["VIA", ""], [""], [""], [""], [""]];
        const allRows = lastIndex ? A320_Neo_CDU_AirwaysFromWaypointPage._GetAllRows(targetPlan) : [];

        let rowBottomLine = ["<RETURN"];
        mcdu.onLeftInput[5] = () => {
            mcdu.eraseTemporaryFlightPlan(() => {
                CDULateralRevisionPage.ShowPage(mcdu, targetPlan.elementAt(reviseIndex), reviseIndex, forPlan, inAlternate);
            });
        };

        if (fpIsSec && targetPlan.pendingAirways && targetPlan.pendingAirways.elements.length > 0) {
            rowBottomLine = ["<RETURN", "INSERT*[color]cyan"];

            mcdu.onRightInput[5] = async () => {
                targetPlan.pendingAirways.finalize(); // TODO replace with fps call (fms-v2)

                mcdu.updateConstraints();

                CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
            };
        } else if (fpIsTmpy && targetPlan.pendingAirways && targetPlan.pendingAirways.elements.length > 0) {
            rowBottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];

            mcdu.onLeftInput[5] = async () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };

            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    targetPlan.pendingAirways = undefined;

                    mcdu.updateConstraints();

                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };
        }

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
                        const targetPlan = mcdu.flightPlan(forPlan, inAlternate);

                        if (value.length > 0) {
                            const elements = targetPlan.pendingAirways.elements;
                            const tailElement = elements[elements.length - 1];

                            const lastFix = tailElement ? tailElement.to : targetPlan.legElementAt(prevFpIndex).terminationWaypoint();

                            const airway = await this._getAirway(mcdu, prevFpIndex, tailElement ? tailElement.airway : undefined, lastFix, value).catch(console.error);

                            if (airway) {
                                const result = targetPlan.pendingAirways.thenAirway(airway);

                                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, airway, result ? 1 : -1, forPlan, inAlternate);
                            } else {
                                mcdu.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
                                scratchpadCallback();
                            }
                        }
                    };
                } else if (pendingAirway) {
                    subRows[i] = ["\xa0VIA", "TO\xa0"];
                    rows[i] = [`${pendingAirway.ident}[color]cyan`, "[\xa0\xa0\xa0][color]cyan"];

                    mcdu.onRightInput[i] = (value, scratchpadCallback) => {
                        const targetPlan = mcdu.flightPlan(forPlan, inAlternate);

                        if (value.length > 0) {
                            Fmgc.WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false).then(/** @param wp {import('msfs-navdata').Fix | undefined} */ (wp) => {
                                if (wp) {
                                    const result = targetPlan.pendingAirways.thenTo(wp);

                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, undefined, result ? 1 : -1, forPlan, inAlternate);
                                } else {
                                    mcdu.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
                                    scratchpadCallback();
                                }
                            });
                        }
                    };
                    if (i + 1 < rows.length) {
                        rows[i + 1] = ["[\xa0\xa0\xa0][color]cyan", ""];
                        subRows[i + 1] = ["\xa0VIA", ""];

                        mcdu.onLeftInput[i + 1] = async (value, scratchpadCallback) => {
                            const targetPlan = mcdu.flightPlan(forPlan, inAlternate);

                            if (value.length > 0) {
                                const airway = await this._getFirstIntersection(mcdu, pendingAirway, prevIcao, value).catch(console.error);
                                if (airway) {
                                    const result = targetPlan.pendingAirways.thenAirway(airway);

                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, airway, result ? 1 : -1, forPlan, inAlternate);
                                } else {
                                    mcdu.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
                                    scratchpadCallback();
                                }
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

    /**
     * @param plan {FlightPlan}
     */
    static _GetAllRows(plan) {
        const allRows = [];
        const elements = plan.pendingAirways.elements;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];

            if (element.to) {
                allRows.push([`{cyan}${element.airway.ident}{end}`, `{cyan}${element.isAutoConnected ? '{small}' : '{big}'}${element.to.ident}{end}{end}`, element.to.databaseId, i]);
            }
        }

        return allRows;
    }

    /**
     * @param {import('msfs-navdata').Airway} lastAirway
     * @param {import('msfs-navdata').Fix} lastFix
     *
     * @returns {Promise<import('msfs-navdata').Airway>}
     */
    static async _getAirway(mcdu, fromFpIndex, lastAirway, lastFix, value) {
        const airways = await mcdu.navigationDatabase.searchAirway(value, lastFix);

        let matchingAirway = lastFix && airways.find((it) => it.fixes.some((fix) => fix.ident === lastFix.ident));
        if (!matchingAirway && lastAirway) {
            matchingAirway = airways.find((it) => it.fixes.some((fix) => lastAirway.fixes.some((endFix) => endFix.databaseId === fix.databaseId)));
        }

        return matchingAirway;
    }

    /**
     * Distance is measured in number of fixes, not a real distance unit.
     * Searching around current fixes index.
     *
     * @param prevAirway {import('msfs-navdata').Airway}
     */
    static async _getFirstIntersection(mcdu, prevAirway, prevAirwayFromIcao, nextAirwayIdent) {
        const prevAirwayFixes = prevAirway.fixes;

        const prevAirwayStartIndex = prevAirwayFixes.findIndex(fix => fix.databaseId === prevAirwayFromIcao);

        if (prevAirwayStartIndex < 0) {
            throw new Error(`Cannot find waypoint ${icao} in airway ${prevAirway.ident}`);
        }

        for (let i = 0; i < prevAirwayFixes.length; i++) {
            if ((prevAirwayStartIndex + i) < prevAirwayFixes.length) {
                const airway = await this._getRoute(mcdu, nextAirwayIdent, prevAirwayFixes[prevAirwayStartIndex + i]).catch(console.error);

                if (airway) {
                    return airway;
                }
            }
            if ((prevAirwayStartIndex - i) >= 0) {
                const airway = await this._getRoute(mcdu, nextAirwayIdent, prevAirwayFixes[prevAirwayStartIndex - i]).catch(console.error);

                if (airway) {
                    return airway;
                }
            }
        }
    }

    static async _getRoute(mcdu, airwayName, fixOnAirway) {
        const airways = await mcdu.navigationDatabase.searchAirway(airwayName, fixOnAirway);
        const matchingAirway = airways.find((it) => it.fixes.some((fix) => fix.databaseId === fixOnAirway.databaseId));

        return matchingAirway;
    }
}
