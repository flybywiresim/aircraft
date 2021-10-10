class CDUInitPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.InitPageA;
        mcdu.pageRedrawCallback = () => CDUInitPage.ShowPage1(mcdu);
        mcdu.activeSystem = 'FMGC';

        let fromTo = "____|____[color]amber";
        let coRoute = "__________[color]amber";
        const flightNo = new CDU_SingleValueField(mcdu,
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
                    }
                });
            }
        );

        //;
        let altDest = "----|----------";
        let costIndex = "---";
        let cruiseFlTemp = "-----\xa0|---°";
        let alignOption;
        let tropo = "{small}36090{end}[color]cyan";
        let requestButton = "REQUEST*[color]amber";
        let requestButtonLabel = "INIT [color]amber";
        let requestEnable = true;

        if (mcdu.simbrief.sendStatus === "REQUESTING") {
            requestEnable = false;
            requestButton = "REQUEST [color]amber";
        }

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]cyan";
                if (coRoute.includes("__________[color]amber")) {
                    coRoute = "";
                }

                // If an active SimBrief OFP matches the FP, hide the request option
                // This allows loading a new OFP via INIT/REVIEW loading a different orig/dest to the current one
                if (mcdu.simbrief.sendStatus != "DONE" ||
                    (mcdu.simbrief["originIcao"] === mcdu.flightPlanManager.getOrigin().ident && mcdu.simbrief["destinationIcao"] === mcdu.flightPlanManager.getDestination().ident)) {
                    requestEnable = false;
                    requestButtonLabel = "";
                    requestButton = "";
                }

                // Cost index
                costIndex = new CDU_SingleValueField(mcdu,
                    "int",
                    mcdu.costIndexSet ? mcdu.costIndex : null,
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
                            mcdu.costIndexSet = true;
                        } else {
                            mcdu.costIndexSet = false;
                            mcdu.costIndex = 0;
                        }
                        CDUInitPage.ShowPage1(mcdu);
                    }
                );

                cruiseFlTemp = "_____\xa0|___°[color]amber";
                //This is done so pilot enters a FL first, rather than using the computed one
                if (mcdu._cruiseEntered && mcdu._cruiseFlightLevel) {
                    cruiseFlTemp =
                        "{cyan}FL" + mcdu._cruiseFlightLevel.toFixed(0).padStart(3, "0") + "\xa0" +
                        (mcdu.cruiseTemperature ? "/" + mcdu.cruiseTemperature.toFixed(0) + "°" : "{small}/" + mcdu.tempCurve.evaluate(mcdu._cruiseFlightLevel).toFixed(0) + "°{end}") +
                        "{end}";
                }

                // CRZ FL / FLX TEMP
                mcdu.onLeftInput[5] = (value) => {
                    if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };

                if (mcdu.flightPlanManager.getOrigin()) {
                    alignOption = "IRS INIT>";
                }

                // Since CoRte isn't implemented, AltDest defaults to None Ref: Ares's documents
                altDest = "NONE[color]cyan";
                if (mcdu.altDestination) {
                    altDest = mcdu.altDestination.ident + "[color]cyan";
                } else {
                    altDest = "NONE" + "[color]cyan";
                }
                mcdu.onLeftInput[1] = async (value) => {
                    switch (altDest) {
                        case "NONE":
                            if (value === "") {
                                CDUAvailableFlightPlanPage.ShowPage(mcdu);
                            } else {
                                if (await mcdu.tryUpdateAltDestination(value)) {
                                    CDUInitPage.ShowPage1(mcdu);
                                }
                            }
                            break;
                        default:
                            if (value === "") {
                                CDUAvailableFlightPlanPage.ShowPage(mcdu);
                            } else {
                                if (await mcdu.tryUpdateAltDestination(value)) {
                                    CDUInitPage.ShowPage1(mcdu);
                                }
                            }
                            break;
                    }
                };
            }
        }

        if (mcdu.coRoute) {
            coRoute = mcdu.coRoute + "[color]cyan";
        }
        mcdu.onLeftInput[0] = (value) => {
            mcdu.updateCoRoute(value, (result) => {
                if (result) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            });
        };

        if (mcdu.tropo) {
            tropo = mcdu.tropo + "[color]cyan";
        }
        mcdu.onRightInput[4] = (value) => {
            if (mcdu.tryUpdateTropo(value)) {
                CDUInitPage.ShowPage1(mcdu);
            }
        };

        /**
         * If scratchpad is filled, attempt to update city pair
         * else show route selection pair if city pair is displayed
         * Ref: FCOM 4.03.20 P6
         */
        mcdu.onRightInput[0] = (value) => {
            if (value !== "") {
                mcdu.tryUpdateFromTo(value, (result) => {
                    if (result) {
                        CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
                        CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);
                        CDUPerformancePage.UpdateThrRedAccFromDestination(mcdu);
                        CDUAvailableFlightPlanPage.ShowPage(mcdu);
                    }
                });
            } else if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
                if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                    CDUAvailableFlightPlanPage.ShowPage(mcdu);
                }
            }
        };
        mcdu.onRightInput[1] = () => {
            if (requestEnable) {
                getSimBriefOfp(mcdu, () => {
                    if (mcdu.page.Current === mcdu.page.InitPageA) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                })
                    .then(() => {
                        insertUplink(mcdu);
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

        mcdu.setTemplate([
            ["INIT"],
            ["\xa0CO RTE", "FROM/TO\xa0\xa0"],
            [coRoute, fromTo],
            ["ALTN/CO RTE", requestButtonLabel],
            [altDest, requestButton],
            ["FLT NBR"],
            [flightNo, alignOption],
            [""],
            ["", "WIND/TEMP>"],
            ["COST INDEX", "TROPO"],
            [costIndex, tropo],
            ["CRZ FL/TEMP", "GND TEMP"],
            [cruiseFlTemp, "---°[color]inop"],
        ]);

        mcdu.setArrows(false, false, true, true);

        mcdu.onPrevPage = () => {
            if (mcdu.isAnEngineOn()) {
                CDUFuelPredPage.ShowPage(mcdu);
            } else {
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        mcdu.onNextPage = () => {
            if (mcdu.isAnEngineOn()) {
                CDUFuelPredPage.ShowPage(mcdu);
            } else {
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        mcdu.onRightInput[3] = () => {
            CDUWindPage.Return = () => {
                CDUInitPage.ShowPage1(mcdu);
            };
            CDUWindPage.ShowPage(mcdu);
        };

        mcdu.onUp = () => {};
        Coherent.trigger("AP_ALT_VAL_SET", 4200);
        Coherent.trigger("AP_VS_VAL_SET", 300);
        Coherent.trigger("AP_HDG_VAL_SET", 180);
    }
    // Does not refresh page so that other things can be performed first as necessary
    static updateTowIfNeeded(mcdu) {
        if (isFinite(mcdu.taxiFuelWeight) && isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.blockFuel)) {
            mcdu.takeOffWeight = mcdu.zeroFuelWeight + mcdu.blockFuel - mcdu.taxiFuelWeight;
        }
    }
    static fuelPredConditionsMet(mcdu) {
        return isFinite(mcdu.blockFuel) &&
            isFinite(mcdu.zeroFuelWeightMassCenter) &&
            isFinite(mcdu.zeroFuelWeight) &&
            mcdu.cruiseFlightLevel &&
            mcdu.flightPlanManager.getWaypointsCount() > 0 &&
            mcdu._zeroFuelWeightZFWCGEntered &&
            mcdu._blockFuelEntered;
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
        mcdu.pageRedrawCallback = () => CDUInitPage.ShowPage2(mcdu);

        let initBTitle = "INIT";

        let zfwColor = "[color]amber";
        let zfwCell = "___._";
        let zfwCgCell = "__._";
        if (mcdu._zeroFuelWeightZFWCGEntered) {
            if (isFinite(mcdu.zeroFuelWeight)) {
                zfwCell = (NXUnits.kgToUser(mcdu.zeroFuelWeight)).toFixed(1);
                zfwColor = "[color]cyan";
            }
            if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
                zfwCgCell = mcdu.zeroFuelWeightMassCenter.toFixed(1);
            }
            if (isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.zeroFuelWeightMassCenter)) {
                zfwColor = "[color]cyan";
            }
        }
        mcdu.onRightInput[0] = async (value) => {
            if (value === "") {
                mcdu.updateZfwVars();
                mcdu.resetScratchpadAndSetScratchpadThroughSystem(
                    (isFinite(mcdu.zeroFuelWeight) ? (NXUnits.kgToUser(mcdu.zeroFuelWeight)).toFixed(1) : "") +
                    "/" +
                    (isFinite(mcdu.zeroFuelWeightMassCenter) ? mcdu.zeroFuelWeightMassCenter.toFixed(1) : ""));
            } else if (mcdu.trySetZeroFuelWeightZFWCG(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
                CDUInitPage.trySetFuelPred(mcdu);
            }
        };

        let blockFuel = "__._";
        let blockFuelColor = "[color]amber";
        if (mcdu._blockFuelEntered || mcdu._fuelPlanningPhase === mcdu._fuelPlanningPhases.IN_PROGRESS) {
            if (isFinite(mcdu.blockFuel)) {
                blockFuel = (NXUnits.kgToUser(mcdu.blockFuel)).toFixed(1);
                blockFuelColor = "[color]cyan";
            }
        }
        mcdu.onRightInput[1] = async (value) => {
            if (mcdu._zeroFuelWeightZFWCGEntered && value !== mcdu.clrValue) { //Simulate delay if calculating trip data
                if (await mcdu.trySetBlockFuel(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                    CDUInitPage.trySetFuelPred(mcdu);
                }
            } else {
                if (await mcdu.trySetBlockFuel(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                }
            }

        };

        let fuelPlanTopTitle = "";
        let fuelPlanBottomTitle = "";
        let fuelPlanColor = "[color]amber";
        if (mcdu._zeroFuelWeightZFWCGEntered && !mcdu._blockFuelEntered) {
            fuelPlanTopTitle = "FUEL ";
            fuelPlanBottomTitle = "PLANNING }";
            mcdu.onRightInput[2] = async () => {
                if (await mcdu.tryFuelPlanning()) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                }
            };
        }
        if (mcdu._fuelPlanningPhase === mcdu._fuelPlanningPhases.IN_PROGRESS) {
            initBTitle = "INIT FUEL PLANNING";
            fuelPlanTopTitle = "BLOCK ";
            fuelPlanBottomTitle = "CONFIRM";
            fuelPlanColor = "[color]green";
            mcdu.onRightInput[2] = async () => {
                if (await mcdu.tryFuelPlanning()) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                    CDUInitPage.trySetFuelPred(mcdu);
                }
            };
        }

        let towCell = "---.-";
        let lwCell = "---.-";
        let towLwColor = "[color]white";

        let taxiFuelCell = "{small}0.4{end}";
        if (isFinite(mcdu.taxiFuelWeight)) {
            if (mcdu._taxiEntered) {
                taxiFuelCell = (NXUnits.kgToUser(mcdu.taxiFuelWeight)).toFixed(1);
            } else {
                taxiFuelCell = "{small}" + (NXUnits.kgToUser(mcdu.taxiFuelWeight)).toFixed(1) + "{end}";
            }
        }
        mcdu.onLeftInput[0] = async (value) => {
            if (mcdu._fuelPredDone) {
                setTimeout(async () => {
                    if (mcdu.trySetTaxiFuelWeight(value)) {
                        CDUInitPage.updateTowIfNeeded(mcdu);
                        if (mcdu.page.Current === mcdu.page.InitPageB) {
                            CDUInitPage.ShowPage2(mcdu);
                        }
                    }
                }, mcdu.getDelayHigh());
            } else {
                if (mcdu.trySetTaxiFuelWeight(value)) {
                    CDUInitPage.updateTowIfNeeded(mcdu);
                    CDUInitPage.ShowPage2(mcdu);
                }
            }
        };

        let tripWeightCell = "---.-";
        let tripTimeCell = "----";
        let tripColor = "[color]white";

        let rteRsvWeightCell = "---.-";
        let rteRsvPercentCell = "5.0";
        let rteRsvColor = "[color]white";
        let rteRsvPctColor = "{cyan}";
        if (isFinite(mcdu.getRouteReservedPercent())) {
            rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
            rteRsvPctColor = "{cyan}";
        }
        mcdu.onLeftInput[2] = async (value) => {
            if (await mcdu.trySetRouteReservedPercent(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let altnWeightCell = "---.-";
        let altnTimeCell = "----";
        let altnColor = "[color]white";
        let altnTimeColor = "{white}";

        let finalWeightCell = "---.-";
        let finalTimeCell = "----";
        let finalColor = "[color]white";
        if (mcdu.getRouteFinalFuelTime() > 0) {
            finalTimeCell = "{cyan}" + FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime()) + "{end}";
        }
        mcdu.onLeftInput[4] = async (value) => {
            if (await mcdu.trySetRouteFinalTime(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let extraWeightCell = "---.-";
        let extraTimeCell = "----";
        let extraColor = "[color]white";
        let extraTimeColor = "{white}";

        let minDestFob = "---.-";
        let minDestFobColor = "[color]white";

        let tripWindColor = "[color]cyan";
        let tripWindCell = "{small}" + mcdu._windDir + mcdu.averageWind.toFixed(0).padStart(3, "0") + "{end}";
        mcdu.onRightInput[4] = async (value) => {
            if (await mcdu.trySetAverageWind(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        if (CDUInitPage.fuelPredConditionsMet(mcdu)) {
            initBTitle = "INIT FUEL PREDICTION{sp}";
            fuelPlanTopTitle = "";
            fuelPlanBottomTitle = "";

            mcdu.tryUpdateTOW();
            if (isFinite(mcdu.takeOffWeight)) {
                towCell = "{small}" + (NXUnits.kgToUser(mcdu.takeOffWeight)).toFixed(1);
                towLwColor = "[color]green";
            }

            if (mcdu._fuelPredDone) {
                if (!mcdu.routeFinalEntered()) {
                    mcdu.tryUpdateRouteFinalFuel();
                }
                if (isFinite(mcdu.getRouteFinalFuelWeight()) && isFinite(mcdu.getRouteFinalFuelTime())) {
                    if (mcdu._rteFinalWeightEntered) {
                        finalWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(mcdu.getRouteFinalFuelWeight())).toFixed(1);
                    } else {
                        finalWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(mcdu.getRouteFinalFuelWeight())).toFixed(1) + "{end}";
                    }
                    if (mcdu._rteFinalTimeEntered || !mcdu.routeFinalEntered()) {
                        finalTimeCell = FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime());
                    } else {
                        finalTimeCell = "{small}" + FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime()) + "{end}";
                    }
                    finalColor = "[color]cyan";
                }
                mcdu.onLeftInput[4] = async (value) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetRouteFinalFuel(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        }
                    }, mcdu.getDelayHigh());
                };

                if (mcdu.altDestination) {
                    if (mcdu._routeAltFuelEntered) {
                        if (isFinite(mcdu.getRouteAltFuelWeight())) {
                            altnWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(mcdu.getRouteAltFuelWeight())).toFixed(1);
                            altnTimeCell = "{small}" + FMCMainDisplay.minutesTohhmm(mcdu.getRouteAltFuelTime()) + "{end}";
                            altnTimeColor = "{green}";
                            altnColor = "[color]cyan";
                        }
                    } else {
                        mcdu.tryUpdateRouteAlternate();
                        if (isFinite(mcdu.getRouteAltFuelWeight())) {
                            altnWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(mcdu.getRouteAltFuelWeight())).toFixed(1);
                            altnTimeCell = FMCMainDisplay.minutesTohhmm(mcdu.getRouteAltFuelTime()) + "{end}";
                            altnTimeColor = "{green}";
                            altnColor = "[color]cyan";
                        }
                    }
                } else {
                    altnWeightCell = "{sp}{sp}{small}0.0{end}";
                    altnTimeCell = "----";
                    altnColor = "[color]green";
                    altnTimeColor = "{white}";
                }

                mcdu.onLeftInput[3] = async (value) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetRouteAlternateFuel(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        }
                    }, mcdu.getDelayHigh());
                };

                mcdu.tryUpdateRouteTrip();
                if (isFinite(mcdu.getTotalTripFuelCons()) && isFinite(mcdu.getTotalTripTime())) {
                    tripWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(mcdu.getTotalTripFuelCons())).toFixed(1);
                    tripTimeCell = FMCMainDisplay.minutesTohhmm(mcdu._routeTripTime);
                    tripColor = "[color]green";
                }

                if (isFinite(mcdu.getRouteReservedWeight())) {
                    if (mcdu._rteReservedWeightEntered) {
                        rteRsvWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(mcdu.getRouteReservedWeight())).toFixed(1);
                    } else {
                        rteRsvWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(mcdu.getRouteReservedWeight())).toFixed(1) + "{end}";
                    }
                    rteRsvColor = "[color]cyan";
                }

                if (mcdu._rteRsvPercentOOR) {
                    rteRsvPercentCell = "--.-";
                    rteRsvPctColor = "{white}";
                } else if (isFinite(mcdu.getRouteReservedPercent())) {
                    if (mcdu._rteReservedPctEntered || !mcdu.routeReservedEntered()) {
                        rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
                    } else {
                        rteRsvPercentCell = "{small}" + mcdu.getRouteReservedPercent().toFixed(1) + "{end}";
                    }
                    rteRsvColor = "[color]cyan";
                    rteRsvPctColor = "{cyan}";
                }

                mcdu.onLeftInput[2] = async (value) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetRouteReservedFuel(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        }
                    }, mcdu.getDelayMedium());
                };

                mcdu.tryUpdateLW();
                lwCell = (NXUnits.kgToUser(mcdu.landingWeight)).toFixed(1);
                lwCell = lwCell.length <= 4 ? "{sp}" + lwCell : lwCell;

                tripWindCell = "{small}" + mcdu._windDir + "000" + "{end}";
                tripWindColor = "[color]cyan";
                if (isFinite(mcdu.averageWind)) {
                    tripWindCell = "{small}" + mcdu._windDir + mcdu.averageWind.toFixed(0).padStart(3, "0") + "{end}";
                }
                mcdu.onRightInput[4] = async (value) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetAverageWind(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        }
                    }, mcdu.getDelayWindLoad());
                };

                if (mcdu._minDestFobEntered) {
                    minDestFob = "{sp}{sp}" + (NXUnits.kgToUser(mcdu._minDestFob)).toFixed(1);
                    minDestFobColor = "[color]cyan";
                } else {
                    mcdu.tryUpdateMinDestFob();
                    minDestFob = "{sp}{sp}{small}" + (NXUnits.kgToUser(mcdu._minDestFob)).toFixed(1) + "{end}";
                    minDestFobColor = "[color]cyan";
                }
                mcdu.onLeftInput[5] = async (value) => {
                    setTimeout(async () => {
                        if (await mcdu.trySetMinDestFob(value)) {
                            if (mcdu.page.Current === mcdu.page.InitPageB) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        }
                    }, mcdu.getDelayHigh());
                };
                mcdu.checkEFOBBelowMin();

                extraWeightCell = "{small}" + (NXUnits.kgToUser(mcdu.tryGetExtraFuel())).toFixed(1);
                if (mcdu.tryGetExtraFuel() < 0) {
                    extraTimeCell = "----{end}";
                    extraTimeColor = "{white}";
                } else {
                    extraTimeCell = FMCMainDisplay.minutesTohhmm(mcdu.tryGetExtraTime()) + "{end}";
                    extraTimeColor = "{green}";
                }
                extraColor = "[color]green";
            }
        }

        mcdu.setTemplate([
            [initBTitle],
            ["TAXI", "ZFW/ZFWCG"],
            [taxiFuelCell + "[color]cyan", zfwCell + "|" + zfwCgCell + zfwColor],
            ["TRIP\xa0\xa0/TIME", "BLOCK"],
            [tripWeightCell + "/" + tripTimeCell + tripColor, blockFuel + blockFuelColor],
            ["RTE RSV/%", fuelPlanTopTitle + fuelPlanColor],
            [rteRsvWeightCell + rteRsvPctColor + "/" + rteRsvPercentCell + "{end}" + rteRsvColor, fuelPlanBottomTitle + fuelPlanColor],
            ["ALTN\xa0\xa0/TIME", "TOW/\xa0\xa0\xa0\xa0LW"],
            [altnWeightCell + altnTimeColor + "/" + altnTimeCell + "{end}" + altnColor, towCell + "/" + lwCell + towLwColor],
            ["FINAL\xa0/TIME", "TRIP WIND"],
            [finalWeightCell + "/" + finalTimeCell + finalColor, "{small}" + tripWindCell + "{end}" + tripWindColor],
            ["MIN DEST FOB", "EXTRA/\xa0TIME"],
            [minDestFob + minDestFobColor, extraWeightCell + extraTimeColor + "/" + extraTimeCell + "{end}" + extraColor],
        ]);

        mcdu.setArrows(false, false, true, true);

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
}
