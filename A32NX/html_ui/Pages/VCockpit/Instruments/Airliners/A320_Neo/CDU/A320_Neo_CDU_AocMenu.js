class CDUAocMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["AOC MENU"],
            ["", "RECEIVED"],
            ["<DELAY", "MESSAGES>"],
            ["WX", "SENT"],
            ["<REQUEST", "MESSAGES>"],
            [""],
            ["<FREE TEXT", "DIVERSION>"],
            [""],
            ["<ETA"],
            ["POSITION"],
            ["<REPORT", "MISC"],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[1] = () => {
            CDUAocRequestsWeather.ShowPage(mcdu);
        }

        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        }

        mcdu.onRightInput[0] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        }
    }
}