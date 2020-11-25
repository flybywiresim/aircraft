class CDUAtcConnection {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["CONNECTION"],
            [""],
            ["<NOTIFICATION"],
            [""],
            [""],
            ["CONNECTION"],
            ["<STATUS"],
            [""],
            [""],
            ["", "MAX UPLINK"],
            ["", "DELAY>"],
            ["ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
