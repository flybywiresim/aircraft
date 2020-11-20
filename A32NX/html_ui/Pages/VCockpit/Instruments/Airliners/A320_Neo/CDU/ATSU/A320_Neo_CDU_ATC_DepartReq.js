class CDUAtcDepartReq {
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
            ["DEPART REQ"],
            ["ATC FLT NBR", "A/C TYPE"],
            [flightNo, "A20N[color]blue"],
            ["FROM/TO"],
            [fromTo],
            ["GATE", "ATIS"],
            ["___[color]red", "_[color]red"],
            ["---------FREE TEXT---------"],
            ["[][color]blue"],
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
