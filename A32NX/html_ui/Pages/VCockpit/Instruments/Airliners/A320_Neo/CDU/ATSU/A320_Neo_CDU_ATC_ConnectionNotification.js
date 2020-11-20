class CDUAtcConnectionNotification {
    static ShowPage(mcdu, store = {"atcCenter": "", "nextAtc": ""}) {
        mcdu.clearDisplay();

        let flightNo = "______[color]green";

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }

        mcdu.setTemplate([
            ["NOTIFICATION"],
            ["ATC FLT NBR"],
            [flightNo],
            ["ATC CENTER"],
            [`${store["atcCenter"] != "" ? store["atcCenter"] + "[color]green" : "____[color]red"}`, "NOTIFY*[color]blue"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["ATC MENU", "CONNECTION"],
            ["<RETURN", "STATUS>"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["atcCenter"] = "";
            } else {
                store["atcCenter"] = value;
            }
            CDUAtcConnectionNotification.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcConnection.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionStatus.ShowPage(mcdu);
        };
    }
}
