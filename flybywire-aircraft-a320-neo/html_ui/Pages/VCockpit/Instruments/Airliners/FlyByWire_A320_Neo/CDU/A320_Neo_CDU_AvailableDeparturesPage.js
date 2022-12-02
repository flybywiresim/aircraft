const DeparturePagination = Object.freeze(
    {
        DEPT_PAGE: 4,
    }
);

class CDUAvailableDeparturesPage {
    static ShowPage(mcdu, airport, pageCurrent = -1, sidSelection = false) {
        const airportInfo = airport.infos;
        if (airportInfo instanceof AirportInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.AvailableDeparturesPage;

            let selectedRunwayCell = "---";
            let selectedRunwayCellColor = "white";
            let selectedSidCell = "------";
            let selectedSidCellColor = "white";
            let selectedTransCell = "------";
            let selectedTransCellColor = "white";

            // --- figure out which data is available for the page ---

            const editingTmpy = mcdu.flightPlanManager.getCurrentFlightPlanIndex() === FlightPlans.Temporary;

            /** @type {OneWayRunway} */
            const selectedRunway = mcdu.flightPlanManager.getOriginRunway();
            const selectedSidIndex = mcdu.flightPlanManager.getDepartureProcIndex();
            const selectedTransitionIndex = mcdu.flightPlanManager.getDepartureEnRouteTransitionIndex();
            /** @type {RawDeparture} */
            const selectedDeparture = airportInfo.departures[selectedSidIndex];
            /** @type {RawEnRouteTransition} */
            const selectedTransition = selectedDeparture ? selectedDeparture.enRouteTransitions[selectedTransitionIndex] : undefined;
            const showEosid = selectedRunway && sidSelection;

            /** @type {OneWayRunway[]} */
            const availableRunways = airportInfo.oneWayRunways;
            /** @type {[number, RawDeparture | string][]} */
            let availableSids = airportInfo.departures
                .map((sid, index) => [index, sid])
                // Workaround for an MSFS bug that results in invalid SIDs with no legs
                .filter(([index, sid]) => sid.runwayTransitions.length > 0 || sid.commonLegs.length > 0);
            /** @type {[number, RawEnRouteTransition | string][]} */
            let availableTransitions = [];

            if (selectedRunway) {
                // filter out any SIDs not compatible with this runway
                availableSids = availableSids.filter(([index, sid]) =>
                    sid.runwayTransitions.length === 0 ||
                    findRunwayTransitionIndex(selectedRunway, sid.runwayTransitions) !== -1
                );
            }

            // NO SID/NO TRANS option is available at the start of the list when non-zero options
            if (availableSids.length > 0) {
                availableSids.unshift([-2, "NO SID"]);
            }

            let selectedSidPage = -1;
            if (selectedDeparture) {
                availableTransitions = selectedDeparture.enRouteTransitions.map((trans, index) => [index, trans]);

                selectedSidPage = Math.floor((availableSids.findIndex(([sidIndex, sid]) => sid === selectedDeparture)) / DeparturePagination.DEPT_PAGE);
            }

            const selectedRunwayPage = selectedRunway ? Math.floor((availableRunways.findIndex((runway) => runway.designation === selectedRunway.designation)) / DeparturePagination.DEPT_PAGE) : -1;

            if (availableTransitions.length > 0) {
                availableTransitions.unshift([-2, "NO TRANS"]);
            }

            // --- render the top part of the page ---

            const selectedColour = editingTmpy ? "yellow" : "green";

            if (selectedRunway) {
                selectedRunwayCell = Avionics.Utils.formatRunway(selectedRunway.designation);
                selectedRunwayCellColor = selectedColour;

                if (selectedRunway.primaryILSFrequency.freqMHz > 0) {
                    selectedRunwayCell += '{small}-ILS{end}';
                }
            }

            if (availableSids.length === 0) {
                selectedSidCell = "NONE";
                selectedSidCellColor = selectedColour;
            } else if (selectedSidIndex === -2) {
                selectedSidCell = "NO SID";
                selectedSidCellColor = selectedColour;
            } else if (selectedDeparture) {
                selectedSidCell = selectedDeparture.name;
                selectedSidCellColor = selectedColour;
            }

            if (selectedDeparture || availableSids.length === 0) {
                if (availableTransitions.length === 0) {
                    selectedTransCell = "NONE";
                    selectedTransCellColor = selectedColour;
                } else if (selectedTransitionIndex === -2) {
                    selectedTransCell = "NO TRANS";
                    selectedTransCellColor = selectedColour;
                } else if (selectedTransition) {
                    selectedTransCell = selectedTransition.name;
                    selectedTransCellColor = selectedColour;
                }
            }

            // --- render the rows ---

            const rows = [[""], [""], [""], [""], [""], [""], [""], ["", "", ""]];
            if (!sidSelection) {
                // jump to selected runway page if entering page
                if (pageCurrent < 0) {
                    pageCurrent = Math.max(0, selectedRunwayPage);
                }

                for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                    const index = i + pageCurrent * DeparturePagination.DEPT_PAGE;
                    const runway = availableRunways[index];
                    if (runway) {
                        const selected = selectedRunway && selectedRunway.designation === runway.designation;
                        const hasIls = runway.primaryILSFrequency.freqMHz > 0;
                        rows[2 * i] = [`${selected ? "{green}{sp}" : "{cyan}{"}${Avionics.Utils.formatRunway(runway.designation).padEnd(3)}${hasIls ? '{small}-ILS{end}' : '{sp}{sp}{sp}{sp}'}${NXUnits.mToUser(runway.length).toFixed(0).padStart(6, '\xa0')}{small}${NXUnits.userDistanceUnit().padEnd(2)}{end}{end}`];
                        const magVar = Facilities.getMagVar(runway.beginningCoordinates.lat, runway.beginningCoordinates.long);
                        const bearing = A32NX_Util.trueToMagnetic(runway.direction, magVar);
                        const ilsText = hasIls ? `${WayPoint.formatIdentFromIcao(runway.primaryILSFrequency.icao).padStart(6)}/${runway.primaryILSFrequency.freqMHz.toFixed(2)}` : '';
                        rows[2 * i + 1] = [`${selected ? "{green}" : "{cyan}"}{sp}{sp}{sp}${Utils.leadingZeros(Math.round(bearing), 3)}${ilsText}{end}`];
                        mcdu.onLeftInput[i + 1] = async () => {
                            mcdu.setOriginRunwayIndex(index, () => {
                                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, -1, true);
                            });
                        };
                    }
                }
            } else {
                // jump to selected SID page if entering page
                if (pageCurrent < 0) {
                    pageCurrent = Math.max(0, selectedSidPage);
                }

                // show the available SIDs down the left side
                for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                    const row = availableSids[pageCurrent * DeparturePagination.DEPT_PAGE + i];
                    if (row) {
                        const [sidIndex, sid] = row;
                        const selected = selectedSidIndex === sidIndex;
                        rows[2 * i] = [`${selected ? "{green}{sp}" : "{cyan}{"}${typeof sid === 'string' ? sid : sid.name}{end}`];
                        mcdu.onLeftInput[1 + i] = async () => {
                            if (sid === "NO SID") {
                                mcdu.setDepartureIndex(-2, () => {
                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true);
                                });
                            } else {
                                const runwayTransitionIndex = selectedRunway ? findRunwayTransitionIndex(selectedRunway, sid.runwayTransitions) : -1;
                                mcdu.setRunwayIndex(runwayTransitionIndex, (success) => {
                                    mcdu.setDepartureIndex(sidIndex, () => {
                                        CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true);
                                    });
                                });
                            }
                        };
                    }
                }

                // show the enroute transitions for the selected SID down the right side
                if (selectedDeparture) {
                    const transPage = selectedSidPage > pageCurrent ? 0 : pageCurrent - selectedSidPage;

                    for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                        const row = availableTransitions[transPage * DeparturePagination.DEPT_PAGE + i];
                        if (row) {
                            const [transIndex, trans] = row;
                            const selected = selectedTransitionIndex === transIndex;
                            rows[2 * i][1] = `${selected ? "{green}" : "{cyan}"}${typeof trans === 'string' ? trans : trans.name}${selected ? " " : "}"}{end}`;
                            mcdu.onRightInput[i + 1] = () => {
                                mcdu.setDepartureTransitionIndex(transIndex, () => {
                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true);
                                }).catch(console.error);
                            };
                        }
                    }
                }
            }

            // --- render arrows etc. ---

            let up = false;
            let down = false;
            let numPages = 0;
            if (sidSelection) {
                const sidPages = Math.ceil(availableSids.length / DeparturePagination.DEPT_PAGE);
                const transPages = Math.ceil(availableTransitions.length / DeparturePagination.DEPT_PAGE);
                numPages = Math.max(sidPages, transPages, selectedSidPage + transPages);
            } else {
                numPages = Math.ceil(availableRunways.length / DeparturePagination.DEPT_PAGE);
            }
            if (pageCurrent < (numPages - 1)) {
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

            if (editingTmpy) {
                mcdu.onLeftInput[5] = () => {
                    mcdu.eraseTemporaryFlightPlan(() => {
                        CDUFlightPlanPage.ShowPage(mcdu, 0);
                    });
                };
                mcdu.onRightInput[5] = () => {
                    mcdu.insertTemporaryFlightPlan(() => {
                        mcdu.updateConstraints();
                        mcdu.onToRwyChanged();
                        CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu, true, true);
                        CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);
                        CDUFlightPlanPage.ShowPage(mcdu, 0);
                    });
                };
            } else {
                mcdu.onLeftInput[5] = () => {
                    CDUFlightPlanPage.ShowPage(mcdu);
                };
            }

            if (showEosid) {
                rows[7][2] = 'EOSID';
            }

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
                [editingTmpy ? "{ERASE[color]amber" : "{RETURN", editingTmpy ? "INSERT*[color]amber" : "", showEosid ? `{${selectedColour}}{sp}NONE{end}` : '']
            ]);
            mcdu.onPrevPage = () => {
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, -1, !sidSelection);
            };
            mcdu.onNextPage = mcdu.onPrevPage;
        }
    }
}

/**
 * Check if a runway transition matches with a runway
 * @param {OneWayRunway} runway
 * @param {RawRunwayTransition} transition
 * @returns {number} -1 if not found, else index of the transition
 */
function findRunwayTransitionIndex(runway, transitions) {
    return transitions.findIndex((trans) => trans.runwayNumber === runway.number && trans.runwayDesignation === runway.designator);
}
