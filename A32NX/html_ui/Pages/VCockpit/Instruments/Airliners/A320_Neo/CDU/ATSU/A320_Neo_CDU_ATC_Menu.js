class CDUAtcMenu {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["ATC MENU", "1", "2"],
            [""],
            ["<LAT REQ[color]inop", "VERT REQ>[color]inop"],
            ["", ""],
            ["<WHEN CAN WE[color]inop", "OTHER REQ>[color]inop"],
            [""],
            ["", "TEXT>[color]inop"],
            [""],
            ["<MSG RECORD[color]inop", "REPORTS>[color]inop"],
            [""],
            ["<CONNECTION", ""],
            ["ATSU DLK"],
            ["<RETURN", "EMERGENCY>[color]inop"]
        ]);

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
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
            ["-------ATS", "623------"],
            ["<DEPART REQ[color]inop", "ATIS>"],
            ["", ""],
            ["<OCEANIC REQ[color]inop", ""],
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
