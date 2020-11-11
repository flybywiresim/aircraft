class CDUInitPage {
    static ShowPage1(mcdu, resetFlightNo = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.InitPageA;
        mcdu.activeSystem = 'FMGC';

        // TODO create local simvars for.. everything
        let fromTo = "____|____[color]red";
        let coRoute = "__________[color]red";
        let flightNo = "________[color]red";
        let altDest = "----|----------";
        let costIndex = "---";
        let cruiseFlTemp = "-----|---°";
        let alignOption;

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]blue";
                if (coRoute.includes("__________[color]red")) {
                    coRoute = "";
                }

                //Need code to set the SimVarValue if user inputs FlNo
                if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
                    flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]blue";
                }

                if (resetFlightNo) {
                    flightNo = "________[color]red";
                }

                costIndex = "___[color]red";
                if (mcdu.costIndex) {
                    costIndex = mcdu.costIndex + "[color]blue";
                }

                // Cost index
                mcdu.onLeftInput[4] = () => {
                    const value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.tryUpdateCostIndex(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };

                cruiseFlTemp = "_____|___°[color]red";

                if (mcdu._cruiseEntered) {
                    //This is done so pilot enters a FL first, rather than using the computed one
                    if (mcdu.cruiseFlightLevel) {
                        let temp = mcdu.tempCurve.evaluate(mcdu.cruiseFlightLevel);
                        if (isFinite(mcdu.cruiseTemperature)) {
                            temp = mcdu.cruiseTemperature;
                        }
                        cruiseFlTemp = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "/" + temp.toFixed(0) + "°[color]blue";
                    }
                }

                // CRZ FL / FLX TEMP
                mcdu.onLeftInput[5] = () => {
                    mcdu._cruiseEntered = true;
                    const value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };

                if (mcdu.flightPlanManager.getOrigin()) {
                    alignOption = "IRS INIT>";
                }

                // Since CoRte isn't implemented, AltDest defaults to None Ref: Ares's documents
                altDest = "NONE[color]blue";
                if (mcdu.altDestination) {
                    altDest = mcdu.altDestination.ident + "[color]blue";
                }
                mcdu.onLeftInput[1] = async () => {
                    const value = mcdu.inOut;
                    switch (altDest) {
                        case "NONE":
                            if (value === "") {
                                CDUAvailableFlightPlanPage.ShowPage(mcdu);
                            } else {
                                mcdu.clearUserInput();
                                if (await mcdu.tryUpdateAltDestination(value)) {
                                    CDUInitPage.ShowPage1(mcdu);
                                }
                            }
                            break;
                        default:
                            if (value === "") {
                                CDUAvailableFlightPlanPage.ShowPage(mcdu);
                            } else {
                                mcdu.clearUserInput();
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
            coRoute = mcdu.coRoute + "[color]blue";
        }
        mcdu.onLeftInput[0] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            mcdu.updateCoRoute(value, (result) => {
                if (result) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            });
        };

        /**
         * If scratchpad is filled, attempt to update city pair
         * else show route selection pair if city pair is displayed
         * Ref: FCOM 4.03.20 P6
         */
        mcdu.onRightInput[0] = () => {
            const value = mcdu.inOut;
            if (value !== "") {
                mcdu.clearUserInput();
                mcdu.tryUpdateFromTo(value, (result) => {
                    if (result) {
                        CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
                        CDUAvailableFlightPlanPage.ShowPage(mcdu);
                    }
                });
            } else if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
                if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                    CDUAvailableFlightPlanPage.ShowPage(mcdu);
                }
            }
        };
        mcdu.onRightInput[2] = () => {
            if (alignOption) {
                CDUIRSInit.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[2] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            mcdu.updateFlightNo(value, (result) => {
                if (result) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            });
        };

        mcdu.setTemplate([
            ["INIT {}"], //Need to find the right unicode for left/right arrow
            ["CO RTE", "FROM/TO"],
            [coRoute, fromTo],
            ["ALTN/CO RTE", "INIT[color]inop"],
            [altDest, "REQUEST*[color]inop"],
            ["FLT NBR"],
            [flightNo + "[color]blue", alignOption],
            [],
            [],
            ["COST INDEX"],
            [costIndex, "WIND>"],
            ["CRZ FL/TEMP", "TROPO"],
            [cruiseFlTemp, "{small}36090{end}[color]blue"],
        ]);

        mcdu.onPrevPage = () => {
            if (mcdu.isAnEngineOn()) {
                mcdu.showErrorMessage("NOT AVAILABLE");
            } else {
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        mcdu.onNextPage = () => {
            if (mcdu.isAnEngineOn()) {
                mcdu.showErrorMessage("NOT AVAILABLE");
            } else {
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        mcdu.onUp = () => {};
        Coherent.trigger("AP_ALT_VAL_SET", 4200);
        Coherent.trigger("AP_VS_VAL_SET", 300);
        Coherent.trigger("AP_HDG_VAL_SET", 180);
    }
    // Does not refresh page so that other things can be performed first as necessary
    static updateTowIfNeeded(mcdu) {
        if (isFinite(mcdu.taxiFuelWeight) && isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.blockFuel)) {
            const tow = mcdu.zeroFuelWeight + mcdu.blockFuel - mcdu.taxiFuelWeight;
            mcdu.trySetTakeOffWeightLandingWeight(tow.toFixed(1));
        }
    }
    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.InitPageB;

        let initBTitle = "INIT {}";

        let fuelPlanTopTitle = "";
        let fuelPlanBottomTitle = "";
        const fuelPlanColor = "[color]red";

        let zfwColor = "[color]red";
        let zfwCell = "___._";
        let zfwCgCell = "__._";

        if (mcdu._zeroFuelWeightZFWCGEntered) {
            if (isFinite(mcdu.zeroFuelWeight)) {
                zfwCell = mcdu.zeroFuelWeight.toFixed(1);
                zfwColor = "[color]blue";
            }
            if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
                zfwCgCell = mcdu.zeroFuelWeightMassCenter.toFixed(1);
            }
            if (isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.zeroFuelWeightMassCenter)) {
                zfwColor = "[color]blue";
            }
        }
        mcdu.onRightInput[0] = async () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === "") {
                mcdu.inOut =
                    (isFinite(mcdu.zeroFuelWeight) ? mcdu.zeroFuelWeight.toFixed(1) : "") +
                    "/" +
                    (isFinite(mcdu.zeroFuelWeightMassCenter) ? mcdu.zeroFuelWeightMassCenter.toFixed(1) : "");
            } else if (await mcdu.trySetZeroFuelWeightZFWCG(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let blockFuel = "___._";
        let blockFuelColor = "[color]red";
        if (mcdu._blockFuelEntered) {
            if (isFinite(mcdu.blockFuel)) {
                blockFuel = mcdu.blockFuel.toFixed(1);
                blockFuelColor = "[color]blue";
            }
        }
        mcdu.onRightInput[1] = async () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetBlockFuel(value)) {
                mcdu._blockFuelEntered = true;
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let towCell = "---.-";
        let lwCell = "---.-";
        let towLwColor = "[color]white";

        let taxiFuelCell = "{small}0.4{end}";
        if (isFinite(mcdu.taxiFuelWeight)) {
            if (mcdu._taxiEntered) {
                taxiFuelCell = mcdu.taxiFuelWeight.toFixed(1);
            } else {
                taxiFuelCell = "{small}" + mcdu.taxiFuelWeight.toFixed(1) + "{end}";
            }
        }
        mcdu.onLeftInput[0] = async () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetTaxiFuelWeight(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let tripWeightCell = "---.-";
        let tripTimeCell = "----";
        let tripColor = "[color]white";

        let rteRsvWeightCell = "---.-";
        let rteRsvPercentCell = "{blue}5.0{end}";
        let rteRsvColor = "[color]white";

        let altnWeightCell = "---.-";
        const altnTimeCell = "----";
        const altnColor = "[color]white";

        let finalWeightCell = "---.-";
        let finalTimeCell = "{blue}0045{end}";
        let finalColor = "[color]white";

        mcdu.onLeftInput[4] = async () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetRouteFinalFuel(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let extraWeightCell = "---.-";
        let extraTimeCell = "----";
        let extraColor = "[color]white";

        let minDestFob = "---.-";
        let minDestFobColor = "[color]white";

        let tripWindCell = mcdu._windDir + "000";
        let tripWindColor = "[color]blue";

        if (mcdu._zeroFuelWeightZFWCGEntered && blockFuel === "__._") {
            fuelPlanTopTitle = "FUEL ";
            fuelPlanBottomTitle = "PLANNING }";
        }

        if (
            isFinite(mcdu.blockFuel) &&
            isFinite(mcdu.zeroFuelWeightMassCenter) &&
            isFinite(mcdu.zeroFuelWeight) &&
            mcdu.cruiseFlightLevel &&
            mcdu.flightPlanManager.getWaypointsCount() > 0 &&
            mcdu._zeroFuelWeightZFWCGEntered &&
            mcdu._blockFuelEntered
        ) {
            initBTitle = "INIT FUEL PREDICTION {}";

            if (isFinite(mcdu.blockFuel)) {
                fuelPlanTopTitle = "";
                fuelPlanBottomTitle = "";
            }

            if (isFinite(mcdu.getTotalTripFuelCons()) && isFinite(mcdu.getTotalTripTime())) {
                tripWeightCell = "{sp}{sp}{small}" + mcdu.getTotalTripFuelCons().toFixed(1);
                tripTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getTotalTripTime()) + "{end}";
                tripColor = "[color]green";
            }

            if (isFinite(mcdu.getRouteReservedWeight()) && isFinite(mcdu.getRouteReservedPercent())) {
                rteRsvWeightCell = "{sp}{sp}{small}" + mcdu.getRouteReservedWeight().toFixed(1) + "{end}";
                rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
                rteRsvColor = "[color]blue";
            }
            mcdu.onLeftInput[2] = async () => {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (await mcdu.trySetRouteReservedFuel(value)) {
                    CDUInitPage.ShowPage2(mcdu);
                }
            };

            //TODO Compute  ALTN WEIGHT & TIME, this is a placeholder value
            altnWeightCell = "{sp}{sp}{small}{green}0.0{end}{end}";

            if (isFinite(mcdu.getRouteFinalFuelWeight()) && isFinite(mcdu.getRouteFinalFuelTime())) {
                finalWeightCell = "{small}" + mcdu.getRouteFinalFuelWeight().toFixed(1) + "{end}";
                finalTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getRouteFinalFuelTime());
                finalColor = "[color]blue";
            }

            // TODO compute final weight and time, this is a place holder value
            finalWeightCell = "{sp}{sp}{small}" + "0.0" + "{end}";
            finalColor = "[color]blue";

            mcdu.takeOffWeight = mcdu.zeroFuelWeight + mcdu.blockFuel - mcdu.taxiFuelWeight;
            if (isFinite(mcdu.takeOffWeight)) {
                towCell = mcdu.takeOffWeight.toFixed(1);
                towLwColor = "[color]green";
            }

            towCell = "{small}" + towCell;
            lwCell = "000.0" + "{end}"; //TODO compute landing weight, this is a place holder value

            tripWindCell = "{small}" + mcdu._windDir + "000" + "{end}";
            tripWindColor = "[color]blue";
            if (isFinite(mcdu.averageWind)) {
                tripWindCell = "{small}" + mcdu._windDir + mcdu.averageWind.toFixed(0).padStart(3, "0") + "{end}";

            }
            mcdu.onRightInput[4] = async () => {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (await mcdu.trySetAverageWind(value)) {
                    CDUInitPage.ShowPage2(mcdu);
                }
            };

            // TODO calculate minDestFob, this is a placeholder value
            minDestFob = "{sp}{sp}{small}0.0{end}";
            minDestFobColor = "[color]blue";

            // TODO calculate extra weight and time, this is a plceholder value
            // extraWeightCell = parseFloat(blockFuel) - (parseFloat(taxiFuelCell) + parseFloat(taxiFuelCell) + parseFloat(rteRsvWeightCell) + parseFloat(minDestFob));
            extraColor = "[color]green";
            extraWeightCell = "{small}0.0";
            extraTimeCell = "0000{end}";
        }

        mcdu.setTemplate([
            [initBTitle],
            ["TAXI", "ZFW/ZFWCG"], // Reference Honeywell FMS
            [taxiFuelCell + "[color]blue", zfwCell + "|" + zfwCgCell + zfwColor],
            ["TRIP  /TIME", "BLOCK"],
            [tripWeightCell + "/" + tripTimeCell + tripColor, blockFuel + blockFuelColor],
            ["RTE RSV/%", fuelPlanTopTitle + fuelPlanColor],
            [rteRsvWeightCell + "/" + rteRsvPercentCell + rteRsvColor, fuelPlanBottomTitle + fuelPlanColor],
            ["ALTN  /TIME", "TOW/{sp}{sp}{sp}LW"],
            [altnWeightCell + "/" + altnTimeCell + altnColor, towCell + "/" + lwCell + towLwColor],
            ["FINAL/TIME", "TRIP WIND"],
            [finalWeightCell + "/" + finalTimeCell + finalColor, "{small}" + tripWindCell + "{end}" + tripWindColor],
            ["MIN DEST FOB", "EXTRA/TIME"],
            [minDestFob + minDestFobColor, extraWeightCell + "/" + extraTimeCell + extraColor],
        ]);

        // It infact does not work
        mcdu.onPlusMinus = () => {
        };

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
