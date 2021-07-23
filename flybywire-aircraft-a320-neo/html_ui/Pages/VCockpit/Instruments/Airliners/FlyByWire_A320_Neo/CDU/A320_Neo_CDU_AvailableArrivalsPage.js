class CDUAvailableArrivalsPage {
    static ShowPage(fmc, mcdu, airport, pageCurrent = 0, starSelection = false, selectedStarIndex = -1) {
        const airportInfo = airport.infos;
        if (airportInfo instanceof AirportInfo) {
            mcdu.setCurrentPage(() => {
                CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, pageCurrent, starSelection, selectedStarIndex);
            });
            console.log(airport);
            let selectedApproachCell = "------";
            let selectedViasCell = "------";
            let selectedTransitionCell = "------";
            let selectedApproachCellColor = "white";
            let selectedViasCellColor = "white";
            let selectedTransitionCellColor = "white";
            const selectedApproach = fmc.flightPlanManager.getApproach();
            console.log(selectedApproach);
            if (selectedApproach && selectedApproach.name) {
                selectedApproachCell = Avionics.Utils.formatRunway(selectedApproach.name);
                selectedApproachCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                const selectedApproachTransition = selectedApproach.transitions[fmc.flightPlanManager.getApproachTransitionIndex()];
                if (selectedApproachTransition) {
                    selectedViasCell = selectedApproachTransition.waypoints[0].infos.icao.substr(7);
                } else {
                    selectedViasCell = "NONE";
                }
                selectedViasCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
            }
            let selectedStarCell = "------";
            let selectedStarCellColor = "white";
            let selectedArrival = airportInfo.arrivals[fmc.flightPlanManager.getArrivalProcIndex()];
            if (!selectedArrival) {
                selectedArrival = airportInfo.arrivals[selectedStarIndex];
            }
            if (selectedArrival) {
                selectedStarCell = selectedArrival.name;
                selectedStarCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                const selectedTransition = selectedArrival.enRouteTransitions[fmc.flightPlanManager.getArrivalTransitionIndex()];
                if (selectedTransition) {
                    selectedTransitionCell = selectedTransition.name;
                    selectedTransitionCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                }
            }
            const approaches = airportInfo.approaches;
            // Add an index member variable so we can track the original order of approaches
            for (let j = 0; j < approaches.length; j++) {
                approaches[j].index = j;
            }
            // Sort the approaches in Honeywell's documented order
            const approachTypeOrder = {"MLS":0, "ILS":1, "GLS":2, "IGS":3, "LOC":4, "BLOC":5, "LDA":6, "SDF": 7, "GPS": 8, "RNAV":9, "VORDME":10, "NDB":11};
            const sortedApproaches = approaches.slice().sort((a, b) => approachTypeOrder[a.name.split(" ")[0]] - approachTypeOrder[b.name.split(" ")[0]]);
            const rows = [[""], [""], [""], [""], [""], [""], [""], [""]];
            if (!starSelection) {
                for (let i = 0; i < 3; i++) {
                    const index = i + pageCurrent;
                    const approach = sortedApproaches[index];
                    if (approach) {
                        const runways = airportInfo.oneWayRunways;
                        const approachRunwayName = Avionics.Utils.formatRunway(approach.name.split(" ")[1]);
                        let runwayLength = 0;
                        let runwayCourse = 0;
                        for (const runway of runways) {
                            const runwayName = Avionics.Utils.formatRunway(runway.designation);
                            if (runwayName.match("^" + approachRunwayName + "C?$")) {
                                runwayLength = runway.length.toFixed(0);
                                runwayCourse = Utils.leadingZeros(Math.round((runway.direction)), 3);
                            }
                        }
                        rows[2 * i] = ["{" + Avionics.Utils.formatRunway(approach.name.replace(/\s+/g, '')) + "[color]cyan", "", "{sp}{sp}{sp}{sp}" + runwayLength + "{small}M{end}[color]cyan"];
                        rows[2 * i + 1] = ["{sp}{sp}{sp}{sp}" + runwayCourse + "[color]cyan"];
                        mcdu.onLeftInput[i + 2] = () => {
                            fmc.setApproachIndex(approach.index, () => {
                                CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                                mcdu.requestOffsideUpdate();
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
                                    // Check if selectedRunway matches a transition on the approach (and also checks for Center runways)
                                    if (runwayTransition.name.match("^RW" + selectedRunway + "C?$")) {
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
                        let color = "cyan";
                        if (!selectedArrival) {
                            color = "green";
                        }
                        rows[2 * i] = ["{NO STAR[color]" + color];
                        mcdu.onLeftInput[i + 2] = () => {
                            fmc.setArrivalProcIndex(-1, () => {
                                CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                                mcdu.requestOffsideUpdate();
                            });
                        };
                    } else {
                        index--;
                        if (matchingArrivals[index]) {
                            const star = matchingArrivals[index].arrival;
                            const starIndex = matchingArrivals[index].arrivalIndex;
                            let color = "cyan";
                            if (selectedStarIndex === starIndex) {
                                color = "green";
                            }
                            rows[2 * i] = ["{" + star.name + "[color]" + color];
                            mcdu.onLeftInput[i + 2] = () => {
                                fmc.setArrivalProcIndex(starIndex, () => {
                                    if (fmc.flightPlanManager.getApproachIndex() > -1) {
                                        CDUAvailableArrivalsPage.ShowViasPage(fmc, mcdu, airport);
                                    } else {
                                        CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                                    }
                                    mcdu.requestOffsideUpdate();
                                });
                            };
                        }
                    }
                }
                rows[0][1] = "NONE}[color]cyan";
                mcdu.onRightInput[2] = () => {
                    fmc.setArrivalIndex(selectedStarIndex, -1, () => {
                        CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport);
                        mcdu.requestOffsideUpdate();
                    });
                };
                for (let i = 0; i < 2; i++) {
                    const index = i + pageCurrent;
                    if (selectedArrival) {
                        const transition = selectedArrival.enRouteTransitions[index];
                        if (transition) {
                            const name = transition.name;
                            rows[2 * (i + 1)][1] = name + "}[color]cyan";
                            mcdu.onRightInput[i + 1 + 2] = () => {
                                fmc.setArrivalIndex(selectedStarIndex, index, () => {
                                    CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport);
                                    mcdu.requestOffsideUpdate();
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
                    viasPageLabel = "{sp}APPR";
                    viasPageLine = "<VIAS";
                    mcdu.onLeftInput[1] = () => {
                        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, selectedStarIndex);
                    };
                }
            }
            let bottomLine = ["<RETURN"];
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                bottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];
                mcdu.onLeftInput[5] = async () => {
                    fmc.eraseTemporaryFlightPlan(() => {
                        CDUFlightPlanPage.ShowPage(fmc, mcdu);
                        mcdu.requestOffsideUpdate();
                    });
                };
                mcdu.onRightInput[5] = async () => {
                    fmc.insertTemporaryFlightPlan(() => {
                        fmc.updateTowerHeadwind();
                        fmc.updateConstraints();
                        CDUPerformancePage.UpdateThrRedAccFromDestination(fmc);
                        CDUFlightPlanPage.ShowPage(fmc, mcdu);
                        mcdu.requestOffsideUpdate();
                    });
                };
            } else {
                mcdu.onLeftInput[5] = () => {
                    CDUFlightPlanPage.ShowPage(fmc, mcdu);
                };
            }
            mcdu.setTemplate([
                ["ARRIVAL {small}TO{end} {green}" + airport.ident + "{end}"],
                ["{sp}APPR", "STAR{sp}", "{sp}VIA"],
                [selectedApproachCell + "[color]" + selectedApproachCellColor, selectedStarCell + "[color]" + selectedStarCellColor, "{sp}" + selectedViasCell + "[color]" + selectedViasCellColor],
                [viasPageLabel, "TRANS{sp}"],
                [viasPageLine, selectedTransitionCell + "[color]" + selectedTransitionCellColor],
                [starSelection ? "STARS" : "APPR", starSelection ? "TRANS" : "", "AVAILABLE"],
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                rows[4],
                rows[5],
                bottomLine
            ]);
            let up = false;
            let down = false;
            const maxPage = starSelection ? (airportInfo.arrivals.length - 2) : (pageCurrent, airportInfo.approaches.length - 3);
            if (pageCurrent < maxPage) {
                mcdu.onUp = () => {
                    pageCurrent++;
                    if (pageCurrent < 0) {
                        pageCurrent = 0;
                    }
                    CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, pageCurrent, starSelection, selectedStarIndex);
                };
                up = true;
            }
            if (pageCurrent > 0) {
                mcdu.onDown = () => {
                    pageCurrent--;
                    if (pageCurrent < 0) {
                        pageCurrent = 0;
                    }
                    CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, pageCurrent, starSelection, selectedStarIndex);
                };
                down = true;
            }
            mcdu.setArrows(up, down, true, true);
            mcdu.onPrevPage = () => {
                CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, !starSelection);
            };
            mcdu.onNextPage = mcdu.onPrevPage;
        }
    }
    static ShowViasPage(fmc, mcdu, airport, pageCurrent = 0, selectedStarIndex = -1) {
        const airportInfo = airport.infos;
        if (airportInfo instanceof AirportInfo) {
            mcdu.setCurrentPage(() => {
                CDUAvailableArrivalsPage.ShowViasPage(fmc, mcdu, airport, pageCurrent, selectedStarIndex);
            });
            let selectedApproachCell = "---";
            let selectedApproachCellColor = "white";
            let selectedViasCell = "NONE";
            let selectedViasCellColor = "white";
            const selectedApproach = fmc.flightPlanManager.getApproach();
            if (selectedApproach) {
                selectedApproachCell = Avionics.Utils.formatRunway(selectedApproach.name);
                selectedApproachCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                const selectedApproachTransition = selectedApproach.transitions[fmc.flightPlanManager.getApproachTransitionIndex()];
                if (selectedApproachTransition) {
                    selectedViasCell = selectedApproachTransition.waypoints[0].infos.icao.substr(7);
                    selectedViasCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
                }
            }
            let selectedStarCell = "------";
            let selectedStarCellColor = "white";
            let selectedArrival = airportInfo.arrivals[fmc.flightPlanManager.getArrivalProcIndex()];
            if (!selectedArrival) {
                selectedArrival = airportInfo.arrivals[selectedStarIndex];
            }
            if (selectedArrival) {
                selectedStarCell = selectedArrival.name;
                selectedStarCellColor = fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1 ? "yellow" : "green";
            }
            const rows = [[""], [""], [""], [""], [""], [""]];
            for (let i = 0; i < 3; i++) {
                const index = i + pageCurrent;
                if (selectedApproach) {
                    const approachTransition = selectedApproach.transitions[index];
                    if (approachTransition) {
                        const name = approachTransition.waypoints[0].infos.icao.substr(7);
                        let color = "cyan";
                        if (index === fmc.flightPlanManager.getApproachTransitionIndex()) {
                            color = "green";
                        }
                        rows[2 * i + 1][0] = "{" + name + "[color]" + color;
                        mcdu.onLeftInput[i + 2] = () => {
                            fmc.setApproachTransitionIndex(index, () => {
                                CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                                mcdu.requestOffsideUpdate();
                            });
                        };
                    }
                }
            }
            let bottomLine = ["<RETURN"];
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                bottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];
                mcdu.onLeftInput[5] = async () => {
                    fmc.eraseTemporaryFlightPlan(() => {
                        CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                        mcdu.requestOffsideUpdate();
                    });
                };
                mcdu.onRightInput[5] = async () => {
                    fmc.insertTemporaryFlightPlan(() => {
                        fmc.updateTowerHeadwind();
                        fmc.updateConstraints();
                        CDUPerformancePage.UpdateThrRedAccFromDestination(fmc);
                        CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                        mcdu.requestOffsideUpdate();
                    });
                };
            } else {
                mcdu.onLeftInput[5] = () => {
                    CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                };
            }
            mcdu.setTemplate([
                ["APPROACH VIAS"],
                ["{sp}APPR", "STAR{sp}", "{sp}VIA"],
                [selectedApproachCell + "[color]" + selectedApproachCellColor , selectedStarCell + "[color]" + selectedStarCellColor, "{sp}" + selectedViasCell + "[color]" + selectedViasCellColor],
                ["APPR VIAS"],
                ["{NO VIAS[color]cyan"],
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                rows[4],
                rows[5],
                rows[6],
                bottomLine
            ]);
            mcdu.onLeftInput[1] = () => {
                fmc.setApproachTransitionIndex(-1, () => {
                    CDUAvailableArrivalsPage.ShowPage(fmc, mcdu, airport, 0, true);
                    mcdu.requestOffsideUpdate();
                });
            };
            let up = false;
            let down = false;

            if (pageCurrent < selectedApproach.transitions.length - 3) {
                mcdu.onUp = () => {
                    pageCurrent++;
                    if (pageCurrent < 0) {
                        pageCurrent = 0;
                    }
                    CDUAvailableArrivalsPage.ShowViasPage(fmc, mcdu, airport, pageCurrent, selectedStarIndex);
                };
                up = true;
            }
            if (pageCurrent > 0) {
                mcdu.onDown = () => {
                    pageCurrent--;
                    if (pageCurrent < 0) {
                        pageCurrent = 0;
                    }
                    CDUAvailableArrivalsPage.ShowViasPage(fmc, mcdu, airport, pageCurrent, selectedStarIndex);
                };
                down = true;
            }
            mcdu.setArrows(up, down, true, true);
        }
    }
}
