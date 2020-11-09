class CDUFuelPredPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.FuelPredPage;
        mcdu.activeSystem = 'FMGC';
        const isFlying = parseInt(SimVar.GetSimVarValue("GROUND VELOCITY", "knots")) > 30;
        let destIdentCell = "---";
        let destTimeCell = "";
        if (mcdu.flightPlanManager.getDestination()) {
            destIdentCell = mcdu.flightPlanManager.getDestination().ident;
            if (isFlying) {
                destTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            } else {
                destTimeCell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.totalTimeInFP);
            }
        }
        let rteRsvWeightCell = "--.-";
        const rteRsvWeight = mcdu.getRouteReservedWeight();
        if (isFinite(rteRsvWeight)) {
            rteRsvWeightCell = rteRsvWeight.toFixed(1);
        }
        let rteRsvPercentCell = "-.-";
        const rteRsvPercent = mcdu.getRouteReservedPercent();
        if (isFinite(rteRsvPercent)) {
            rteRsvPercentCell = rteRsvPercent.toFixed(1);
        }
        let zfwColor = "[color]red";
        let zfwCell = "___._";
        if (isFinite(mcdu.zeroFuelWeight)) {
            zfwCell = mcdu.zeroFuelWeight.toFixed(1);
            zfwColor = "[color]blue";
        }
        let zfwCgCell = "__._";
        if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
            zfwCgCell = mcdu.zeroFuelWeightMassCenter.toFixed(1);
        }
        mcdu.onRightInput[2] = async () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (await mcdu.trySetZeroFuelWeightZFWCG(value)) {
                CDUInitPage.ShowPage2(mcdu);
            }
        };
        mcdu.setTemplate([
            ["FUEL PRED"],
            ["AT", "EFOB", isFlying ? "UTC" : "TIME"],
            [destIdentCell + "[color]green", "", destTimeCell + "[color]green"],
            [""],
            [""],
            ["RTE RSV/ %", "ZFW/ZFWCG"],
            [rteRsvWeightCell + " /" + rteRsvPercentCell + "[color]green", zfwCell + "/ " + zfwCgCell + zfwColor],
            ["ALTN /TIME", "FOB"],
            [""],
            ["FINAL /TIME", "GW/ CG"],
            [""],
            ["MIN DEST FOB", "EXTRA /TIME"],
            [""]
        ]);
    }
}
//# sourceMappingURL=A320_Neo_CDU_FuelPredPage.js.map