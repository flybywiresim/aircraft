class CDUAvailableFlightPlanPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAvailableFlightPlanPage.ShowPage(fmc, mcdu);
        });

        let fromTo = "NO ORIGIN/DEST";
        if (fmc.flightPlanManager.getOrigin()) {
            if (fmc.flightPlanManager.getDestination()) {
                fromTo = fmc.flightPlanManager.getOrigin().ident + "/" + fmc.flightPlanManager.getDestination().ident;
            }
        }
        mcdu.setTemplate([
            [fromTo],
            [""],
            ["NONE[color]green"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);
        mcdu.onLeftInput[5] = () => {
            CDUInitPage.ShowPage1(fmc, mcdu);
        };
    }
}
