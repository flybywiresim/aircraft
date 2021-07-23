class CDUAtcConnectionStatus {
    static ShowPage(fmc, mcdu, store = {"atcCenter": "", "nextAtc": ""}) {
        mcdu.setCurrentPage(() => {
            CDUAtcConnectionStatus.ShowPage(fmc, mcdu, store);
        });
        let flightNo = "______[color]green";

        if (fmc.flightNumber) {
            flightNo = fmc.flightNumber + "[color]green";
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
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionNotification.ShowPage(fmc, mcdu);
        };
    }
}
