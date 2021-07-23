class CDUFuelPredPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUFuelPredPage.ShowPage(fmc, mcdu);
        }, 'FMGC');

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
        let rteRsvPctColor = "{white}";

        let zfwCell = "___._";
        let zfwCgCell = (" __._");
        let zfwColor = "[color]amber";
        mcdu.onRightInput[2] = async (value) => {
            if (value === "") {
                fmc.updateZfwVars();
                mcdu.sendDataToScratchpad(
                    (isFinite(fmc.zeroFuelWeight) ? (NXUnits.kgToUser(fmc.zeroFuelWeight)).toFixed(1) : "") +
                    "/" +
                    (isFinite(fmc.zeroFuelWeightMassCenter) ? fmc.zeroFuelWeightMassCenter.toFixed(1) : ""));
            } else if (fmc.trySetZeroFuelWeightZFWCG(value)) {
                mcdu.requestUpdate();
            }
        };

        let altFuelCell = "---.-";
        let altFuelTimeCell = "----";
        let altFuelColor = "[color]white";
        let altTimeColor = "{white}";

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
        let extraTimeColor = "{white}";

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

            if (fmc.altDestination) {
                altIdentCell = fmc.altDestination.ident;
            }

            const dest = fmc.flightPlanManager.getDestination();
            if (dest) {
                destIdentCell = dest.ident;
            }

            gwCell = "{small}" + NXUnits.kgToUser(fmc.getGW()).toFixed(1);
            cgCell = fmc.getCG().toFixed(1) + "{end}";
            gwCgCellColor = "[color]green";

            fobCell = "{small}" + (NXUnits.kgToUser(fmc.getFOB())).toFixed(1) + "{end}";
            fobOtherCell = "{inop}FF{end}";
            fobCellColor = "[color]cyan";
        }

        if (CDUInitPage.fuelPredConditionsMet(fmc)) {
            const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");

            if (fmc._fuelPredDone) {
                if (!fmc.routeFinalEntered()) {
                    fmc.tryUpdateRouteFinalFuel();
                }
                if (isFinite(fmc.getRouteFinalFuelWeight()) && isFinite(fmc.getRouteFinalFuelTime())) {
                    if (fmc._rteFinalWeightEntered) {
                        finalFuelCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc.getRouteFinalFuelWeight())).toFixed(1);
                    } else {
                        finalFuelCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc.getRouteFinalFuelWeight())).toFixed(1) + "{end}";
                    }
                    if (fmc._rteFinalTimeEntered || !fmc.routeFinalEntered()) {
                        finalTimeCell = FMCMainDisplay.minutesTohhmm(fmc.getRouteFinalFuelTime());
                    } else {
                        finalTimeCell = "{small}" + FMCMainDisplay.minutesTohhmm(fmc.getRouteFinalFuelTime()) + "{end}";
                    }
                    finalColor = "[color]cyan";
                }
                mcdu.onLeftInput[4] = async (value) => {
                    if (await fmc.trySetRouteFinalFuel(value)) {
                        mcdu.requestUpdate();
                    }
                };

                if (fmc.altDestination) {
                    if (fmc._routeAltFuelEntered) {
                        if (isFinite(fmc.getRouteAltFuelWeight())) {
                            altFuelCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc.getRouteAltFuelWeight())).toFixed(1);
                            altFuelTimeCell = "{small}" + FMCMainDisplay.minutesTohhmm(fmc.getRouteAltFuelTime()) + "{end}";
                            altTimeColor = "{green}";
                            altFuelColor = "[color]cyan";
                        }
                    } else {
                        fmc.tryUpdateRouteAlternate();
                        if (isFinite(fmc.getRouteAltFuelWeight())) {
                            altFuelCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc.getRouteAltFuelWeight())).toFixed(1);
                            altFuelTimeCell = FMCMainDisplay.minutesTohhmm(fmc.getRouteAltFuelTime()) + "{end}";
                            altTimeColor = "{green}";
                            altFuelColor = "[color]cyan";
                        }
                    }
                } else {
                    altFuelCell = "{sp}{sp}{small}0.0{end}";
                    altFuelTimeCell = "----";
                    altFuelColor = "[color]green";
                    altTimeColor = "{white}";
                }
                mcdu.onLeftInput[3] = async (value) => {
                    console.log("Entered Val : " + value);
                    if (await fmc.trySetRouteAlternateFuel(value)) {
                        mcdu.requestUpdate();
                    }
                };
                if (fmc.altDestination) {
                    altIdentCell = fmc.altDestination.ident;
                    altEFOBCell = (NXUnits.kgToUser(fmc.getAltEFOB(true))).toFixed(1);
                    altEFOBCellColor = fmc.getAltEFOB(true) < fmc._minDestFob ? "[color]amber" : "[color]green";
                    altTimeCellColor = "[color]green";
                }

                fmc.tryUpdateRouteTrip(isFlying);
                const dest = fmc.flightPlanManager.getDestination();
                if (dest) {
                    destIdentCell = dest.ident;
                }
                destEFOBCell = (NXUnits.kgToUser(fmc.getDestEFOB(true))).toFixed(1);
                // Should we use predicted values or liveETATo and liveUTCto?
                destTimeCell = isFlying ? FMCMainDisplay.secondsToUTC(utcTime + FMCMainDisplay.minuteToSeconds(fmc._routeTripTime))
                    : destTimeCell = FMCMainDisplay.minutesTohhmm(fmc._routeTripTime);
                if (fmc.altDestination) {
                    altTimeCell = isFlying ? FMCMainDisplay.secondsToUTC(utcTime + FMCMainDisplay.minuteToSeconds(fmc._routeTripTime) + FMCMainDisplay.minuteToSeconds(fmc.getRouteAltFuelTime()))
                        : FMCMainDisplay.minutesTohhmm(fmc.getRouteAltFuelTime());
                }
                destEFOBCellColor = "[color]green";
                destTimeCellColor = "[color]green";

                if (isFlying) {
                    rteRsvWeightCell = "{small}0.0{end}";
                    rteRsvPercentCell = "--.-";
                    rteRSvCellColor = "[color]green";
                    rteRsvPctColor = "{white}";
                } else {
                    rteRsvWeightCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc.getRouteReservedWeight())).toFixed(1);
                    if (!fmc._rteReservedWeightEntered) {
                        rteRsvWeightCell = "{small}" + rteRsvWeightCell + "{end}";
                    }

                    if (fmc._rteRsvPercentOOR) {
                        rteRsvPercentCell = "--.-";
                        rteRSvCellColor = "[color]cyan";
                        rteRsvPctColor = "{white}";
                    } else {
                        rteRsvPercentCell = fmc.getRouteReservedPercent().toFixed(1);
                        const needsPadding = rteRsvPercentCell.length <= 3;
                        if (!fmc._rteReservedPctEntered && fmc.routeReservedEntered()) {
                            rteRsvPercentCell = "{small}" + rteRsvPercentCell + "{end}";
                        }
                        if (needsPadding) {
                            rteRsvPercentCell = "{sp}" + rteRsvPercentCell;
                        }
                        rteRsvPctColor = "{cyan}";
                    }
                    rteRSvCellColor = "[color]cyan";

                    mcdu.onLeftInput[2] = async (value) => {
                        if (await fmc.trySetRouteReservedFuel(value)) {
                            mcdu.requestUpdate();
                        }
                    };
                }

                if (fmc._minDestFobEntered) {
                    minDestFobCell = "{sp}{sp}" + (NXUnits.kgToUser(fmc._minDestFob)).toFixed(1);
                    minDestFobCellColor = "[color]cyan";
                } else {
                    fmc.tryUpdateMinDestFob();
                    minDestFobCell = "{sp}{sp}{small}" + (NXUnits.kgToUser(fmc._minDestFob)).toFixed(1) + "{end}";
                    minDestFobCellColor = "[color]cyan";
                }
                mcdu.onLeftInput[5] = async (value) => {
                    if (await fmc.trySetMinDestFob(value)) {
                        mcdu.requestUpdate();
                    }
                };
                fmc.checkEFOBBelowMin();

                extraFuelCell = "{small}" + (NXUnits.kgToUser(fmc.tryGetExtraFuel(true))).toFixed(1);
                if (fmc.tryGetExtraFuel(true) < 0) {
                    extraTimeCell = "----{end}";
                    extraTimeColor = "{white}";
                } else {
                    extraTimeCell = FMCMainDisplay.minutesTohhmm(fmc.tryGetExtraTime(true)) + "{end}";
                    extraTimeColor = "{green}";
                }
                extraCellColor = "[color]green";

                // Currently not updating as there's no simvar to retrieve this.
                if (isFinite(fmc.zeroFuelWeight)) {
                    zfwCell = (NXUnits.kgToUser(fmc.zeroFuelWeight)).toFixed(1);
                    zfwColor = "[color]cyan";
                }
                if (isFinite(fmc.zeroFuelWeightMassCenter)) {
                    zfwCgCell = fmc.zeroFuelWeightMassCenter.toFixed(1);
                }
            }
        }

        mcdu.setTemplate([
            ["FUEL PRED"],
            ["\xa0AT", "EFOB", isFlying ? "UTC" : "TIME"],
            [destIdentCell + "[color]green", destEFOBCell + destEFOBCellColor, destTimeCell + destTimeCellColor],
            [""],
            [altIdentCell + "[color]green", altEFOBCell + altEFOBCellColor, altTimeCell + altTimeCellColor],
            ["RTE RSV/%", "ZFW/ZFWCG"],
            [rteRsvWeightCell + rteRsvPctColor + "/" + rteRsvPercentCell + "{end}" + rteRSvCellColor, zfwCell + "/" + zfwCgCell + zfwColor],
            ["ALTN\xa0\xa0/TIME", "FOB{sp}{sp}{sp}{sp}{sp}"],
            [altFuelCell + altTimeColor + "/" + altFuelTimeCell + "{end}" + altFuelColor, fobCell + "/" + fobOtherCell + "{sp}{sp}" + fobCellColor],
            ["FINAL\xa0/TIME", "GW/{sp}{sp} CG"],
            [finalFuelCell + "/" + finalTimeCell + finalColor, gwCell + "/  " + cgCell + gwCgCellColor],
            ["MIN DEST FOB", "EXTRA TIME"],
            [minDestFobCell + minDestFobCellColor, extraFuelCell + extraTimeColor + "/" + extraTimeCell + "{end}" + extraCellColor]
        ]);
    }
}
