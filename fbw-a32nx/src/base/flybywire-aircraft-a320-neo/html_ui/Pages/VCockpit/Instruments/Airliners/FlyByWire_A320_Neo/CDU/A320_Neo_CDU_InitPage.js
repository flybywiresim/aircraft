// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class CDUInitPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.InitPageA;
        mcdu.pageRedrawCallback = () => CDUInitPage.ShowPage1(mcdu);
        mcdu.activeSystem = 'FMGC';
        mcdu.coRoute.routes = [];

        const haveFlightPlan = mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport;

        const fromTo = new Column(23, "____|____", Column.amber, Column.right);
        const [coRouteAction, coRouteText, coRouteColor] = new CDU_SingleValueField(
            mcdu,
            "string",
            mcdu.coRoute.routeNumber,
            {
                emptyValue: haveFlightPlan ? "" : "__________[color]amber",
                suffix: "[color]cyan",
                maxLength: 10,
            },
            async (value) => {
                await mcdu.updateCoRoute(value, (result) => {
                    if (result) {
                        CDUInitPage.ShowPage1(mcdu);
                    } else {
                        scratchpadCallback();
                    }
                });
            }
        ).getFieldAsColumnParameters();

        const [flightNoAction, flightNoText, flightNoColor] = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.flightNumber,
            {
                emptyValue: "________[color]amber",
                suffix: "[color]cyan",
                maxLength: 7
            },
            (value) => {
                mcdu.updateFlightNo(value, (result) => {
                    if (result) {
                        CDUInitPage.ShowPage1(mcdu);
                    } else {
                        mcdu.setScratchpadUserData(value);
                    }
                });
            }
        ).getFieldAsColumnParameters();

        const altnAirport = mcdu.flightPlanService.active.alternateDestinationAirport;
        const altDest = new Column(0, `${altnAirport ? altnAirport.ident : '----'}|----------`);
        let costIndexText = "---";
        let costIndexAction;
        let costIndexColor = Column.white;

        const cruiseFl = new Column(0, "-----");
        const cruiseTemp = new Column (10, "---°", Column.right);
        const cruiseFlTempSeparator = new Column(6, "/");

        let alignOption;
        const tropo = new Column(23, "36090", Column.small, Column.cyan, Column.right);
        let requestButton = "REQUEST*";
        let requestButtonLabel = "INIT";
        let requestEnable = true;

        if (mcdu.simbrief.sendStatus === "REQUESTING") {
            requestEnable = false;
            requestButton = "REQUEST ";
        }

        const origin = mcdu.flightPlanService.active.originAirport;
        const dest = mcdu.flightPlanService.active.destinationAirport;

        if (origin) {
            if (dest) {
                fromTo.update(origin.ident + "/" + dest.ident, Column.cyan);

                // If an active SimBrief OFP matches the FP, hide the request option
                // This allows loading a new OFP via INIT/REVIEW loading a different orig/dest to the current one
                if (mcdu.simbrief.sendStatus != "DONE" ||
                    (mcdu.simbrief["originIcao"] === origin.ident && mcdu.simbrief["destinationIcao"] === dest.ident)) {
                    requestEnable = false;
                    requestButtonLabel = "";
                    requestButton = "";
                }

                // Cost index
                [costIndexAction, costIndexText, costIndexColor] = new CDU_SingleValueField(mcdu,
                    "int",
                    mcdu.isCostIndexSet ? mcdu.costIndex : null,
                    {
                        clearable: true,
                        emptyValue: "___[color]amber",
                        minValue: 0,
                        maxValue: 999,
                        suffix: "[color]cyan"
                    },
                    (value) => {
                        if (value != null) {
                            mcdu.costIndex = value;
                            // mcdu.isCostIndexSet = true;
                        } else {
                            // mcdu.isCostIndexSet = false;
                            mcdu.costIndex = undefined;
                        }
                        CDUInitPage.ShowPage1(mcdu);
                    }
                ).getFieldAsColumnParameters();

                mcdu.onLeftInput[4] = costIndexAction;

                cruiseFl.update("_____", Column.amber);
                cruiseTemp.update("|___°", Column.amber);
                cruiseFlTempSeparator.updateAttributes(Column.amber);

                //This is done so pilot enters a FL first, rather than using the computed one
                if (mcdu.cruiseLevel) {
                    cruiseFl.update("FL" + mcdu.cruiseLevel.toFixed(0).padStart(3, "0"), Column.cyan);
                    if (mcdu.cruiseTemperature) {
                        cruiseTemp.update(mcdu.cruiseTemperature.toFixed(0) + "°", Column.cyan);
                        cruiseFlTempSeparator.updateAttributes(Column.cyan);
                    } else {
                        cruiseTemp.update(mcdu.tempCurve.evaluate(mcdu.cruiseLevel).toFixed(0) + "°", Column.cyan, Column.small);
                        cruiseFlTempSeparator.updateAttributes(Column.cyan, Column.small);
                    }
                }

                // CRZ FL / FLX TEMP
                mcdu.onLeftInput[5] = (value, scratchpadCallback) => {
                    if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    } else {
                        scratchpadCallback();
                    }
                };

                if (mcdu.flightPlanService.active.originAirport) {
                    alignOption = "IRS INIT>";
                }

                altDest.update(altnAirport ? altnAirport.ident : "NONE", Column.cyan);

                mcdu.onLeftInput[1] = async (value, scratchpadCallback) => {
                    try {
                        if (value === "") {
                            await mcdu.getCoRouteList(mcdu);
                            CDUAvailableFlightPlanPage.ShowPage(mcdu);
                        } else {
                            if (await mcdu.tryUpdateAltDestination(value)) {
                                CDUInitPage.ShowPage1(mcdu);
                            } else {
                                scratchpadCallback();
                            }
                        }
                    } catch (error) {
                        console.error(error);
                        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                    }
                };
            }
        }

        mcdu.onLeftInput[0] = coRouteAction;

        if (mcdu.tropo) {
            tropo.update(mcdu.tropo.toString(), mcdu.isTropoPilotEntered ? Column.big : Column.small);
        }
        mcdu.onRightInput[4] = (value, scratchpadCallback) => {
            if (mcdu.tryUpdateTropo(value)) {
                CDUInitPage.ShowPage1(mcdu);
            } else {
                scratchpadCallback();
            }
        };

        /**
         * If scratchpad is filled, attempt to update city pair
         * else show route selection pair if city pair is displayed
         * Ref: FCOM 4.03.20 P6
         */
        mcdu.onRightInput[0] = (value, scratchpadCallback) => {
            if (value !== "") {
                mcdu.tryUpdateFromTo(value, (result) => {
                    if (result) {
                        CDUAvailableFlightPlanPage.ShowPage(mcdu);
                    } else {
                        scratchpadCallback();
                    }
                });
            } else if (mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport) {
                mcdu.getCoRouteList(mcdu).then(() => {
                    CDUAvailableFlightPlanPage.ShowPage(mcdu);
                });
            }
        };
        mcdu.onRightInput[1] = () => {
            if (requestEnable) {
                getSimBriefOfp(mcdu, () => {
                    if (mcdu.page.Current === mcdu.page.InitPageA) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                })
                    .then((data) => {
                        Fmgc.SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief(mcdu, mcdu.flightPlanService, data, { doUplinkProcedures: false }).then(() => {
                            console.log('SimBrief data uplinked.');

                            mcdu.flightPlanService.uplinkInsert();

                            const plan = mcdu.flightPlanService.active;
                            mcdu.updateFlightNo(plan.flightNumber);
                            mcdu.setGroundTempFromOrigin();

                            if (mcdu.page.Current === mcdu.page.InitPageA) {
                                CDUInitPage.ShowPage1(mcdu);
                            }
                        }).catch((error) => {
                            console.error(error);
                            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                        });
                    });
            }
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            if (alignOption) {
                CDUIRSInit.ShowPage(mcdu);
            }
        };

        const groundTemp = new Column(23, "---°", Column.right);
        if (mcdu.groundTemp !== undefined) {
            groundTemp.update(mcdu.groundTemp.toFixed(0) + "°", Column.cyan, (mcdu.groundTempPilot !== undefined ? Column.big : Column.small));
        }

        mcdu.onRightInput[5] = (scratchpadValue, scratchpadCallback) => {
            try {
                mcdu.trySetGroundTemp(scratchpadValue);
                CDUInitPage.ShowPage1(mcdu);
            } catch (msg) {
                if (msg instanceof McduMessage) {
                    mcdu.setScratchpadMessage(msg);
                    scratchpadCallback();
                } else {
                    throw msg;
                }
            }
        };

        mcdu.onLeftInput[2] = flightNoAction;

        mcdu.setArrows(false, false, true, true);

        mcdu.setTemplate(FormatTemplate([
            [
                new Column(10, "INIT")
            ],
            [
                new Column(1, "CO RTE"),
                new Column(21, "FROM/TO", Column.right)
            ],
            [
                new Column(0, coRouteText, coRouteColor),
                fromTo
            ],
            [
                new Column(0, "ALTN/CO RTE"),
                new Column(22, requestButtonLabel, Column.amber, Column.right)
            ],
            [
                altDest,
                new Column(23, requestButton, Column.amber, Column.right)
            ],
            [
                new Column(0, "FLT NBR")
            ],
            [
                new Column(0, flightNoText, flightNoColor),
                new Column(23, alignOption || "", Column.right)
            ],
            [""],
            [
                new Column(23, "WIND/TEMP>", Column.right)
            ],
            [
                new Column(0, "COST INDEX"),
                new Column(23, "TROPO", Column.right)
            ],
            [
                new Column(0, costIndexText, costIndexColor),
                tropo
            ],
            [
                new Column(0, "CRZ FL/TEMP"),
                new Column(23, "GND TEMP", Column.right)
            ],
            [
                cruiseFl,
                cruiseFlTempSeparator,
                cruiseTemp,
                groundTemp
            ]
        ]));

        mcdu.onPrevPage = () => {
            mcdu.goToFuelPredPage();
        };
        mcdu.onNextPage = () => {
            mcdu.goToFuelPredPage();
        };

        mcdu.onRightInput[3] = () => {
            CDUWindPage.Return = () => {
                CDUInitPage.ShowPage1(mcdu);
            };
            CDUWindPage.ShowPage(mcdu);
        };

        mcdu.onUp = () => {};
        try {
            Coherent.trigger("AP_ALT_VAL_SET", 4200);
            Coherent.trigger("AP_VS_VAL_SET", 300);
            Coherent.trigger("AP_HDG_VAL_SET", 180);
        } catch (e) {
            console.error(e);
        }
    }
    // Does not refresh page so that other things can be performed first as necessary
    static updateTowIfNeeded(mcdu) {
        if (isFinite(mcdu.taxiFuelWeight) && isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.blockFuel)) {
            mcdu.takeOffWeight = mcdu.zeroFuelWeight + mcdu.blockFuel - mcdu.taxiFuelWeight;
        }
    }
    static fuelPredConditionsMet(mcdu) {
        const fob = mcdu.getFOB();

        return Number.isFinite(fob) &&
            Number.isFinite(mcdu.zeroFuelWeightMassCenter) &&
            Number.isFinite(mcdu.zeroFuelWeight) &&
            mcdu.flightPlanService.active && mcdu.flightPlanService.active.legCount > 0 &&
            mcdu._zeroFuelWeightZFWCGEntered;
    }
    static trySetFuelPred(mcdu) {
        if (CDUInitPage.fuelPredConditionsMet(mcdu) && !mcdu._fuelPredDone) {
            setTimeout(() => {
                if (CDUInitPage.fuelPredConditionsMet(mcdu) && !mcdu._fuelPredDone) { //Double check as user can clear block fuel during timeout
                    mcdu._fuelPredDone = true;
                    if (mcdu.page.Current === mcdu.page.InitPageB) {
                        CDUInitPage.ShowPage2(mcdu);
                    }
                }
            }, mcdu.getDelayFuelPred());
        }
    }
    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.InitPageB;
        mcdu.activeSystem = 'FMGC';
        mcdu.pageRedrawCallback = () => CDUInitPage.ShowPage2(mcdu);

        const alternate = mcdu.flightPlanService.active ? mcdu.flightPlanService.active.alternateDestinationAirport : undefined;

        const zfwCell = new Column(17, "___._", Column.amber, Column.right);
        const zfwCgCell = new Column(22, "__._", Column.amber, Column.right);
        const zfwCgCellDivider = new Column(18, "|", Column.amber, Column.right);

        if (mcdu._zeroFuelWeightZFWCGEntered) {
            if (isFinite(mcdu.zeroFuelWeight)) {
                zfwCell.update(NXUnits.kgToUser(mcdu.zeroFuelWeight).toFixed(1), Column.cyan);
            }
            if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
                zfwCgCell.update(mcdu.zeroFuelWeightMassCenter.toFixed(1), Column.cyan);
            }
            if (isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.zeroFuelWeightMassCenter)) {
                zfwCgCellDivider.updateAttributes(Column.cyan);
            }
        }
        mcdu.onRightInput[0] = async (value, scratchpadCallback) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
                return;
            } else if (value === "") {
                let zfw = undefined;
                let zfwCg = undefined;
                const a32nxBoarding = SimVar.GetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "bool");
                const gsxBoarding = SimVar.GetSimVarValue("L:FSDT_GSX_BOARDING_STATE", "number");
                if (a32nxBoarding || (gsxBoarding >= 4 && gsxBoarding < 6)) {
                    zfw = NXUnits.kgToUser(SimVar.GetSimVarValue("L:A32NX_AIRFRAME_ZFW_DESIRED", "number"));
                    zfwCg = SimVar.GetSimVarValue("L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", "number");
                } else if (isFinite(getZfw()) && isFinite(getZfwcg())) {
                    zfw = getZfw();
                    zfwCg = getZfwcg();
                }

                // ZFW/ZFWCG auto-fill helper
                if (zfw && zfwCg) {
                    mcdu.setScratchpadText(`${(zfw / 1000).toFixed(1)}/${zfwCg.toFixed(1)}`);
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            } else {
                if (mcdu.trySetZeroFuelWeightZFWCG(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                    CDUInitPage.trySetFuelPred(mcdu);
                } else {
                    scratchpadCallback();
                }
            }
        };

        const blockFuel = new Column(23, "__._", Column.amber, Column.right);
        if (mcdu._blockFuelEntered || mcdu._fuelPlanningPhase === mcdu._fuelPlanningPhases.IN_PROGRESS) {
            if (isFinite(mcdu.blockFuel)) {
                blockFuel.update(NXUnits.kgToUser(mcdu.blockFuel).toFixed(1), Column.cyan);
            }
        }
        mcdu.onRightInput[1] = async (value, scratchpadCallback) => {
            if (mcdu._zeroFuelWeightZFWCGEntered && value !== mcdu.clrValue) { //Simulate delay if calculating trip data
                if (await mcdu.trySetBlockFuel(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                    CDUInitPage.trySetFuelPred(mcdu);
                } else {
                    scratchpadCallback();
                }
            } else {
                if (await mcdu.trySetBlockFuel(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                } else {
                    scratchpadCallback();
                }
            }

        };

        const fuelPlanTopTitle = new Column(23, "", Column.amber, Column.right);
        const fuelPlanBottomTitle = new Column(23, "", Column.amber, Column.right);
        if (mcdu._zeroFuelWeightZFWCGEntered && !mcdu._blockFuelEntered) {
            fuelPlanTopTitle.text = "FUEL ";
            fuelPlanBottomTitle.text = "PLANNING }";
            mcdu.onRightInput[2] = async () => {
                if (await mcdu.tryFuelPlanning()) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                }
            };
        }
        if (mcdu._fuelPlanningPhase === mcdu._fuelPlanningPhases.IN_PROGRESS) {
            fuelPlanTopTitle.update("BLOCK ", Column.green);
            fuelPlanBottomTitle.update("CONFIRM", Column.green);
            mcdu.onRightInput[2] = async () => {
                if (await mcdu.tryFuelPlanning()) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                    CDUInitPage.trySetFuelPred(mcdu);
                }
            };
        }

        const towCell = new Column(17, "---.-", Column.right);
        const lwCell = new Column(23, "---.-", Column.right);
        const towLwCellDivider = new Column(18, "/");
        const taxiFuelCell = new Column(0, "0.4", Column.cyan, Column.small);

        if (isFinite(mcdu.taxiFuelWeight)) {
            if (mcdu._taxiEntered) {
                taxiFuelCell.update(NXUnits.kgToUser(mcdu.taxiFuelWeight).toFixed(1), Column.big);
            } else {
                taxiFuelCell.text = NXUnits.kgToUser(mcdu.taxiFuelWeight).toFixed(1);
            }
        }
        mcdu.onLeftInput[0] = async (value, scratchpadCallback) => {
            if (mcdu._fuelPredDone) {
                setTimeout(async () => {
                    if (mcdu.trySetTaxiFuelWeight(value)) {
                        CDUInitPage.updateTowIfNeeded(mcdu);
                        if (mcdu.page.Current === mcdu.page.InitPageB) {
                            CDUInitPage.ShowPage2(mcdu);
                        }
                    } else {
                        scratchpadCallback();
                    }
                }, mcdu.getDelayHigh());
            } else {
                if (mcdu.trySetTaxiFuelWeight(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                } else {
                    scratchpadCallback();
                }
            }
        };

        const tripWeightCell = new Column(4, "---.-", Column.right);
        const tripTimeCell = new Column(9, "----", Column.right);
        const tripCellDivider = new Column(5, "/");
        const rteRsvWeightCell = new Column(4, "---.-", Column.right);
        const rteRsvPercentCell = new Column(6, "5.0", Column.cyan);
        const rteRsvCellDivider = new Column(5, "/", Column.cyan);

        if (isFinite(mcdu.getRouteReservedPercent())) {
            rteRsvPercentCell.text = mcdu.getRouteReservedPercent().toFixed(1);
        }
        mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
            if (await mcdu.trySetRouteReservedPercent(value)) {
                CDUInitPage.ShowPage2(mcdu);
            } else {
                scratchpadCallback();
            }
        };

        const altnWeightCell = new Column(4, "---.-", Column.right);
        const altnTimeCell = new Column(9, "----", Column.right);
        const altnCellDivider = new Column(5, "/");
        const finalWeightCell = new Column(4, "---.-", Column.right);
        const finalTimeCell = new Column(9, "----", Column.right);
        const finalCellDivider = new Column(5, "/");

        if (mcdu.getRouteFinalFuelTime() > 0) {
            finalTimeCell.update(FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime()), Column.cyan);
            finalCellDivider.updateAttributes(Column.cyan);
        }
        mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
            if (await mcdu.trySetRouteFinalTime(value)) {
                CDUInitPage.ShowPage2(mcdu);
            } else {
                scratchpadCallback();
            }
        };

        const extraWeightCell = new Column(18, "---.-", Column.right);
        const extraTimeCell = new Column(23, "----", Column.right);
        const extraCellDivider = new Column(19, "/");
        const minDestFob = new Column(4, "---.-", Column.right);
        const tripWindDirCell = new Column(19, "--");
        const tripWindAvgCell = new Column(21, "---");

        if (mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport) {
            tripWindDirCell.update(CDUInitPage.formatWindDirection(mcdu.averageWind), Column.cyan, Column.small);
            tripWindAvgCell.update(CDUInitPage.formatWindComponent(mcdu.averageWind), Column.cyan);

            mcdu.onRightInput[4] = (value, scratchpadCallback) => {
                if (mcdu.trySetAverageWind(value)) {
                    CDUInitPage.ShowPage2(mcdu);
                } else {
                    scratchpadCallback();
                }
            };
        }

        if (CDUInitPage.fuelPredConditionsMet(mcdu)) {
            fuelPlanTopTitle.text = "";
            fuelPlanBottomTitle.text = "";

            mcdu.tryUpdateTOW();
            if (isFinite(mcdu.takeOffWeight)) {
                towCell.update(NXUnits.kgToUser(mcdu.takeOffWeight).toFixed(1), Column.green, Column.small);
            }

            if (mcdu._fuelPredDone) {
                if (!mcdu.routeFinalEntered()) {
                    mcdu.tryUpdateRouteFinalFuel();
                }
                if (isFinite(mcdu.getRouteFinalFuelWeight()) && isFinite(mcdu.getRouteFinalFuelTime())) {
                    if (mcdu._rteFinalWeightEntered) {
                        finalWeightCell.update(NXUnits.kgToUser(mcdu.getRouteFinalFuelWeight()).toFixed(1), Column.cyan);
                    } else {
                        finalWeightCell.update(NXUnits.kgToUser(mcdu.getRouteFinalFuelWeight()).toFixed(1), Column.cyan, Column.small);
                    }
                    if (mcdu._rteFinalTimeEntered || !mcdu.routeFinalEntered()) {
                        finalTimeCell.update(FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime()), Column.cyan);
                    } else {
                        finalTimeCell.update(FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime()), Column.cyan, Column.small);
                        finalCellDivider.updateAttributes(Column.small);
                    }
                    finalCellDivider.updateAttributes(Column.cyan);
                }
                mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetRouteFinalFuel(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        } else {
                            scratchpadCallback();
                        }
                    }, mcdu.getDelayHigh());
                };

                if (alternate) {
                    const altFuelEntered = mcdu._routeAltFuelEntered;
                    if (!altFuelEntered) {
                        mcdu.tryUpdateRouteAlternate();
                    }
                    if (isFinite(mcdu.getRouteAltFuelWeight())) {
                        altnWeightCell.update(NXUnits.kgToUser(mcdu.getRouteAltFuelWeight()).toFixed(1), Column.cyan, altFuelEntered ? Column.big : Column.small);
                        const time = mcdu.getRouteAltFuelTime();
                        if (time) {
                            altnTimeCell.update(FMCMainDisplay.minutesTohhmm(mcdu.getRouteAltFuelTime()), Column.green, Column.small);
                            altnCellDivider.updateAttributes(Column.green, Column.small);
                        } else {
                            altnTimeCell.update('----',Column.white);
                            altnCellDivider.updateAttributes(Column.white, altFuelEntered ? Column.big : Column.small);
                        }
                    }
                } else {
                    altnWeightCell.update("0.0", Column.green, Column.small);
                }

                mcdu.onLeftInput[3] = async (value, scratchpadCallback) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetRouteAlternateFuel(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        } else {
                            scratchpadCallback();
                        }
                    }, mcdu.getDelayHigh());
                };

                mcdu.tryUpdateRouteTrip();
                if (isFinite(mcdu.getTotalTripFuelCons()) && isFinite(mcdu.getTotalTripTime())) {
                    tripWeightCell.update(NXUnits.kgToUser(mcdu.getTotalTripFuelCons()).toFixed(1), Column.green, Column.small);
                    tripTimeCell.update(FMCMainDisplay.minutesTohhmm(mcdu._routeTripTime), Column.green, Column.small);
                    tripCellDivider.updateAttributes(Column.green, Column.small);
                }

                if (isFinite(mcdu.getRouteReservedWeight())) {
                    if (mcdu._rteReservedWeightEntered) {
                        rteRsvWeightCell.update(NXUnits.kgToUser(mcdu.getRouteReservedWeight()).toFixed(1), Column.cyan);
                    } else {
                        rteRsvWeightCell.update(NXUnits.kgToUser(mcdu.getRouteReservedWeight()).toFixed(1), Column.cyan, Column.small);
                    }
                }

                if (mcdu._rteRsvPercentOOR) {
                    rteRsvPercentCell.update("--.-", Column.white);
                    rteRsvCellDivider.updateAttributes(Column.white);
                } else if (isFinite(mcdu.getRouteReservedPercent())) {
                    if (mcdu._rteReservedPctEntered || !mcdu.routeReservedEntered()) {
                        rteRsvPercentCell.update(mcdu.getRouteReservedPercent().toFixed(1), Column.cyan);
                    } else {
                        rteRsvPercentCell.update(mcdu.getRouteReservedPercent().toFixed(1), Column.cyan, Column.small);
                        rteRsvCellDivider.updateAttributes(Column.small);
                    }
                }

                mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetRouteReservedFuel(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        } else {
                            scratchpadCallback();
                        }
                    }, mcdu.getDelayMedium());
                };

                mcdu.tryUpdateLW();
                lwCell.update(NXUnits.kgToUser(mcdu.landingWeight).toFixed(1), Column.green, Column.small);
                towLwCellDivider.updateAttributes(Column.green, Column.small);

                const windComponent = Number.isFinite(mcdu.averageWind) ? mcdu.averageWind : 0;

                tripWindDirCell.update(CDUInitPage.formatWindDirection(windComponent), Column.small);
                tripWindAvgCell.update(CDUInitPage.formatWindComponent(windComponent), Column.big);

                mcdu.onRightInput[4] = async (value, scratchpadCallback) => {
                    setTimeout(() => {
                        if (mcdu.trySetAverageWind(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        } else {
                            scratchpadCallback();
                        }
                    }, mcdu.getDelayWindLoad());
                };

                if (mcdu._minDestFobEntered) {
                    minDestFob.update(NXUnits.kgToUser(mcdu._minDestFob).toFixed(1), Column.cyan);
                } else {
                    mcdu.tryUpdateMinDestFob();
                    minDestFob.update(NXUnits.kgToUser(mcdu._minDestFob).toFixed(1), Column.cyan, Column.small);
                }
                mcdu.onLeftInput[5] = async (value, scratchpadCallback) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetMinDestFob(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        } else {
                            scratchpadCallback();
                        }
                    }, mcdu.getDelayHigh());
                };
                mcdu.checkEFOBBelowMin();

                extraWeightCell.update(NXUnits.kgToUser(mcdu.tryGetExtraFuel()).toFixed(1), Column.green, Column.small);
                if (mcdu.tryGetExtraFuel() >= 0) {
                    extraTimeCell.update(FMCMainDisplay.minutesTohhmm(mcdu.tryGetExtraTime()), Column.green, Column.small);
                    extraCellDivider.updateAttributes(Column.green, Column.small);
                }
            }
        }

        mcdu.setArrows(false, false, true, true);

        mcdu.setTemplate(FormatTemplate([
            [
                new Column(5, "INIT FUEL PRED")
            ],
            [
                new Column(0, "TAXI"),
                new Column(15, "ZFW/ZFWCG")
            ],
            [
                taxiFuelCell,
                zfwCell,
                zfwCgCellDivider,
                zfwCgCell
            ],
            [
                new Column(0, "TRIP"),
                new Column(5, "/TIME"),
                new Column(19, "BLOCK")
            ],
            [
                tripWeightCell,
                tripCellDivider,
                tripTimeCell,
                blockFuel
            ],
            [
                new Column(0, "RTE RSV/%"),
                fuelPlanTopTitle
            ],
            [
                rteRsvWeightCell,
                rteRsvCellDivider,
                rteRsvPercentCell,
                fuelPlanBottomTitle
            ],
            [
                new Column(0, "ALTN"),
                new Column(5, "/TIME"),
                new Column(15, "TOW/"),
                new Column(22, "LW")
            ],
            [
                altnWeightCell,
                altnCellDivider,
                altnTimeCell,
                towCell,
                towLwCellDivider,
                lwCell
            ],
            [
                new Column(0, "FINAL/TIME"),
                new Column(15, "TRIP WIND")
            ],
            [
                finalWeightCell,
                finalCellDivider,
                finalTimeCell,
                tripWindDirCell,
                tripWindAvgCell
            ],
            [
                new Column(0, "MIN DEST FOB"),
                new Column(14, "EXTRA/TIME")
            ],
            [
                minDestFob,
                extraWeightCell,
                extraCellDivider,
                extraTimeCell
            ]
        ]));

        mcdu.onPrevPage = () => {
            CDUInitPage.ShowPage1(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUInitPage.ShowPage1(mcdu);
        };
    }

    // Defining as static here to avoid duplicate code in CDUIRSInit
    static ConvertDDToDMS(deg, lng) {
        // converts decimal degrees to degrees minutes seconds
        const M = 0 | (deg % 1) * 60e7;
        let degree;
        if (lng) {
            degree = (0 | (deg < 0 ? -deg : deg)).toString().padStart(3, "0");
        } else {
            degree = 0 | (deg < 0 ? -deg : deg);
        }
        return {
            dir : deg < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
            deg : degree,
            min : Math.abs(0 | M / 1e7),
            sec : Math.abs((0 | M / 1e6 % 1 * 6e4) / 100)
        };
    }

    static formatWindDirection(tailwindComponent) {
        return Math.round(tailwindComponent) > 0 ? "TL" : "HD";
    }

    static formatWindComponent(tailwindComponent) {
        return Math.round(Math.abs(tailwindComponent)).toFixed(0).padStart(3, "0");
    }
}
