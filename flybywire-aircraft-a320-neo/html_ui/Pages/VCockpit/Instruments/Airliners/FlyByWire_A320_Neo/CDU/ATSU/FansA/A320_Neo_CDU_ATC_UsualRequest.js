class CDUAtcUsualRequestFansA {
    static CreateDataBlock() {
        return {
            directTo: null,
            speed: null,
            heading: null,
            weatherDeviation: null,
            climbTo: null,
            descentTo: null,
            dueToWeather: false,
            requestDescent: false,
        };
    }

    static CanSendData(data) {
        return data.directTo || data.speed || data.heading || data.weatherDeviation || data.climbTo || data.descentTo || data.requestDescent;
    }

    static CanEraseData(data) {
        return data.directTo || data.speed || data.heading || data.weatherDeviation || data.climbTo || data.descentTo || data.dueToWeather || data.requestDescent;
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
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM22", [data.directTo]));
        }
        if (data.weatherDeviation) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.weatherDeviation).split(" ");
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM27", [elements[0], elements[1]]));
        }
        if (data.heading) {
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM70", [data.heading === 0 ? "360" : data.heading.toString()]));
        }
        if (data.climbTo) {
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM9", [data.climbTo]));
        }
        if (data.descentTo) {
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM10", [data.descentTo]));
        }
        if (data.requestDescent) {
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM67"));
            retval[retval.length - 1].Content[0].Content[0].Value = "REQUEST DESCENT";
        }
        if (data.speed) {
            retval.push(CDUAtcUsualRequestFansA.CreateRequest(mcdu, "DM18", [data.speed]));
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

    static ShowPage(mcdu, data = CDUAtcUsualRequestFansA.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCUsualRequest;

        let addText = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcUsualRequestFansA.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            addText = "ADD TEXT>";
        }
        if (CDUAtcUsualRequestFansA.CanEraseData(data)) {
            erase = "*ERASE";
        }

        let directTo = "{cyan}[     ]{end}";
        if (data.directTo) {
            directTo = `${data.directTo}[color]cyan`;
        }
        let heading = "[ ]°[color]cyan";
        if (data.heading !== null) {
            heading = `${data.heading}°[color]cyan`;
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
        const requestDescent = ["REQUEST\xa0", "DESCENT{cyan}}{end}"];
        if (data.dueToWeather) {
            dueToWeather[0] = "{cyan}\xa0DUE TO{end}";
            dueToWeather[1] = "{cyan}\xa0WEATHER{end}";
        }
        if (data.requestDescent) {
            requestDescent[0] = "{cyan}REQUEST\xa0{end}";
            requestDescent[1] = "{cyan}DESCENT\xa0{end}";
        }

        mcdu.setTemplate([
            ["USUAL REQ"],
            ["\xa0DIR TO", "SPEED\xa0"],
            [directTo, speed],
            ["\xa0HDG", "WX DEV\xa0"],
            [heading, weatherDeviation],
            ["\xa0CLB TO", "DES TO\xa0"],
            [climbTo, descentTo],
            [dueToWeather[0], requestDescent[0]],
            [dueToWeather[1], requestDescent[1]],
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

                        CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
                    });
                }
            }

            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.heading = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadDegree(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.heading = parseInt(value) % 360;
                }
            }

            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
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
            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
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
            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcUsualRequestFansA.ShowPage(mcdu);
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
            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
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
            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
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
            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.requestDescent = false;
            } else {
                data.requestDescent = true;
            }
            CDUAtcUsualRequestFansA.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcUsualRequestFansA.CanSendData(data)) {
                const requests = CDUAtcUsualRequestFansA.CreateRequests(mcdu, data);
                if (requests.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, requests);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcUsualRequestFansA.CanSendData(data)) {
                const requests = CDUAtcUsualRequestFansA.CreateRequests(mcdu, data);
                if (requests.length !== 0) {
                    mcdu.atsu.registerMessages(requests);
                    CDUAtcUsualRequestFansA.ShowPage(mcdu);
                }
            }
        };
    }
}
