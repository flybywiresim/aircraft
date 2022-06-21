class CDUAtcMenu {
    static ShowPage1(mcdu) {
        mcdu.activeSystem = "ATSU";
        if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansB) {
            CDUAtcMenuFansB.ShowPage(mcdu);
        } else {
            CDUAtcMenuFansA.ShowPage(mcdu);
        }
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCMenu;
        mcdu.setTemplate([
            ["ATC MENU", "2", "2"],
            ["------ATS623 PAGE--------"],
            ["<DEPART REQ", "ATIS>"],
            ["", ""],
            ["<OCEANIC REQ", ""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ATSU DLK"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcDepartReq.ShowPage1(mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAtcOceanicReq.ShowPage1(mcdu);
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
            CDUAtcAtisMenu.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
