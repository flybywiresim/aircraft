class CDUAtcFlightReq {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCFlightRequest;

        let procedure = "";
        let freeText = "";
        let contact = "";
        let clearance = "";
        if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
            procedure = "<PROCEDURE";
            freeText = "<FREE TEXT";
            contact = "CONTACT>";
            clearance = "CLEARANCE>";
        }

        mcdu.setTemplate([
            ["FLIGHT REQ"],
            [""],
            ["<LATERAL", "VERTICAL>"],
            [""],
            ["<SPEED", contact],
            [""],
            [procedure, "OCEANIC>"],
            [""],
            [freeText],
            [""],
            ["", clearance],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcLatRequestFansA.ShowPage1(mcdu);
            } else {
                CDUAtcLatRequestFansB.ShowPage(mcdu);
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAtcSpeedRequest.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcProcedureRequest.ShowPage(mcdu);
            }
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcTextFansA.ShowPage1(mcdu);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcVertRequestFansA.ShowPage1(mcdu);
            } else {
                CDUAtcVertRequestFansB.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcContactRequest.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDUAtcOceanicReq.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                CDUAtcClearanceReq.ShowPage(mcdu, "CLEARANCE");
            }
        };
    }
}
