class CDUAtcConnectionNotification {
    static ShowPage(fmc, mcdu, store = {"atcCenter": ""}) {
        mcdu.setCurrentPage(() => {
            CDUAtcConnectionNotification.ShowPage(fmc, mcdu, store);
        });
        const canNotify = "";
        let flightNo = "______[color]green";
        let fromTo = "____|____[color]amber";
        if (store["atcCenter"] == "") {
            store["atcCenter"] = "____[color]amber";
        }
        if (fmc.flightNumber) {
            flightNo = fmc.flightNumber + "[color]green";
        }
        if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getDestination().ident) {
            fromTo = fmc.flightPlanManager.getOrigin().ident + "/" + fmc.flightPlanManager.getDestination().ident + "[color]cyan";
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
            CDUAtcConnectionNotification.ShowPage(fmc, mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionStatus.ShowPage(fmc, mcdu);
        };
    }
}
