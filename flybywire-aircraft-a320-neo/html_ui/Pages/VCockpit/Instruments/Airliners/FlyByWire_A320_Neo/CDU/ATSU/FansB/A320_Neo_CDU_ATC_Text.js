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

    static CreateMessage(message, data) {
        let extension = null;
        if (data.performance) {
            extension = Atsu.CpdlcMessagesDownlink["DM66"][1].deepCopy();
        } else if (data.weather) {
            extension = Atsu.CpdlcMessagesDownlink["DM65"][1].deepCopy();
        }
        message.Extensions.push(extension);
    }

    static ShowPage(mcdu, message = null, data = CDUAtcTextFansB.CreateDataBlock()) {
        mcdu.clearDisplay();

        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcTextFansA.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
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
            ["TEXT"],
            ["{big}\xa0\xa0\xa0 REPLY WITHIN 20S{end}"],
            [""],
            [acPerform[0]],
            [acPerform[1]],
            [weather[0]],
            [weather[1]],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
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
            CDUAtcTextFansB.ShowPage(mcdu, parent, message, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.weather = false;
            } else {
                data.performance = false;
                data.weather = true;
            }
            CDUAtcTextFansB.ShowPage(mcdu, parent, message, data);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcTextFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const prepMessage = CDUAtcTextFansA.CreateMessage(messages, data);
                    if (prepMessage) {
                        // TODO update message
                        mcdu.atsu.registerMessage(prepMessage);
                    }
                    CDUAtcMenu.ShowPage1(mcdu);
                }
            }
        };
    }
}
