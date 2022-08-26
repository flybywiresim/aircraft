class CDUAtcMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCMenu;

        // regular update due to showing dynamic data on this page
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.ATCMenu) {
                CDUAtcMenu.ShowPage(mcdu);
            }
        }, mcdu.PageTimeout.Slow);

        let modif = "";
        if (mcdu.atsu.modificationMessage) {
            modif = "MODIFY>";
        }

        mcdu.setTemplate([
            ["ATC MENU"],
            [""],
            ["<FLIGHT REQ", "USUAL REQ>"],
            [""],
            ["<GROUND REQ", "D-ATIS>"],
            [""],
            ["<MSG RECORD", "REPORTS>"],
            [""],
            ["<MONITORED MSG", modif],
            [""],
            ["<CONNECTION"],
            ["\xa0ATSU DLK"],
            ["<RETURN", "EMER MENU>[color]amber"]
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

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUAtcMessageMonitoring.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcConnection.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcUsualRequestFansA.ShowPage(mcdu);
            } else {
                CDUAtcUsualRequestFansB.ShowPage(mcdu);
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
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcReports.ShowPage(mcdu);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.keyNotActive);
            }
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            if (mcdu.atsu.modificationMessage) {
                CDUAtcMessageModify.ShowPage(mcdu, mcdu.atsu.modificationMessage);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcEmergencyFansA.ShowPage1(mcdu);
            } else {
                CDUAtcEmergencyFansB.ShowPage(mcdu);
            }
        };
    }
}
