class CDUAvailableFlightPlanPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        let fromTo = "NO ORIGIN/DEST";
        if (mcdu.flightPlanManager.getOrigin()) {
            if (mcdu.flightPlanManager.getDestination()) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident;
            }
        }
        mcdu.setTemplate([
            [fromTo],
            [""],
            ["NONE"],
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
        mcdu.onLeftInput[5] = () => { CDUInitPage.ShowPage1(mcdu); };
    }
}
//# sourceMappingURL=A320_Neo_CDU_AvailableFlightPlanPage.js.map