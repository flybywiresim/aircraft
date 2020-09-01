class CDUAocMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["AOC MENU"],
            [""],
            ["<PREFLIGHT", "FLT LOG>"],
            [""],
            ["<ENROUTE", "REPORTS>"],
            [""],
            ["<POSTFLIGHT", "REQUESTS>"],
            [""],
            ["", "RCVD MSGS"],
            [""],
            ["<MISC MENU", "UNSENT MSGS>"],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onRightInput[2] = () => {
            CDUAocRequests.ShowPage(mcdu, null);
        }

        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        }
    }
}