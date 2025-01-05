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

const ApproachTypeOrder = Object.freeze({
    [Fmgc.ApproachType.Mls]: 0,
    [Fmgc.ApproachType.MlsTypeA]: 1,
    [Fmgc.ApproachType.MlsTypeBC]: 2,
    [Fmgc.ApproachType.Ils]: 3,
    [Fmgc.ApproachType.Gls]: 4,
    [Fmgc.ApproachType.Igs]: 5,
    [Fmgc.ApproachType.Loc]: 6,
    [Fmgc.ApproachType.LocBackcourse]: 7,
    [Fmgc.ApproachType.Lda]: 8,
    [Fmgc.ApproachType.Sdf]: 9,
    [Fmgc.ApproachType.Fms]: 10,
    [Fmgc.ApproachType.Gps]: 11,
    [Fmgc.ApproachType.Rnav]: 12,
    [Fmgc.ApproachType.VorDme]: 13,
    [Fmgc.ApproachType.Vortac]: 13, // VORTAC and VORDME are intentionally the same
    [Fmgc.ApproachType.Vor]: 14,
    [Fmgc.ApproachType.NdbDme]: 15,
    [Fmgc.ApproachType.Ndb]: 16,
    [Fmgc.ApproachType.Unknown]: 17,
});

const ArrivalPagination = Object.freeze(
    {
        ARR_PAGE: 3,
        TRNS_PAGE: 2,
        VIA_PAGE: 3,
    }
);

class CDUAvailableArrivalsPage {
    static async ShowPage(mcdu, airport, pageCurrent = 0, starSelection = false, forPlan = Fmgc.FlightPlanIndex.Active, inAlternate = false) {
        /** @type {BaseFlightPlan} */
        const targetPlan = mcdu.flightPlan(forPlan, inAlternate);

        const isTemporary = targetPlan.index === Fmgc.FlightPlanIndex.Temporary;

        const selectedApproachId = targetPlan.approach ? targetPlan.approach.databaseId : targetPlan.approach;
        const selectedStarId = targetPlan.arrival ? targetPlan.arrival.databaseId : targetPlan.arrival;
        const selectedTransitionId = targetPlan.arrivalEnrouteTransition ? targetPlan.arrivalEnrouteTransition.databaseId : targetPlan.arrivalEnrouteTransition;

        const flightPlanAccentColor = isTemporary ? "yellow" : "green";

        const ilss = await mcdu.navigationDatabase.backendDatabase.getIlsAtAirport(targetPlan.destinationAirport.ident);

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableArrivalsPage;
        let selectedApproachCell = "------";
        let selectedViasCell = "------";
        let selectedTransitionCell = "------";
        let selectedApproachCellColor = "white";
        let selectedViasCellColor = "white";
        let selectedTransitionCellColor = "white";

        let viasPageLabel = "";
        let viasPageLine = "";

        const selectedApproach = targetPlan.approach;

        if (selectedApproach && selectedApproach.ident) {
            selectedApproachCell = Fmgc.ApproachUtils.shortApproachName(selectedApproach);
            selectedApproachCellColor = flightPlanAccentColor;

            const selectedApproachTransition = targetPlan.approachVia;
            const availableVias = targetPlan.availableApproachVias;

            if (availableVias.length === 0 || selectedApproachTransition === null) {
                selectedViasCell = "NONE";
                selectedViasCellColor = flightPlanAccentColor;
            } else if (selectedApproachTransition) {
                selectedViasCell = selectedApproachTransition.ident;
                selectedViasCellColor = flightPlanAccentColor;
            }
        } else if (!selectedApproach && targetPlan.destinationRunway) {
            selectedApproachCell = Fmgc.RunwayUtils.runwayString(targetPlan.destinationRunway.ident);
            selectedApproachCellColor = flightPlanAccentColor;

            // Runway-only approaches have no VIAs
            selectedViasCell = "NONE";
            selectedViasCellColor = flightPlanAccentColor;
        }

        let selectedStarCell = "------";
        let selectedStarCellColor = "white";

        const selectedArrival = targetPlan.arrival;
        const availableArrivals = targetPlan.availableArrivals;

        if (selectedArrival) {
            selectedStarCell = selectedArrival.ident;
            selectedStarCellColor = flightPlanAccentColor;

            const selectedTransition = targetPlan.arrivalEnrouteTransition;
            const availableTransitions = selectedArrival.enrouteTransitions;

            if (selectedTransition) {
                selectedTransitionCell = selectedTransition.ident;
                selectedTransitionCellColor = flightPlanAccentColor;
            } else if (availableTransitions.length === 0 || selectedTransition === null) {
                selectedTransitionCell = "NONE";
                selectedTransitionCellColor = flightPlanAccentColor;
            }
        } else if (selectedArrival === null || availableArrivals.length === 0) {
            selectedStarCell = "NONE";
            selectedStarCellColor = flightPlanAccentColor;

            selectedTransitionCell = "NONE";
            selectedTransitionCellColor = flightPlanAccentColor;
        }

        /**
         * @type {import('msfs-navdata').Approach[]}
         */
        const approaches = targetPlan.availableApproaches;

        /**
         * @type {import('msfs-navdata').Runway[]}
         */
        const runways = targetPlan.availableDestinationRunways;

        // Sort the approaches in Honeywell's documented order
        const sortedApproaches = approaches.slice()
            // The A320 cannot fly TACAN approaches
            .filter(({ type }) => type !== Fmgc.ApproachType.TACAN)
            // Filter out approaches with no matching runway
            // Approaches not going to a specific runway (i.e circling approaches are filtered out at DB level)
            .filter((a) => !!runways.find((rw) => rw.ident === a.runwayIdent))
            // Sort the approaches in Honeywell's documented order
            .sort((a, b) => ApproachTypeOrder[a.type] - ApproachTypeOrder[b.type])
            .map((approach) => ({ approach }))
            .concat(
                // Runway-by-itself approaches
                runways.slice().map((runway) => ({ runway }))
            );
        const rows = [[""], [""], [""], [""], [""], [""], [""], [""]];

        /**
         * @type {({ arrival: import('msfs-navdata').Arrival, arrivalIndex: number })[]}
         */
        const matchingArrivals = [];

        if (!starSelection) {
            for (let i = 0; i < ArrivalPagination.ARR_PAGE; i++) {
                const index = i + pageCurrent * ArrivalPagination.ARR_PAGE;

                const approachOrRunway = sortedApproaches[index];
                if (!approachOrRunway) {
                    break;
                }

                const { approach, runway } = approachOrRunway;
                if (approach) {
                    let runwayLength = '----';
                    let runwayCourse = '---';

                    const isSelected = selectedApproach && selectedApproachId === approach.databaseId;
                    const color = isSelected && !isTemporary ? "green" : "cyan";

                    const runway = targetPlan.availableDestinationRunways.find((rw) => rw.ident === approach.runwayIdent);
                    if (runway) {
                        runwayLength = runway.length.toFixed(0); // TODO imperial length pin program
                        runwayCourse = Utils.leadingZeros(Math.round(runway.magneticBearing), 3);

                        const finalLeg = approach.legs[approach.legs.length - 1];
                        const matchingIls = approach.type === Fmgc.ApproachType.Ils ? ilss.find(
                            (ils) => finalLeg && finalLeg.recommendedNavaid && ils.databaseId === finalLeg.recommendedNavaid.databaseId
                        ) : undefined;
                        const hasIls = !!matchingIls;
                        const ilsText = hasIls ? `${matchingIls.ident.padStart(6)}/${matchingIls.frequency.toFixed(2)}` : '';

                        rows[2 * i] = [`{${color}}${ !isSelected ? "{" : "{sp}"}${Fmgc.ApproachUtils.shortApproachName(approach)}{end}`, "", `{sp}{sp}{sp}${runwayLength}{small}M{end}[color]${color}`];
                        rows[2 * i + 1] = [`{${color}}{sp}{sp}{sp}${runwayCourse}${ilsText}{end}`];
                    }

                    mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
                        // Clicking the already selected approach is not allowed
                        if (!isSelected) {
                            try {
                                await mcdu.flightPlanService.setApproach(approach.databaseId, forPlan, inAlternate);

                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                            } catch (e) {
                                console.error(e);
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                mcdu.eraseTemporaryFlightPlan(() => {
                                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, false, forPlan, inAlternate);
                                });
                            }
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                            scratchpadCallback();
                        }
                    };
                } else if (runway) {
                    const runwayLength = runway.length.toFixed(0); // TODO imperial length pin program
                    const runwayCourse = Utils.leadingZeros(Math.round(runway.magneticBearing), 3);

                    const isSelected = !selectedApproach && targetPlan.destinationRunway && runway.databaseId === targetPlan.destinationRunway.databaseId;
                    const color = isSelected && !isTemporary ? "green" : "cyan";

                    rows[2 * i] = [`{${color}}${ !isSelected ? "{" : "{sp}"}${Fmgc.RunwayUtils.runwayString(runway.ident)}{end}`, "", `{sp}{sp}{sp}${runwayLength}{small}M{end}[color]${color}`];
                    rows[2 * i + 1] = ["{sp}{sp}{sp}{sp}" + runwayCourse + "[color]cyan"];

                    mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
                        // Clicking the already selected runway is not allowed
                        if (!isSelected) {
                            try {
                                await mcdu.flightPlanService.setApproach(undefined, forPlan, inAlternate);
                                await mcdu.flightPlanService.setDestinationRunway(runway.ident, forPlan, inAlternate);

                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                            } catch (e) {
                                console.error(e);
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                mcdu.eraseTemporaryFlightPlan(() => {
                                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, false, forPlan, inAlternate);
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
            /**
             * @type {import('msfs-navdata').Runway | undefined}
             */
            const destinationRunway = targetPlan.destinationRunway;

            if (destinationRunway) {
                const arrivals = targetPlan.availableArrivals;

                for (let i = 0; i < arrivals.length; i++) {
                    const arrival = arrivals[i];

                    if (arrival.runwayTransitions.length) {
                        for (let j = 0; j < arrival.runwayTransitions.length; j++) {
                            const runwayTransition = arrival.runwayTransitions[j];
                            if (runwayTransition) {
                                // Check if selectedRunway matches a transition on the approach (and also checks for Center runways)
                                if (runwayTransition.ident === destinationRunway.ident || (runwayTransition.ident.charAt(6) === 'B' && runwayTransition.ident.substring(4, 6) === destinationRunway.ident.substring(4, 6))) {
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
                for (let i = 0; i < targetPlan.availableArrivals.length; i++) {
                    const arrival = targetPlan.availableArrivals[i];
                    matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
                }
            }
            for (let i = 0; i < ArrivalPagination.ARR_PAGE; i++) {
                let index = i + (pageCurrent * ArrivalPagination.ARR_PAGE);
                if (index === 0) {
                    const isSelected = selectedArrival === null;
                    const color = isSelected && !isTemporary ? "green" : "cyan";

                    rows[2 * i] = [`{${color}}${!isSelected ? "{" : "{sp}"}${Labels.NO_STAR}{end}`];

                    if (!isSelected) {
                        mcdu.onLeftInput[i + 2] = async () => {
                            try {
                                await mcdu.flightPlanService.setArrival(null, forPlan, inAlternate);

                                const availableVias = targetPlan.availableApproachVias;

                                if (selectedApproach !== undefined && availableVias.length > 0) {
                                    CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                                } else {
                                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                                }
                            } catch (e) {
                                console.error(e);
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                mcdu.eraseTemporaryFlightPlan(() => {
                                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                                });
                            }
                        };
                    }
                } else {
                    index--;
                    if (matchingArrivals[index]) {
                        const star = matchingArrivals[index].arrival;
                        const starDatabaseId = matchingArrivals[index].arrival.databaseId;
                        const isSelected = selectedStarId === starDatabaseId;
                        const color = isSelected && !isTemporary ? "green" : "cyan";

                        rows[2 * i] = [`{${color}}${!isSelected ? "{" : "{sp}"}${star.ident}{end}`];

                        mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
                            // Clicking the already selected star is not allowed
                            if (!isSelected) {
                                const destinationRunway = targetPlan.destinationRunway;

                                const arrivalRunway = destinationRunway ? star.runwayTransitions.find(t => {
                                    return t.ident === destinationRunway.ident;
                                }) : undefined;

                                try {
                                    if (arrivalRunway !== undefined) {
                                        await mcdu.flightPlanService.setDestinationRunway(arrivalRunway.ident, forPlan, inAlternate);
                                    }

                                    await mcdu.flightPlanService.setArrival(starDatabaseId, forPlan, inAlternate);

                                    const availableVias = targetPlan.availableApproachVias;

                                    if (selectedApproach !== undefined && availableVias.length > 0) {
                                        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                                    } else {
                                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                                    }
                                } catch (e) {
                                    console.error(e);
                                    mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                    mcdu.eraseTemporaryFlightPlan(() => {
                                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
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

            if (selectedArrival) {
                if (selectedArrival.enrouteTransitions.length > 0) {
                    const isNoTransSelected = selectedTransitionId === null;
                    const color = isNoTransSelected && !isTemporary ? "green" : "cyan";

                    rows[0][1] = `${Labels.NO_TRANS}${!isNoTransSelected ? "}" : "{sp}"}[color]${color}`;

                    mcdu.onRightInput[2] = async () => {
                        try {
                            await mcdu.flightPlanService.setArrivalEnrouteTransition(null, forPlan, inAlternate);

                            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                        } catch (e) {
                            console.error(e);
                            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                            mcdu.eraseTemporaryFlightPlan(() => {
                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                            });
                        }
                    };

                    for (let i = 0; i < ArrivalPagination.TRNS_PAGE; i++) {
                        const index = i + pageCurrent * ArrivalPagination.TRNS_PAGE;

                        const transition = selectedArrival.enrouteTransitions[index];
                        if (transition) {
                            const isSelected = selectedTransitionId === transition.databaseId;
                            const color = isSelected && !isTemporary ? "green" : "cyan";

                            rows[2 * (i + 1)][1] = `{${color}}${transition.ident}${!isSelected ? "}" : "{sp}"}{end}`;

                            // Clicking the already selected transition is not allowed
                            mcdu.onRightInput[i + 3] = async (_, scratchpadCallback) => {
                                if (!isSelected) {
                                    try {
                                        await mcdu.flightPlanService.setArrivalEnrouteTransition(transition.databaseId, forPlan, inAlternate);

                                        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
                                    } catch (e) {
                                        console.error(e);
                                        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                                        mcdu.eraseTemporaryFlightPlan(() => {
                                            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
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

            if (selectedApproach) {
                const availableApproachVias = targetPlan.availableApproachVias;

                if (availableApproachVias.length > 0) {
                    viasPageLabel = "{sp}APPR";
                    viasPageLine = "<VIAS";
                    mcdu.onLeftInput[1] = () => {
                        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                    };
                }
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
        const maxPage = starSelection ? (selectedArrival ? Math.max(Math.ceil(selectedArrival.enrouteTransitions.length / ArrivalPagination.TRNS_PAGE) - 1, Math.ceil((matchingArrivals.length + 1) / ArrivalPagination.ARR_PAGE) - 1) : Math.ceil((matchingArrivals.length + 1) / ArrivalPagination.ARR_PAGE) - 1) : (pageCurrent, Math.ceil(sortedApproaches.length / ArrivalPagination.ARR_PAGE) - 1);
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
            ["ARRIVAL {small}TO{end} {green}" + airport.ident + "{sp}{end}"],
            ["{sp}APPR", "STAR{sp}", "{sp}VIA"],
            [`{${selectedApproachCellColor}}${selectedApproachCell.padEnd(10)}{end}{${selectedViasCellColor}}${selectedViasCell}{end}`, selectedStarCell + "[color]" + selectedStarCellColor],
            [viasPageLabel, "TRANS{sp}"],
            [viasPageLine, selectedTransitionCell + "[color]" + selectedTransitionCellColor],
            ["{big}" + (starSelection ? "STARS" : "APPR").padEnd(5) + "{end}{sp}{sp}AVAILABLE", starSelection ? "{big}TRANS{end}" : "", ""],
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
        /** @type {BaseFlightPlan} */
        const targetPlan = mcdu.flightPlan(forPlan, inAlternate);

        const isTemporary = targetPlan.index === Fmgc.FlightPlanIndex.Temporary;
        const planColor = isTemporary ? "yellow" : "green";

        const availableApproachVias = targetPlan.availableApproachVias;

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableArrivalsPageVias;
        let selectedApproachCell = "------";
        let selectedApproachCellColor = "white";
        let selectedViasCell = "------";
        let selectedViasCellColor = "white";

        const selectedApproach = targetPlan.approach;
        const selectedApproachVia = targetPlan.approachVia;

        if (selectedApproach) {
            selectedApproachCell = Fmgc.ApproachUtils.shortApproachName(selectedApproach);
            selectedApproachCellColor = planColor;

            if (selectedApproachVia === null) {
                selectedViasCell = "NONE";
                selectedViasCellColor = planColor;
            } else if (selectedApproachVia) {
                selectedViasCell = selectedApproachVia.ident;
                selectedViasCellColor = planColor;
            }
        }

        let selectedStarCell = "------";
        let selectedStarCellColor = "white";

        const selectedArrival = targetPlan.arrival;
        const availableArrivals = targetPlan.availableArrivals;

        if (selectedArrival) {
            selectedStarCell = selectedArrival.ident;
            selectedStarCellColor = planColor;
        } else if (selectedArrival === null || availableArrivals.length === 0) {
            selectedStarCell = "NONE";
            selectedStarCellColor = planColor;
        }

        const rows = [[""], [""], [""], [""], [""], [""]];

        for (let i = 0; i < ArrivalPagination.VIA_PAGE; i++) {
            const index = i + pageCurrent * ArrivalPagination.VIA_PAGE;
            const via = availableApproachVias[index];

            if (selectedApproach && via) {
                const isSelected = selectedApproachVia && via.databaseId === selectedApproachVia.databaseId;
                const color = isSelected && !isTemporary ? "green" : "cyan";

                rows[2 * i + 1][0] = `{${color}}${!isSelected ? "{" : "{sp}"}${via.ident}{end}`;

                mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
                    // Clicking the already selected via is not allowed
                    if (!isSelected) {
                        try {
                            await mcdu.flightPlanService.setApproachVia(via.databaseId, forPlan, inAlternate);

                            CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                        } catch (e) {
                            console.error(e);
                            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                            mcdu.eraseTemporaryFlightPlan(() => {
                                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                            });
                        }
                    } else {
                        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                        scratchpadCallback();
                    }
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
                    CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                });
            };
        } else {
            mcdu.onLeftInput[5] = () => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
            };
        }

        const isNoViaSelected = selectedApproachVia === null;
        const color = isNoViaSelected && !isTemporary ? "green" : "cyan";

        mcdu.setTemplate([
            ["APPROACH VIAS"],
            ["{sp}APPR", "STAR{sp}", "{sp}VIA"],
            [`{${selectedApproachCellColor}}${selectedApproachCell.padEnd(10)}{end}{${selectedViasCellColor}}${selectedViasCell}{end}`, selectedStarCell + "[color]" + selectedStarCellColor],
            ["APPR VIAS"],
            [`${!isNoViaSelected ? "{" : "{sp}"}${Labels.NO_VIA}[color]${color}`],
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
            try {
                await mcdu.flightPlanService.setApproachVia(null, forPlan, inAlternate);

                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
            } catch (e) {
                console.error(e);
                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                });
            }
        };
        let up = false;
        let down = false;

        if (pageCurrent < Math.ceil(selectedApproach.transitions.length / ArrivalPagination.VIA_PAGE) - 1) {
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
