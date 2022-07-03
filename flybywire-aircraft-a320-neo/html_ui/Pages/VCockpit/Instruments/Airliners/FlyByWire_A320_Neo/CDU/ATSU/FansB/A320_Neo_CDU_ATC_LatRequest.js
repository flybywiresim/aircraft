class CDUAtcLatRequestFansB {
    static CreateDataBlock() {
        return {
            directTo: null,
            weatherDeviation: null,
        };
    }

    static CanSendData(data) {
        return data.directTo || data.weatherDeviation;
    }

    static CanEraseData(data) {
        return data.directTo || data.weatherDeviation;
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

        if (data.directTo) {
            retval.push(CDUAtcLatRequestFansB.CreateRequest(mcdu, "DM22", [data.directTo]));
        }
        if (data.weatherDeviation) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.weatherDeviation).split(" ");
            retval.push(CDUAtcLatRequestFansB.CreateRequest(mcdu, "DM27", [elements[0], elements[1]]));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcLatRequestFansB.CreateDataBlock()) {
        mcdu.clearDisplay();

        let weatherDeviation = "{cyan}[  ]{end}";
        if (data.weatherDeviation) {
            weatherDeviation = `${data.weatherDeviation}[color]cyan`;
        }
        let directTo = "{cyan}[     ]{end}";
        if (data.directTo) {
            directTo = `${data.directTo}[color]cyan`;
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcLatRequestFansB.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcLatRequestFansB.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC LAT REQ"],
            ["\xa0DIR TO[color]white"],
            [directTo],
            [""],
            [""],
            ["", "WX DEV"],
            ["", weatherDeviation],
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

                        CDUAtcLatRequestFansB.ShowPage(mcdu, data);
                    });
                }
            }

            CDUAtcLatRequestFansB.ShowPage(mcdu, data);
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

            CDUAtcLatRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.track = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadDegree(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.track = parseInt(value) % 360;
                }
            }

            CDUAtcLatRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcLatRequestFansB.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.offset = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.offset = Atsu.InputValidation.formatScratchpadOffset(value);
                    data.offsetStart = null;
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcLatRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = async (value) => {
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
            CDUAtcLatRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.backOnTrack = false;
            } else {
                data.backOnTrack = true;
            }
            CDUAtcLatRequestFansB.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcLatRequestFansB.CanSendData(data)) {
                const messages = CDUAtcLatRequestFansB.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcLatRequestFansB.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcLatRequestFansB.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcLatRequestFansB.ShowPage(mcdu);
                }
            }
        };
    }
}
