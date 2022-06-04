class CDUAtcVertRequestFansA {
    static CreateDataBlock() {
        return {
            climb: null,
            climbStart: null,
            descend: null,
            descendStart: null,
            startAt: null,
            whenHigher: false,
            whenLower: false,
            altitude: null,
            blockAltitudeLow: null,
            blockAltitudeHigh: null,
            requestDescent: false,
            cruise: null,
        };
    }

    static CanSendData(data) {
        return data.climb || data.climbStart || data.descendStart || data.descend || data.startAt || data.altitude || data.whenHigher || data.whenLower ||
            data.blockAltitudeLow || data.blockAltitudeHigh || data.cruise || data.requestDescent;
    }

    static HandleClbDesStart(mcdu, value, data, climbRequest) {
        if (value === FMCMainDisplay.clrValue || !value) {
            if (climbRequest) {
                data.climbStart = null;
            } else {
                data.descendStart = null;
            }
            data.startAt = null;
        } else {
            const entries = value.split('/');
            let updateAlt = false;
            let altitude = null;
            let start = null;

            const error = Atsu.InputValidation.validateScratchpadAltitude(entries[0]);
            if (!error) {
                updateAlt = true;
                altitude = Atsu.InputValidation.formatScratchpadAltitude(entries[0]);
                entries.shift();
            }

            if (entries.length !== 0) {
                const startingPoint = entries.join("/");

                Atsu.InputValidation.classifyScratchpadWaypointType(mcdu, startingPoint, true).then((type) => {
                    if (altitude || (data.climb && climbRequest || data.descend && !climbRequest)) {
                        switch (type[0]) {
                            case Atsu.InputWaypointType.GeoCoordinate:
                            case Atsu.InputWaypointType.Place:
                                start = startingPoint;
                                break;
                            case Atsu.InputWaypointType.Timepoint:
                                if (startingPoint.endsWith("Z")) {
                                    start = startingPoint;
                                } else {
                                    start = `${startingPoint}Z`;
                                }
                                break;
                            default:
                                mcdu.addNewAtsuMessage(type[1]);
                                start = null;
                                if (updateAlt) {
                                    altitude = null;
                                }
                                break;
                        }
                    }

                    if (altitude || start) {
                        if (altitude && start) {
                            data.startAt = start;
                            if (climbRequest) {
                                data.climbStart = altitude;
                            } else {
                                data.descendStart = altitude;
                            }
                        } else if (altitude) {
                            // update the altitude and keep the start at
                            const lastStart = data.startAt;
                            data.startAt = lastStart;
                            if (climbRequest) {
                                data.climbStart = altitude;
                            } else {
                                data.descendStart = altitude;
                            }
                        } else if (start && (data.climbStart || data.descendStart)) {
                            // update start at if climb or descend are set
                            data.startAt = start;
                        }
                    }

                    CDUAtcVertRequestFansA.ShowPage2(mcdu, data);
                });
            } else if (updateAlt) {
                if (climbRequest) {
                    data.climbStart = altitude;
                } else {
                    data.descendStart = altitude;
                }
            } else if (error) {
                mcdu.addNewAtsuMessage(error);
            }
        }

        CDUAtcVertRequestFansA.ShowPage2(mcdu, data);
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
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM9", [data.climb]));
        }
        if (data.climbStart) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, /$[0-9]{4}Z^/.test(data.startAt) ? "DM13" : "DM11", [data.startAt, data.climbStart]));
        }
        if (data.descend) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM10", [data.descend]));
        }
        if (data.descendStart) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, /$[0-9]{4}Z^/.test(data.startAt) ? "DM14" : "DM12", [data.startAt, data.descendStart]));
        }
        if (data.altitude) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM6", [data.altitude]));
        }
        if (data.whenHigher) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM53"));
        }
        if (data.whenLower) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM52"));
        }
        if (data.blockAltitudeLow && data.blockAltitudeHigh) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM7", [data.blockAltitudeLow, data.blockAltitudeHigh]));
        }
        if (data.requestDescent) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, "DM67"));
            retval[retval.length - 1].Content[0].Content[0].Value = "REQUEST DESCENT";
        }
        if (data.cruise) {
            retval.push(CDUAtcVertRequestFansA.CreateRequest(mcdu, data.whenCruise ? "DM54" : "DM8", [data.cruise]));
        }

        return retval;
    }

    static ShowPage1(mcdu, data = CDUAtcVertRequestFansA.CreateDataBlock()) {
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
        let requestDescentSmall = "REQUEST\xa0";
        let requestDescent = "DESCENT{cyan}}{end}";
        if (data.requestDescent) {
            requestDescentSmall += "[color]cyan";
            requestDescent = "DESCENT\xa0[color]cyan";
        }
        let blockAlt = "[   ]/[   ][color]cyan";
        if (data.blockAltitudeLow && data.blockAltitudeHigh) {
            blockAlt = `${data.blockAltitudeLow}/${data.blockAltitudeHigh}[color]cyan`;
        }
        let crzClimb = "[   ][color]cyan";
        if (data.cruise && !data.whenCruise) {
            crzClimb = `${data.cruise}[color]cyan`;
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcVertRequestFansA.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ", "1", "2"],
            ["\xa0CLB TO", "DES TO\xa0"],
            [climbTo, descentTo],
            ["\xa0ALT", requestDescentSmall],
            [altitude, requestDescent],
            ["\xa0BLOCK ALT/ALT"],
            [blockAlt],
            ["\xa0CRUISE CLB TO"],
            [crzClimb],
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
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
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
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.blockAltitudeLow = null;
                data.blockAltitudeHigh = null;
            } else if (value) {
                const entries = value.split("/");
                if (entries.length !== 2) {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                } else {
                    const error = Atsu.InputValidation.validateAltitudeRange(entries[0], entries[1]);
                    if (error !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(error);
                    } else {
                        data.blockAltitudeLow = Atsu.InputValidation.formatScratchpadAltitude(entries[0]);
                        data.blockAltitudeHigh = Atsu.InputValidation.formatScratchpadAltitude(entries[1]);
                        CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
                    }
                }
            }
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
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
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
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
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcVertRequestFansA.ShowPage1(mcdu);
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
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.requestDescent = false;
            } else {
                data.requestDescent = true;
            }
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                if (data.whenSpeedRange) {
                    data.speedLow = null;
                    data.speedHigh = null;
                    data.whenSpeedRange = false;
                }
            } else if (value) {
                const range = Atsu.InputValidation.validateScratchpadSpeedRanges(value);
                if (range[0] !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(range[0]);
                } else {
                    if (range[1].length === 2) {
                        data.speedLow = range[1][0];
                        data.speedHigh = range[1][1];
                        data.whenSpeedRange = true;
                    }
                }
            }
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcVertRequestFansA.CanSendData(data)) {
                const messages = CDUAtcVertRequestFansA.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequestFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequestFansA.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcVertRequestFansA.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcVertRequestFansA.ShowPage2(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcVertRequestFansA.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAtcVertRequestFansA.CreateDataBlock()) {
        mcdu.clearDisplay();

        let climbStart = "[   ]/[   ][color]cyan";
        if (data.climbStart) {
            climbStart = `${data.climbStart}/${data.startAt ? data.startAt : "[   ]"}[color]cyan`;
        }
        let descendStart = "[   ]/[   ][color]cyan";
        if (data.descendStart) {
            descendStart = `${data.descendStart}/${data.startAt ? data.startAt : "[   ]"}[color]cyan`;
        }

        let higherAlt = "{cyan}{{end}HIGHER ALT";
        if (data.whenHigher) {
            higherAlt = "\xa0HIGHER ALT[color]cyan";
        }
        let lowerAlt = "LOWER ALT{cyan}}{end}";
        if (data.whenLower) {
            lowerAlt = "LOWER ALT\xa0[color]cyan";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcVertRequestFansA.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ", "2", "2"],
            ["\xa0CLB TO/START AT"],
            [climbStart],
            ["\xa0DES TO/START AT"],
            [descendStart],
            ["---WHEN CAN WE EXPECT---"],
            [higherAlt, lowerAlt],
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
            CDUAtcVertRequestFansA.HandleClbDesStart(mcdu, value, data, true);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            CDUAtcVertRequestFansA.HandleClbDesStart(mcdu, value, data, false);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.whenHigher = false;
            } else {
                data.whenHigher = true;
                data.whenLower = false;
            }
            CDUAtcVertRequestFansA.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcVertRequestFansA.ShowPage2(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.whenLower = false;
            } else {
                data.whenHigher = false;
                data.whenLower = true;
            }
            CDUAtcVertRequestFansA.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcVertRequestFansA.CanSendData(data)) {
                const messages = CDUAtcVertRequestFansA.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage2(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequestFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequestFansA.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcVertRequestFansA.ShowPage2(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcVertRequestFansA.ShowPage1(mcdu, data);
        };
    }
}
