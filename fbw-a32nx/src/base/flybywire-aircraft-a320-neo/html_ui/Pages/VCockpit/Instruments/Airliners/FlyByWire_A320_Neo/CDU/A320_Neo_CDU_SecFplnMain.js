class CDUSecFplnMain {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'FMGC';

        mcdu.onLeftInput[0] = () => {
            mcdu.flightPlanService.flightPlanManager.copy(Fmgc.FlightPlanIndex.Active, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[1] = () => {
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[2] = () => {
            mcdu.flightPlanService.flightPlanManager.delete(Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[5] = () => {
            mcdu.flightPlanService.flightPlanManager.swap(Fmgc.FlightPlanIndex.FirstSecondary, Fmgc.FlightPlanIndex.Active);
        };

        mcdu.setTemplate([
            ["SEC INDEX"],
            [""],
            ["{COPY ACTIVE", "INIT>[color]inop"],
            [""],
            ["<SEC F-PLN", "PERF>[color]inop"],
            [""],
            ["{DELETE SEC"],
            [""],
            ["*ACTIVATE SEC[color]inop"],
            [""],
            [""],
            [""],
            ["*SWAP ACTIVE[color]inop"]
        ]);
    }
}
