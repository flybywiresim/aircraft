class CDUInitPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        // TODO fix LSK ALT when NONE
        let fromTo = "{amberFront}□□□□/□□□□{amberEnd}"; //Ref: THALES FM2
        let coRoute = "{amberFront}□□□□□□□□□□{amberEnd}"; //Ref: THALES FM2
        let flightNo = "{amberFront}□□□□□□□□{amberEnd}"; //Ref: THALES FM2
        let altDest = "----/------"; // Ref: THALES FM2
        let lat = "----.-"; //Ref: Thales FM2
        let long = "-----.--"; //Ref: Thales FM2
        let costIndex = "---";
        let cruiseFlTemp = "----- /---°";

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                fromTo =  "{magentaFront}" + mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "{magentaEnd}";
                if (coRoute.includes("{amberFront}□□□□□□□□□□{amberEnd}")) coRoute = "{magentaFront}NONE{magentaEnd}"; //Check if coroute exists

                //Need code to set the SimVarValue if user inputs FlNo
                if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
                    flightNo = "{magentaFront}" + SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "{magentaEnd}";
                }

                if (mcdu.flightPlanManager.getOrigin().infos.coordinates) {
                    // Credit to Externoak for proper LAT and LONG formatting
                    const airportCoordinates = mcdu.flightPlanManager.getOrigin().infos.coordinates;
                    const originAirportLat = this.ConvertDDToDMS(airportCoordinates["lat"], false);
                    const originAirportLon = this.ConvertDDToDMS(airportCoordinates["long"], true);
                    lat = "{magentaFront}" + originAirportLat["deg"] + "°" + originAirportLat["min"] + "." + Math.ceil(Number(originAirportLat["sec"] / 10)) + originAirportLat["dir"] + "{magentaEnd}";
                    long = "{magentaFront}" + originAirportLon["deg"] + "°" + originAirportLon["min"] + "." + Math.ceil(Number(originAirportLon["sec"] / 10)) + originAirportLon["dir"] + "{magentaEnd}";
                }

                costIndex = "{amberFront}□□□{amberEnd}";
                if (mcdu.costIndex) {
                    costIndex = "{magentaFront}" + mcdu.costIndex + "{magentaEnd}";
                }
                mcdu.onLeftInput[4] = () => {
                    let value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.tryUpdateCostIndex(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };

                cruiseFlTemp = "{amberFront}□□□□□ /□□□°{amberEnd}";
                if (mcdu._cruiseEntered) {
                    //This is done so pilot enters a FL first, rather than using the computed one
                    if (mcdu.cruiseFlightLevel) {
                        let temp = mcdu.tempCurve.evaluate(mcdu.cruiseFlightLevel);
                        if (isFinite(mcdu.cruiseTemperature)) {
                            temp = mcdu.cruiseTemperature;
                        }
                        cruiseFlTemp = "{magentaFront}" +"FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + " /" + temp.toFixed(0) + "°{magentaEnd}";
                    }
                }
                mcdu.onLeftInput[5] = () => {
                    mcdu._cruiseEntered = true;
                    let value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };

                // Since CoRte isn't implemented, AltDest defaults to None Ref: FCOM 4.03.20 *Old Version
                altDest = "{magentaFront}NONE{magentaEnd}";
                if (mcdu.altDestination) {
                    altDest = "{magentaFront}" + mcdu.altDestination.ident + "{magentaEnd}";
                }
                mcdu.onLeftInput[1] = async () => {
                    let value = mcdu.inOut;
                    if (altDest.includes("NONE") || value !== "") {
                        mcdu.clearUserInput();
                        if (await mcdu.tryUpdateAltDestination(value)) {
                            CDUInitPage.ShowPage1(mcdu);
                        }
                    } else if (altDest.includes("NONE")) {
                        CDUAvailableFlightPlanPage.ShowPage(mcdu);
                    }
                };
            }
        }

        if (mcdu.coRoute) {
            coRoute = "{magentaFront}"+ mcdu.coRoute + "{magentaEnd}";
        }

        mcdu.onLeftInput[0] = () => {
            let value = mcdu.inOut;
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
            let value = mcdu.inOut;
            if (value !== "") {
                let value = mcdu.inOut;
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

        mcdu.onLeftInput[2] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            mcdu.updateFlightNo(value, (result) => {
                if (result) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            });
        };

        // Enable skewing of the LAT
        //* Skewing doesn't actually work
        let latText = "LAT";
        if (mcdu._latSelected) latText = "LAT ↑↓";
        mcdu.onLeftInput[3] = () => {
            mcdu._latSelected = true;
            mcdu._lonSelected = false;
            CDUInitPage.ShowPage1(mcdu);
        };

        // Enable Skewing of the LON
        //* Skewing doesn't actually work
        let lonText = "LON";
        if (mcdu._lonSelected) lonText = "LON ↑↓";
        mcdu.onRightInput[3] = () => {
            mcdu._lonSelected = true;
            mcdu._latSelected = false;
            CDUInitPage.ShowPage1(mcdu);
        };

        mcdu.setTemplate([
            ["INIT →"], //Need to find the right unicode for left/right arrow
            ["CO RTE", "FROM/TO"],
            [coRoute, fromTo],
            ["ALTN/CO RTE"],
            [altDest],
            ["FLT NBR"],
            ["{magentaFront}" + flightNo + "{magentaEnd}"],
            [latText, lonText],
            [lat, long],
            ["COST INDEX"],
            [costIndex, "WIND>"],
            ["CRZ FL/TEMP", "TROPO"],
            [cruiseFlTemp, "{magentaFront}36090{magentaEnd}"],
        ]);

        mcdu._lineElements.forEach(function (ele) {
            ele.forEach(function (el) {
                if (el != null) {
                    let newHtml = el;
                    if (newHtml != null) {
                        newHtml = newHtml.innerHTML.replace(/{amberFront}/g, '<span class=\'amber\'>');
                        newHtml = newHtml.replace(/{amberEnd}/g, '</span>');
                        el.innerHTML = newHtml;
                    }
                }})
        });

        mcdu._lineElements.forEach(function (ele) {
            ele.forEach(function (el) {
                if (el != null) {
                    let newHtml = el;
                    if (newHtml != null) {
                        newHtml = newHtml.innerHTML.replace(/{magentaFront}/g, '<span class=\'magenta\'>');
                        newHtml = newHtml.replace(/{magentaEnd}/g, '</span>');
                        el.innerHTML = newHtml;
                    }
                }})
        });

        mcdu.onPrevPage = () => {
            CDUInitPage.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUInitPage.ShowPage2(mcdu);
        };

        // TODO this
        mcdu.onDown = () => {};

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

        let initBTitle = "INIT ←";
        let fuelPlanTitle = "";
        let fuelPlanColor = "[color]red";

        let zfwColor = "[color]red";
        let zfwCell = "□□.□";
        let zfwCgCell = " □□.□";
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
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === "") {
                mcdu.inOut =
                    (isFinite(mcdu.zeroFuelWeight) ? mcdu.zeroFuelWeight.toFixed(1) : "") +
                    "/" +
                    (isFinite(mcdu.zeroFuelWeightMassCenter) ? mcdu.zeroFuelWeightMassCenter.toFixed(1) : "");
            } else if (await mcdu.tryParseZeroFuelWeightZFWCG(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let blockFuel = "□□.□[color]red";
        if (mcdu._blockFuelEntered) {
            if (isFinite(mcdu.blockFuel)) {
                blockFuel = mcdu.blockFuel.toFixed(1) + "[color]blue";
            }
        }
        mcdu.onRightInput[1] = async () => {
            let value = mcdu.inOut;
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

        let taxiFuelCell = "0.2";
        if (isFinite(mcdu.taxiFuelWeight)) {
            taxiFuelCell = mcdu.taxiFuelWeight.toFixed(1);
        }
        mcdu.onLeftInput[0] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetTaxiFuelWeight(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let tripWeightCell = "--.-";
        let tripTimeCell = "----";
        let tripColor = "[color]white";

        let rteRsvWeightCell = "--.-";
        let rteRsvPercentCell = "5.0";
        let rteRsvColor = "[color]blue"; //Until color splitting works

        let altnWeightCell = "--.-";
        let altnTimeCell = "----";
        let altnColor = "[color]white";

        let finalWeightCell = "--.-";
        let finalTimeCell = "0030";
        let finalColor = "[color]blue"; // Need a way to split the colors

        mcdu.onLeftInput[4] = async () => {
            let value = mcdu.inOut;
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

        let tripWindCell = "---.-";
        // The below three are required for fuel prediction to occur as-well as an active flight plan and a FL
        if (
            isFinite(mcdu.blockFuel) &&
            isFinite(mcdu.zeroFuelWeightMassCenter) &&
            isFinite(mcdu.zeroFuelWeight) &&
            mcdu.cruiseFlightLevel &&
            mcdu.flightPlanManager.getWaypointsCount() > 0 &&
            mcdu._zeroFuelWeightZFWCGEntered &&
            mcdu._blockFuelEntered
        ) {
            initBTitle = "INIT FUEL PREDICTION ←";

            if (isFinite(mcdu.getTotalTripFuelCons()) && isFinite(mcdu.getTotalTripTime())) {
                tripWeightCell = mcdu.getTotalTripFuelCons().toFixed(1);
                tripTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getTotalTripTime());
                tripColor = "[color]green";
            }

            if (isFinite(mcdu.getRouteReservedWeight()) && isFinite(mcdu.getRouteReservedPercent())) {
                rteRsvWeightCell = mcdu.getRouteReservedWeight().toFixed(1);
                rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
                //rteRsvColor = "[color]blue" // There until color splitting works
            }
            mcdu.onLeftInput[2] = async () => {
                let value = mcdu.inOut;
                mcdu.clearUserInput();
                if (await mcdu.trySetRouteReservedFuel(value)) {
                    CDUInitPage.ShowPage2(mcdu);
                }
            };

            //TODO Compute code to determine ALTN WEIGHT & TIME

            if (isFinite(mcdu.getRouteFinalFuelWeight()) && isFinite(mcdu.getRouteFinalFuelTime())) {
                finalWeightCell = mcdu.getRouteFinalFuelWeight().toFixed(1);
                finalTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getRouteFinalFuelTime());
                //finalColor = "[color]blue"; // This is here until color splitting can be figured out
            }

            mcdu.takeOffWeight = mcdu.zeroFuelWeight + mcdu.blockFuel - mcdu.taxiFuelWeight;
            console.log("Takeoff weight =" + mcdu.takeOffWeight);
            if (isFinite(mcdu.takeOffWeight)) {
                towCell = mcdu.takeOffWeight.toFixed(1);
                towLwColor = "[color]green";
            }

            if (isFinite(mcdu.landingWeight)) {
                lwCell = mcdu.landingWeight.toFixed(1);
            }

            if (isFinite(mcdu.averageWind)) {
                tripWindCell = mcdu.averageWind.toFixed(1);
            }
            mcdu.onRightInput[4] = async () => {
                let value = mcdu.inOut;
                mcdu.clearUserInput();
                if (await mcdu.trySetAverageWind(value)) {
                    CDUInitPage.ShowPage2(mcdu);
                }
            };

            extraWeightCell = parseFloat(blockFuel) - (parseFloat(taxiFuelCell) + parseFloat(taxiFuelCell) + parseFloat(rteRsvWeightCell) + parseFloat(minDestFob));
            extraColor = "[color]green";
        }

        mcdu.setTemplate([
            [initBTitle],
            ["TAXI", "ZFW /ZFWCG"], // Reference Honeywell FMS
            [taxiFuelCell + "[color]blue", zfwCell + "/" + zfwCgCell + zfwColor],
            ["TRIP/TIME", "BLOCK"],
            [tripWeightCell + " /" + tripTimeCell + tripColor, blockFuel],
            ["RTE RSV /%", fuelPlanTitle + fuelPlanColor],
            [rteRsvWeightCell + " /" + rteRsvPercentCell + rteRsvColor],
            ["ALTN /TIME", "TOW /LW"],
            [altnWeightCell + "/" + altnTimeCell + altnColor, towCell + " /" + lwCell + towLwColor],
            ["FINAL /TIME", "TRIP WIND"],
            [finalWeightCell + " /" + finalTimeCell + finalColor, tripWindCell + "[color]blue"],
            ["MIN DEST FOB", "EXTRA /TIME"],
            [minDestFob + minDestFobColor, extraWeightCell + "/" + extraTimeCell + extraColor],
        ]);
        mcdu.onPrevPage = () => {
            CDUInitPage.ShowPage1(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUInitPage.ShowPage1(mcdu);
        };
    }

    // Credits to Externoak for this
    static ConvertDDToDMS(deg, lng) {
        // converts decimal degrees to degrees minutes seconds
        const M = 0 | ((deg % 1) * 60e7);
        let degree;
        if (lng) {
            degree = this.pad(0 | (deg < 0 ? (deg = -deg) : deg), 3, 0);
        } else {
            degree = 0 | (deg < 0 ? (deg = -deg) : deg);
        }
        return {
            dir: deg < 0 ? (lng ? "W" : "S") : lng ? "E" : "N",
            deg: degree,
            min: Math.abs(0 | (M / 1e7)),
            sec: Math.abs((0 | (((M / 1e6) % 1) * 6e4)) / 100),
        };
    }

    // Credits to Externoak for this
    static pad(n, width, filler) {
        // returns value with size 3, i.e n=1 width=3 filler=. -> "..1"
        n = n + "";
        return n.length >= width ? n : new Array(width - n.length + 1).join(filler) + n;
    }
}
//# sourceMappingURL=A320_Neo_CDU_InitPage.js.map
