class CDUAocMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["AOC MENU"],
            [""],
            ["<INIT[color]inop", "FREE TEXT>"],
            ["", "RECEIVED"],
            ["<WX REQUEST", "MESSAGES>"],
            ["", "SENT"],
            ["<ATIS", "MESSAGES>"],
            [""],
            ["<FUEL[color]inop", "BOARDING>[color]inop"],
            [""],
            ["<PERF/W&B[color]inop", "DIVERSION>[color]inop"],
            ["ATSU DLK"],
            ["<RETURN", "MISC>[color]inop"]
        ]);

        mcdu.onLeftInput[1] = () => {
            CDUAocRequestsWeather.ShowPage(mcdu);
        };
        mcdu.onLeftInput[2] = () => {
            CDUAocRequestsAtis.ShowPage(mcdu);
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };
        mcdu.onRightInput[0] = () => {
            CDUAocFreeText.ShowPage(mcdu);
        };
        mcdu.onRightInput[1] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        };
        mcdu.onRightInput[2] = () => {
            CDUAocMessagesSent.ShowPage(mcdu);
        };
    }
}