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
            ["", "MAX UPLINK\xa0[color]inop"],
            ["", "DELAY>[color]inop"],
            ["ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcConnectionNotification.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUAtcConnectionStatus.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
