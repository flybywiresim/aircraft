class A320_Neo_CDU_AirwaysFromWaypointPage {
    static ShowPage(mcdu, reviseIndex, pendingAirway, lastIndex) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AirwaysFromWaypointPage;

        const waypoint = mcdu.flightPlanService.activeOrTemporary.legElementAt(reviseIndex);
        const fpIsTmpy = mcdu.flightPlanService.hasTemporary;

        let prevIcao = waypoint.definition.waypoint.databaseId;
        let prevFpIndex = reviseIndex;

        if (!mcdu.flightPlanService.activeOrTemporary.pendingAirways) {
            mcdu.flightPlanService.startAirwayEntry(reviseIndex);
        }

        const rows = [["----"], [""], [""], [""], [""]];
        const subRows = [["VIA", ""], [""], [""], [""], [""]];
        const allRows = lastIndex ? A320_Neo_CDU_AirwaysFromWaypointPage._GetAllRows(mcdu, reviseIndex, lastIndex) : [];
        let rowBottomLine = ["<RETURN"];
        if (fpIsTmpy) {
            rowBottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];

            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.flightPlanService.activeOrTemporary.pendingAirways = undefined;

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
                            const elements = mcdu.flightPlanService.activeOrTemporary.pendingAirways.elements;
                            const tailElement = elements[elements.length - 1];

                            const airway = await this._getAirway(mcdu, prevFpIndex, tailElement ? tailElement.airway : undefined, value).catch(console.error);

                            if (airway) {
                                const result = mcdu.flightPlanService.activeOrTemporary.pendingAirways.thenAirway(airway);

                                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, airway, result ? 1 : -1);
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
                        if (value.length > 0) {
                            mcdu.getOrSelectWaypointByIdent(value, /** @param wp {import('msfs-navdata').Waypoint|undefined} */ (wp) => {
                                if (wp) {
                                    const result = mcdu.flightPlanService.activeOrTemporary.pendingAirways.thenTo(wp);

                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, undefined, result ? 1 : -1);
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
                            if (value.length > 0) {
                                const elements = mcdu.flightPlanService.activeOrTemporary.pendingAirways.elements;
                                const tailElement = elements[elements.length - 1];

                                const airway = await this._getAirway(mcdu, prevFpIndex, tailElement ? tailElement.airway : undefined, value).catch(console.error);

                                if (airway) {
                                    const result = mcdu.flightPlanService.activeOrTemporary.pendingAirways.thenAirway(airway);

                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, reviseIndex, airway, lastIndex, result ? 1 : -1);
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

    static _GetAllRows(mcdu) {
        const allRows = [];
        const elements = mcdu.flightPlanService.activeOrTemporary.pendingAirways.elements;

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
     *
     * @returns {Promise<import('msfs-navdata').Airway>}
     */
    static async _getAirway(mcdu, fromFpIndex, lastAirway, value) {
        const lastWaypoint = mcdu.flightPlanService.activeOrTemporary.legElementAt(fromFpIndex);

        const airways = await mcdu.navigationDatabase.searchAirway(value);

        let matchingAirway = airways.find((it) => it.fixes.some((fix) => fix.ident === lastWaypoint.ident));
        if (!matchingAirway && lastAirway) {
            matchingAirway = airways.find((it) => it.fixes.some((fix) => lastAirway.fixes.some((lastFix) => lastFix.databaseId === fix.databaseId)));
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
        const prevIcaos = prevAirway.fixes.map((it) => it.databaseId);

        const prevAirwayStartIndex = prevIcaos.findIndex(icao => icao === prevAirwayFromIcao);

        if (prevAirwayStartIndex < 0) {
            throw new Error(`Cannot find waypoint ${icao} in airway ${prevAirway.ident}`);
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
        const airways = await mcdu.navigationDatabase.searchAirway(value);
        const matchingAirway = airways.find((it) => it.fixes.some((fix) => fix.databaseId === icao));

        return matchingAirway;
    }
}
