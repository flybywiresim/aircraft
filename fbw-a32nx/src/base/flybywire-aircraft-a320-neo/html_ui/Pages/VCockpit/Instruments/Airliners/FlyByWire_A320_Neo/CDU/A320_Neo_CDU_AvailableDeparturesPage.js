// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

const DeparturePagination = Object.freeze(
    {
        DEPT_PAGE: 4,
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

        const planColor = forPlan === Fmgc.FlightPlanIndex.Active ? mcdu.flightPlanService.hasTemporary ? "yellow" : "green" : "white";

        /** @type {import('msfs-navdata').Runway} */
        const selectedRunway = targetPlan.originRunway;
        const selectedSid = targetPlan.originDeparture;
        const selectedTransition = targetPlan.departureEnrouteTransition;

        /** @type {RawDeparture} */
        /** @type {RawEnRouteTransition} */
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

        // NO SID/NO TRANS option is available at the start of the list when non-zero options
        if (availableSids.length > 0) {
            availableSids.unshift("NO SID");
        }

        let selectedSidPage = -1;
        if (selectedSid) {
            availableTransitions = [...selectedSid.enrouteTransitions];

            selectedSidPage = Math.floor((availableSids.findIndex((sid) => sid.databaseId === selectedSid.databaseId)) / DeparturePagination.DEPT_PAGE);
        }

        const selectedRunwayPage = selectedRunway ? Math.floor((availableRunways.findIndex((runway) => runway.ident === selectedRunway.ident)) / DeparturePagination.DEPT_PAGE) : -1;

        if (availableTransitions.length > 0) {
            availableTransitions.unshift("NO TRANS");
        }

        // --- render the top part of the page ---

        const selectedColour = editingTmpy ? "yellow" : "green";

        if (selectedRunway) {
            selectedRunwayCell = selectedRunway.ident.substring(2);
            selectedRunwayCellColor = selectedColour;

            // TODO check type of ls... but awful from raw JS
            if (selectedRunway.lsIdent) {
                selectedRunwayCell += '{small}-ILS{end}';
            }
        }

        if (selectedSid) {
            selectedSidCell = selectedSid.ident;
            selectedSidCellColor = planColor;

            if (selectedTransition) {
                selectedTransCell = selectedTransition.ident;
                selectedTransCellColor = planColor;
            } else {
                selectedTransCell = "NONE";
            }
        }

        if (availableSids.length === 0) {
            selectedSidCell = "NONE";
            selectedSidCellColor = selectedColour;
        /*} else if (selectedSidIndex === -2) {
            selectedSidCell = "NO SID";
            selectedSidCellColor = selectedColour;
        */} else if (selectedSid) {
            selectedSidCell = selectedSid.ident;
            selectedSidCellColor = selectedColour;
        }

        if (selectedSid || availableSids.length === 0) {
            if (availableTransitions.length === 0) {
                selectedTransCell = "NONE";
                selectedTransCellColor = selectedColour;
            /*} else if (selectedTransitionIndex === -2) {
                selectedTransCell = "NO TRANS";
                selectedTransCellColor = selectedColour;
            */} else if (selectedTransition) {
                selectedTransCell = selectedTransition.ident;
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
                    const selected = selectedRunway && selectedRunway.ident === runway.ident;
                    const hasIls = runway.lsFrequencyChannel > 0; // TODO what if not ILS
                    rows[2 * i] = [`${selected ? "{green}{sp}" : "{cyan}{"}${runway.ident.substring(2).padEnd(3)}${hasIls ? '{small}-ILS{end}' : '{sp}{sp}{sp}{sp}'}${NXUnits.mToUser(runway.length).toFixed(0).padStart(6, '\xa0')}{small}${NXUnits.userDistanceUnit().padEnd(2)}{end}{end}`];
                    const ilsText = hasIls ? `${runway.lsIdent.padStart(6)}/${runway.lsFrequencyChannel.toFixed(2)}` : '';
                    rows[2 * i + 1] = [`${selected ? "{green}" : "{cyan}"}{sp}{sp}{sp}${Utils.leadingZeros(Math.round(runway.magneticBearing), 3)}${ilsText}{end}`];
                    mcdu.onLeftInput[i + 1] = async () => {
                        try {
                            await mcdu.flightPlanService.setOriginRunway(runway.ident, forPlan, inAlternate);
                        } catch (e) {
                            console.error(e);
                            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                        }
                        CDUAvailableDeparturesPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
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
                    const selected = sid !== "NO SID" && selectedSid && selectedSid.databaseId === sid.databaseId;
                    rows[2 * i] = [`${selected ? "{green}{sp}" : "{cyan}{"}${typeof sid === 'string' ? sid : sid.ident}{end}`];
                    mcdu.onLeftInput[1 + i] = async () => {
                        try {
                            if (sid === "NO SID") {
                                // TODO we need to remember this explicit selection somehow
                                await mcdu.flightPlanService.setDepartureProcedure(undefined, forPlan, inAlternate);
                            } else {
                                /*const transitionRunway = targetPlan.availableOriginRunways.find((it) => it.ident === runwayTransitionIdent);
                                await mcdu.flightPlanService.setOriginRunway(transitionRunway.ident);*/
                                await mcdu.flightPlanService.setDepartureProcedure(sid.databaseId, forPlan, inAlternate);
                            }
                        } catch (e) {
                            console.error(e);
                            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                        }

                        CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
                    };
                }
            }

            // show the enroute transitions for the selected SID down the right side
            if (selectedSid) {
                const transPage = selectedSidPage > pageCurrent ? 0 : pageCurrent - selectedSidPage;

                for (let i = 0; i < DeparturePagination.DEPT_PAGE; i++) {
                    const trans = availableTransitions[transPage * DeparturePagination.DEPT_PAGE + i];
                    if (trans) {
                        const selected = trans !== "NO TRANS" && selectedTransition && selectedTransition.ident === trans.ident;
                        rows[2 * i][1] = `${selected ? "{green}" : "{cyan}"}${typeof trans === 'string' ? trans : trans.ident}${selected ? " " : "}"}{end}`;
                        mcdu.onRightInput[i + 1] = async () => {
                            try {
                                await mcdu.flightPlanService.setDepartureEnrouteTransition(trans.databaseId, forPlan, inAlternate);
                            } catch (e) {
                                console.error(e);
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                            }
                            CDUAvailableDeparturesPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
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
            ["{sp}RWY", "TRANS{sp}", "{sp}SID"],
            [selectedRunwayCell + "[color]" + selectedRunwayCellColor, selectedTransCell + "[color]" + selectedTransCellColor, selectedSidCell + "[color]" + selectedSidCellColor],
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
            CDUAvailableDeparturesPage.ShowPage(mcdu, airport, -1, !sidSelection, forPlan);
        };
        mcdu.onNextPage = mcdu.onPrevPage;
    }
}

/**
 * Check if a runway transition matches with a runway
 * @param {OneWayRunway} runway
 * @param {RawRunwayTransition} transition
 * @returns {number} -1 if not found, else index of the transition
 */
function findRunwayTransitionIndex(runway, transitions) {
    return transitions.findIndex((trans) => trans.ident === runway.ident);
}
