// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

const DeparturePagination = Object.freeze(
    {
        DEPT_PAGE: 4,
    }
);

const Labels = Object.freeze(
    {
        NO_SID: "NO SID",
        NO_TRANS: "NO TRANS",
        NO_VIA: "NO VIA",
        NO_STAR: "NO STAR",
    }
);

class CDUAvailableDeparturesPage {
    static ShowPage(mcdu, airport, pageCurrent = -1, sidSelection = false, forPlan = Fmgc.FlightPlanIndex.Active, inAlternate = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableDeparturesPage;

        let selectedRunwayCell = "---";
        let selectedRunwayCellColor = "white";
        let selectedSidCell = "------";
        let selectedSidCellColor = "white";
        let selectedTransCell = "------";
        let selectedTransCellColor = "white";

        // --- figure out which data is available for the page ---

        const editingTmpy = forPlan === Fmgc.FlightPlanIndex.Active && mcdu.flightPlanService.hasTemporary;

        /** @type {BaseFlightPlan} */
        const targetPlan = mcdu.flightPlan(forPlan, inAlternate);

        /** @type {import('msfs-navdata').Runway} */
        const selectedRunway = targetPlan.originRunway;
        const selectedSid = targetPlan.originDeparture;
        const selectedTransition = targetPlan.departureEnrouteTransition;

        /** @type {Departure} */
        /** @type {ProcedureTransition} */
        const showEosid = selectedRunway && sidSelection;

        /** @type {import('msfs-navdata').Runway[]} */
        const availableRunways = [...targetPlan.availableOriginRunways];
        let availableSids = [...targetPlan.availableDepartures];
        let availableTransitions = [];

        if (selectedRunway) {
            // filter out any SIDs not compatible with this runway
            availableSids = availableSids.filter((sid) =>
                sid.runwayTransitions.length === 0 ||
                findRunwayTransitionIndex(selectedRunway, sid.runwayTransitions) !== -1
            );
        }

        // NO SID option is available at the end of the list when non-zero options
        if (availableSids.length > 0) {
            availableSids.push(Labels.NO_SID);
        }

        let selectedSidPage = -1;
        if (selectedSid) {
            availableTransitions = [...selectedSid.enrouteTransitions];

            selectedSidPage = Math.floor((availableSids.findIndex((sid) => sid.databaseId === selectedSid.databaseId)) / DeparturePagination.DEPT_PAGE);
        }

        const selectedRunwayPage = selectedRunway ? Math.floor((availableRunways.findIndex((runway) => runway.ident === selectedRunway.ident)) / DeparturePagination.DEPT_PAGE) : -1;

        // NO TRANS option is available at the end of the list when non-zero options
        if (availableTransitions.length > 0) {
            availableTransitions.push(Labels.NO_TRANS);
        }

        // --- render the top part of the page ---

        const selectedColour = editingTmpy ? "yellow" : "green";

        if (selectedRunway) {
            selectedRunwayCell = Fmgc.RunwayUtils.runwayString(selectedRunway.ident);
            selectedRunwayCellColor = selectedColour;

            // TODO check type of ls... but awful from raw JS
            if (selectedRunway.lsIdent) {
                selectedRunwayCell = `${selectedRunwayCell.padEnd(3)}{small}-ILS{end}`;
            }
        }

        if (selectedSid) {
            selectedSidCell = selectedSid.ident;
            selectedSidCellColor = selectedColour;
        } else if (availableSids.length === 0 || selectedSid === null) {
            selectedSidCell = "NONE";
            selectedSidCellColor = selectedColour;
        }

        if (selectedTransition) {
            selectedTransCell = selectedTransition.ident;
            selectedTransCellColor = selectedColour;
        } else if (selectedSid !== undefined && availableTransitions.length === 0 || selectedTransition === null) {
            selectedTransCell = "NONE";
            selectedTransCellColor = selectedColour;
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
                    const selected = selectedRunway && selectedRunway.ident === runway.ident;
                    const color = selected && !editingTmpy ? "green" : "cyan";

                    const hasIls = runway.lsFrequencyChannel > 0; // TODO what if not ILS
                    rows[2 * i] = [`{${color}}${selected ? "{sp}" : "{"}${Fmgc.RunwayUtils.runwayString(runway.ident).padEnd(3)}${hasIls ? '{small}-ILS{end}' : '{sp}{sp}{sp}{sp}'}${NXUnits.mToUser(runway.length).toFixed(0).padStart(6, '\xa0')}{small}${NXUnits.userDistanceUnit().padEnd(2)}{end}{end}`];
                    const ilsText = hasIls ? `${runway.lsIdent.padStart(6)}/${runway.lsFrequencyChannel.toFixed(2)}` : '';
                    rows[2 * i + 1] = [`{${color}}{sp}{sp}{sp}${Utils.leadingZeros(Math.round(runway.magneticBearing), 3)}${ilsText}{end}`];
                    mcdu.onLeftInput[i + 1] = async (_, scratchpadCallback) => {
                        // Clicking the already selected runway is not allowed
                        if (!selected) {
                            try {
                                await mcdu.flightPlanService.setOriginRunway(runway.ident, forPlan, inAlternate);

                                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                            } catch (e) {
                                console.error(e);
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                mcdu.eraseTemporaryFlightPlan(() => {
                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, false, forPlan, inAlternate);
                                });
                            }
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                            scratchpadCallback();
                        }
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
                const sid = availableSids[pageCurrent * DeparturePagination.DEPT_PAGE + i];
                if (sid) {
                    const selected = (sid === Labels.NO_SID && selectedSid === null) || (selectedSid && selectedSid.databaseId === sid.databaseId);
                    const color = selected && !editingTmpy ? "green" : "cyan";

                    rows[2 * i] = [`{${color}}${selected ? "{sp}" : "{"}${typeof sid === 'string' ? sid : sid.ident}{end}`];
                    mcdu.onLeftInput[1 + i] = async (_, scratchpadCallback) => {
                        // Clicking the already selected SID is not allowed
                        if (!selected) {
                            try {
                                if (sid === Labels.NO_SID) {
                                    await mcdu.flightPlanService.setDepartureProcedure(null, forPlan, inAlternate);
                                } else {
                                    await mcdu.flightPlanService.setDepartureProcedure(sid.databaseId, forPlan, inAlternate);
                                }

                                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
                            } catch (e) {
                                console.error(e);
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                mcdu.eraseTemporaryFlightPlan(() => {
                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, false, forPlan, inAlternate);
                                });
                            }
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                            scratchpadCallback();
                        }
                    };
                }
            }

            // show the enroute transitions for the selected SID down the right side
            if (selectedSid) {
                const transPage = selectedSidPage > pageCurrent ? 0 : pageCurrent - selectedSidPage;

                for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                    const trans = availableTransitions[transPage * DeparturePagination.DEPT_PAGE + i];
                    if (trans) {
                        const selected = (trans === Labels.NO_TRANS && selectedTransition === null) || (selectedTransition && selectedTransition.ident === trans.ident);
                        const color = selected && !editingTmpy ? "green" : "cyan";

                        rows[2 * i][1] = `{${color}}${typeof trans === 'string' ? trans : trans.ident}${selected ? " " : "}"}{end}`;
                        mcdu.onRightInput[i + 1] = async (_, scratchpadCallback) => {
                            // Clicking the already selected transition is not allowed
                            if (!selected) {
                                try {
                                    if (trans === Labels.NO_TRANS) {
                                        await mcdu.flightPlanService.setDepartureEnrouteTransition(null, forPlan, inAlternate);
                                    } else {
                                        await mcdu.flightPlanService.setDepartureEnrouteTransition(trans.databaseId, forPlan, inAlternate);
                                    }

                                    CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
                                } catch (e) {
                                    console.error(e);
                                    mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                    mcdu.eraseTemporaryFlightPlan(() => {
                                        CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                                    });
                                }
                            } else {
                                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                                scratchpadCallback();
                            }
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
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, sidSelection, forPlan, inAlternate);
            };
            up = true;
        }
        if (pageCurrent > 0) {
            mcdu.onDown = () => {
                pageCurrent--;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, sidSelection, forPlan, inAlternate);
            };
            down = true;
        }
        mcdu.setArrows(up, down, true, true);

        if (editingTmpy) {
            mcdu.onLeftInput[5] = () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };
            mcdu.onRightInput[5] = () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.updateConstraints();
                    mcdu.onToRwyChanged();
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };
        } else {
            mcdu.onLeftInput[5] = () => {
                CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
            };
        }

        if (showEosid) {
            rows[7][2] = 'EOSID';
        }

        mcdu.setTemplate([
            ["{sp}DEPARTURES {small}FROM{end} {green}" + airport.ident + "{sp}{sp}{sp}"],
            ["{sp}RWY", "TRANS{sp}", "SID"],
            [selectedRunwayCell + "[color]" + selectedRunwayCellColor, selectedTransCell + "[color]" + selectedTransCellColor, selectedSidCell + "{sp}[color]" + selectedSidCellColor],
            sidSelection ? ["SIDS", "TRANS", "AVAILABLE"] : ["", "", "AVAILABLE RUNWAYS\xa0"],
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
            CDUAvailableDeparturesPage.ShowPage(mcdu, airport, -1, !sidSelection, forPlan, inAlternate);
        };
        mcdu.onNextPage = mcdu.onPrevPage;
    }
}

/**
 * Check if a runway transition matches with a runway
 * @param {Runway} runway
 * @param {ProcedureTransition} transition
 * @returns {number} -1 if not found, else index of the transition
 */
function findRunwayTransitionIndex(runway, transitions) {
    return transitions.findIndex((trans) => trans.ident === runway.ident);
}
