class CDUAvailableArrivalsPage {
    static ShowPage(mcdu, airport, pageCurrent = 0, starSelection = false, selectedStarIndex = -1) {
        const airportInfo = airport.infos;
        if (airportInfo instanceof AirportInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.AvailableArrivalsPage;
            console.log(airport);
            let selectedApproachCell = "---";
            let selectedViasCell = "NONE";
            let selectedTransitionCell = "NONE";
            const selectedApproach = mcdu.flightPlanManager.getApproach();
            console.log(selectedApproach);
            if (selectedApproach) {
                selectedApproachCell = Avionics.Utils.formatRunway(selectedApproach.name);
                const selectedApproachTransition = selectedApproach.transitions[mcdu.flightPlanManager.getApproachTransitionIndex()];
                if (selectedApproachTransition) {
                    selectedViasCell = selectedApproachTransition.waypoints[0].infos.icao.substr(7);
                }
            }
            let selectedStarCell = "------";
            let selectedArrival = airportInfo.arrivals[mcdu.flightPlanManager.getArrivalProcIndex()];
            if (!selectedArrival) {
                selectedArrival = airportInfo.arrivals[selectedStarIndex];
            }
            if (selectedArrival) {
                selectedStarCell = selectedArrival.name;
                const selectedTransition = selectedArrival.enRouteTransitions[mcdu.flightPlanManager.getArrivalTransitionIndex()];
                if (selectedTransition) {
                    selectedTransitionCell = selectedTransition.name;
                }
            }
            const approaches = airportInfo.approaches;
            const rows = [[""], [""], [""], [""], [""], [""], [""], [""]];
            if (!starSelection) {
                for (let i = 0; i < 3; i++) {
                    const index = i + pageCurrent;
                    const approach = approaches[index];
                    if (approach) {
                        rows[2 * i] = ["{" + Avionics.Utils.formatRunway(approach.name) + "[color]blue"];
                        mcdu.onLeftInput[i + 2] = () => {
                            mcdu.setApproachIndex(index, () => {
                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                            });
                        };
                    }
                }
            } else {
                const matchingArrivals = [];
                if (selectedApproach) {
                    const selectedRunway = selectedApproach.runway;
                    for (let i = 0; i < airportInfo.arrivals.length; i++) {
                        const arrival = airportInfo.arrivals[i];
                        if (arrival.runwayTransitions.length) {
                            for (let j = 0; j < arrival.runwayTransitions.length; j++) {
                                const runwayTransition = arrival.runwayTransitions[j];
                                if (runwayTransition) {
                                    if (runwayTransition.name.indexOf(selectedRunway) != -1) {
                                        matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
                                    }
                                }
                            }
                        } else {
                            //add the arrival even if it isn't runway specific
                            matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
                        }
                    }
                } else {
                    for (let i = 0; i < airportInfo.arrivals.length; i++) {
                        const arrival = airportInfo.arrivals[i];
                        matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
                    }
                }
                for (let i = 0; i < 3; i++) {
                    let index = i + pageCurrent;
                    if (index === 0) {
                        let color = "blue";
                        if (!selectedArrival) {
                            color = "green";
                        }
                        rows[2 * i] = ["{NO STAR[color]" + color];
                        mcdu.onLeftInput[i + 2] = () => {
                            mcdu.setArrivalProcIndex(-1, () => {
                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                            });
                        };
                    } else {
                        index--;
                        if (matchingArrivals[index]) {
                            const star = matchingArrivals[index].arrival;
                            const starIndex = matchingArrivals[index].arrivalIndex;
                            let color = "blue";
                            if (selectedStarIndex === starIndex) {
                                color = "green";
                            }
                            rows[2 * i] = ["{" + star.name + "[color]" + color];
                            mcdu.onLeftInput[i + 2] = () => {
                                mcdu.setArrivalProcIndex(starIndex, () => {
                                    if (mcdu.flightPlanManager.getApproachIndex() > -1) {
                                        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport);
                                    } else {
                                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                                    }
                                });
                            };
                        }
                    }
                }
                rows[0][1] = "NONE}[color]blue";
                mcdu.onRightInput[2] = () => {
                    mcdu.setArrivalIndex(selectedStarIndex, -1, () => {
                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport);
                    });
                };
                for (let i = 0; i < 2; i++) {
                    const index = i + pageCurrent;
                    if (selectedArrival) {
                        const transition = selectedArrival.enRouteTransitions[index];
                        if (transition) {
                            const name = transition.name;
                            rows[2 * (i + 1)][1] = name + "}[color]blue";
                            mcdu.onRightInput[i + 1 + 2] = () => {
                                mcdu.setArrivalIndex(selectedStarIndex, index, () => {
                                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport);
                                });
                            };
                        }
                    }
                }
            }
            let viasPageLabel = "";
            let viasPageLine = "";
            if (starSelection) {
                if (selectedApproach) {
                    viasPageLabel = "APPR";
                    viasPageLine = "<VIAS";
                    mcdu.onLeftInput[1] = () => {
                        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, selectedStarIndex);
                    };
                }
            }
            let bottomLabel = [""];
            let bottomLine = ["<RETURN"];
            if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                bottomLabel = ["TMPY[color]red", "TMPY[color]red"];
                bottomLine = ["*ERASE[color]red", "INSERT*[color]red"];
                mcdu.onLeftInput[5] = async () => {
                    mcdu.eraseTemporaryFlightPlan(() => {
                        CDUFlightPlanPage.ShowPage(mcdu);
                    });
                };
                mcdu.onRightInput[5] = async () => {
                    mcdu.insertTemporaryFlightPlan(() => {
                        CDUFlightPlanPage.ShowPage(mcdu);
                    });
                };
            } else {
                mcdu.onLeftInput[5] = () => {
                    CDUFlightPlanPage.ShowPage(mcdu);
                };
            }
            mcdu.setTemplate([
                ["ARRIVAL TO " + airport.ident + "{ }"],
                ["APPR", "STAR", "VIA"],
                [selectedApproachCell + "[color]green", selectedStarCell + "[color]green", selectedViasCell + "[color]green"],
                [viasPageLabel, "TRANS"],
                [viasPageLine, selectedTransitionCell + "[color]green"],
                [starSelection ? "STAR" : "APPR", starSelection ? "TRANS" : "", "AVAILABLE"],
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                rows[4],
                bottomLabel,
                bottomLine
            ]);
            mcdu.onUp = () => {
                pageCurrent++;
                if (starSelection) {
                    pageCurrent = Math.min(pageCurrent, airportInfo.arrivals.length - 3);
                } else {
                    pageCurrent = Math.min(pageCurrent, airportInfo.approaches.length - 3);
                }
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, starSelection, selectedStarIndex);
            };
            mcdu.onDown = () => {
                pageCurrent--;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, starSelection, selectedStarIndex);
            };
            mcdu.onPrevPage = () => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, !starSelection);
            };
            mcdu.onNextPage = mcdu.onPrevPage;
        }
    }
    static ShowViasPage(mcdu, airport, pageCurrent = 0, selectedStarIndex = -1) {
        const airportInfo = airport.infos;
        if (airportInfo instanceof AirportInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.AvailableArrivalsPageVias;
            let selectedApproachCell = "---";
            let selectedViasCell = "NONE";
            const selectedApproach = mcdu.flightPlanManager.getApproach();
            if (selectedApproach) {
                selectedApproachCell = Avionics.Utils.formatRunway(selectedApproach.name);
                const selectedApproachTransition = selectedApproach.transitions[mcdu.flightPlanManager.getApproachTransitionIndex()];
                if (selectedApproachTransition) {
                    selectedViasCell = selectedApproachTransition.waypoints[0].infos.icao.substr(7);
                }
            }
            let selectedStarCell = "------";
            let selectedArrival = airportInfo.arrivals[mcdu.flightPlanManager.getArrivalProcIndex()];
            if (!selectedArrival) {
                selectedArrival = airportInfo.arrivals[selectedStarIndex];
            }
            if (selectedArrival) {
                selectedStarCell = selectedArrival.name;
            }
            const rows = [[""], [""], [""], [""], [""], [""]];
            for (let i = 0; i < 3; i++) {
                const index = i + pageCurrent;
                if (selectedApproach) {
                    const approachTransition = selectedApproach.transitions[index];
                    if (approachTransition) {
                        const name = approachTransition.waypoints[0].infos.icao.substr(7);
                        let color = "blue";
                        if (index === mcdu.flightPlanManager.getApproachTransitionIndex()) {
                            color = "green";
                        }
                        rows[2 * i + 1][0] = "{" + name + "[color]" + color;
                        mcdu.onLeftInput[i + 2] = () => {
                            mcdu.setApproachTransitionIndex(index, () => {
                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                            });
                        };
                    }
                }
            }
            let bottomLabel = [""];
            let bottomLine = ["<RETURN"];
            if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                bottomLabel = ["TMPY[color]red", "TMPY[color]red"];
                bottomLine = ["*ERASE[color]red", "INSERT*[color]red"];
                mcdu.onLeftInput[5] = async () => {
                    mcdu.eraseTemporaryFlightPlan(() => {
                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                    });
                };
                mcdu.onRightInput[5] = async () => {
                    mcdu.insertTemporaryFlightPlan(() => {
                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                    });
                };
            } else {
                mcdu.onLeftInput[5] = () => {
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                };
            }
            mcdu.setTemplate([
                ["ARRIVAL TO " + airport.ident + "{ }"],
                ["APPR", "STAR", "VIA"],
                [selectedApproachCell + "[color]green", selectedStarCell + "[color]green", selectedViasCell + "[color]green"],
                ["APPR VIAS"],
                ["{NO VIAS[color]blue"],
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                rows[4],
                rows[5],
                bottomLabel,
                bottomLine
            ]);
            mcdu.onLeftInput[1] = () => {
                mcdu.setApproachTransitionIndex(-1, () => {
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true);
                });
            };
            mcdu.onUp = () => {
                pageCurrent++;
                pageCurrent = Math.min(pageCurrent, airportInfo.approaches.length - 3);
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, pageCurrent, selectedStarIndex);
            };
            mcdu.onDown = () => {
                pageCurrent--;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, pageCurrent, selectedStarIndex);
            };
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_AvailableArrivalsPage.js.map