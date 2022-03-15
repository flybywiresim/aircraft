class CDUAtcVertRequest {
    static CreateDataBlock() {
        return {
            clb: null,
            des: null,
            startAt: null,
            alt: null,
            spd: null,
            whenHigher: false,
            whenLower: false,
            whenSpd: false,
            blockAltLow: null,
            blockAltHigh: null,
            vmcDescend: false,
            cruise: null,
            spdLow: null,
            spdHigh: null,
            whenCruise: false,
            whenSpdRange: false
        };
    }

    static CanSendData(data) {
        return data.clb || data.des || data.startAt || data.alt || data.spd || data.whenHigher || data.whenLower ||
            data.whenSpd || data.blockAltLow || data.blockAltHigh || data.cruise || data.spdLow || data.spdHigh ||
            data.whenCruise || data.whenSpdRange || data.vmcDescend;
    }

    static HandleClbDesStart(mcdu, value, data, climbRequest) {
        if (value === FMCMainDisplay.clrValue || !value) {
            if (climbRequest) {
                data.clb = null;
            } else {
                data.des = null;
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
                    if (altitude || (data.clb && climbRequest || data.des && !climbRequest)) {
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
                                data.clb = altitude;
                            } else {
                                data.des = altitude;
                            }
                        } else if (altitude) {
                            // update the altitude and keep the start at
                            const lastStart = data.startAt;
                            data.startAt = lastStart;
                            if (climbRequest) {
                                data.clb = altitude;
                            } else {
                                data.des = altitude;
                            }
                        } else if (start && (data.clb || data.des)) {
                            // update start at if clb or des are set
                            data.startAt = start;
                        }
                    }

                    CDUAtcVertRequest.ShowPage1(mcdu, data);
                });
            } else if (updateAlt) {
                if (climbRequest) {
                    data.clb = altitude;
                } else {
                    data.des = altitude;
                }
            } else if (error) {
                mcdu.addNewAtsuMessage(error);
            }
        }

        CDUAtcVertRequest.ShowPage1(mcdu, data);
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

        if (data.clb) {
            if (data.startAt) {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, /$[0-9]{4}Z^/.test(data.startAt) ? "DM13" : "DM11", [data.startAt, data.clb]));
            } else {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM9", [data.clb]));
            }
        }
        if (data.des) {
            if (data.startAt) {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, /$[0-9]{4}Z^/.test(data.startAt) ? "DM14" : "DM12", [data.startAt, data.des]));
            } else {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM10", [data.des]));
            }
        }
        if (data.alt) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM6", [data.alt]));
        }
        if (data.spd) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, data.whenSpd ? "DM49" : "DM18", [data.spd]));
        }
        if (data.whenHigher) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM53"));
            retval[retval.length - 1].ContentTemplateIndex = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === "STD" ? 0 : 1;
        }
        if (data.whenLower) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM52"));
            retval[retval.length - 1].ContentTemplateIndex = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === "STD" ? 0 : 1;
        }
        if (data.blockAltLow && data.blockAltHigh) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM7", [data.blockAltLow, data.blockAltHigh]));
        } else if (data.vmcDescend) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM69"));
        } else if (data.cruise) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, data.whenCruise ? "DM54" : "DM8", [data.cruise]));
        } else if (data.spdLow && data.spdHigh) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, data.whenSpdRange ? "DM50" : "DM19", [data.spdLow, data.spdHigh]));
        }

        return retval;
    }

    static ShowPage1(mcdu, data = CDUAtcVertRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let clbStart = "[   ]/[   ][color]cyan";
        if (data.clb) {
            clbStart = `${data.clb}/${data.startAt ? data.startAt : "[   ]"}[color]cyan`;
        }
        let desStart = "[   ]/[   ][color]cyan";
        if (data.des) {
            desStart = `${data.des}/${data.startAt ? data.startAt : "[   ]"}[color]cyan`;
        }

        let alt = "[   ][color]cyan";
        if (data.alt) {
            alt = `${data.alt}[color]cyan`;
        }
        let spd = "[ ][color]cyan";
        if (data.spd && !data.whenSpd) {
            spd = `${data.spd}[color]cyan`;
        }
        let spdWhen = "[ ][color]cyan";
        if (data.spd && data.whenSpd) {
            spdWhen = `${data.spd}[color]cyan`;
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
        let reqDisplay = "REQ DISPLAY\xa0[color]cyan";
        if (CDUAtcVertRequest.CanSendData(data)) {
            reqDisplay = "REQ DISPLAY*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ", "1", "2"],
            ["\xa0CLB TO/START AT", "ALT\xa0"],
            [clbStart, alt],
            ["\xa0DES TO/START AT", "SPD\xa0"],
            [desStart, spd],
            ["---WHEN CAN WE EXPECT---"],
            [higherAlt, lowerAlt],
            ["", "WHEN CAN SPD\xa0"],
            ["", spdWhen],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC MENU", "ATC\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            CDUAtcVertRequest.HandleClbDesStart(mcdu, value, data, true);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            CDUAtcVertRequest.HandleClbDesStart(mcdu, value, data, false);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.whenHigher = false;
            } else {
                data.whenHigher = true;
            }
            CDUAtcVertRequest.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcVertRequest.ShowPage1(mcdu);
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
                data.alt = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.alt = Atsu.InputValidation.formatScratchpadAltitude(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcVertRequest.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.spd = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.spd = Atsu.InputValidation.formatScratchpadSpeed(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcVertRequest.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.whenLower = false;
            } else {
                data.whenLower = true;
            }
            CDUAtcVertRequest.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.spd = null;
                data.whenSpd = false;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.spd = Atsu.InputValidation.formatScratchpadSpeed(value);
                    data.whenSpd = true;
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcVertRequest.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                if (messages) {
                    CDUAtcTextFansA.ShowPage1(mcdu, "REQ", messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                    if (messages) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcVertRequest.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onNextPage = () => {
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAtcVertRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let blockAlt = "[   ]/[   ][color]cyan";
        if (data.blockAltLow && data.blockAltHigh) {
            blockAlt = `${data.blockAltLow}/${data.blockAltHigh}[color]cyan`;
        }
        let crzClimb = "[   ][color]cyan";
        if (data.cruise && !data.whenCruise) {
            crzClimb = `${data.cruise}[color]cyan`;
        }
        let crzClimbWhen = "[   ][color]cyan";
        if (data.cruise && data.whenCruise) {
            crzClimbWhen = `${data.cruise}[color]cyan`;
        }

        let spdRange = "[ ]/[ ][color]cyan";
        if (data.spdLow && data.spdHigh && !data.whenSpdRange) {
            spdRange = `${data.spdLow}/${data.spdHigh}[color]cyan`;
        }
        let spdRangeWhen = "[ ]/[ ][color]cyan";
        if (data.spdLow && data.spdHigh && data.whenSpdRange) {
            spdRangeWhen = `${data.spdLow}/${data.spdHigh}[color]cyan`;
        }
        let vmc = "VMC\xa0";
        let vmcDesc = "DESCENT{cyan}}{end}";
        if (data.vmcDescend) {
            vmc = "VMC\xa0[color]cyan";
            vmcDesc = "DESCENT\xa0[color]cyan";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "REQ DISPLAY\xa0[color]cyan";
        if (CDUAtcVertRequest.CanSendData(data)) {
            reqDisplay = "REQ DISPLAY*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ", "2", "2"],
            ["\xa0BLOCK ALT", vmc],
            [blockAlt, vmcDesc],
            ["\xa0CRZ CLB TO", "SPD RANGE\xa0"],
            [crzClimb, spdRange],
            [""],
            ["{small}---WHEN CAN WE EXPECT---{end}"],
            ["\xa0CRZ CLB TO", "SPD RANGE\xa0"],
            [crzClimbWhen, spdRangeWhen],
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
                data.blockAltLow = null;
                data.blockAltHigh = null;
            } else if (value) {
                const entries = value.split("/");
                if (entries.length !== 2) {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                } else {
                    const error = Atsu.InputValidation.validateAltitudeRange(entries[0], entries[1]);
                    if (error !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(error);
                    } else {
                        data.blockAltLow = Atsu.InputValidation.formatScratchpadAltitude(entries[0]);
                        data.blockAltHigh = Atsu.InputValidation.formatScratchpadAltitude(entries[1]);
                        CDUAtcVertRequest.ShowPage2(mcdu, data);
                    }
                }
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                if (!data.whenCruise) {
                    data.cruise = null;
                }
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.cruise = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.cruise = null;
                data.whenCruise = false;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.cruise = Atsu.InputValidation.formatScratchpadAltitude(value);
                    data.whenCruise = true;
                }
            }
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcVertRequest.ShowPage2(mcdu);
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
                data.vmcDescend = false;
            } else {
                data.vmcDescend = true;
            }
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                if (!data.whenSpdRange) {
                    data.spdLow = null;
                    data.spdHigh = null;
                }
            } else if (value) {
                const range = Atsu.InputValidation.validateScratchpadSpeedRanges(value);
                if (range[0] !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(range[0]);
                } else {
                    if (range[1].length === 2) {
                        data.spdLow = range[1][0];
                        data.spdHigh = range[1][1];
                    }
                }
            }
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                if (data.whenSpdRange) {
                    data.spdLow = null;
                    data.spdHigh = null;
                    data.whenSpdRange = false;
                }
            } else if (value) {
                const range = Atsu.InputValidation.validateScratchpadSpeedRanges(value);
                if (range[0] !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(range[0]);
                } else {
                    if (range[1].length === 2) {
                        data.spdLow = range[1][0];
                        data.spdHigh = range[1][1];
                        data.whenSpdRange = true;
                    }
                }
            }
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                if (messages) {
                    CDUAtcTextFansA.ShowPage1(mcdu, "REQ", messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                    if (messages) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcVertRequest.ShowPage2(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcVertRequest.ShowPage1(mcdu, data);
        };
    }
}
