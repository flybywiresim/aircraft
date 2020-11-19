class CDUAtcConnection {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["ATC MENU", "1", "2"],
            [""],
            ["<LAT REQ", "VERT REQ>"],
            ["", ""],
            ["<WHEN CAN WE", "OTHER REQ>"],
            [""],
            ["", "TEXT>"],
            [""],
            ["<MSG RECORD", "REPORTS>"],
            [""],
            ["<CONNECTION", ""],
            ["ATSU DLK"],
            ["<RETURN", "EMERGENCY>[color]red"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcConnection.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["ATC MENU", "2", "2"],
            [""],
            ["<DEPART REQ", "ATIS>"],
            ["", ""],
            ["<OCEANIC REQ", ""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["ATSU DLK"],
            ["<RETURN"]
        ]);

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
