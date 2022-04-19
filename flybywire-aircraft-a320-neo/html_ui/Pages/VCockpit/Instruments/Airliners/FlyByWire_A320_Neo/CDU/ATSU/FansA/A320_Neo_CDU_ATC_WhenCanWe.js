class CDUAtcWhenCanWe {
    static CreateDataBlock() {
        return {
            spd: null,
            whenHigher: false,
            whenLower: false,
            cruise: null,
            spdLow: null,
            spdHigh: null,
            backOnRoute: false
        };
    }

    static CanSendData(data) {
        return data.spd || data.whenLower || data.whenHigher || data.cruise || data.spdLow || data.spdHigh || data.backOnRoute;
    }

    static CanEraseData(data) {
        return data.spd || data.whenLower || data.whenHigher || data.cruise || data.spdLow || data.spdHigh || data.backOnRoute;
    }

    static CreateRequest(mcdu, type, values = []) {
        const retval = new Atsu.RequestMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content = Atsu.CpdlcMessagesDownlink[type][1].deepCopy();

        for (let i = 0; i < values.length; ++i) {
            retval.Content.Content[i].Value = values[i];
        }

        return retval;
    }

    static CreateRequests(mcdu, data) {
        const retval = [];

        if (data.spd) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM49", [data.spd]));
        }
        if (data.whenHigher) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM53"));
            if (Simplane.getPressureSelectedMode(Aircraft.A320_NEO) !== "STD") {
                retval[retval.length - 1].ContentTemplateIndex = 1;
            }
        }
        if (data.whenLower) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM52"));
            if (Simplane.getPressureSelectedMode(Aircraft.A320_NEO) !== "STD") {
                retval[retval.length - 1].ContentTemplateIndex = 1;
            }
        }
        if (data.cruise) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM54", [data.cruise]));
        }
        if (data.spdLow && data.spdHigh) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM50", [data.spdLow, data.spdHigh]));
        }
        if (data.backOnRoute) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM51"));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcWhenCanWe.CreateDataBlock()) {
        mcdu.clearDisplay();

        let crzClimb = "[   ][color]cyan";
        if (data.cruise) {
            crzClimb = `${data.cruise}[color]cyan`;
        }
        let spd = "[ ][color]cyan";
        if (data.spd) {
            spd = `${data.spd}[color]cyan`;
        }
        let spdRange = "[ ]/[ ][color]cyan";
        if (data.spdLow && data.spdHigh) {
            spdRange = `${data.spdLow}/${data.spdHigh}[color]cyan`;
        }
        let higherAlt = "{cyan}{{end}HIGHER ALT";
        if (data.whenHigher) {
            higherAlt = "\xa0HIGHER ALT[color]cyan";
        }
        let lowerAlt = "LOWER ALT{cyan}}{end}";
        if (data.whenLower) {
            lowerAlt = "LOWER ALT\xa0[color]cyan";
        }
        let backOnRoute = "BACK ON ROUTE{cyan}}{end}";
        if (data.backOnRoute) {
            backOnRoute = "BACK ON ROUTE\xa0[color]cyan";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "REQ DISPLAY\xa0[color]cyan";
        if (CDUAtcWhenCanWe.CanSendData(data)) {
            reqDisplay = "REQ DISPLAY*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcWhenCanWe.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["WHEN CAN WE\nEXPECT"],
            [""],
            [higherAlt, lowerAlt],
            ["\xa0CRZ CLB TO", "SPEED\xa0"],
            [crzClimb, spd],
            ["", "SPEED RANGE\xa0"],
            ["", spdRange],
            [""],
            ["", backOnRoute],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC MENU", "ATC\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.whenHigher = false;
            } else {
                data.whenHigher = true;
                data.whenLower = false;
            }
            CDUAtcWhenCanWe.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.cruise = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.cruise = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcWhenCanWe.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcWhenCanWe.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.whenLower = false;
            } else {
                data.whenHigher = false;
                data.whenLower = true;
            }
            CDUAtcWhenCanWe.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.spd = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.spd = Atsu.InputValidation.formatScratchpadSpeed(value);
                }
            }
            CDUAtcWhenCanWe.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                if (!data.whenSpdRange) {
                    data.spdLow = null;
                    data.spdHigh = null;
                }
            } else if (value) {
                const retval = Atsu.InputValidation.validateScratchpadSpeedRanges(value);
                if (retval[0] === Atsu.AtsuStatusCodes.Ok) {
                    data.spdLow = retval[1][0];
                    data.spdHigh = retval[1][1];
                } else {
                    mcdu.addNewAtsuMessage(retval[0]);
                }
            }
            CDUAtcWhenCanWe.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.backOnRoute = false;
            } else {
                data.backOnRoute = true;
            }
            CDUAtcWhenCanWe.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcWhenCanWe.CanSendData(data)) {
                const messages = CDUAtcWhenCanWe.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, "REQ", messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcWhenCanWe.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcWhenCanWe.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcWhenCanWe.ShowPage(mcdu);
                }
            }
        };
    }
}
