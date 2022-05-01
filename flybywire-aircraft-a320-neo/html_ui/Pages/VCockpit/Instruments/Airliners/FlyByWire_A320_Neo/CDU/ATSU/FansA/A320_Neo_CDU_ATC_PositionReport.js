class CDUAtcPositionReport {
    static SecondsToString(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
    }

    static CreateDataBlock(mcdu, autoFill) {
        const retval = {
            passedWaypoint: [null, null, null],
            activeWaypoint: [null, null],
            nextWaypoint: null,
            currentPosition: null,
            currentUtc: null,
            currentAltitude: null,
            wind: null,
            sat: null,
            icing: null,
            turbulence: null,
            eta: null,
            endurance: null,
            indicatedAirspeed: null,
            groundSpeed: null,
            verticalSpeed: null,
            deviating: null,
            heading: null,
            track: null,
            descending: null,
            climbing: null,
        };

        if (autoFill === true) {
            const current = mcdu.atsu.currentFlightState();
            const target = mcdu.atsu.targetFlightState();
            const lastWp = mcdu.atsu.lastWaypoint();
            const activeWp = mcdu.atsu.activeWaypoint();
            const nextWp = mcdu.atsu.nextWaypoint();

            if (lastWp) {
                retval.passedWaypoint[0] = lastWp.ident;
                retval.passedWaypoint[1] = CDUAtcPositionReport.SecondsToString(lastWp.utc);
                retval.passedWaypoint[2] = lastWp.altitude;
            }

            retval.currentPosition = new LatLong(current.lat, current.lon).toShortDegreeString();
            retval.currentUtc = CDUAtcPositionReport.SecondsToString(SimVar.GetSimVarValue('E:ZULU TIME', 'seconds'));
            retval.currentAltitude = current.altitude;

            if (activeWp) {
                retval.activeWaypoint[0] = activeWp.ident;
                retval.activeWaypoint[1] = CDUAtcPositionReport.SecondsToString(activeWp.utc);
            }
            if (nextWp) {
                retval.nextWaypoint = nextWp.ident;
            }

            // TODO add wind
            // TODO add SAT
            // TODO add ETA

            retval.indicatedAirspeed = current.indicatedAirspeed;
            retval.groundSpeed = current.groundSpeed;
            retval.verticalSpeed = current.verticalSpeed;
            // TODO add deviating
            retval.heading = current.heading;
            retval.track = current.track;
            if (current.altitude > target.altitude) {
                retval.descending = target.altitude;
            } else if (current.altitude < target.altitude) {
                retval.climbing = target.altitude;
            }
        }

        return retval;
    }

    static CanEraseData(data) {
        return data.passedWaypoint[0] || data.passedWaypoint[1] || data.passedWaypoint[2] || data.activeWaypoint[0] || data.activeWaypoint[1] || data.nextWaypoint ||
            data.currentPosition || data.currentUtc || data.currentAltitude || data.wind || data.sat || data.icing || data.turbulence ||
            data.eta || data.endurance || data.indicatedAirspeed || data.groundSpeed || data.verticalSpeed || data.deviating || data.heading || data.track ||
            data.descending || data.climbing;
    }

    static CanSendData(data) {
        return data.currentPosition && data.currentUtc && data.currentAltitude;
    }

    static CreateReport(mcdu, data) {

    }

    static ShowPage1(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.clearDisplay();

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        const overhead = ["[    ]", "[  ]", "[    ]"];
        if (data.passedWaypoint[0]) {
            overhead[0] = data.passedWaypoint[0];
        }
        if (data.passedWaypoint[1] && data.passedWaypoint[2]) {
            overhead[1] = data.passedWaypoint[1];
            overhead[2] = data.passedWaypoint[2];
        }

        const ppos = ["_______[color]amber", "____/______[color]amber"];
        if (data.currentPosition) {
            ppos[0] = `{cyan}${data.currentPosition}{end}`;
        }
        if (data.currentUtc && data.currentAltitude) {
            // TODO convert Altitude the FL if STD is used
            ppos[1] = `{cyan}${data.currentUtc}/${data.currentAltitude}{end}`;
        }

        const to = ["[    ]", "[  ]"];
        if (data.activeWaypoint[0]) {
            to[0] = data.activeWaypoint[0];
        }
        if (data.activeWaypoint[1]) {
            to[1] = data.activeWaypoint[1];
        }

        let next = "[    ]";
        if (data.nextWaypoint) {
            next = data.nextWaypoint;
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "1", "3"],
            ["\xa0OVHD-----------UTC/ALT"],
            [`{cyan}${overhead[0]}{end}`, `{cyan}${overhead[1]}/${overhead[2]}`],
            ["\xa0PPOS-----------UTC/ALT"],
            [ppos[0], ppos[1]],
            ["\xa0TO-----------------UTC"],
            [`{cyan}${to[0]}{end}`, `{cyan}${to[1]}{end}`],
            ["\xa0NEXT"],
            [`{cyan}${next}{end}`],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.lastWaypoint[0] = null;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.lastWaypoint[0] = value;
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
                            data.lastWaypoint[0] = value;
                        }

                        CDUAtcPositionReport.ShowPage1(mcdu, data);
                    });
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.currentPosition = null;
            } else if (value && mcdu.isLatLonFormat(value)) {
                // format: DDMM.MB/EEEMM.MC
                try {
                    mcdu.parseLatLon(value);
                    data.currentPosition = value;
                } catch (err) {
                    if (err === NXSystemMessages.formatError) {
                        mcdu.setScratchpadMessage(err);
                    }
                };
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.activeWaypoint[0] = null;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.activeWaypoint[0] = value;
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
                            data.activeWaypoint[0] = value;
                        }

                        CDUAtcPositionReport.ShowPage1(mcdu, data);
                    });
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.nextWaypoint = null;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.nextWaypoint = value;
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
                            data.nextWaypoint = value;
                        }

                        CDUAtcPositionReport.ShowPage1(mcdu, data);
                    });
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, CDUAtcPositionReport.CreateDataBlock(mcdu, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.lastWaypoint[1] = null;
                data.lastWaypoint[2] = null;
            } else {
                const elements = value.split("/");
                if (elements.length === 2) {
                    const timeError = Atsu.InputValidation.validateScratchpadTime(elements[0]);
                    const altError = Atsu.InputValidation.validateScratchpadAltitude(elements[1]);

                    if (timeError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(timeError);
                    } else if (altError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(altError);
                    } else {
                        data.lastWaypoint[1] = elements[0];
                        data.lastWaypoint[2] = elements[1];
                    }
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.currentUtc = null;
                data.currentAltitude = null;
            } else {
                const elements = value.split("/");
                if (elements.length === 2) {
                    const timeError = Atsu.InputValidation.validateScratchpadTime(elements[0]);
                    const altError = Atsu.InputValidation.validateScratchpadAltitude(elements[1]);

                    if (timeError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(timeError);
                    } else if (altError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(altError);
                    } else {
                        data.currentUtc = elements[0];
                        data.currentAltitude = elements[1];
                    }
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.activeWaypoint[1] = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadTime(value);

                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.activeWaypoint[1] = value;
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [report]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                    mcdu.atsu.registerMessages([report]);
                    CDUAtcPositionReport.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.clearDisplay();

        const wind = data.wind ? data.wind.split("/") : ["[  ]", "[  ]"];
        const sat = data.sat ? data.sat : "[  ]";
        const turbulence = data.turbulence ? data.turbulence : "[  ]";
        const icing = data.icing ? data.icing : "[  ]";
        const eta = data.eta ? data.eta : "[   ]";
        const endurance = data.endurance ? data.endurance : "[   ]";

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "2", "3"],
            ["\xa0WIND", "SAT\xa0"],
            [`{cyan}${wind[0]}{end}{white}°{end}/{cyan}${wind[1]}{end}`, `{cyan}${sat}{end}`],
            ["\xa0ICING(TLMS)", "TURB(LMS)\xa0"],
            [`{cyan}${icing}{end}`, `{cyan}${turbulence}{end}`],
            ["\xa0ETA", "ENDURANCE\xa0"],
            [`{cyan}${eta}{end}`, `{cyan}${endurance}{end}`],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCDataManager.clrValue) {
                data.wind = null;
            } else if (Atsu.InputValidation.validateScratchpadWind(value)) {
                data.wind = Atsu.InputValidation.formatScratchpadWind(value);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCDataManager.clrValue) {
                data.icing = null;
            } else if (value === "T" || value === "L" || value === "M" || value === "S") {
                data.icing = value;
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCDataManager.clrValue) {
                data.eta = null;
            } else if (Atsu.InputValidation.validateScratchpadTime(value)) {
                data.eta = value;
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, CDUAtcPositionReport.CreateDataBlock(mcdu, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCDataManager.clrValue) {
                data.sat = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadTemperature(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.sat = Atsu.InputValidation.formatScratchpadTemperature(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCDataManager.clrValue) {
                data.turbulence = null;
            } else if (value === "L" || value === "M" || value === "S") {
                data.turbulence = value;
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCDataManager.clrValue) {
                data.endurance = null;
            } else if (Atsu.InputValidation.validateScratchpadEndurance(value)) {
                data.endurance = Atsu.InputValidation.formatScratchpadEndurance(value);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [report]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                    mcdu.atsu.registerMessages([report]);
                    CDUAtcPositionReport.ShowPage2(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, data);
        };
    }

    static ShowPage3(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.clearDisplay();

        const indicatedAirspeed = data.indicatedAirspeed ? data.indicatedAirspeed : "[  ]";
        const groundSpeed = data.groundSpeed ? data.groundSpeed : "[  ]";
        const verticalSpeed = data.verticalSpeed ? data.verticalSpeed : "[  ]";
        const deviating = data.deviating ? data.deviating : "[  ]";
        const heading = data.heading ? data.heading : "[  ]";
        const track = data.track ? data.track : "[  ]";
        const descending = ["\xa0DSCENDING TO", "[   ]"];
        const climbing = ["CLBING TO\xa0", "[   ]"];

        const current = mcdu.atsu.currentFlightState();
        const target = mcdu.atsu.targetFlightState();
        if (target.altitude < current.altitude) {
            climbing[0] = climbing[1] = "";
            descending[1] = target.altitude;
        } else if (target.altitude > current.altitude) {
            descending[0] = descending[1] = "";
            climbing[1] = target.altitude;
        } else {
            descending[0] = descending[1] = "";
            climbing[0] = climbing[1] = "";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "3", "3"],
            ["\xa0SPEED", "GROUND SPD\xa0"],
            [`{cyan}${indicatedAirspeed}{end}`, `{cyan}${groundSpeed}{end}`],
            ["\xa0VERT SPEED", "DEVIATING\xa0"],
            [`{cyan}${verticalSpeed}{end}`, `{cyan}${deviating}{end}`],
            ["\xa0HEADING", "TRACK ANGLE\xa0"],
            [`{cyan}${heading}{end}{white}°{end}`, `{cyan}${track}{end}{white}°{end}`],
            [descending[0], climbing[0]],
            [`{cyan}${descending[1]}{end}`, `{cyan}${climbing[1]}{end}`],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, CDUAtcPositionReport.CreateDataBlock(mcdu, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [report]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                    mcdu.atsu.registerMessages([report]);
                    CDUAtcPositionReport.ShowPage3(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };
    }
}
