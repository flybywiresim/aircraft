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
            ["<MSG RECORD[color]inop", "REPORTS>"],
            [""],
            ["<CONNECTION", ""],
            ["ATSU DLK"],
            ["<RETURN", "EMERGENCY>[color]red"]
        ]);

        /*mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcLatReq.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAtcWhenCanWe.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUAtcMsgRecord.ShowPage(mcdu);
        };*/

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

        /*mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUAtcVertReq.ShowPage(mcdu);
        };*/

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcEmergency.ShowPage(mcdu);
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
            ["----------ATS 623----------"],
            ["<DEPART REQ", "ATIS>"],
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

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcDepartReq.ShowPage(mcdu);
        };

        /*mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAtcOceanicReq.ShowPage(mcdu);
        };*/

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
