class CDUAocMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["AOC MENU"],
            [""],
            ["<INIT/PRES", "FREE TEXT>"],
            ["", "RECEIVED"],
            ["<WX REQUEST", "MESSAGES>"],
            ["", "SENT"],
            ["<ATIS", "MESSAGES>"],
            [""],
            ["<W/B[color]white", ""],
            [""],
            ["", "DIVERSION>[color]inop"],
            ["ATSU DLK"],
            ["<RETURN", "MISC>[color]inop"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAocRequestsWeather.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUAocRequestsAtis.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUAocOfpData.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUAocFreeText.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDUAocMessagesSent.ShowPage(mcdu);
        };
        mcdu.onLeftInput[0] = () => {
            CDUAocInit.ShowPage(mcdu);
        };
    }
}
