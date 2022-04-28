class CDUAtcGroundReq {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        mcdu.setTemplate([
            ["GROUND REQ"],
            [""],
            ["<DEPARTURE"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcDepartReq.ShowPage1(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };
    }
}
