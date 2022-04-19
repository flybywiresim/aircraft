class CDUAtcMenuFansA {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCMenu;

        // regular update due to showing dynamic data on this page
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.ATCMenu) {
                CDUAtcMenu.ShowPage1(mcdu);
            }
        }, mcdu.PageTimeout.Slow);

        mcdu.setTemplate([
            ["ATC MENU", "1", "2"],
            [""],
            ["<LAT REQ[color]white", "VERT REQ>[color]white"],
            [""],
            ["<WHEN CAN WE[color]white", "OTHER REQ>[color]inop"],
            [""],
            ["", "TEXT>[color]white"],
            [""],
            ["<MSG RECORD", "REPORTS>[color]inop"],
            [""],
            ["<CONNECTION", ""],
            ["\xa0ATSU DLK"],
            ["<RETURN", "EMERGENCY>[color]inop"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcLatRequest.ShowPage(mcdu);
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
            CDUAtcMessagesRecord.ShowPage(mcdu);
        };

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

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUAtcVertRequest.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDUAtcTextFansA.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            //CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            //CDUAtcEmergency.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
    }
}
