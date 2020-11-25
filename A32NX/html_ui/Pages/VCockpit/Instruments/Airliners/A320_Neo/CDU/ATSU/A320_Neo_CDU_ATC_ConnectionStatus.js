class CDUAtcConnectionStatus {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        const activeAtc = mcdu._cpdlcAtcCenter + "[color]green";
        let flightNo = "______[color]green";

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }

        mcdu.setTemplate([
            ["CONNECTION STATUS"],
            ["ACTIVE ATC"],
            [activeAtc],
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

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionNotification.ShowPage(mcdu);
        };
    }
}
