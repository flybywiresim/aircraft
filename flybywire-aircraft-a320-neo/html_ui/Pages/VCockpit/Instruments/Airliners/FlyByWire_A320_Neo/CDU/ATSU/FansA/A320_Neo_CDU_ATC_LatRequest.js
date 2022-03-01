class CDUAtcLatRequest {
    static CreateDataBlock() {
        return {
            dir: null,
            wxDev: null,
            sid: null,
            offset: null,
            offsetStart: null,
            hdg: null,
            trk: null,
            backOnTrack: false
        };
    }

    static CanSendData(data) {
        return data.dir || data.wxDev || data.sid || data.offset || data.hdg || data.trk || data.backOnTrack;
    }

    static CanEraseData(data) {
        return data.dir || data.wxDev || data.sid || data.offset || data.hdg || data.trk || data.backOnTrack;
    }

    static CreateRequest(type, values = []) {
        const retval = new Atsu.RequestMessage();
        retval.Content = Atsu.CpdlcMessagesDownlink[type][1].deepCopy();

        for (let i = 0; i < values.length; ++i) {
            retval.Content.Content[i].Value = values[i];
        }

        return retval;
    }

    static CreateRequests(data) {
        const retval = [];

        if (data.dir) {
            retval.push(CDUAtcLatRequest.CreateRequest("DM22", [data.dir]));
        }
        if (data.wxDev) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.wxDev).split(" ");
            retval.push(CDUAtcLatRequest.CreateRequest("DM27", [elements[0], elements[1]]));
        }
        if (data.sid) {
            retval.push(CDUAtcLatRequest.CreateRequest("DM22", [data.sid]));
        }
        if (data.offset) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.offset).split(" ");

            if (!data.offsetStart || /$[0-9]{4}Z^/.test(data.offsetStart)) {
                retval.push(CDUAtcLatRequest.CreateRequest("DM17", [!data.offsetStart ? (new Atsu.AtsuTimestamp()).dcduTimestamp() : data.offsetStart, elements[0], elements[1]]));
            } else {
                retval.push(CDUAtcLatRequest.CreateRequest("DM16", [data.offsetStart, elements[0], elements[1]]));
            }
        }
        if (data.hdg) {
            retval.push(CDUAtcLatRequest.CreateRequest("DM70", [data.hdg === 0 ? "360" : data.hdg.toString()]));
        }
        if (data.trk) {
            retval.push(CDUAtcLatRequest.CreateRequest("DM71", [data.trk === 0 ? "360" : data.trk.toString()]));
        }
        if (data.backOnTrack) {
            retval.push(CDUAtcLatRequest.CreateRequest("DM51"));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcLatRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let wheaterDeviation = "{cyan}[  ]{end}";
        if (data.wxDev) {
            wheaterDeviation = `${data.wxDev}[color]cyan`;
        }
        let heading = "[ ]°[color]cyan";
        if (data.hdg !== null) {
            heading = `${data.hdg}°[color]cyan`;
        }
        let grdTrack = "[ ]°[color]cyan";
        if (data.trk !== null) {
            grdTrack = `${data.trk}°[color]cyan`;
        }
        let directTo = "{cyan}[     ]{end}";
        if (data.dir) {
            directTo = `${data.dir}[color]cyan`;
        }
        let sidStar = "{cyan}[   ]{end}";
        if (data.sid) {
            sidStar = `${data.sid}[color]cyan`;
        }
        let offsetDistance = "[  ]";
        if (data.offset) {
            offsetDistance = data.offset;
        }
        let offsetStartPoint = "[     ]";
        if (data.offsetStart) {
            offsetStartPoint = data.offsetStart;
        }
        let whenCanWe = "WHEN CAN WE EXPECT\xa0";
        let backOnRoute = "BACK ON ROUTE{cyan}}{end}";
        if (data.backOnTrack) {
            backOnRoute = "BACK ON ROUTE\xa0[color]cyan";
            whenCanWe = "WHEN CAN WE EXPECT\xa0[color]cyan";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "REQ DISPL\xa0[color]cyan";
        if (CDUAtcLatRequest.CanSendData(data)) {
            reqDisplay = "REQ DISPL*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcLatRequest.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC LAT REQ"],
            ["\xa0DIR TO[color]white", "WX DEV UP TO\xa0[color]white"],
            [directTo, wheaterDeviation],
            ["\xa0SID", "OFFSET/START AT\xa0"],
            [sidStar, `{cyan}${offsetDistance}/${offsetStartPoint}{end}`],
            ["\xa0HEADING", "GROUND TRK\xa0"],
            [heading, grdTrack],
            ["", whenCanWe],
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
                data.dir = null;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.dir = value;
                    } catch (err) {
                        if (err === NXSystemMessages.formatError) {
                            mcdu.addNewMessage(err);
                        }
                    };
                } else if (/^[A-Z0-9]{2,7}/.test(value)) {
                    // place format
                    mcdu.dataManager.GetWaypointsByIdent.bind(mcdu.dataManager)(value).then((waypoints) => {
                        if (waypoints.length === 0) {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        } else {
                            data.dir = value;
                        }

                        CDUAtcLatRequest.ShowPage(mcdu, data);
                    });
                }
            }

            CDUAtcLatRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.currentFlightPhase === FmgcFlightPhases.PREFLIGHT) {
                // requesting a SID
                if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
                    mcdu.dataManager.GetWaypointsByIdent.bind(mcdu.dataManager)(mcdu.flightPlanManager.getOrigin().ident).then((waypoints) => {
                        if (waypoints.length === 0) {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        } else if (waypoints[0].infos instanceof AirportInfo) {
                            const airportInfo = waypoints[0].infos;
                            if (airportInfo.departures.findIndex((sid) => sid.name === value) === -1) {
                                mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                            } else {
                                data.sid = value;
                            }

                            CDUAtcLatRequest.ShowPage(mcdu, data);
                        }
                    });
                }
            } else {
                // requesting an arrival
                if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                    mcdu.dataManager.GetWaypointsByIdent.bind(mcdu.dataManager)(mcdu.flightPlanManager.getDestination().ident).then((waypoints) => {
                        if (waypoints.length === 0) {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        } else if (waypoints[0].infos instanceof AirportInfo) {
                            const airportInfo = waypoints[0].infos;
                            if (airportInfo.approaches.findIndex((star) => star.name === value) === -1) {
                                mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                            } else {
                                data.sid = value;
                            }

                            CDUAtcLatRequest.ShowPage(mcdu, data);
                        }
                    });
                }
            }

            CDUAtcLatRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.hdg = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadDegree(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    const angle = parseInt(value);
                    if (angle === 360) {
                        data.hdg = 0;
                    } else {
                        data.hdg = angle;
                    }
                }
            }

            CDUAtcLatRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcLatRequest.ShowPage(mcdu);
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
                data.wxDev = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.wxDev = value;
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcLatRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = async (value) => {
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
                    offset = entries[0];
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

                        CDUAtcLatRequest.ShowPage(mcdu, data);
                    });
                } else if (updatedOffset) {
                    data.offset = offset;
                } else if (error) {
                    mcdu.addNewMessage(error);
                }
            }

            CDUAtcLatRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.trk = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadDegree(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    const angle = parseInt(value);
                    if (angle === 360) {
                        data.trk = 0;
                    } else {
                        data.trk = angle;
                    }
                }
            }

            CDUAtcLatRequest.ShowPage(mcdu, data);
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
            CDUAtcLatRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcLatRequest.CanSendData(data)) {
                const messages = CDUAtcLatRequest.CreateRequests(data);
                if (messages) {
                    CDUAtcTextFansA.ShowPage1(mcdu, "REQ", messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcLatRequest.CanSendData(data)) {
                if (mcdu.atsuManager.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcLatRequest.CreateRequests(data);
                    if (messages) {
                        mcdu.atsuManager.registerMessages(messages);
                    }
                    CDUAtcLatRequest.ShowPage(mcdu);
                }
            }
        };
    }
}
