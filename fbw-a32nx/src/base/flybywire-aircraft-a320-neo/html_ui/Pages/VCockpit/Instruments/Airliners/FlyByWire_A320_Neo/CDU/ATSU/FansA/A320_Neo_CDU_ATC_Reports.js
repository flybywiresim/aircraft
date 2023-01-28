class CDUAtcReports {
    static CreateDataBlock() {
        return {
            backOnRoute: false,
            deviating: null,
        };
    }

    static CanSendData(data) {
        return data.requestContact || data.deviating;
    }

    static CreateRequest(mcdu, type, values = []) {
        const retval = new Atsu.CpdlcMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content.push(Atsu.CpdlcMessagesDownlink[type][1].deepCopy());

        for (let i = 0; i < values.length; ++i) {
            retval.Content[0].Content[i].Value = values[i];
        }

        return retval;
    }

    static CreateRequests(mcdu, data) {
        const retval = [];

        if (data.requestContact) {
            retval.push(CDUAtcReports.CreateRequest(mcdu, "DM20"));
        }
        if (data.deviating) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.deviating).split(" ");
            retval.push(CDUAtcReports.CreateRequest(mcdu, "DM80", [elements[0], elements[1]]));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcReports.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCReports;

        let backOnRoute = "{cyan}{{end}BACK ON RTE";
        if (data.backOnRoute) {
            backOnRoute = "{cyan}\xa0BACK ON RTE{end}";
        }
        let deviating = "{cyan}[ ]{end}";
        if (data.deviating) {
            deviating = `{cyan}${data.deviating}{end}`;
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["REPORTS"],
            [""],
            [backOnRoute],
            ["\xa0DEVIATING"],
            [deviating],
            [""],
            ["<MANUAL POS REPORT"],
            [`\xa0AUTO POS REPORT: ${mcdu.atsu.atc.automaticPositionReportActive() ? "ON" : "OFF"}`],
            [`{cyan}*SET ${mcdu.atsu.atc.automaticPositionReportActive() ? "OFF" : "ON"}{end}`],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.backOnRoute = false;
            } else {
                data.backOnRoute = true;
            }
            CDUAtcReports.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.deviating = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.deviating = Atsu.InputValidation.formatScratchpadOffset(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcReports.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUAtcPositionReport.ShowPage1(mcdu);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            mcdu.atsu.atc.toggleAutomaticPositionReportActive();
            CDUAtcReports.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcReports.ShowPage(mcdu);
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
            if (CDUAtcReports.CanSendData(data)) {
                const messages = CDUAtcReports.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcReports.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcReports.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcReports.ShowPage(mcdu);
                }
            }
        };
    }
}
