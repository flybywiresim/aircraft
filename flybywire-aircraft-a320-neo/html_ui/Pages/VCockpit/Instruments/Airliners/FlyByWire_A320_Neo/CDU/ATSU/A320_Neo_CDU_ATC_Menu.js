class CDUAtcMenu {
    static ShowPage1(mcdu) {
        if (mcdu.atsuManager.atc.fansMode() === Atsu.FansMode.FansB) {
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
            ["--------ATS623 PAGE--------"],
            ["<DEPART REQ[color]inop", "ATIS>"],
            ["", ""],
            ["<OCEANIC REQ[color]inop", ""],
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
            //CDUAtcDepartReq.ShowPage1(mcdu);
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
            CDUAocRequestsAtis.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
