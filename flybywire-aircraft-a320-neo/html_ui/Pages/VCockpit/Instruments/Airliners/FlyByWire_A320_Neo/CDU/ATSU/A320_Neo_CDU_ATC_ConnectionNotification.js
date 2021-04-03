class CDUAtcConnectionNotification {
    static ShowPage(mcdu, store = {"atcCenter": ""}) {
        mcdu.clearDisplay();
        const canNotify = "";
        let flightNo = "______[color]green";
        let fromTo = "____|____[color]amber";
        if (store["atcCenter"] == "") {
            store["atcCenter"] = "____[color]amber";
        }
        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]cyan";
        }

        mcdu.setTemplate([
            ["NOTIFICATION"],
            ["\xa0ATC FLT NBR", "FROM/TO\xa0"],
            [flightNo, fromTo],
            ["\xa0ATC CENTER"],
            [store["atcCenter"], "NOTIFY\xa0[color]inop", "---------"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ATC MENU", "CONNECTION\xa0"],
            ["<RETURN", "STATUS>"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value != "") {
                store["atcCenter"] = value + "[color]green";
            }
            CDUAtcConnectionNotification.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionStatus.ShowPage(mcdu);
        };
    }
}
