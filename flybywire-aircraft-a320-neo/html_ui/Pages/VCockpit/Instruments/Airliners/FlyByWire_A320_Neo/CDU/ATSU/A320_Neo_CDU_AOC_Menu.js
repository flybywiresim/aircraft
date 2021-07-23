class CDUAocMenu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(null, "ATSU");

        mcdu.setTemplate([
            ["AOC MENU"],
            [""],
            ["<INIT/PRES", "FREE TEXT>"],
            ["", "RECEIVED"],
            ["<WX REQUEST", "MESSAGES>"],
            ["", "SENT"],
            ["<ATIS", "MESSAGES>"],
            [""],
            ["<PERF/W&B[color]white", "BOARDING>[color]inop"],
            [""],
            ["", "DIVERSION>[color]inop"],
            ["ATSU DLK"],
            ["<RETURN", "MISC>[color]inop"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAocRequestsWeather.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUAocRequestsAtis.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUAocOfpData.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUAocFreeText.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            CDUAocMessagesReceived.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDUAocMessagesSent.ShowPage(fmc, mcdu);
        };
        mcdu.onLeftInput[0] = () => {
            CDUAocInit.ShowPage(fmc, mcdu);
        };
    }
}
