class CDUAtcConnectionStatus {
    static ShowPage(mcdu, store = {"atcCenter": "", "nextAtc": ""}) {
        mcdu.clearDisplay();
        let flightNo = "______[color]green";

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }

        mcdu.setTemplate([
            ["CONNECTION STATUS"],
            ["ACTIVE ATC"],
            ["____[color]amber"],
            ["NEXT ATC"],
            ["----"],
            ["", "MAX UPLINK DELAY\xa0"],
            ["", "NONE[color]inop\xa0"],
            ["--------ADS: ARMED---------"],
            ["\xa0SET OFF[color]inop"],
            [""],
            ["", "ADS DETAIL>[color]inop"],
            ["\xa0ATC MENU", ""],
            ["<RETURN", "NOTIFICATION>"]
        ]);

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
            CDUAtcConnectionNotification.ShowPage(mcdu);
        };
    }
}
