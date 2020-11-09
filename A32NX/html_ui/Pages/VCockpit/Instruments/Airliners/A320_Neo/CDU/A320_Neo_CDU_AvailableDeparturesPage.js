class CDUAvailableDeparturesPage {
    static ShowPage(mcdu, airport, pageCurrent = 0, sidSelection = false) {
        const airportInfo = airport.infos;
        console.log(airportInfo);
        if (airportInfo instanceof AirportInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.AvailableDeparturesPage;
            let selectedRunwayCell = "---";
            const selectedRunway = mcdu.flightPlanManager.getDepartureRunway();
            if (selectedRunway) {
                selectedRunwayCell = Avionics.Utils.formatRunway(selectedRunway.designation);
            }
            let selectedSidCell = "------";
            let selectedTransCell = "------";
            let departureEnRouteTransition;
            const selectedDeparture = airportInfo.departures[mcdu.flightPlanManager.getDepartureProcIndex()];
            if (selectedDeparture) {
                selectedSidCell = selectedDeparture.name;
                const departureEnRouteTransitionIndex = mcdu.flightPlanManager.getDepartureEnRouteTransitionIndex();
                if (departureEnRouteTransitionIndex > -1) {
                    departureEnRouteTransition = selectedDeparture.enRouteTransitions[departureEnRouteTransitionIndex];
                    if (departureEnRouteTransition) {
                        selectedTransCell = departureEnRouteTransition.name;
                    }
                }
            }
            let doInsertRunwayOnly = false;
            let insertRow = ["<RETURN"];
            mcdu.onLeftInput[5] = () => {
                CDUFlightPlanPage.ShowPage(mcdu);
            };
            const runways = airportInfo.oneWayRunways;
            const rows = [[""], [""], [""], [""], [""], [""], [""], [""]];
            if (!sidSelection) {
                for (let i = 0; i < 4; i++) {
                    const index = i + pageCurrent;
                    const runway = runways[index];
                    if (runway) {
                        rows[2 * i] = [
                            "{" + Avionics.Utils.formatRunway(runway.designation) + "[color]blue",
                            "CRS" + (runway.direction / 10).toFixed(0) + "0[color]blue",
                            runway.length.toFixed(0) + "M[color]blue"
                        ];
                        mcdu.onLeftInput[i + 1] = async () => {
                            mcdu.setOriginRunwayIndex(index, () => {
                                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, true);
                            });
                        };
                    }
                }
            } else {
                doInsertRunwayOnly = true;
                insertRow = ["<F-PLN[color]yellow", "INSERT*[color]red"];
                mcdu.onRightInput[5] = () => {
                    mcdu.insertTemporaryFlightPlan(() => {
                        CDUFlightPlanPage.ShowPage(mcdu, 0);
                    });
                };
                let rowIndex = -pageCurrent + 1;
                let index = 0;
                rows[0] = ["{NONE[color]blue"];
                mcdu.onLeftInput[rowIndex + 1] = () => {
                    mcdu.setDepartureIndex(-1, () => {
                        CDUAvailableDeparturesPage.ShowPage(mcdu, airport);
                    });
                };
                while (rowIndex < 4 && index < airportInfo.departures.length) {
                    const sid = airportInfo.departures[index];
                    const scopout = index;
                    let transitionIndex = 0;
                    index++;
                    if (sid) {
                        let sidMatchesSelectedRunway = false;
                        if (!selectedRunway) {
                            sidMatchesSelectedRunway = true;
                        } else {
                            for (let j = 0; j < sid.runwayTransitions.length; j++) {
                                if (sid.runwayTransitions[j].name.indexOf(selectedRunway.designation) !== -1) {
                                    sidMatchesSelectedRunway = true;
                                    transitionIndex = j;
                                    break;
                                }
                            }
                        }
                        if (sidMatchesSelectedRunway) {
                            if (rowIndex >= 1) {
                                rows[2 * rowIndex] = ["{" + sid.name + "[color]blue"];
                                mcdu.onLeftInput[rowIndex + 1] = () => {
                                    mcdu.setRunwayIndex(transitionIndex, (success) => {
                                        mcdu.setDepartureIndex(scopout, () => {
                                            CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, true);
                                        });
                                    });
                                };
                            }
                            rowIndex++;
                        }
                    }
                }
                if (selectedDeparture) {
                    for (let i = 0; i < 4; i++) {
                        const enRouteTransitionIndex = i + pageCurrent;
                        const enRouteTransition = selectedDeparture.enRouteTransitions[enRouteTransitionIndex];
                        if (enRouteTransition) {
                            rows[2 * i][1] = enRouteTransition.name + "}[color]blue";
                            mcdu.onRightInput[i + 1] = () => {
                                mcdu.flightPlanManager.setDepartureEnRouteTransitionIndex(enRouteTransitionIndex, () => {
                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, true);
                                });
                            };
                        }
                    }
                }
            }
            mcdu.setTemplate([
                ["DEPARTURES FROM " + airport.ident + " }"],
                ["RWY", "TRANS", "SID"],
                [selectedRunwayCell, selectedTransCell, selectedSidCell],
                ["", "", "AVAILABLE " + (sidSelection ? "SIDS" : "RUNWAYS")],
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                rows[4],
                rows[5],
                rows[6],
                [doInsertRunwayOnly ? "TMPY[color]yellow" : ""],
                insertRow
            ]);
            mcdu.onUp = () => {
                pageCurrent++;
                if (sidSelection) {
                    pageCurrent = Math.min(pageCurrent, airportInfo.departures.length - 3);
                } else {
                    pageCurrent = Math.min(pageCurrent, airportInfo.oneWayRunways.length - 3);
                }
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, sidSelection);
            };
            mcdu.onDown = () => {
                pageCurrent--;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, sidSelection);
            };
            mcdu.onPrevPage = () => {
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, !sidSelection);
            };
            mcdu.onNextPage = mcdu.onPrevPage;
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_AvailableDeparturesPage.js.map