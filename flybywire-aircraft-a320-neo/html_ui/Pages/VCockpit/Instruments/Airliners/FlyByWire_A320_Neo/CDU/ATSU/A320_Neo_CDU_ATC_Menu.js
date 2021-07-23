class CDUAtcMenu {
    static ShowPage1(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAtcMenu.ShowPage(fmc, mcdu);
        }, 'FMGC');

        mcdu.setTemplate([
            ["ATC MENU", "1", "2"],
            [""],
            ["<REQUEST"],
            ["", ""],
            [""],
            [""],
            [""],
            [""],
            ["<MSG RECORD", "REPORTS>"],
            [""],
            ["<CONNECTION", ""],
            ["\xa0ATSU DLK"],
            ["<RETURN", "EMERGENCY>[color]amber"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcRequest.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUAtcMessagesRecord.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcConnection.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(fmc, mcdu);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            CDUAtcReports.ShowPage(fmc, mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcEmergency.ShowPage(fmc, mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAtcMenu.ShowPage2(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUAtcMenu.ShowPage2(fmc, mcdu);
        };
    }

    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAtcMenu.ShowPage(fmc, mcdu);
        }, 'ATC');

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
            ["\xa0ATSU DLK"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcDepartReq.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(fmc, mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUAocRequestsAtis.ShowPage(fmc, mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };
    }
}
