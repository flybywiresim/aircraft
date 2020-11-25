class CDUAtcRequest {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        let flightNo = "______[color]red";
        let fromTo = "____|____[color]red";
        let atcCenter = "____[color]red";

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]blue";
        }

        mcdu.setTemplate([
            ["REQUEST"],
            ["DIR TO", "FL/ALT"],
            ["[{\xa0\xa0\xa0}]", "[{\xa0\xa0\xa0}]"],
            ["", "SPD/MACH"],
            ["", "[{\xa0\xa0\xa0}]"],
            [""],
            [""],
            ["DUE TO", "DUE TO"],
            ["{WEATHER", "A/C PERF}"],
            [""],
            [""],
            ["ATC MENU", "ATC DEPART[color]blue"],
            ["<RETURN", "REQ DISPL*[color]blue"]
        ]);

        mcdu.onLeftInput[4] = (value) => {
            atcCenter = value + "[color]green";
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
    }
}
