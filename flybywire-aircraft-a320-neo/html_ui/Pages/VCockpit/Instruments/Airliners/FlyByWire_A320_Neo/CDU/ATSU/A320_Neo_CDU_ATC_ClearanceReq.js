class CDUAtcClearanceReq {
    static CreateDataBlock() {
        return {
            clearance: false
        };
    }

    static CanSendData(data) {
        return data.clearance;
    }

    static CreateRequest(mcdu) {
        const retval = new Atsu.CpdlcMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content.push(Atsu.CpdlcMessagesDownlink["DM25"][1].deepCopy());
        retval.Content[0].Content[0].Value = "DEPARTURE";
        return retval;
    }

    static ShowPage(mcdu, title, data = CDUAtcClearanceReq.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCGroundRequest;

        let addText = "ADD TEXT\xa0";
        let clearance = "{cyan}{{end}CLEARANCE";
        let transfer = ["{cyan}XFR TO\xa0{end}", "{cyan}DCDU\xa0{end}"];
        let erase = ["\xa0ALL FIELDS", "\xa0ERASE"];
        if (mcdu.atsu.atc.fansMode() !== Atsu.FansMode.FansA) {
            clearance = "<DEPARTURE";
            transfer = ["", ""];
            erase = ["", ""];
            addText = "";
        } else if (data.clearance) {
            clearance = "{cyan}\xa0CLEARANCE{end}";
            transfer[1] = "{cyan}DCDU*{end}";
            addText = "ADD TEXT>";
            erase[1] = "*ERASE";
        }

        mcdu.setTemplate([
            [`${title} REQ`],
            [""],
            [clearance],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [erase[0]],
            [erase[1], addText],
            ["\xa0ATC MENU", transfer[0]],
            ["<RETURN", transfer[1]]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (mcdu.atsu.atc.fansMode() !== Atsu.FansMode.FansA) {
                CDUAtcDepartReq.ShowPage1(mcdu);
                return;
            } else if (value === FMCMainDisplay.clrValue) {
                data.clearance = false;
            } else {
                data.clearance = true;
            }

            CDUAtcClearanceReq.ShowPage(mcdu, title, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcClearanceReq.ShowPage(mcdu, title);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA && CDUAtcClearanceReq.CanSendData(data)) {
                const message = CDUAtcClearanceReq.CreateRequest(mcdu);
                CDUAtcTextFansA.ShowPage1(mcdu, [message]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA && CDUAtcClearanceReq.CanSendData(data)) {
                const message = CDUAtcClearanceReq.CreateRequest(mcdu);
                mcdu.atsu.registerMessages([message]);
                CDUAtcClearanceReq.ShowPage(mcdu, title);
            }
        };
    }
}
