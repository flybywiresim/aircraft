class CDUAtcTextFansB {
    static CreateDataBlock() {
        return {
            performance: false,
            weather: false
        };
    }

    static CanSendData(data) {
        return data.performance || data.weather;
    }

    static CreateMessages(messages, data) {
        let extension = null;
        if (data.performance) {
            extension = Atsu.CpdlcMessagesDownlink["DM66"][1].deepCopy();
        } else if (data.weather) {
            extension = Atsu.CpdlcMessagesDownlink["DM65"][1].deepCopy();
        }

        let updated = false;
        for (const message of messages) {
            if (message.Content[0].TypeId.includes("UM")) {
                message.Response.Content.push(extension);
                updated = true;
            } else {
                message.Content.push(extension);
            }
        }

        return updated;
    }

    static ShowPage(mcdu, messages, data = CDUAtcTextFansB.CreateDataBlock()) {
        mcdu.clearDisplay();

        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcTextFansB.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            erase = "*ERASE";
        }

        const acPerform = ["\xa0DUE TO", "{cyan}{{end}A/C PERFORM"];
        if (data.performance) {
            acPerform[0] += "[color]cyan";
            acPerform[1] = "\xa0A/C PERFORM[color]cyan";
        }
        const weather = ["\xa0DUE TO", "{cyan}{{end}WEATHER"];
        if (data.weather) {
            weather[0] += "[color]cyan";
            weather[1] = "\xa0WEATHER[color]cyan";
        }

        mcdu.setTemplate([
            ["FREE TEXT"],
            [acPerform[0], weather[0]],
            [acPerform[1], weather[1]],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["ALL FIELDS"],
            [erase],
            ["\xa0ATC MENU", `XFR TO\xa0[color]cyan`],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.performance = false;
            } else {
                data.performance = true;
                data.weather = false;
            }
            CDUAtcTextFansB.ShowPage(mcdu, messages, data);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.performance = false;
            } else {
                data.performance = true;
                data.weather = false;
            }
            CDUAtcTextFansB.ShowPage(mcdu, messages, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcTextFansB.ShowPage(mcdu, messages);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcTextFansB.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    if (CDUAtcTextFansB.CreateMessages(mcdu, messages, data)) {
                        mcdu.atsu.atc.updateMessage(messages[0]);
                    } else {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcMenu.ShowPage(mcdu);
                }
            }
        };
    }
}
