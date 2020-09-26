class CDUInitPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        // TODO create local simvars for.. everything
        let fromTo = "□□□□/□□□□[color]red";
        let coRoute = "□□□□□□□□□□[color]red";
        let flightNo = "□□□□□□□□[color]red";
        let altDest = "----/------";
        let lat = "----.-";
        let long = "-----.--";
        let costIndex = "---";
        let cruiseFlTemp = "----- /---°";

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]blue";
                if (coRoute.includes("□□□□□□□□□□[color]red")) coRoute = "NONE[color]blue"; //Check if coroute exists

                //Need code to set the SimVarValue if user inputs FlNo
                if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
                    flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]blue";
                }

                if (mcdu.flightPlanManager.getOrigin().infos.coordinates) {
                    /*  Commented out until #677 is merged
                    const airportCoordinates = mcdu.flightPlanManager.getOrigin().infos.coordinates;
                    const originAirportLat = this.ConvertDDToDMS(airportCoordinates["lat"], false);
                    const originAirportLon = this.ConvertDDToDMS(airportCoordinates["long"], true);
                    lat = originAirportLat["deg"] + "°" + originAirportLat["min"] + "." + Math.ceil(Number(originAirportLat["sec"] / 10)) + originAirportLat["dir"] + "[color]blue";
                    long =
                        originAirportLon["deg"] + "°" + originAirportLon["min"] + "." + Math.ceil(Number(originAirportLon["sec"] / 10)) + originAirportLon["dir"] + "[color]blue";
                     */
                    lat = mcdu.flightPlanManager.getOrigin().infos.coordinates.latToDegreeString() + "[color]blue";
                    long = mcdu.flightPlanManager.getOrigin().infos.coordinates.longToDegreeString() + "[color]blue";
                }

                costIndex = "□□□[color]red";
                if (mcdu.costIndex) {
                    costIndex = mcdu.costIndex + "[color]blue";
                }
                mcdu.onLeftInput[4] = () => {
                    let value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.tryUpdateCostIndex(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };

                cruiseFlTemp = "□□□□□ /□□□°[color]red";
                if (mcdu._cruiseEntered) {
                    //This is done so pilot enters a FL first, rather than using the computed one
                    if (mcdu.cruiseFlightLevel) {
                        let temp = mcdu.tempCurve.evaluate(mcdu.cruiseFlightLevel);
                        if (isFinite(mcdu.cruiseTemperature)) {
                            temp = mcdu.cruiseTemperature;
                        }
                        cruiseFlTemp = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + " /" + temp.toFixed(0) + "°[color]blue";
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
                altDest = "NONE[color]blue";
                if (mcdu.altDestination) {
                    altDest = mcdu.altDestination.ident + "[color]blue";
                }
                /**
                 * This is honestly a mess, but I was just focusing on making it work
                 *
                 */
                mcdu.onLeftInput[1] = async () => {
                    let value = mcdu.inOut;
                    console.log("ALT value is: " + value);
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

        if (mcdu.coRoute) coRoute = mcdu.coRoute + "[color]blue";

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
            [flightNo + "[color]blue"],
            [latText, lonText],
            [lat, long],
            ["COST INDEX"],
            [costIndex, "WIND>"],
            ["CRZ FL/TEMP", "TROPO"],
            [cruiseFlTemp, "36090[color]blue"],
        ]);

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

        let taxiFuelCell = 0.2;
        if (isFinite(mcdu.taxiFuelWeight)) {
            taxiFuelCell = mcdu.taxiFuelWeight.toFixed(1) ;
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
        let rteRsvPercentCell = 5.0;
        let rteRsvColor = "[color]white";

        let altnWeightCell = "--.-";
        let altnTimeCell = "----";
        let altnColor = "[color]white";

        let finalWeightCell = "--.-";
        let finalTimeCell = "0030";
        let finalColor = "[color]white";

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

        let tripWindCell = "-----";
        let tripWindColor = "[color]white";
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
                tripWeightCell = "{smallFront}" + mcdu.getTotalTripFuelCons().toFixed(1);
                tripTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getTotalTripTime()) + "{smallEnd}";
                tripColor = "[color]green";
            }

            if (isFinite(mcdu.getRouteReservedWeight()) && isFinite(mcdu.getRouteReservedPercent())) {
                rteRsvWeightCell = mcdu.getRouteReservedWeight().toFixed(1) ;
                rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
                rteRsvColor = "[color]blue";
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
                finalColor = "[color]blue";
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

            towCell = "{smallFront}" + towCell;
            lwCell = "{smallEnd}" + lwCell;

            tripWindCell = "{smallFront}" + mcdu._windDir + "000" + "{smallEnd}";
            tripWindColor = "[color]blue";
            if (isFinite(mcdu.averageWind)) {
                tripWindCell = "{smallFront}" + mcdu._windDir + this.pad(mcdu.averageWind.toFixed(0), 3, "0") + "{smallEnd}";
            }
            mcdu.onRightInput[4] = async () => {
                let value = mcdu.inOut;
                mcdu.clearUserInput();
                if (await mcdu.tryParseAverageWind(value)) {
                    CDUInitPage.ShowPage2(mcdu);
                }
            };

            // TODO calculate minDestFob

            // TODO insert small font when this can actually be calculated
            extraWeightCell = parseFloat(blockFuel) - (parseFloat(taxiFuelCell) + parseFloat(taxiFuelCell) + parseFloat(rteRsvWeightCell) + parseFloat(minDestFob));
            extraColor = "[color]green";
            if (!isFinite(extraWeightCell)) {
                extraWeightCell = "---.-";
                extraColor = "[color]white";
            }
        }

        mcdu.setTemplate([
            [initBTitle],
            ["TAXI", "ZFW /ZFWCG"], // Reference Honeywell FMS
            [taxiFuelCell + "[color]blue", zfwCell + "/" + zfwCgCell + zfwColor],
            ["TRIP/TIME", "BLOCK"],
            [tripWeightCell + "/" + tripTimeCell + tripColor, blockFuel],
            ["RTE RSV /%", fuelPlanTitle + fuelPlanColor],
            [rteRsvWeightCell + "/" + rteRsvPercentCell + rteRsvColor],
            ["ALTN /TIME", "TOW /LW"],
            [altnWeightCell + "/" + altnTimeCell + altnColor, towCell + "/" + lwCell + towLwColor],
            ["FINAL /TIME", "TRIP WIND"],
            [finalWeightCell + "/" + finalTimeCell + finalColor, tripWindCell + tripWindColor],
            ["MIN DEST FOB", "EXTRA /TIME"],
            [minDestFob + minDestFobColor, extraWeightCell + "/" + extraTimeCell + extraColor],
        ]);

        mcdu._lineElements.forEach(function (ele) {
            ele.forEach(function (el) {
                if (el != null) {
                    let newHtml = el;
                    if (newHtml != null) {
                        newHtml = newHtml.innerHTML.replace(/{smallFront}/g, "<span class='s-text'>");
                        newHtml = newHtml.replace(/{smallEnd}/g, "</span>");
                        el.innerHTML = newHtml;
                    }
                }
            });
        });

        // It infact does not work
        mcdu.onPlusMinus = () => {
            console.log("Plus Minus Works!!");
        };

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
