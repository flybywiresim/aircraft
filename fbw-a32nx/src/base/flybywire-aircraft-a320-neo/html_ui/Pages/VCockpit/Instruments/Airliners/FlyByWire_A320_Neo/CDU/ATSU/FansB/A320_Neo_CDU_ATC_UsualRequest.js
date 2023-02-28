class CDUAtcUsualRequestFansB {
    static CreateDataBlock() {
        return {
            directTo: null,
            speed: null,
            weatherDeviation: null,
            climbTo: null,
            descentTo: null,
            dueToWeather: false,
        };
    }

    static CanSendData(data) {
        return data.directTo || data.speed || data.weatherDeviation || data.climbTo || data.descentTo;
    }

    static CanEraseData(data) {
        return data.directTo || data.speed || data.weatherDeviation || data.climbTo || data.descentTo || data.dueToWeather;
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

        let extension = null;
        if (data.dueToWeather) {
            extension = Atsu.CpdlcMessagesDownlink["DM65"][1].deepCopy();
        }

        if (data.directTo) {
            retval.push(CDUAtcUsualRequestFansB.CreateRequest(mcdu, "DM22", [data.directTo]));
        }
        if (data.weatherDeviation) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.weatherDeviation).split(" ");
            retval.push(CDUAtcUsualRequestFansB.CreateRequest(mcdu, "DM27", [elements[0], elements[1]]));
        }
        if (data.climbTo) {
            retval.push(CDUAtcUsualRequestFansB.CreateRequest(mcdu, "DM9", [data.climbTo]));
        }
        if (data.descentTo) {
            retval.push(CDUAtcUsualRequestFansB.CreateRequest(mcdu, "DM10", [data.descentTo]));
        }
        if (data.speed) {
            retval.push(CDUAtcUsualRequestFansB.CreateRequest(mcdu, "DM18", [data.speed]));
        }

        if (extension) {
            retval.forEach((message) => {
                if (message.Content[0].TypeId !== "DM27") {
                    message.Content.push(extension);
                }
            });
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcUsualRequestFansB.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCUsualRequest;

        let addText = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcUsualRequestFansB.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            addText = "ADD TEXT>";
        }
        if (CDUAtcUsualRequestFansB.CanEraseData(data)) {
            erase = "*ERASE";
        }

        let directTo = "{cyan}[     ]{end}";
        if (data.directTo) {
            directTo = `${data.directTo}[color]cyan`;
        }
        let weatherDeviation = "{cyan}[  ]{end}";
        if (data.weatherDeviation) {
            weatherDeviation = `${data.weatherDeviation}[color]cyan`;
        }
        let speed = "[ ][color]cyan";
        if (data.speed) {
            speed = `${data.speed}[color]cyan`;
        }
        let climbTo = "[   ][color]cyan";
        let descentTo = "[   ][color]cyan";
        if (data.climbTo) {
            climbTo = `${data.climbTo}[color]cyan`;
        }
        if (data.descentTo) {
            descentTo = `${data.descentTo}[color]cyan`;
        }

        const dueToWeather = ["\xa0DUE TO", "{cyan}{{end}WEATHER"];
        if (data.dueToWeather) {
            dueToWeather[0] = "{cyan}\xa0DUE TO{end}";
            dueToWeather[1] = "{cyan}\xa0WEATHER{end}";
        }

        mcdu.setTemplate([
            ["USUAL REQ"],
            ["\xa0DIR TO", "SPEED\xa0"],
            [directTo, speed],
            ["", "WX DEV\xa0"],
            ["", weatherDeviation],
            ["\xa0CLB TO", "DES TO\xa0"],
            [climbTo, descentTo],
            [dueToWeather[0]],
            [dueToWeather[1]],
            ["\xa0ALL FIELDS"],
            [erase, addText],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.directTo = null;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.directTo = value;
                    } catch (err) {
                        if (err === NXSystemMessages.formatError) {
                            mcdu.setScratchpadMessage(err);
                        }
                    };
                } else if (/^[A-Z0-9]{2,7}/.test(value)) {
                    // place format
                    mcdu.dataManager.GetWaypointsByIdent.bind(mcdu.dataManager)(value).then((waypoints) => {
                        if (waypoints.length === 0) {
                            mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                        } else {
                            data.directTo = value;
                        }

                        CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
                    });
                }
            }

            CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.climbTo = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.climbTo = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.dueToWeather = false;
            } else {
                data.dueToWeather = true;
            }
            CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcUsualRequestFansB.ShowPage(mcdu);
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
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.speed = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.speed = Atsu.InputValidation.formatScratchpadSpeed(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = async (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.weatherDeviation = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.weatherDeviation = Atsu.InputValidation.formatScratchpadOffset(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.descentTo = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.descentTo = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcUsualRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcUsualRequestFansB.CanSendData(data)) {
                const requests = CDUAtcUsualRequestFansB.CreateRequests(mcdu, data);
                if (requests.length !== 0) {
                    CDUAtcTextFansB.ShowPage1(mcdu, requests);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcUsualRequestFansB.CDUAtcUsualRequestFansB(data)) {
                const requests = CDUAtcUsualRequestFansB.CreateRequests(mcdu, data);
                if (requests.length !== 0) {
                    mcdu.atsu.registerMessages(requests);
                    CDUAtcUsualRequestFansB.ShowPage(mcdu);
                }
            }
        };
    }
}
