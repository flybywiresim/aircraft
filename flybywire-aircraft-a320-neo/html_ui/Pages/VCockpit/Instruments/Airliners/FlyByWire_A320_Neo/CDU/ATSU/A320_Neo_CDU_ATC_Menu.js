class CDUAtcMenu {
    static ShowPage(mcdu) {
        mcdu.activeSystem = "ATSU";

        mcdu.setTemplate([
            ["ATC MENU"],
            [""],
            ["<FLIGHT REQ", "USUAL REQ>"],
            [""],
            ["<GROUND REQ", "D-ATIS>"],
            [""],
            ["<MSG RECORD", "REPORTS>"],
            [""],
            ["<MONITORED MSG"],
            [""],
            ["<CONNECTION"],
            ["\xa0ATSU DLK"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAtcClearanceReq.ShowPage(mcdu, "GROUND");
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUAtcMessagesRecord.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            // TODO monitored messages
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUAtcConnection.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansB) {
                CDUAtcUsualRequestFansB.ShowPage(mcdu);
            } else {
                CDUAtcUsualRequestFansA.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            CDUAtcAtisMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            // TODO link reports page
        };
    }
}
