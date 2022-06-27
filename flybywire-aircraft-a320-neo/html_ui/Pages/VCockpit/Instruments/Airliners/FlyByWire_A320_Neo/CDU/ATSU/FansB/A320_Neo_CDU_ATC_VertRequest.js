class CDUAtcVertRequestFansB {
    static CreateDataBlock() {
        return {
            climb: null,
            descend: null,
            altitude: null,
        };
    }

    static CanSendData(data) {
        return data.climb || data.descend || data.altitude;
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

        if (data.climb) {
            retval.push(CDUAtcVertRequestFansB.CreateRequest(mcdu, "DM9", [data.climb]));
        }
        if (data.descend) {
            retval.push(CDUAtcVertRequestFansB.CreateRequest(mcdu, "DM10", [data.descend]));
        }
        if (data.altitude) {
            retval.push(CDUAtcVertRequestFansB.CreateRequest(mcdu, "DM6", [data.altitude]));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcVertRequestFansB.CreateDataBlock()) {
        mcdu.clearDisplay();

        let climbTo = "[   ][color]cyan";
        let descentTo = "[   ][color]cyan";
        if (data.climb) {
            climbTo = `${data.climb}[color]cyan`;
        }
        if (data.descend) {
            descentTo = `${data.descend}[color]cyan`;
        }
        let altitude = "[   ][color]cyan";
        if (data.altitude) {
            altitude = `${data.altitude}[color]cyan`;
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcVertRequestFansB.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ"],
            ["\xa0CLB TO", "DES TO\xa0"],
            [climbTo, descentTo],
            ["\xa0ALT"],
            [altitude],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0FLIGHT REQ", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.climb = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.climb = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcVertRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.altitude = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.altitude = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcVertRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcVertRequestFansB.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.descend = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.descend = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcVertRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcVertRequestFansB.CanSendData(data)) {
                const messages = CDUAtcVertRequestFansB.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansB.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequestFansB.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequestFansB.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcVertRequestFansB.ShowPage(mcdu);
                }
            }
        };
    }
}
