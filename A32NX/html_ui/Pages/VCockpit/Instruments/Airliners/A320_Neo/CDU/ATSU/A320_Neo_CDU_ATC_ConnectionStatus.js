class CDUAtcConnectionStatus {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        let flightNo = "______[color]green";
        let atcCenter = "____[color]red";

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }

        mcdu.setTemplate([
            ["CONNECTION STATUS"],
            ["ACTIVE ATC"],
            [atcCenter],
            ["NEXT ATC"],
            ["----"],
            ["", "MAX UPLINK DELAY"],
            ["", "NONE[color]blue"],
            ["-----ADS: ARMED---------"],
            ["*SET OFF[color]blue"],
            [""],
            ["", "ADS DETAIL"],
            ["ATC MENU", ""],
            ["<RETURN", "NOTIFICATION>"]
        ]);

        mcdu.onLeftInput[4] = (value) => {
            atcCenter = value + "[color]green";
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
