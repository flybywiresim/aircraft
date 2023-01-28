/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * translates MSFS navdata approach type to honeywell ordering
 */
const ApproachTypeOrder = Object.freeze([
    // MLS
    ApproachType.APPROACH_TYPE_ILS,
    // GLS
    // IGS
    ApproachType.APPROACH_TYPE_LOCALIZER,
    ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE,
    ApproachType.APPROACH_TYPE_LDA,
    ApproachType.APPROACH_TYPE_SDF,
    ApproachType.APPROACH_TYPE_GPS,
    ApproachType.APPROACH_TYPE_RNAV,
    ApproachType.APPROACH_TYPE_VORDME,
    ApproachType.APPROACH_TYPE_VOR,
    ApproachType.APPROACH_TYPE_NDBDME,
    ApproachType.APPROACH_TYPE_NDB,
    ApproachType.APPROACH_TYPE_UNKNOWN, // should be "runway by itself"...
]);

const ArrivalPagination = Object.freeze(
    {
        ARR_PAGE: 3,
        TRNS_PAGE: 2
    }
);
class CDUAvailableArrivalsPage {
    static ShowPage(mcdu, airport, pageCurrent = 0, starSelection = false, forPlan = Fmgc.FlightPlanIndex.Active, inAlternate = false) {
        // TODO SEC F-PLN
        /** @type {import('../../../../../../../../src/fmgc/src/flightplanning/new/plans/BaseFlightPlan').BaseFlightPlan} */
        let targetPlan;
        if (forPlan === Fmgc.FlightPlanIndex.Active) {
            if (inAlternate) {
                targetPlan = mcdu.flightPlanService.activeOrTemporary.alternateFlightPlan;
            } else {
                targetPlan = mcdu.flightPlanService.activeOrTemporary;
            }
        } else {
            targetPlan = mcdu.flightPlanService.get(forPlan);
        }

        const isTemporary = targetPlan.index === Fmgc.FlightPlanIndex.Temporary;

        const selectedStarIdent = targetPlan.arrival ? targetPlan.arrival.ident : undefined;
        const selectedTransitionIdent = targetPlan.arrivalEnrouteTransition ? targetPlan.arrivalEnrouteTransition.ident : undefined;

        const flightPlanAccentColor = isTemporary ? "yellow" : "green";

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableArrivalsPage;
        let selectedApproachCell = "------";
        let selectedViasCell = "------";
        let selectedTransitionCell = "------";
        let selectedApproachCellColor = "white";
        let selectedViasCellColor = "white";
        let selectedTransitionCellColor = "white";

        const selectedApproach = targetPlan.approach;

        if (selectedApproach && selectedApproach.ident) {
            selectedApproachCell = Fmgc.NavigationDatabase.formatShortApproachIdent(selectedApproach);
            selectedApproachCellColor = flightPlanAccentColor;

            const selectedApproachTransition = targetPlan.approachVia;

            if (selectedApproachTransition) {
                selectedViasCell = selectedApproachTransition.ident;
            } else {
                selectedViasCell = "NONE";
            }

            selectedViasCellColor = flightPlanAccentColor;
        }

        let selectedStarCell = "------";
        let selectedStarCellColor = "white";

        const selectedArrival = targetPlan.arrival;

        if (selectedArrival) {
            selectedStarCell = selectedArrival.ident;
            selectedStarCellColor = flightPlanAccentColor;

            const selectedTransition = targetPlan.arrivalEnrouteTransition;

            if (selectedTransition) {
                selectedTransitionCell = selectedTransition.ident;
                selectedTransitionCellColor = flightPlanAccentColor;
            }
        }

        const approaches = targetPlan.availableApproaches;

        // Add an index member variable, so we can track the original order of approaches
        for (let j = 0; j < approaches.length; j++) {
            approaches[j].index = j;
        }

        // Sort the approaches in Honeywell's documented order
        const sortedApproaches = approaches.slice().sort((a, b) => ApproachTypeOrder.indexOf(a.type) - ApproachTypeOrder.indexOf(b.type));
        const rows = [[""], [""], [""], [""], [""], [""], [""], [""]];

        /**
         * @type {({ arrival: import('msfs-navdata').Arrival, arrivalIndex: number })[]}
         */
        const matchingArrivals = [];

        if (!starSelection) {
            for (let i = 0; i < ArrivalPagination.ARR_PAGE; i++) {
                const index = i + pageCurrent * ArrivalPagination.ARR_PAGE;
                const approach = sortedApproaches[index];
                if (approach) {
                    let runwayLength = '----';
                    let runwayCourse = '---';

                    const runway = Fmgc.FlightPlanService.active.availableDestinationRunways.find((rw) => rw.ident === approach.runwayIdent);
                    if (runway) {
                        runwayLength = runway.length.toFixed(0); // TODO imperial length pin program
                        runwayCourse = Utils.leadingZeros(Math.round(runway.magneticBearing), 3);

                    }

                    rows[2 * i] = [`{cyan}{${Fmgc.NavigationDatabase.formatShortApproachIdent(approach)}{end}`, "", "{sp}{sp}{sp}{sp}" + runwayLength + "{small}M{end}[color]cyan"];
                    rows[2 * i + 1] = ["{sp}{sp}{sp}{sp}" + runwayCourse + "[color]cyan"];

                    mcdu.onLeftInput[i + 2] = async () => {
                        // TODO we need to set the runway, but cannot correlate runway from approach yet

                        await mcdu.flightPlanService.setApproach(approach.ident, forPlan, inAlternate);

                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                    };
                }
            }
        } else {
            if (selectedApproach && selectedApproach.runwayIdent) {
                const arrivals = targetPlan.availableArrivals;

                const selectedRunway = selectedApproach.runway;

                for (let i = 0; i < arrivals.length; i++) {
                    const arrival = arrivals[i];

                    if (arrival.runwayTransitions.length) {
                        for (let j = 0; j < arrival.runwayTransitions.length; j++) {
                            const runwayTransition = arrival.runwayTransitions[j];
                            if (runwayTransition) {
                                // Check if selectedRunway matches a transition on the approach (and also checks for Center runways)
                                if (runwayTransition.ident === selectedApproach.runwayIdent || (runwayTransition.ident.charAt(4) === 'B' && runwayTransition.ident.substring(0, 4) === selectedApproach.runwayIdent.substring(0, 4))) {
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
            for (let i = 0; i < ArrivalPagination.ARR_PAGE; i++) {
                let index = i + (pageCurrent * ArrivalPagination.ARR_PAGE);
                if (index === 0) {
                    let color = "cyan";
                    if (!selectedArrival) {
                        color = "green";
                    }
                    rows[2 * i] = ["{NO STAR[color]" + color];

                    mcdu.onLeftInput[i + 2] = async () => {
                        await mcdu.flightPlanService.setArrival(undefined, forPlan, inAlternate);

                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                    };
                } else {
                    index--;
                    if (matchingArrivals[index]) {
                        const star = matchingArrivals[index].arrival;
                        const starIdent = matchingArrivals[index].arrival.ident;

                        let color = "cyan";
                        if (selectedStarIdent === starIdent) {
                            color = "green";
                        }
                        rows[2 * i] = ["{" + star.ident + "[color]" + color];
                        mcdu.onLeftInput[i + 2] = async () => {
                            const destinationRunway = targetPlan.destinationRunway;

                            const arrivalRunway = destinationRunway ? star.runwayTransitions.find(t => {
                                return t.ident === destinationRunway.ident;
                            }) : undefined;

                            if (arrivalRunway !== undefined) {
                                await mcdu.flightPlanService.setDestinationRunway(arrivalRunway.ident, forPlan, inAlternate);
                            }

                            await mcdu.flightPlanService.setArrival(starIdent, forPlan, inAlternate);

                            const approachIdent = targetPlan.approach.ident;

                            if (approachIdent !== undefined) {
                                CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                            } else {
                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                            }

                        };
                    }
                }
            }
            if (selectedArrival) {
                rows[0][1] = "NO TRANS}[color]cyan";
            }

            mcdu.onRightInput[2] = async () => {
                await mcdu.flightPlanService.setArrival(undefined, forPlan, inAlternate);

                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
            };

            for (let i = 0; i < ArrivalPagination.TRNS_PAGE; i++) {
                const index = i + pageCurrent * ArrivalPagination.TRNS_PAGE;
                if (selectedArrival) {
                    const transition = selectedArrival.enrouteTransitions[index];
                    if (transition) {
                        rows[2 * (i + 1)][1] = `${transition.ident}${selectedTransitionIdent === transition.ident ? " " : "}"}[color]cyan`;

                        mcdu.onRightInput[i + 3] = async () => {
                            await mcdu.flightPlanService.setArrivalEnrouteTransition(transition.ident, forPlan, inAlternate);

                            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
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
                    CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                };
            }
        }
        let bottomLine = ["<RETURN"];
        if (isTemporary) {
            bottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];
            mcdu.onLeftInput[5] = async () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };
            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.updateTowerHeadwind();
                    mcdu.updateConstraints();
                    CDUPerformancePage.UpdateThrRedAccFromDestination(mcdu);
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };
        } else {
            mcdu.onLeftInput[5] = () => {
                CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
            };
        }
        let up = false;
        let down = false;
        const maxPage = starSelection ? (selectedArrival ? Math.max(Math.ceil(selectedArrival.enrouteTransitions.length / ArrivalPagination.TRNS_PAGE) - 1, Math.ceil(matchingArrivals.length / ArrivalPagination.ARR_PAGE) - 1) : Math.ceil(matchingArrivals.length / ArrivalPagination.ARR_PAGE) - 1) : (pageCurrent, Math.ceil(approaches.length / ArrivalPagination.ARR_PAGE) - 1);
        if (pageCurrent < maxPage) {
            mcdu.onUp = () => {
                pageCurrent++;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, starSelection, forPlan, inAlternate);
            };
            up = true;
        }
        if (pageCurrent > 0) {
            mcdu.onDown = () => {
                pageCurrent--;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, starSelection, forPlan, inAlternate);
            };
            down = true;
        }
        mcdu.setArrows(up, down, true, true);
        mcdu.setTemplate([
            ["ARRIVAL {small}TO{end} {green}" + airport.ident + "{end}"],
            ["{sp}APPR", "STAR{sp}", "{sp}VIA"],
            [selectedApproachCell + "[color]" + selectedApproachCellColor, selectedStarCell + "[color]" + selectedStarCellColor, "{sp}" + selectedViasCell + "[color]" + selectedViasCellColor],
            [viasPageLabel, "TRANS{sp}"],
            [viasPageLine, selectedTransitionCell + "[color]" + selectedTransitionCellColor],
            [(starSelection ? "STARS" : "APPR").padStart(5) + "{sp}{sp}AVAILABLE", starSelection ? "TRANS" : "", ""],
            rows[0],
            rows[1],
            rows[2],
            rows[3],
            rows[4],
            rows[5],
            bottomLine
        ]);
        mcdu.onPrevPage = () => {
            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, !starSelection, forPlan, inAlternate);
        };
        mcdu.onNextPage = mcdu.onPrevPage;
    }

    static ShowViasPage(mcdu, airport, pageCurrent = 0, forPlan = Fmgc.FlightPlanIndex.Active, inAlternate = false) {
        const appr_page = 3;

        // TODO SEC F-PLN
        /** @type {import('../../../../../../../../src/fmgc/src/flightplanning/new/plans/BaseFlightPlan').BaseFlightPlan} */
        let targetPlan;
        if (forPlan === Fmgc.FlightPlanIndex.Active) {
            if (inAlternate) {
                targetPlan = mcdu.flightPlanService.activeOrTemporary.alternateFlightPlan;
            } else {
                targetPlan = mcdu.flightPlanService.activeOrTemporary;
            }
        } else {
            targetPlan = mcdu.flightPlanService.get(forPlan);
        }

        const planColor = targetPlan.index === Fmgc.FlightPlanIndex.Temporary ? "yellow" : "green";

        const availableApproachVias = targetPlan.availableApproachVias;

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableArrivalsPageVias;
        let selectedApproachCell = "---";
        let selectedApproachCellColor = "white";
        let selectedViasCell = "NONE";
        let selectedViasCellColor = "white";

        const selectedApproach = targetPlan.approach;
        const selectedApproachVia = targetPlan.approachVia;

        if (selectedApproach) {
            selectedApproachCell = selectedApproach.ident;
            selectedApproachCellColor = planColor;

            if (selectedApproachVia) {
                selectedViasCell = selectedApproachVia.ident;
                selectedViasCellColor = planColor;
            }
        }

        let selectedStarCell = "------";
        let selectedStarCellColor = "white";

        const selectedArrival = targetPlan.arrival;

        if (selectedArrival) {
            selectedStarCell = selectedArrival.ident;
            selectedStarCellColor = planColor;
        }

        const rows = [[""], [""], [""], [""], [""], [""]];

        for (let i = 0; i < appr_page; i++) {
            const index = i + pageCurrent * appr_page;
            const via = availableApproachVias[index];

            if (selectedApproach && via) {
                rows[2 * i + 1][0] = `${via.ident === (selectedApproachVia ? selectedApproachVia.ident : undefined) ? " " : "{"}${via.ident}[color]cyan`;

                mcdu.onLeftInput[i + 2] = async () => {
                    await mcdu.flightPlanService.setApproachVia(via.ident, forPlan, inAlternate);

                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                };
            }
        }

        let bottomLine = ["<RETURN"];

        if (mcdu.flightPlanService.hasTemporary) {
            bottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];

            mcdu.onLeftInput[5] = async () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };

            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.updateTowerHeadwind();
                    mcdu.updateConstraints();
                    CDUPerformancePage.UpdateThrRedAccFromDestination(mcdu);
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                });
            };
        } else {
            mcdu.onLeftInput[5] = () => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
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
        mcdu.onLeftInput[1] = async () => {
            await mcdu.flightPlanService.setApproachVia(undefined, forPlan, inAlternate);

            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
        };
        let up = false;
        let down = false;

        if (pageCurrent < Math.ceil(selectedApproach.transitions.length / appr_page) - 1) {
            mcdu.onUp = () => {
                pageCurrent++;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, pageCurrent, forPlan, inAlternate);
            };
            up = true;
        }
        if (pageCurrent > 0) {
            mcdu.onDown = () => {
                pageCurrent--;
                if (pageCurrent < 0) {
                    pageCurrent = 0;
                }
                CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, pageCurrent, forPlan, inAlternate);
            };
            down = true;
        }
        mcdu.setArrows(up, down, true, true);
        mcdu.onPrevPage = () => {
            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
        };
        mcdu.onNextPage = mcdu.onPrevPage;
    }
}
