class CDUInitPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        let fromTo = "□□□□/□□□□[color]red"; //Ref: THALES FM2
        let coRoute = "□□□□□□□□□□[color]red"; //Ref: THALES FM2
        let flightNo = "□□□□□□□□[color]red"; //Ref: THALES FM2
        let altDest = "----/------"; // Ref: THALES FM2
        let lat = "----.-"; //Ref: Thales FM2
        let long = "-----.--"; //Ref: Thales FM2
        let costIndex = "---";
        let cruiseFlTemp = "----- /---°";

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {

                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]blue";
                if (coRoute == "□□□□□□□□□□[color]red") coRoute = "NONE[color]blue" //Check if coroute exists

                //Need code to set the SimVarValue if user inputs FlNo
                if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")+"[color]blue";

                console.log(mcdu.flightPlanManager.getOrigin()); //Is this needed?
                if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().infos && mcdu.flightPlanManager.getOrigin().infos.coordinates) {
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

                // Since CoRte isn't implemented, AltDest defaults to None Ref: FCOM 4.03.20
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
        }
        
        if (mcdu.coRoute) {
            coRoute = mcdu.coRoute + "[color]blue";
        }
        
        mcdu.setTemplate([
            ["INIT ⇄"],
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
        /**
         * If scratchpad is filled, attempt to update city pair
         * else show route selection pair if city pair is displayed
         * Ref: FCOM 4.03.20 P6
         */
        mcdu.onRightInput[0] = () => {
            if (mcdu.inOut) {
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
                    CDUAvailableFlightPlanPage.ShowPage(mcdu)
                }
            }
        };

        /**
         * If city pair is displayed show route selection page
         * Ref: FCOM 4.03.20 P6 
         */
        mcdu.onLeftInput[1] = () => {
            if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
                if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                    CDUAvailableFlightPlanPage.ShowPage(mcdu)
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
        let latText = "LAT"
        if (mcdu._latSelected)  latText = "LAT ⇅"
        mcdu.onLeftInput[3] = () => {
            mcdu._latSelected = true;
            mcdu._lonSelected = false;
            CDUInitPage.ShowPage1(mcdu)
        }

        // Enable Skewing of the LON
        //* Skewing doesn't actually work
        let lonText = "LON"
        if (mcdu._lonSelected) lonText = "LON ⇅"
        mcdu.onRightInput[3] = () => {
            mcdu._lonSelected = true;
            mcdu._latSelected = false;
            CDUInitPage.ShowPage1(mcdu) 
        }

        mcdu.onPrevPage = () => {
            CDUInitPage.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUInitPage.ShowPage2(mcdu);
        };

        // TODO this 
        mcdu.onDown = () => {

        }

        mcdu.onUp = () => {

        }
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

        let initBTitle = "INIT ⇄"

        let zfwColor = "[color]red";
        let zfwCell = "□□□.□";
        let zfwCgCell = " /--.-";
        if (isFinite(mcdu.zeroFuelWeight)) {
            zfwCell = mcdu.zeroFuelWeight.toFixed(1);
            zfwColor = "[color]blue";
        }
        if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
            zfwCgCell = " /" + mcdu.zeroFuelWeightMassCenter.toFixed(1);
        }
        mcdu.onRightInput[0] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetZeroFuelWeightZFWCG(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

        let blockFuel = "□□.□[color]red";
        if (isFinite(mcdu.blockFuel)) {
            blockFuel = mcdu.blockFuel.toFixed(1) + "[color]blue";
            initBTitle = "INIT FUEL PREDICTION ⇄"
        }
        mcdu.onRightInput[1] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetBlockFuel(value)) {
                CDUInitPage.updateTowIfNeeded(mcdu);
                CDUInitPage.ShowPage2(mcdu);
            }
        };

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

        let rteRsvPercentCell = "5.0";
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

        let rteFinalTimeCell = "0030";
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

        let tripWeightCell = "--.-";
        let tripTimeCell = "----";

        let rteRsvWeightCell = "--.-";
        let rteFinalWeightCell = "--.-";

        let towCell = "---.-";
        let lwCell = "---.-";

        let tripWindCell = "---.-";
        // The below three are required for fuel prediction to occur as-well as an active flight plan and a FL
        if (isFinite(mcdu.blockFuel) && isFinite(mcdu.zeroFuelWeightMassCenter) && isFinite(mcdu.zeroFuelWeight)
         && mcdu.cruiseFlightLevel && (mcdu.flightPlanManager.getWaypointsCount() > 0)) {
            
            if (isFinite(mcdu.getTotalTripFuelCons())) {
                console.log("TRIP " + mcdu.getTotalTripFuelCons());
                tripWeightCell = mcdu.getTotalTripFuelCons().toFixed(1);
            }
            
            if (isFinite(mcdu.getTotalTripTime())) {
                console.log("TIME " + mcdu.getTotalTripTime());
                tripTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.getTotalTripTime());
            }
            
            let rteRsvWeight = mcdu.getRouteReservedWeight();
            if (isFinite(rteRsvWeight)) {
                rteRsvWeightCell = rteRsvWeight.toFixed(1);
            }
            
            let rteFinalWeight = mcdu.getRouteFinalFuelWeight();
            if (isFinite(rteFinalWeight)) {
                rteFinalWeightCell = rteFinalWeight.toFixed(1);
            }
            
            if (isFinite(mcdu.takeOffWeight)) {
                towCell = mcdu.takeOffWeight.toFixed(1);
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
        }
        
        mcdu.setTemplate([
            [initBTitle],
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
}
//# sourceMappingURL=A320_Neo_CDU_InitPage.js.map
