class CDUAtcVertRequest {
    static CreateDataBlock() {
        return {
            climb: null,
            descend: null,
            startAt: null,
            altitude: null,
            speed: null,
            whenHigher: false,
            whenLower: false,
            whenSpeed: false,
            blockAltitudeLow: null,
            blockAltitudeHigh: null,
            vmcDescend: false,
            cruise: null,
            speedLow: null,
            speedHigh: null,
            whenCruise: false,
            whenSpeedRange: false
        };
    }

    static CanSendData(data) {
        return data.climb || data.descend || data.startAt || data.altitude || data.speed || data.whenHigher || data.whenLower ||
            data.whenSpeed || data.blockAltitudeLow || data.blockAltitudeHigh || data.cruise || data.speedLow || data.speedHigh ||
            data.whenCruise || data.whenSpeedRange || data.vmcDescend;
    }

    static HandleClbDesStart(mcdu, value, data, climbRequest) {
        if (value === FMCMainDisplay.clrValue || !value) {
            if (climbRequest) {
                data.climb = null;
            } else {
                data.descend = null;
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
                                data.climb = altitude;
                            } else {
                                data.descend = altitude;
                            }
                        } else if (altitude) {
                            // update the altitude and keep the start at
                            const lastStart = data.startAt;
                            data.startAt = lastStart;
                            if (climbRequest) {
                                data.climb = altitude;
                            } else {
                                data.descend = altitude;
                            }
                        } else if (start && (data.climb || data.descend)) {
                            // update start at if climb or descend are set
                            data.startAt = start;
                        }
                    }

                    CDUAtcVertRequest.ShowPage1(mcdu, data);
                });
            } else if (updateAlt) {
                if (climbRequest) {
                    data.climb = altitude;
                } else {
                    data.descend = altitude;
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

        if (data.climb) {
            if (data.startAt) {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, /$[0-9]{4}Z^/.test(data.startAt) ? "DM13" : "DM11", [data.startAt, data.climb]));
            } else {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM9", [data.climb]));
            }
        }
        if (data.descend) {
            if (data.startAt) {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, /$[0-9]{4}Z^/.test(data.startAt) ? "DM14" : "DM12", [data.startAt, data.descend]));
            } else {
                retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM10", [data.descend]));
            }
        }
        if (data.altitude) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM6", [data.altitude]));
        }
        if (data.speed) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, data.whenSpeed ? "DM49" : "DM18", [data.speed]));
        }
        if (data.whenHigher) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM53"));
            retval[retval.length - 1].ContentTemplateIndex = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === "STD" ? 0 : 1;
        }
        if (data.whenLower) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM52"));
            retval[retval.length - 1].ContentTemplateIndex = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === "STD" ? 0 : 1;
        }
        if (data.blockAltitudeLow && data.blockAltitudeHigh) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM7", [data.blockAltitudeLow, data.blockAltitudeHigh]));
        } else if (data.vmcDescend) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, "DM69"));
        } else if (data.cruise) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, data.whenCruise ? "DM54" : "DM8", [data.cruise]));
        } else if (data.speedLow && data.speedHigh) {
            retval.push(CDUAtcVertRequest.CreateRequest(mcdu, data.whenSpeedRange ? "DM50" : "DM19", [data.speedLow, data.speedHigh]));
        }

        return retval;
    }

    static ShowPage1(mcdu, data = CDUAtcVertRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let climbStart = "[   ]/[   ][color]cyan";
        if (data.climb) {
            climbStart = `${data.climb}/${data.startAt ? data.startAt : "[   ]"}[color]cyan`;
        }
        let descendStart = "[   ]/[   ][color]cyan";
        if (data.descend) {
            descendStart = `${data.descend}/${data.startAt ? data.startAt : "[   ]"}[color]cyan`;
        }

        let alt = "[   ][color]cyan";
        if (data.altitude) {
            alt = `${data.altitude}[color]cyan`;
        }
        let speed = "[ ][color]cyan";
        if (data.speed && !data.whenSpeed) {
            speed = `${data.speed}[color]cyan`;
        }
        let speedWhen = "[ ][color]cyan";
        if (data.speed && data.whenSpeed) {
            speedWhen = `${data.speed}[color]cyan`;
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
        if (CDUAtcVertRequest.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ", "1", "2"],
            ["\xa0CLB TO/START AT", "ALT\xa0"],
            [climbStart, alt],
            ["\xa0DES TO/START AT", "SPD\xa0"],
            [descendStart, speed],
            ["---WHEN CAN WE EXPECT---"],
            [higherAlt, lowerAlt],
            ["", "WHEN CAN SPD\xa0"],
            ["", speedWhen],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
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
                data.altitude = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.altitude = Atsu.InputValidation.formatScratchpadAltitude(value);
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
                data.speed = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.speed = Atsu.InputValidation.formatScratchpadSpeed(value);
                    data.whenSpeed = false;
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
                data.speed = null;
                data.whenSpeed = false;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.speed = Atsu.InputValidation.formatScratchpadSpeed(value);
                    data.whenSpeed = true;
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
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
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
        if (data.blockAltitudeLow && data.blockAltitudeHigh) {
            blockAlt = `${data.blockAltitudeLow}/${data.blockAltitudeHigh}[color]cyan`;
        }
        let crzClimb = "[   ][color]cyan";
        if (data.cruise && !data.whenCruise) {
            crzClimb = `${data.cruise}[color]cyan`;
        }
        let crzClimbWhen = "[   ][color]cyan";
        if (data.cruise && data.whenCruise) {
            crzClimbWhen = `${data.cruise}[color]cyan`;
        }

        let speedRange = "[ ]/[ ][color]cyan";
        if (data.speedLow && data.speedHigh && !data.whenSpeedRange) {
            speedRange = `${data.speedLow}/${data.speedHigh}[color]cyan`;
        }
        let speedRangeWhen = "[ ]/[ ][color]cyan";
        if (data.speedLow && data.speedHigh && data.whenSpeedRange) {
            speedRangeWhen = `${data.speedLow}/${data.speedHigh}[color]cyan`;
        }
        let vmc = "VMC\xa0";
        let vmcDesc = "DESCENT{cyan}}{end}";
        if (data.vmcDescend) {
            vmc = "VMC\xa0[color]cyan";
            vmcDesc = "DESCENT\xa0[color]cyan";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcVertRequest.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC VERT REQ", "2", "2"],
            ["\xa0BLOCK ALT", vmc],
            [blockAlt, vmcDesc],
            ["\xa0CRZ CLB TO", "SPD RANGE\xa0"],
            [crzClimb, speedRange],
            [""],
            ["{small}---WHEN CAN WE EXPECT---{end}"],
            ["\xa0CRZ CLB TO", "SPD RANGE\xa0"],
            [crzClimbWhen, speedRangeWhen],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
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
                    data.whenCruise = false;
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
                if (!data.whenSpeedRange) {
                    data.speedLow = null;
                    data.speedHigh = null;
                }
            } else if (value) {
                const range = Atsu.InputValidation.validateScratchpadSpeedRanges(value);
                if (range[0] !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(range[0]);
                } else {
                    if (range[1].length === 2) {
                        data.speedLow = range[1][0];
                        data.speedHigh = range[1][1];
                        data.whenSpeedRange = false;
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
            CDUAtcVertRequest.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcVertRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcVertRequest.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
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
