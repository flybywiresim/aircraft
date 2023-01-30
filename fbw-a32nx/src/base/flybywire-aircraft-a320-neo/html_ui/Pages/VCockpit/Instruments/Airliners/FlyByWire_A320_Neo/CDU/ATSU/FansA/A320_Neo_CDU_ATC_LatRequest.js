class CDUAtcLatRequestFansA {
    static CreateDataBlock() {
        return {
            directTo: null,
            weatherDeviation: null,
            offset: null,
            offsetStart: null,
            heading: null,
            track: null,
            backOnTrack: false
        };
    }

    static CanSendData(data) {
        return data.directTo || data.weatherDeviation || data.offset || data.heading || data.track || data.backOnTrack;
    }

    static CanEraseData(data) {
        return data.directTo || data.weatherDeviation || data.offset || data.heading || data.track || data.backOnTrack;
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
            retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM22", [data.directTo]));
        }
        if (data.weatherDeviation) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.weatherDeviation).split(" ");
            retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM27", [elements[0], elements[1]]));
        }
        if (data.offset) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.offset).split(" ");

            if (!data.offsetStart || /$[0-9]{4}Z^/.test(data.offsetStart)) {
                retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM17", [!data.offsetStart ? (new Atsu.AtsuTimestamp()).dcduTimestamp() : data.offsetStart, elements[0], elements[1]]));
            } else {
                retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM16", [data.offsetStart, elements[0], elements[1]]));
            }
        }
        if (data.heading) {
            retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM70", [data.heading === 0 ? "360" : data.heading.toString()]));
        }
        if (data.track) {
            retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM71", [data.track === 0 ? "360" : data.track.toString()]));
        }
        if (data.backOnTrack) {
            retval.push(CDUAtcLatRequestFansA.CreateRequest(mcdu, "DM51"));
        }

        return retval;
    }

    static ShowPage1(mcdu, data = CDUAtcLatRequestFansA.CreateDataBlock()) {
        mcdu.clearDisplay();

        let weatherDeviation = "{cyan}[  ]{end}";
        if (data.weatherDeviation) {
            weatherDeviation = `${data.weatherDeviation}[color]cyan`;
        }
        let heading = "[ ]°[color]cyan";
        if (data.heading !== null) {
            heading = `${data.heading}°[color]cyan`;
        }
        let grdTrack = "[ ]°[color]cyan";
        if (data.track !== null) {
            grdTrack = `${data.track}°[color]cyan`;
        }
        let directTo = "{cyan}[     ]{end}";
        if (data.directTo) {
            directTo = `${data.directTo}[color]cyan`;
        }
        let offsetDistance = "[  ]";
        if (data.offset && data.offsetStart === null) {
            offsetDistance = data.offset;
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcLatRequestFansA.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcLatRequestFansA.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC LAT REQ", "1", "2"],
            ["\xa0DIR TO[color]white"],
            [directTo],
            ["\xa0HDG", "OFFSET\xa0"],
            [heading, `{cyan}${offsetDistance}{end}`],
            ["\xa0GND TRK", "WX DEV\xa0"],
            [grdTrack, weatherDeviation],
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

                        CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
                    });
                }
            }

            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
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

            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
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

            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcLatRequestFansA.ShowPage1(mcdu);
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
            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
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
            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
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
            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcLatRequestFansA.CanSendData(data)) {
                const messages = CDUAtcLatRequestFansA.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcLatRequestFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcLatRequestFansA.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcLatRequestFansA.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcLatRequestFansA.ShowPage2(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcLatRequestFansA.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAtcLatRequestFansA.CreateDataBlock()) {
        mcdu.clearDisplay();

        let offsetDistance = "[  ]";
        let offsetStartPoint = "[     ]";
        if (data.offset && data.offsetStart) {
            offsetDistance = data.offset;
            offsetStartPoint = data.offsetStart;
        }
        let whenCanWe = "{big}\xa0WHEN CAN WE\xa0{end}";
        let backOnRoute = "{cyan}{{end}EXPECT BACK ON ROUTE";
        if (data.backOnTrack) {
            backOnRoute = "{cyan}\xa0EXPECT BACK ON ROUTE{end}";
            whenCanWe = "{cyan}{big}\xa0WHEN CAN WE\xa0{end}{end}";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcLatRequestFansA.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcLatRequestFansA.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC LAT REQ", "2", "2"],
            ["", "OFFSET/START AT"],
            ["", `{cyan}${offsetDistance}/${offsetStartPoint}{end}`],
            [""],
            ["------------------------"],
            [whenCanWe],
            [backOnRoute],
            ["------------------------"],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0FLIGHT REQ", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.backOnTrack = false;
            } else {
                data.backOnTrack = true;
            }

            CDUAtcLatRequestFansA.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcLatRequestFansA.ShowPage2(mcdu);
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
        mcdu.onRightInput[0] = async (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.offset = null;
                data.offsetStart = null;
            } else if (value) {
                const entries = value.split('/');
                let updatedOffset = false;
                let offsetStart = null;
                let offset = null;

                const error = Atsu.InputValidation.validateScratchpadOffset(entries[0]);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    updatedOffset = true;
                    offset = Atsu.InputValidation.formatScratchpadOffset(entries[0]);
                    entries.shift();
                }

                if (entries.length !== 0) {
                    const startingPoint = entries.join("/");

                    Atsu.InputValidation.classifyScratchpadWaypointType(mcdu, startingPoint, true).then((type) => {
                        if (offset || data.offset) {
                            switch (type[0]) {
                                case Atsu.InputWaypointType.GeoCoordinate:
                                case Atsu.InputWaypointType.Place:
                                    offsetStart = startingPoint;
                                    break;
                                case Atsu.InputWaypointType.Timepoint:
                                    if (startingPoint.endsWith("Z")) {
                                        offsetStart = startingPoint;
                                    } else {
                                        offsetStart = `${startingPoint}Z`;
                                    }
                                    break;
                                default:
                                    mcdu.addNewAtsuMessage(type[1]);
                                    offsetStart = null;
                                    if (updatedOffset) {
                                        offset = null;
                                    }
                                    break;
                            }
                        }

                        if (offset || offsetStart) {
                            const oldOffsetStart = data.offsetStart;
                            const oldOffset = data.offset;

                            data.offset = offset ? offset : oldOffset;
                            data.offsetStart = offsetStart ? offsetStart : oldOffsetStart;
                        }

                        CDUAtcLatRequestFansA.ShowPage2(mcdu, data);
                    });
                } else if (updatedOffset) {
                    if (data.offsetStart) {
                        data.offset = offset;
                    } else {
                        mcdu.addNewAtsuMessage(Atsu.AtsuStatusCodes.FormatError);
                    }
                } else if (error) {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcLatRequestFansA.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcLatRequestFansA.CanSendData(data)) {
                const requests = CDUAtcLatRequestFansA.CreateRequests(mcdu, data);
                if (requests.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, requests);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcLatRequestFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcLatRequestFansA.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcLatRequestFansA.ShowPage2(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcLatRequestFansA.ShowPage1(mcdu, data);
        };
    }
}
