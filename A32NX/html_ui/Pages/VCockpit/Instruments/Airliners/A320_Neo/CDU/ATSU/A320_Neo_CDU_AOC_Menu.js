class CDUAocMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["AOC MENU"],
            ["", "RECEIVED"],
            ["<DELAY[color]inop", "MESSAGES>"],
            ["WX/ATIS", "SENT"],
            ["<REQUEST", "MESSAGES>"],
            [""],
            ["<FREE TEXT", "DIVERSION>[color]inop"],
            [""],
            ["<ETA[color]inop"],
            ["POSITION[color]inop"],
            ["<REPORT[color]inop", "MISC[color]inop"],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[1] = () => {
            CDUAocRequestsWeather.ShowPage(mcdu);
        };
        mcdu.onLeftInput[2] = () => {
            CDUAocFreeText.ShowPage(mcdu);
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };
        mcdu.onRightInput[0] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        };
        mcdu.onRightInput[1] = () => {
            CDUAocMessagesSent.ShowPage(mcdu);
        };
    }
}