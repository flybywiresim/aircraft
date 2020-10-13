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


        // INOP BUTTONS
        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        // IMPLEMENTED BUTTONS
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