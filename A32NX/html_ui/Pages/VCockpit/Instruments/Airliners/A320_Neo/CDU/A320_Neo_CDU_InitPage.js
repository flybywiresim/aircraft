class CDUInitPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        let fromTo = "□□□□/□□□□[color]red";
        let cruiseFlTemp = "----- /---°";
        let costIndex = "---";
        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]blue";
                costIndex = "---[color]blue";
                mcdu.onLeftInput[4] = () => {
                    let value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.tryUpdateCostIndex(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };
                cruiseFlTemp = "□□□□□ /□□□[color]red";
                if (mcdu.cruiseFlightLevel) {
                    let temp = mcdu.tempCurve.evaluate(mcdu.cruiseFlightLevel);
                    if (isFinite(mcdu.cruiseTemperature)) {
                        temp = mcdu.cruiseTemperature;
                    }
                    cruiseFlTemp = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + " /" + temp.toFixed(0) + "°[color]blue";
                }
                mcdu.onLeftInput[5] = () => {
                    let value = mcdu.inOut;
                    mcdu.clearUserInput();
                    if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                        CDUInitPage.ShowPage1(mcdu);
                    }
                };
            }
        }
        let coRoute = "NONE[color]blue";
        if (mcdu.coRoute) {
            coRoute = mcdu.coRoute + "[color]blue";
        }
        let altDest = "-------[color]blue";
        if (mcdu.flightPlanManager.getDestination()) {
            altDest = "NONE[color]blue";
            if (mcdu.altDestination) {
                altDest = mcdu.altDestination.ident + "[color]blue";
            }
            mcdu.onLeftInput[1] = async () => {
                let value = mcdu.inOut;
                mcdu.clearUserInput();
                if (await mcdu.tryUpdateAltDestination(value)) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            };
        }
        let alignOption;

        if (mcdu.flightPlanManager.getOrigin()) {
            alignOption = "IRS INIT>";
        }
        let flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
        if (!flightNo) {
            flightNo = "--------";
        }
        let lat = "----.--";
        let long = "-----.--";
        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().infos && mcdu.flightPlanManager.getOrigin().infos.coordinates) {
            const airportCoordinates = mcdu.flightPlanManager.getOrigin().infos.coordinates;
            const originAirportLat = this.ConvertDDToDMS(airportCoordinates['lat'], false);
            const originAirportLon = this.ConvertDDToDMS(airportCoordinates['long'], true);
            lat = originAirportLat['deg'] + '°' + originAirportLat['min'] + '.' + Math.ceil(Number(originAirportLat['sec'] / 10)) + originAirportLat['dir'] + "[color]blue";
            long = originAirportLon['deg'] + '°' + originAirportLon['min'] + '.' + Math.ceil(Number(originAirportLon['sec'] / 10)) + originAirportLon['dir'] + "[color]blue";
        }
        if (mcdu.costIndex) {
            costIndex = mcdu.costIndex + "[color]blue";
        }
        mcdu.setTemplate([
            ["INIT →"],
            ["CO RTE", "FROM/TO"],
            [coRoute, fromTo],
            ["ALTN/CO RTE"],
            [altDest],
            ["FLT NBR"],
            [flightNo + "[color]blue", alignOption],
            ["LAT", "LONG"],
            [lat, long],
            ["COST INDEX"],
            [costIndex, "WIND>"],
            ["CRZ FL/TEMP", "TROPO"],
            [cruiseFlTemp, "36090[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            mcdu.updateCoRoute(value, (result) => {
                if (result) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            });
        };
        mcdu.onRightInput[0] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            mcdu.tryUpdateFromTo(value, (result) => {
                if (result) {                    
                    CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
                    
                    CDUAvailableFlightPlanPage.ShowPage(mcdu);
                }
            });
        };
        mcdu.onRightInput[2] = () => {
            if (alignOption) {
                CDUIRSInit.ShowPage(mcdu);
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
        mcdu.onPrevPage = () => {
            CDUInitPage.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUInitPage.ShowPage2(mcdu);
        };
        Coherent.trigger("AP_ALT_VAL_SET", 4200);
        Coherent.trigger("AP_VS_VAL_SET", 300);
        Coherent.trigger("AP_HDG_VAL_SET", 180);
    }
    // Does not refresh page so that other things can be performed first as necessary
    static updateTowIfNeeded(mcdu) {
        if (isFinite(mcdu.taxiFuelWeight) &&
            isFinite(mcdu.zeroFuelWeight) &&
            isFinite(mcdu.blockFuel)) {

            const tow = mcdu.zeroFuelWeight + mcdu.blockFuel - mcdu.taxiFuelWeight;
            mcdu.trySetTakeOffWeightLandingWeight(tow.toFixed(1));
        }
    }
    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        let taxiFuelCell = "-.-";
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
        if (isFinite(mcdu.getTotalTripFuelCons())) {
            console.log("TRIP " + mcdu.getTotalTripFuelCons());
            tripWeightCell = mcdu.getTotalTripFuelCons().toFixed(1);
        }
        let tripTimeCell = "----";
        if (isFinite(mcdu.getTotalTripTime())) {
            console.log("TIME " + mcdu.getTotalTripTime());
            tripTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getTotalTripTime());
        }
        let rteRsvWeightCell = "--.-";
        let rteRsvWeight = mcdu.getRouteReservedWeight();
        if (isFinite(rteRsvWeight)) {
            rteRsvWeightCell = rteRsvWeight.toFixed(1);
        }
        let rteRsvPercentCell = "-.-";
        let rteRsvPercent = mcdu.getRouteReservedPercent();
        if (isFinite(rteRsvPercent)) {
            rteRsvPercentCell = rteRsvPercent.toFixed(1);
        }
        mcdu.onLeftInput[2] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetRouteReservedFuel(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        let rteFinalWeightCell = "--.-";
        let rteFinalWeight = mcdu.getRouteFinalFuelWeight();
        if (isFinite(rteFinalWeight)) {
            rteFinalWeightCell = rteFinalWeight.toFixed(1);
        }
        let rteFinalTimeCell = "----";
        let rteFinalTime = mcdu.getRouteFinalFuelTime();
        if (isFinite(rteFinalTime)) {
            rteFinalTimeCell = FMCMainDisplay.secondsTohhmm(rteFinalTime);
        }
        mcdu.onLeftInput[4] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetRouteFinalFuel(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        let zfwColor = "[color]red";
        let zfwCell = "□□□.□";
        let zfwCgCell = " /□□.□";
        if (isFinite(mcdu.zeroFuelWeight)) {
            zfwCell = mcdu.zeroFuelWeight.toFixed(1);
            zfwColor = "[color]blue";
        }
        if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
            zfwCgCell = " /" + mcdu.zeroFuelWeightMassCenter.toFixed(1);
        }
        if (isFinite(mcdu.zeroFuelWeight) && isFinite(mcdu.zeroFuelWeightMassCenter)) {
            zfwColor = "[color]blue";
        }
        mcdu.onRightInput[0] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === "") {
                mcdu.inOut = (isFinite(mcdu.zeroFuelWeight) ? mcdu.zeroFuelWeight.toFixed(1) : "") + "/" + (isFinite(mcdu.zeroFuelWeightMassCenter) ? mcdu.zeroFuelWeightMassCenter.toFixed(1) : "");
            }
            else if (await mcdu.trySetZeroFuelWeightZFWCG(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        let blockFuel = "□□.□[color]red";
        if (isFinite(mcdu.blockFuel)) {
            blockFuel = mcdu.blockFuel.toFixed(1) + "[color]blue";
        }
        mcdu.onRightInput[1] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetBlockFuel(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        let towCell = "---.-";
        let lwCell = "---.-";
        if (isFinite(mcdu.takeOffWeight)) {
            towCell = mcdu.takeOffWeight.toFixed(1);
        }
        if (isFinite(mcdu.landingWeight)) {
            lwCell = mcdu.landingWeight.toFixed(1);
        }
        let tripWindCell = "---.-";
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
        mcdu.setTemplate([
            ["INIT →"],
            ["TAXI", "ZFW /ZFWCG"],
            [taxiFuelCell + "[color]blue", zfwCell + zfwCgCell + zfwColor],
            ["TRIP/TIME", "BLOCK"],
            [tripWeightCell + " /" + tripTimeCell + "[color]green", blockFuel],
            ["RTE RSV /%"],
            [rteRsvWeightCell + " /" + rteRsvPercentCell + "[color]blue"],
            ["ALTN /TIME", "TOW /LW"],
            ["--.-/----", towCell + " /" + lwCell + "[color]green"],
            ["FINAL /TIME", "TRIP WIND"],
            [rteFinalWeightCell + " /" + rteFinalTimeCell + "[color]blue", tripWindCell + "[color]blue"],
            ["MIN DEST FOB", "EXTRA /TIME"],
            ["-----", "--.-/----"]
        ]);
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
            const M=0|(deg%1)*60e7;
            let degree;
            if (lng) {
                degree = (0 | (deg < 0 ? deg = -deg:deg)).toString().padStart(3, "0");
            } else {
                degree = 0 | (deg < 0 ? deg = -deg:deg);
            }
            return {
                dir : deg<0 ? lng ? 'W':'S' : lng ? 'E':'N',
                deg : degree,
                min : Math.abs(0|M/1e7),
                sec : Math.abs((0|M/1e6%1*6e4)/100)
            };
    }
}
//# sourceMappingURL=A320_Neo_CDU_InitPage.js.map
