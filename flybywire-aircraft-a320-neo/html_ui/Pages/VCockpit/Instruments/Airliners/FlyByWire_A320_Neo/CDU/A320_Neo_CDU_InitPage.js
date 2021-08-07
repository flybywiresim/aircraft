class CDUInitPage {
    static ShowPage1(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUInitPage.ShowPage1(fmc, mcdu);
        }, 'FMGC');

        let fromTo = "____|____[color]amber";
        let coRoute = "__________[color]amber";
        const flightNo = new CDU_SingleValueField(mcdu,
            "string",
            fmc.flightNumber,
            {
                emptyValue: "________[color]amber",
                suffix: "[color]cyan",
                maxLength: 7
            },
            (value) => {
                fmc.updateFlightNo(value, () => {
                    mcdu.requestUpdate();
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

        if (fmc.simbrief.sendStatus === "REQUESTING") {
            requestEnable = false;
            requestButton = "REQUEST [color]amber";
        }

        if (fmc.flightPlanManager.getOrigin() && fmc.flightPlanManager.getOrigin().ident) {
            if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getDestination().ident) {
                fromTo = fmc.flightPlanManager.getOrigin().ident + "/" + fmc.flightPlanManager.getDestination().ident + "[color]cyan";
                if (coRoute.includes("__________[color]amber")) {
                    coRoute = "";
                }

                // If an active SimBrief OFP matches the FP, hide the request option
                // This allows loading a new OFP via INIT/REVIEW loading a different orig/dest to the current one
                if (fmc.simbrief.sendStatus != "DONE" ||
                    (fmc.simbrief["originIcao"] === fmc.flightPlanManager.getOrigin().ident && fmc.simbrief["destinationIcao"] === fmc.flightPlanManager.getDestination().ident)) {
                    requestEnable = false;
                    requestButtonLabel = "";
                    requestButton = "";
                }

                // Cost index
                costIndex = new CDU_SingleValueField(mcdu,
                    "int",
                    fmc.costIndexSet ? fmc.costIndex : null,
                    {
                        clearable: true,
                        emptyValue: "___[color]amber",
                        minValue: 0,
                        maxValue: 999,
                        suffix: "[color]cyan"
                    },
                    (value) => {
                        if (value != null) {
                            fmc.costIndex = value;
                            fmc.costIndexSet = true;
                        } else {
                            fmc.costIndexSet = false;
                            fmc.costIndex = 0;
                        }
                        mcdu.requestUpdate();
                    }
                );

                cruiseFlTemp = "_____\xa0|___°[color]amber";
                //This is done so pilot enters a FL first, rather than using the computed one
                if (fmc._cruiseEntered && fmc._cruiseFlightLevel) {
                    cruiseFlTemp =
                        "{cyan}FL" + fmc._cruiseFlightLevel.toFixed(0).padStart(3, "0") + "\xa0" +
                        (fmc.cruiseTemperature ? "/" + fmc.cruiseTemperature.toFixed(0) + "°" : "{small}/" + fmc.tempCurve.evaluate(fmc._cruiseFlightLevel).toFixed(0) + "°{end}") +
                        "{end}";
                }

                // CRZ FL / FLX TEMP
                mcdu.onLeftInput[5] = (value) => {
                    if (fmc.setCruiseFlightLevelAndTemperature(value)) {
                        mcdu.requestUpdate();
                    }
                };

                if (fmc.flightPlanManager.getOrigin()) {
                    alignOption = "IRS INIT>";
                }

                // Since CoRte isn't implemented, AltDest defaults to None Ref: Ares's documents
                altDest = "NONE[color]cyan";
                if (fmc.altDestination) {
                    altDest = fmc.altDestination.ident + "[color]cyan";
                } else {
                    altDest = "NONE" + "[color]cyan";
                }
                mcdu.onLeftInput[1] = async (value) => {
                    switch (altDest) {
                        case "NONE":
                            if (value === "") {
                                CDUAvailableFlightPlanPage.ShowPage(fmc, mcdu);
                            } else {
                                if (await fmc.tryUpdateAltDestination(value)) {
                                    mcdu.requestUpdate();
                                }
                            }
                            break;
                        default:
                            if (value === "") {
                                CDUAvailableFlightPlanPage.ShowPage(fmc, mcdu);
                            } else {
                                if (await fmc.tryUpdateAltDestination(value)) {
                                    mcdu.requestUpdate();
                                }
                            }
                            break;
                    }
                };
            }
        }

        if (fmc.coRoute) {
            coRoute = fmc.coRoute + "[color]cyan";
        }
        mcdu.onLeftInput[0] = (value) => {
            fmc.updateCoRoute(value, (result) => {
                if (result) {
                    mcdu.requestUpdate();
                }
            });
        };

        if (fmc.tropo) {
            tropo = fmc.tropo + "[color]cyan";
        }
        mcdu.onRightInput[4] = (value) => {
            if (fmc.tryUpdateTropo(value)) {
                mcdu.requestUpdate();
            }
        };

        /**
         * If scratchpad is filled, attempt to update city pair
         * else show route selection pair if city pair is displayed
         * Ref: FCOM 4.03.20 P6
         */
        mcdu.onRightInput[0] = (value) => {
            if (value !== "") {
                fmc.tryUpdateFromTo(value, (result) => {
                    if (result) {
                        // TODO look into why this is calling another page
                        CDUPerformancePage.UpdateThrRedAccFromOrigin(fmc);
                        CDUPerformancePage.UpdateEngOutAccFromOrigin(fmc);
                        CDUPerformancePage.UpdateThrRedAccFromDestination(fmc);
                        CDUAvailableFlightPlanPage.ShowPage(fmc, mcdu);
                    }
                });
            } else if (fmc.flightPlanManager.getOrigin() && fmc.flightPlanManager.getOrigin().ident) {
                if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getDestination().ident) {
                    CDUAvailableFlightPlanPage.ShowPage(fmc, mcdu);
                }
            }
        };
        mcdu.onRightInput[1] = () => {
            if (requestEnable) {
                getSimBriefOfp(fmc, mcdu, () => {
                    mcdu.requestUpdate();
                })
                    .then(() => {
                        insertUplink(fmc, mcdu);
                    });
            }
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            if (alignOption) {
                CDUIRSInit.ShowPage(fmc, mcdu);
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
            if (fmc.isAnEngineOn()) {
                CDUFuelPredPage.ShowPage(fmc, mcdu);
            } else {
                CDUInitPage.ShowPage2(fmc, mcdu);
            }
        };
        mcdu.onNextPage = () => {
            if (fmc.isAnEngineOn()) {
                CDUFuelPredPage.ShowPage(fmc, mcdu);
            } else {
                CDUInitPage.ShowPage2(fmc, mcdu);
            }
        };

        mcdu.onRightInput[3] = () => {
            mcdu.returnPageCallback = () => {
                CDUInitPage.ShowPage1(fmc, mcdu);
            };
            CDUWindPage.ShowPage(fmc, mcdu);
        };

        mcdu.onUp = () => {};
        Coherent.trigger("AP_ALT_VAL_SET", 4200);
        Coherent.trigger("AP_VS_VAL_SET", 300);
        Coherent.trigger("AP_HDG_VAL_SET", 180);
    }
    // Does not refresh page so that other things can be performed first as necessary
    static updateTowIfNeeded(fmc) {
        if (isFinite(fmc.taxiFuelWeight) && isFinite(fmc.zeroFuelWeight) && isFinite(fmc.blockFuel)) {
            fmc.takeOffWeight = fmc.zeroFuelWeight + fmc.blockFuel - fmc.taxiFuelWeight;
        }
    }
    // TODO fix from here down
    static fuelPredConditionsMet(fmc) {
        return isFinite(fmc.blockFuel) &&
            isFinite(fmc.zeroFuelWeightMassCenter) &&
            isFinite(fmc.zeroFuelWeight) &&
            fmc.cruiseFlightLevel &&
            fmc.flightPlanManager.getWaypointsCount() > 0 &&
            fmc._zeroFuelWeightZFWCGEntered &&
            fmc._blockFuelEntered;
    }
    static trySetFuelPred(fmc) {
        if (CDUInitPage.fuelPredConditionsMet(fmc) && !fmc._fuelPredDone) {
            setTimeout(() => {
                if (CDUInitPage.fuelPredConditionsMet(fmc) && !fmc._fuelPredDone) { //Double check as user can clear block fuel during timeout
                    fmc._fuelPredDone = true;
                    fmc.requestUpdate();
                }
            }, mcdu.getDelayFuelPred());
        }
    }

    static ShowPage2(fmc, mcdu) {
        if (fmc.timeSinceFirstEngineStart >= 15) {
            CDUFuelPredPage.ShowPage(fmc, mcdu);
            return;
        }
        mcdu.setCurrentPage(() => {
            CDUInitPage.ShowPage2(fmc, mcdu);
        });

        let initBTitle = "INIT";

        let zfwColor = "[color]amber";
        let zfwCell = "___._";
        let zfwCgCell = "__._";
        if (fmc._zeroFuelWeightZFWCGEntered) {
            if (isFinite(fmc.zeroFuelWeight)) {
                zfwCell = (NXUnits.kgToUser(fmc.zeroFuelWeight)).toFixed(1);
                zfwColor = "[color]cyan";
            }
            if (isFinite(fmc.zeroFuelWeightMassCenter)) {
                zfwCgCell = fmc.zeroFuelWeightMassCenter.toFixed(1);
            }
            if (isFinite(fmc.zeroFuelWeight) && isFinite(fmc.zeroFuelWeightMassCenter)) {
                zfwColor = "[color]cyan";
            }
        }
        mcdu.onRightInput[0] = async (value) => {
            if (value === "") {
                fmc.updateZfwVars();
                mcdu.sendDataToScratchpad(
                    (isFinite(fmc.zeroFuelWeight) ? (NXUnits.kgToUser(fmc.zeroFuelWeight)).toFixed(1) : "") +
                    "/" +
                    (isFinite(fmc.zeroFuelWeightMassCenter) ? fmc.zeroFuelWeightMassCenter.toFixed(1) : ""));
            } else if (fmc.trySetZeroFuelWeightZFWCG(value)) {
                CDUInitPage.updateTowIfNeeded(fmc);
                mcdu.requestUpdate();
                CDUInitPage.trySetFuelPred(fmc);
            }
        };

        let blockFuel = "__._";
        let blockFuelColor = "[color]amber";
        if (fmc._blockFuelEntered || fmc._fuelPlanningPhase === fmc._fuelPlanningPhases.IN_PROGRESS) {
            if (isFinite(fmc.blockFuel)) {
                blockFuel = (NXUnits.kgToUser(fmc.blockFuel)).toFixed(1);
                blockFuelColor = "[color]cyan";
            }
        }
        mcdu.onRightInput[1] = async (value) => {
            if (fmc._zeroFuelWeightZFWCGEntered && value !== FMCMainDisplay.clrValue) { //Simulate delay if calculating trip data
                if (await fmc.trySetBlockFuel(value)) {
                    CDUInitPage.updateTowIfNeeded(fmc);
                    mcdu.requestUpdate();
                    CDUInitPage.trySetFuelPred(fmc);
                }
            } else {
                if (await fmc.trySetBlockFuel(value)) {
                    CDUInitPage.updateTowIfNeeded(fmc);
                    mcdu.requestUpdate();
                }
            }

        };

        let fuelPlanTopTitle = "";
        let fuelPlanBottomTitle = "";
        let fuelPlanColor = "[color]amber";
        if (fmc._zeroFuelWeightZFWCGEntered && !fmc._blockFuelEntered) {
            fuelPlanTopTitle = "FUEL ";
            fuelPlanBottomTitle = "PLANNING }";
            mcdu.onRightInput[2] = async () => {
                if (await fmc.tryFuelPlanning()) {
                    CDUInitPage.updateTowIfNeeded(fmc);
                    mcdu.requestUpdate();
                }
            };
        }
        if (fmc._fuelPlanningPhase === fmc._fuelPlanningPhases.IN_PROGRESS) {
            initBTitle = "INIT FUEL PLANNING";
            fuelPlanTopTitle = "BLOCK ";
            fuelPlanBottomTitle = "CONFIRM";
            fuelPlanColor = "[color]green";
            mcdu.onRightInput[2] = async () => {
                if (await fmc.tryFuelPlanning()) {
                    CDUInitPage.updateTowIfNeeded(fmc);
                    mcdu.requestUpdate();
                    CDUInitPage.trySetFuelPred(fmc);
                }
            };
        }

        let towCell = "---.-";
        let lwCell = "---.-";
        let towLwColor = "[color]white";

        let taxiFuelCell = "{small}0.4{end}";
        if (isFinite(fmc.taxiFuelWeight)) {
            if (fmc._taxiEntered) {
                taxiFuelCell = (NXUnits.kgToUser(fmc.taxiFuelWeight)).toFixed(1);
            } else {
                taxiFuelCell = "{small}" + (NXUnits.kgToUser(fmc.taxiFuelWeight)).toFixed(1) + "{end}";
            }
        }
        mcdu.onLeftInput[0] = async (value) => {
            if (fmc._fuelPredDone) {
                setTimeout(async () => {
                    if (fmc.trySetTaxiFuelWeight(value)) {
                        CDUInitPage.updateTowIfNeeded(fmc);
                        mcdu.requestUpdate();
                    }
                }, mcdu.getDelayHigh());
            } else {
                if (fmc.trySetTaxiFuelWeight(value)) {
                    CDUInitPage.updateTowIfNeeded(fmc);
                    mcdu.requestUpdate();
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
        if (isFinite(fmc.getRouteReservedPercent())) {
            rteRsvPercentCell = fmc.getRouteReservedPercent().toFixed(1);
            rteRsvPctColor = "{cyan}";
        }
        mcdu.onLeftInput[2] = async (value) => {
            if (await fmc.trySetRouteReservedPercent(value)) {
                mcdu.requestUpdate();
            }
        };

        let altnWeightCell = "---.-";
        let altnTimeCell = "----";
        let altnColor = "[color]white";
        let altnTimeColor = "{white}";

        let finalWeightCell = "---.-";
        let finalTimeCell = "----";
        let finalColor = "[color]white";
        if (fmc.getRouteFinalFuelTime() > 0) {
            finalTimeCell = "{cyan}" + FMCMainDisplay.minutesTohhmm(fmc.getRouteFinalFuelTime()) + "{end}";
        }
        mcdu.onLeftInput[4] = async (value) => {
            if (await fmc.trySetRouteFinalTime(value)) {
                mcdu.requestUpdate();
            }
        };

        let extraWeightCell = "---.-";
        let extraTimeCell = "----";
        let extraColor = "[color]white";
        let extraTimeColor = "{white}";

        let minDestFob = "---.-";
        let minDestFobColor = "[color]white";

        let tripWindColor = "[color]cyan";
        let tripWindCell = "{small}" + fmc._windDir + fmc.averageWind.toFixed(0).padStart(3, "0") + "{end}";
        mcdu.onRightInput[4] = async (value) => {
            if (await fmc.trySetAverageWind(value)) {
                mcdu.requestUpdate();
            }
        };

        if (CDUInitPage.fuelPredConditionsMet(fmc)) {
            initBTitle = "INIT FUEL PREDICTION{sp}";
            fuelPlanTopTitle = "";
            fuelPlanBottomTitle = "";

            fmc.tryUpdateTOW();
            if (isFinite(fmc.takeOffWeight)) {
                towCell = "{small}" + (NXUnits.kgToUser(fmc.takeOffWeight)).toFixed(1);
                towLwColor = "[color]green";
            }

            if (fmc._fuelPredDone) {
                if (!fmc.routeFinalEntered()) {
                    fmc.tryUpdateRouteFinalFuel();
                }
                if (isFinite(fmc.getRouteFinalFuelWeight()) && isFinite(fmc.getRouteFinalFuelTime())) {
                    if (fmc._rteFinalWeightEntered) {
                        finalWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc.getRouteFinalFuelWeight())).toFixed(1);
                    } else {
                        finalWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc.getRouteFinalFuelWeight())).toFixed(1) + "{end}";
                    }
                    if (fmc._rteFinalTimeEntered || !fmc.routeFinalEntered()) {
                        finalTimeCell = FMCMainDisplay.minutesTohhmm(fmc.getRouteFinalFuelTime());
                    } else {
                        finalTimeCell = "{small}" + FMCMainDisplay.minutesTohhmm(fmc.getRouteFinalFuelTime()) + "{end}";
                    }
                    finalColor = "[color]cyan";
                }
                mcdu.onLeftInput[4] = async (value) => {
                    setTimeout(async () => {
                        if (await fmc.trySetRouteFinalFuel(value)) {
                            mcdu.requestUpdate();
                        }
                    }, mcdu.getDelayHigh());
                };

                if (fmc.altDestination) {
                    if (fmc._routeAltFuelEntered) {
                        if (isFinite(fmc.getRouteAltFuelWeight())) {
                            altnWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc.getRouteAltFuelWeight())).toFixed(1);
                            altnTimeCell = "{small}" + FMCMainDisplay.minutesTohhmm(fmc.getRouteAltFuelTime()) + "{end}";
                            altnTimeColor = "{green}";
                            altnColor = "[color]cyan";
                        }
                    } else {
                        fmc.tryUpdateRouteAlternate();
                        if (isFinite(fmc.getRouteAltFuelWeight())) {
                            altnWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc.getRouteAltFuelWeight())).toFixed(1);
                            altnTimeCell = FMCMainDisplay.minutesTohhmm(fmc.getRouteAltFuelTime()) + "{end}";
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
                        if (await fmc.trySetRouteAlternateFuel(value)) {
                            mcdu.requestUpdate();
                        }
                    }, mcdu.getDelayHigh());
                };

                fmc.tryUpdateRouteTrip();
                if (isFinite(fmc.getTotalTripFuelCons()) && isFinite(fmc.getTotalTripTime())) {
                    tripWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc.getTotalTripFuelCons())).toFixed(1);
                    tripTimeCell = FMCMainDisplay.minutesTohhmm(fmc._routeTripTime);
                    tripColor = "[color]green";
                }

                if (isFinite(fmc.getRouteReservedWeight())) {
                    if (fmc._rteReservedWeightEntered) {
                        rteRsvWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc.getRouteReservedWeight())).toFixed(1);
                    } else {
                        rteRsvWeightCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc.getRouteReservedWeight())).toFixed(1) + "{end}";
                    }
                    rteRsvColor = "[color]cyan";
                }

                if (fmc._rteRsvPercentOOR) {
                    rteRsvPercentCell = "--.-";
                    rteRsvPctColor = "{white}";
                } else if (isFinite(fmc.getRouteReservedPercent())) {
                    if (fmc._rteReservedPctEntered || !fmc.routeReservedEntered()) {
                        rteRsvPercentCell = fmc.getRouteReservedPercent().toFixed(1);
                    } else {
                        rteRsvPercentCell = "{small}" + fmc.getRouteReservedPercent().toFixed(1) + "{end}";
                    }
                    rteRsvColor = "[color]cyan";
                    rteRsvPctColor = "{cyan}";
                }

                mcdu.onLeftInput[2] = async (value) => {
                    setTimeout(async () => {
                        if (await fmc.trySetRouteReservedFuel(value)) {
                            mcdu.requestUpdate();
                        }
                    }, mcdu.getDelayMedium());
                };

                fmc.tryUpdateLW();
                lwCell = (NXUnits.kgToUser(fmc.landingWeight)).toFixed(1);
                lwCell = lwCell.length <= 4 ? "{sp}" + lwCell : lwCell;

                tripWindCell = "{small}" + fmc._windDir + "000" + "{end}";
                tripWindColor = "[color]cyan";
                if (isFinite(fmc.averageWind)) {
                    tripWindCell = "{small}" + fmc._windDir + fmc.averageWind.toFixed(0).padStart(3, "0") + "{end}";
                }
                mcdu.onRightInput[4] = async (value) => {
                    setTimeout(async () => {
                        if (await fmc.trySetAverageWind(value)) {
                            mcdu.requestUpdate();
                        }
                    }, mcdu.getDelayWindLoad());
                };

                if (fmc._minDestFobEntered) {
                    minDestFob = "{sp}{sp}" + (NXUnits.kgToUser(fmc._minDestFob)).toFixed(1);
                    minDestFobColor = "[color]cyan";
                } else {
                    fmc.tryUpdateMinDestFob();
                    minDestFob = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc._minDestFob)).toFixed(1) + "{end}";
                    minDestFobColor = "[color]cyan";
                }
                mcdu.onLeftInput[5] = async (value) => {
                    setTimeout(async () => {
                        if (await fmc.trySetMinDestFob(value)) {
                            mcdu.requestUpdate();
                        }
                    }, mcdu.getDelayHigh());
                };
                fmc.checkEFOBBelowMin();

                extraWeightCell = "{small}" + (NXUnits.kgToUser(fmc.tryGetExtraFuel())).toFixed(1);
                if (fmc.tryGetExtraFuel() < 0) {
                    extraTimeCell = "----{end}";
                    extraTimeColor = "{white}";
                } else {
                    extraTimeCell = FMCMainDisplay.minutesTohhmm(fmc.tryGetExtraTime()) + "{end}";
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
            CDUInitPage.ShowPage1(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUInitPage.ShowPage1(fmc, mcdu);
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
