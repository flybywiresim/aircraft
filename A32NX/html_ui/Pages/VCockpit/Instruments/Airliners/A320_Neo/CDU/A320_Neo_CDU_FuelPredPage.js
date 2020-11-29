class CDUFuelPredPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.FuelPredPage;
        mcdu.activeSystem = 'FMGC';
        const isFlying = parseInt(SimVar.GetSimVarValue("GROUND VELOCITY", "knots")) > 30;
        let destIdentCell = "NONE";
        let destTimeCell = "----";
        let destTimeCellColor = "[color]white";
        let destEFOBCell = "---.-";
        let destEFOBCellColor = "[color]white";

        let altIdentCell = "NONE";
        let altTimeCell = "----";
        let altTimeCellColor = "[color]white";
        let altEFOBCell = "---.-";
        let altEFOBCellColor = "[color]white";

        let rteRsvWeightCell = "---.-";
        let rteRsvPercentCell = "---.-";
        let rteRSvCellColor = "[color]white";

        let zfwCell = "___._";
        let zfwCgCell = (" __._");
        let zfwColor = "[color]amber";
        mcdu.onRightInput[2] = async (value) => {
            if (await mcdu.trySetZeroFuelWeightZFWCG(value)) {
                CDUFuelPredPage.ShowPage(mcdu);
            }
        };

        let altFuelCell = "---.-";
        let altFuelTimeCell = "----";
        let altFuelColor = "[color]white";

        let fobCell = "---.-";
        let fobOtherCell = "-----";
        let fobCellColor = "[color]white";

        let finalFuelCell = "---.-";
        let finalTimeCell = "----";
        let finalColor = "[color]white";

        let gwCell = "---.-";
        let cgCell = " --.-";
        let gwCgCellColor = "[color]white";

        let minDestFobCell = "---.-";
        let minDestFobCellColor = "[color]white";

        let extraFuelCell = "---.-";
        let extraTimeCell = "----";
        let extraCellColor = "[color]white";

        if (CDUInitPage.fuelPredConditionsMet(mcdu)) {
            const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");

            if (mcdu._fuelPredDone) {
                if (mcdu._rteFinalEntered) {
                    if (isFinite(mcdu.getRouteFinalFuelWeight())) {
                        finalFuelCell = "{sp}{sp}" + mcdu.getRouteFinalFuelWeight().toFixed(1);
                        finalTimeCell = FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime());
                        finalColor = "[color]cyan";
                    }
                } else {
                    mcdu.tryUpdateRouteFinalFuel();
                    if (isFinite(mcdu.getRouteFinalFuelWeight())) {
                        finalFuelCell = "{sp}{sp}{small}" + mcdu.getRouteFinalFuelWeight().toFixed(1) + "{end}";
                        finalTimeCell = FMCMainDisplay.minutesTohhmm(mcdu.getRouteFinalFuelTime());
                        finalColor = "[color]cyan";
                    }
                }
                mcdu.onLeftInput[4] = async (value) => {
                    if (await mcdu.trySetRouteFinalFuel(value)) {
                        CDUFuelPredPage.ShowPage(mcdu);
                    }
                };

                if (mcdu._routeAltFuelEntered) {
                    if (isFinite(mcdu.getRouteAltFuelWeight())) {
                        altFuelCell = "{sp}{sp}" + mcdu.getRouteAltFuelWeight().toFixed(1);
                        altFuelTimeCell = "{small}{green}" + FMCMainDisplay.minutesTohhmm(mcdu.getRouteAltFuelTime()) + "{end}{end}";
                        altFuelColor = "[color]cyan";
                    }
                } else {
                    mcdu.tryUpdateRouteAlternate();
                    if (isFinite(mcdu.getRouteAltFuelWeight())) {
                        altFuelCell = "{sp}{sp}{small}" + mcdu.getRouteAltFuelWeight().toFixed(1);
                        altFuelTimeCell = "{green}" + FMCMainDisplay.minutesTohhmm(mcdu.getRouteAltFuelTime()) + "{end}{end}";
                        altFuelColor = "[color]cyan";
                    }
                }
                mcdu.onLeftInput[3] = async (value) => {
                    console.log("Entered Val : " + value);
                    if (await mcdu.trySetRouteAlternateFuel(value)) {
                        CDUFuelPredPage.ShowPage(mcdu);
                    }
                };
                if (mcdu.altDestination) {
                    altIdentCell = mcdu.altDestination.ident;
                    altEFOBCell = mcdu.getAltEFOB(true).toFixed(1);
                    altTimeCellColor = "[color]green";
                    altEFOBCellColor = "[color]green";
                }

                mcdu.tryUpdateRouteTrip(isFlying);
                destIdentCell = mcdu.flightPlanManager.getDestination().ident;
                destEFOBCell = mcdu.getDestEFOB(true).toFixed(1);
                // Should we use predicted values or liveETATo and liveUTCto?
                destTimeCell = isFlying ? FMCMainDisplay.secondsToUTC(utcTime + FMCMainDisplay.minuteToSeconds(mcdu._routeTripTime))
                    : destTimeCell = FMCMainDisplay.minutesTohhmm(mcdu._routeTripTime);
                if (mcdu.altDestination) {
                    altTimeCell = isFlying ? FMCMainDisplay.secondsToUTC(utcTime + FMCMainDisplay.minuteToSeconds(mcdu._routeTripTime) + FMCMainDisplay.minuteToSeconds(mcdu.getRouteAltFuelTime()))
                        : FMCMainDisplay.minutesTohhmm(mcdu.getRouteAltFuelTime());
                }
                destEFOBCellColor = "[color]green";
                destTimeCellColor = "[color]green";

                fobCell = "{small}" + mcdu.getFOB().toFixed(1) + "{end}";
                fobOtherCell = "FF";
                fobCellColor = "[color]cyan";

                gwCell = "{small}" + mcdu.getGW().toFixed(1);
                cgCell = mcdu.getCG().toFixed(1) + "{end}";
                gwCgCellColor = "[color]green";

                if (isFlying) {
                    rteRsvWeightCell = "{small}0.0{end}";
                    rteRsvPercentCell = "{white}--.-{end}";
                    rteRSvCellColor = "[color]green";
                } else {
                    if (mcdu._rteRsvPercentOOR) {
                        rteRsvWeightCell = "{sp}{sp}{small}" + "---.-" + "{end}";
                        rteRsvPercentCell = "--.-";
                        rteRSvCellColor = "[color]cyan";
                    } else {
                        rteRsvWeightCell = mcdu.getRouteReservedWeight().toFixed(1);
                        rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
                        rteRsvPercentCell = rteRsvPercentCell.length <= 3 ? "{sp}" + rteRsvPercentCell : rteRsvPercentCell;
                        rteRSvCellColor = "[color]cyan";
                        mcdu.onLeftInput[2] = async (value) => {
                            if (await mcdu.trySetRouteReservedFuel(value)) {
                                CDUInitPage.ShowPage2(mcdu);
                            }
                        };
                    }
                }

                if (mcdu._minDestFobEntered) {
                    minDestFobCell = "{sp}{sp}" + mcdu._minDestFob.toFixed(1);
                    minDestFobCellColor = "[color]cyan";
                } else {
                    mcdu.tryUpdateMinDestFob();
                    minDestFobCell = "{sp}{sp}{small}" + mcdu._minDestFob.toFixed(1) + "{end}";
                    minDestFobCellColor = "[color]cyan";
                }
                mcdu.onLeftInput[5] = async (value) => {
                    if (await mcdu.trySetMinDestFob(value)) {
                        CDUFuelPredPage.ShowPage(mcdu);
                    }
                };

                if (isFlying) {
                    extraFuelCell = "{small}" + (mcdu.tryGetExtraFuel(true) + mcdu.getRouteReservedWeight()).toFixed(1);
                } else {
                    extraFuelCell = "{small}" + mcdu.tryGetExtraFuel(true).toFixed(1);
                }
                extraCellColor = "[color]green";
                extraTimeCell = FMCMainDisplay.minutesTohhmm(mcdu.tryGetExtraTime(true)) + "{end}";

                // Currently not updating as there's no simvar to retrieve this.
                if (isFinite(mcdu.zeroFuelWeight)) {
                    zfwCell = mcdu.zeroFuelWeight.toFixed(1);
                    zfwColor = "[color]cyan";
                }
                if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
                    zfwCgCell = mcdu.zeroFuelWeightMassCenter.toFixed(1);
                }
            }
        }

        mcdu.setTemplate([
            ["FUEL PRED"],
            ["AT", "EFOB", isFlying ? "UTC" : "TIME"],
            [destIdentCell + "[color]green", destEFOBCell + destEFOBCellColor, destTimeCell + destTimeCellColor],
            [""],
            [altIdentCell + "[color]green", altEFOBCell + altEFOBCellColor, altTimeCell + altTimeCellColor],
            ["RTE RSV/%", "ZFW/ZFWCG"],
            [rteRsvWeightCell + "/" + rteRsvPercentCell + rteRSvCellColor, zfwCell + "/" + zfwCgCell + zfwColor],
            ["ALTN/TIME", "FOB{sp}{sp}{sp}{sp}{sp}"],
            [altFuelCell + "/" + altFuelTimeCell + altFuelColor, fobCell + "/" + fobOtherCell + "{sp}{sp}" + fobCellColor],
            ["FINAL/TIME", "GW/{sp}{sp} CG"],
            [finalFuelCell + "/" + finalTimeCell + finalColor, gwCell + "/  " + cgCell + gwCgCellColor],
            ["MIN DEST FOB", "EXTRA TIME"],
            [minDestFobCell + minDestFobCellColor, extraFuelCell + "/" + extraTimeCell + extraCellColor]
        ]);

        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.FuelPredPage) {
                CDUFuelPredPage.ShowPage(mcdu);
            }
        }, mcdu.PageTimeout.Dyn);
    }
}
