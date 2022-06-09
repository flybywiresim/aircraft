const DeparturePagination = Object.freeze(
    {
        DEPT_PAGE: 4,
    }
);

class CDUAvailableDeparturesPage {
    static ShowPage(mcdu, airport, pageCurrent = 0, sidSelection = false) {
        const airportInfo = airport.infos;
        if (airportInfo instanceof AirportInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.AvailableDeparturesPage;
            let selectedRunwayCell = "---";
            let selectedRunwayCellColor = "white";
            /** @type {OneWayRunway} */
            const selectedRunway = mcdu.flightPlanManager.getOriginRunway();
            if (selectedRunway) {
                selectedRunwayCell = Avionics.Utils.formatRunway(selectedRunway.designation);
                selectedRunwayCellColor = mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
            }
            let selectedSidCell = "------";
            let selectedSidCellColor = "white";
            let selectedTransCell = "------";
            let selectedTransCellColor = "white";
            let departureEnRouteTransition;
            const selectedDeparture = airportInfo.departures[mcdu.flightPlanManager.getDepartureProcIndex()];
            if (selectedDeparture) {
                selectedSidCell = selectedDeparture.name;
                selectedSidCellColor = mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                const departureEnRouteTransitionIndex = mcdu.flightPlanManager.getDepartureEnRouteTransitionIndex();
                if (departureEnRouteTransitionIndex > -1) {
                    departureEnRouteTransition = selectedDeparture.enRouteTransitions[departureEnRouteTransitionIndex];
                    if (departureEnRouteTransition) {
                        selectedTransCell = departureEnRouteTransition.name;
                    } else {
                        selectedTransCell = "NONE";
                    }
                    selectedTransCellColor = mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                }
            }
            let insertRow = ["<RETURN"];
            mcdu.onLeftInput[5] = () => {
                CDUFlightPlanPage.ShowPage(mcdu);
            };
            const runways = airportInfo.oneWayRunways;
            const rows = [[""], [""], [""], [""], [""], [""], [""], [""]];
            const selectedSidIndex = mcdu.flightPlanManager.getDepartureProcIndex();
            const selectedEnRouteIndex = mcdu.flightPlanManager.getDepartureEnRouteTransitionIndex();

            if (!sidSelection) {
                for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                    const index = i + pageCurrent * DeparturePagination.DEPT_PAGE;
                    const runway = runways[index];
                    if (runway) {
                        rows[2 * i] = [
                            "{" + Avionics.Utils.formatRunway(runway.designation).padEnd(8) + NXUnits.mToUser(runway.length).toFixed(0).padStart(5) + "{small}" + NXUnits.userDistanceUnit().padEnd(2) + "{end}" + "".padEnd(11) + "[color]cyan"
                        ];
                        rows[2 * i + 1] = ["{sp}{sp}{sp}" + Utils.leadingZeros(Math.round((runway.direction)), 3) + "[color]cyan",];
                        mcdu.onLeftInput[i + 1] = async () => {
                            mcdu.setOriginRunwayIndex(index, () => {
                                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, true);
                            });
                        };
                    }
                }
            } else {

                insertRow = ["{ERASE[color]amber", "INSERT*[color]amber"];
                mcdu.onRightInput[5] = () => {
                    mcdu.insertTemporaryFlightPlan(() => {
                        mcdu.updateConstraints();
                        mcdu.onToRwyChanged();
                        CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu, true, true);
                        CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);
                        CDUFlightPlanPage.ShowPage(mcdu, 0);
                    });
                };

                const lower = pageCurrent * DeparturePagination.DEPT_PAGE;
                const upper = (pageCurrent + 1) * DeparturePagination.DEPT_PAGE;
                let nextDep = 0;
                for (let depI = 0; nextDep < upper && depI < airportInfo.departures.length; depI++) {
                    const sid = airportInfo.departures[depI];
                    let transitionIndex = 0;
                    if (sid) {
                        let sidMatchesSelectedRunway = false;
                        if (selectedRunway) {
                            for (let j = 0; j < sid.runwayTransitions.length; j++) {
                                if (sid.runwayTransitions[j].runwayNumber === selectedRunway.number && sid.runwayTransitions[j].runwayDesignation === selectedRunway.designator) {
                                    sidMatchesSelectedRunway = true;
                                    transitionIndex = j;
                                    break;
                                }
                            }
                        }
                        if (!selectedRunway || sidMatchesSelectedRunway) {
                            if (nextDep >= lower) {
                                rows[2 * (nextDep - lower)] = [`${ selectedSidIndex === depI ? " " : "{"}${sid.name}[color]cyan`];
                                mcdu.onLeftInput[(nextDep - lower) + 1] = async () => {
                                    mcdu.setRunwayIndex(transitionIndex, (success) => {
                                        mcdu.setDepartureIndex(depI, () => {
                                            CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true);
                                        });
                                    });
                                    console.log("transitionalIndex: " + transitionIndex);
                                    console.log("scopout: " + depI);
                                };
                            }
                            ++nextDep;
                        }
                    }
                }
                if (nextDep < upper) {
                    rows[2 * (nextDep - lower)] = ["{NO SID[color]cyan"];
                    mcdu.onLeftInput[(nextDep - lower) + 1] = async () => {
                        mcdu.setDepartureIndex(-1, () => {
                            CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true);
                        });
                    };
                }
                if (selectedDeparture) {
                    for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                        const enRouteTransitionIndex = i + pageCurrent * DeparturePagination.DEPT_PAGE;
                        const enRouteTransition = selectedDeparture.enRouteTransitions[enRouteTransitionIndex];
                        if (enRouteTransition) {
                            rows[2 * i][1] = `${enRouteTransition.name}${selectedEnRouteIndex === enRouteTransitionIndex ? " " : "}"}[color]cyan`;
                            mcdu.onRightInput[i + 1] = () => {
                                mcdu.flightPlanManager.setDepartureEnRouteTransitionIndex(enRouteTransitionIndex, () => {
                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true);
                                }).catch(console.error);
                            };
                        }
                    }
                }
            }
            let up = false;
            let down = false;
            let maxPage = 0;
            if (sidSelection) {
                if (selectedRunway) {
                    for (const departure of airportInfo.departures) {
                        for (const transition of departure.runwayTransitions) {
                            if (transition.runwayNumber === selectedRunway.number && transition.runwayDesignation === selectedRunway.designator) {
                                maxPage++;
                                break;
                            }
                        }
                    }
                    maxPage = Math.ceil(maxPage / DeparturePagination.DEPT_PAGE) - ((maxPage % DeparturePagination.DEPT_PAGE === 0) ? 0 : 1);
                } else {
                    maxPage = Math.ceil(airportInfo.departures.length / DeparturePagination.DEPT_PAGE) - ((airportInfo.departures.length % DeparturePagination.DEPT_PAGE === 0) ? 0 : 1);
                }

                if (selectedDeparture) {
                    maxPage = Math.max(maxPage, Math.ceil(selectedDeparture.enRouteTransitions.length / DeparturePagination.DEPT_PAGE) - ((selectedDeparture.enRouteTransitions.length % DeparturePagination.DEPT_PAGE === 0) ? 0 : 1));
                }
            } else {
                maxPage = Math.ceil(airportInfo.oneWayRunways.length / DeparturePagination.DEPT_PAGE) - 1;
            }
            if (pageCurrent < maxPage) {
                mcdu.onUp = () => {
                    pageCurrent++;
                    if (pageCurrent < 0) {
                        pageCurrent = 0;
                    }
                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, sidSelection);
                };
                up = true;
            }
            if (pageCurrent > 0) {
                mcdu.onDown = () => {
                    pageCurrent--;
                    if (pageCurrent < 0) {
                        pageCurrent = 0;
                    }
                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, sidSelection);
                };
                down = true;
            }
            mcdu.setArrows(up, down, true, true);
            mcdu.setTemplate([
                ["{sp}DEPARTURES {small}FROM{end} {green}" + airport.ident + "{sp}{sp}{sp}"],
                ["{sp}RWY", "TRANS{sp}", "{sp}SID"],
                [selectedRunwayCell + "[color]" + selectedRunwayCellColor, selectedTransCell + "[color]" + selectedTransCellColor, selectedSidCell + "[color]" + selectedSidCellColor],
                sidSelection ? ["SIDS", "TRANS", "AVAILABLE"] : ["", "", "AVAILABLE RUNWAYS{sp}"],
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                rows[4],
                rows[5],
                rows[6],
                rows[7],
                insertRow
            ]);
            mcdu.onPrevPage = () => {
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, !sidSelection);
            };
            mcdu.onNextPage = mcdu.onPrevPage;
        }
    }
}
