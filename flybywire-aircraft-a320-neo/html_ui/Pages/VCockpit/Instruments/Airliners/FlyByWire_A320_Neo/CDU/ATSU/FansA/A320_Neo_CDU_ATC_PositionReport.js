class CDUAtcPositionReport {
    static SecondsToString(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
    }

    static FillDataBlock(mcdu, data) {
        const current = mcdu.atsu.currentFlightState();
        const target = mcdu.atsu.targetFlightState();
        const lastWp = mcdu.atsu.lastWaypoint();
        const activeWp = mcdu.atsu.activeWaypoint();
        const nextWp = mcdu.atsu.nextWaypoint();

        if (lastWp && !data.passedWaypoint[3]) {
            data.passedWaypoint[0] = lastWp.ident;
            data.passedWaypoint[1] = CDUAtcPositionReport.SecondsToString(lastWp.utc);
            data.passedWaypoint[2] = lastWp.altitude;
        }

        data.currentPosition = !data.currentPosition[2] ? [current.lat, current.lon, false] : data.currentPosition;
        data.currentUtc[0] = !data.currentUtc[1] ? CDUAtcPositionReport.SecondsToString(SimVar.GetSimVarValue('E:ZULU TIME', 'seconds')) : data.currentUtc[0];
        data.currentAltitude[0] = !data.currentAltitude[1] ? current.altitude : data.currentAltitude[0];

        if (activeWp && !data.activeWaypoint[2]) {
            data.activeWaypoint[0] = activeWp.ident;
            data.activeWaypoint[1] = CDUAtcPositionReport.SecondsToString(activeWp.utc);
        }
        if (nextWp && !data.nextWaypoint[1]) {
            data.nextWaypoint[0] = nextWp.ident;
        }
        if (mcdu.atsu.destinationWaypoint() && !data.eta[1]) {
            data.eta[0] = CDUAtcPositionReport.SecondsToString(mcdu.atsu.destinationWaypoint().utc);
        }

        if (!data.wind[1]) {
            const windDirection = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_1_WIND_DIRECTION`, 500);
            const windVelocity = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_1_WIND_VELOCITY`, 500);

            const wind = `${Math.round(windDirection.value)}/${Math.round(windVelocity.value)}`;
            if (Atsu.InputValidation.validateScratchpadWind(wind) === Atsu.AtsuStatusCodes.Ok) {
                data.wind[0] = Atsu.InputValidation.formatScratchpadWind(wind);
            }
        }
        if (!data.sat[1]) {
            const sat = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', 500);
            if (Atsu.InputValidation.validateScratchpadTemperature(sat.value) === Atsu.AtsuStatusCodes.Ok) {
                data.sat[0] = Math.round(Atsu.InputValidation.formatScratchpadTemperature(`${sat.value}`));
            }
        }

        data.indicatedAirspeed[0] = !data.indicatedAirspeed[1] ? current.indicatedAirspeed : data.indicatedAirspeed[0];
        data.groundSpeed[0] = !data.groundSpeed[1] ? current.groundSpeed : data.groundSpeed[0];
        data.verticalSpeed[0] = !data.verticalSpeed[1] ? current.verticalSpeed : data.verticalSpeed[0];
        // TODO add deviating
        data.heading[0] = !data.heading[1] ? current.heading : data.heading[0];
        data.track[0] = !data.track[1] ? current.track : data.track[0];
        if (target.apActive && current.altitude > target.altitude) {
            data.descending = target.altitude;
        } else if (target.apActive && current.altitude < target.altitude) {
            data.climbing = target.altitude;
        }
    }

    static CreateDataBlock(mcdu, autoFill) {
        const retval = {
            passedWaypoint: [null, null, null, !autoFill],
            activeWaypoint: [null, null, !autoFill],
            nextWaypoint: [null, !autoFill],
            currentPosition: [null, !autoFill],
            currentUtc: [null, !autoFill],
            currentAltitude: [null, !autoFill],
            wind: [null, !autoFill],
            sat: [null, !autoFill],
            icing: [null, !autoFill],
            turbulence: [null, !autoFill],
            eta: [null, !autoFill],
            endurance: [null, !autoFill],
            indicatedAirspeed: [null, !autoFill],
            groundSpeed: [null, !autoFill],
            verticalSpeed: [null, !autoFill],
            deviating: [null, !autoFill],
            heading: [null, !autoFill],
            track: [null, !autoFill],
            descending: [null, !autoFill],
            climbing: [null, !autoFill],
        };

        if (autoFill === true) {
            setTimeout(() => {
                CDUAtcPositionReport.FillDataBlock(mcdu, retval);
                if (mcdu.page.Current === mcdu.page.ATCPositionReport1) {
                    CDUAtcPositionReport.ShowPage1(mcdu, retval);
                } else if (mcdu.page.Current === mcdu.page.ATCPositionReport2) {
                    CDUAtcPositionReport.ShowPage2(mcdu, retval);
                } else if (mcdu.page.Current === mcdu.page.ATCPositionReport3) {
                    CDUAtcPositionReport.ShowPage3(mcdu, retval);
                }
            }, 1500);
        }

        return retval;
    }

    static CanEraseData(data) {
        return data.passedWaypoint[0] || data.passedWaypoint[1] || data.passedWaypoint[2] || data.activeWaypoint[0] || data.activeWaypoint[1] || data.nextWaypoint[0] ||
            data.currentPosition[0] || data.currentUtc[0] || data.currentAltitude[0] || data.wind[0] || data.sat[0] || data.icing[0] || data.turbulence[0] ||
            data.eta[0] || data.endurance[0] || data.indicatedAirspeed[0] || data.groundSpeed[0] || data.verticalSpeed[0] || data.deviating[0] || data.heading[0] || data.track[0] ||
            data.descending[0] || data.climbing[0];
    }

    static CanSendData(data) {
        return data.currentPosition[0] && data.currentUtc[0] && data.currentAltitude[0];
    }

    static CreateReport(mcdu, data) {

    }

    static ShowPage1(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.page.Current = mcdu.page.ATCPositionReport1;

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcPositionReport.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcPositionReport.CanEraseData(data)) {
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
        if (data.currentPosition[0]) {
            const dmsLat = CDUInitPage.ConvertDDToDMS(data.currentPosition[0][0], false);
            const dmsLon = CDUInitPage.ConvertDDToDMS(data.currentPosition[0][1], true);

            dmsLon['deg'] = Number(dmsLon['deg']);
            dmsLat['sec'] = Math.ceil(Number(dmsLat['sec'] / 100));
            dmsLon['sec'] = Math.ceil(Number(dmsLon['sec'] / 100));
            dmsLat['min'] = dmsLat['min'].toString();
            dmsLon['min'] = dmsLon['min'].toString();

            if (dmsLat['dir'] === "N") {
                if (dmsLon['dir'] === "E") {
                    ppos[0] = `{cyan}${dmsLat['deg']}N${dmsLon['deg']}{end}`;
                } else {
                    ppos[0] = `{cyan}${dmsLat['deg']}${dmsLon['deg']}N{end}`;
                }
            } else if (dmsLon['dir'] === "E") {
                ppos[0] = `{cyan}${dmsLat['deg']}${dmsLon['deg']}S{end}`;
            } else {
                ppos[0] = `{cyan}${dmsLat['deg']}W${dmsLon['deg']}{end}`;
            }
            //const lat = `${dmsLat['deg']}°${dmsLat['min']}.${dmsLat['sec']}${dmsLat['dir']}`;
            //const lon = `${dmsLon['deg']}°${dmsLon['min']}.${dmsLon['sec']}${dmsLon['dir']}`;
            //ppos[0] = `{cyan}${lat}/${lon}{end}`;
        }
        if (data.currentUtc[0] && data.currentAltitude[0]) {
            // TODO convert Altitude the FL if STD is used
            ppos[1] = `{cyan}${data.currentUtc[0]}/${data.currentAltitude[0]}{end}`;
        }

        const to = ["[    ]", "[  ]"];
        if (data.activeWaypoint[0]) {
            to[0] = data.activeWaypoint[0];
        }
        if (data.activeWaypoint[1]) {
            to[1] = data.activeWaypoint[1];
        }

        let next = "[    ]";
        if (data.nextWaypoint[0]) {
            next = data.nextWaypoint[0];
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
                data.lastWaypoint[3] = true;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.lastWaypoint[0] = value;
                        data.lastWaypoint[3] = true;
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
                            data.lastWaypoint[3] = true;
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
                data.currentPosition[0] = null;
                data.currentPosition[1] = true;
            } else if (value && mcdu.isLatLonFormat(value)) {
                // format: DDMM.MB/EEEMM.MC
                try {
                    mcdu.parseLatLon(value);
                    data.currentPosition[0] = value;
                    data.currentPosition[1] = true;
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
                data.activeWaypoint[2] = true;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.activeWaypoint[0] = value;
                        data.activeWaypoint[2] = true;
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
                            data.activeWaypoint[2] = true;
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
                data.nextWaypoint[0] = null;
                data.nextWaypoint[1] = true;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.nextWaypoint[0] = value;
                        data.nextWaypoint[1] = true;
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
                            data.nextWaypoint[0] = value;
                            data.nextWaypoint[1] = true;
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
                data.lastWaypoint[3] = true;
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
                        data.lastWaypoint[3] = true;
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
                data.currentUtc = [null, true];
                data.currentAltitude = [null, true];
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
                        data.currentUtc = [elements[0], true];
                        data.currentAltitude = [elements[1], true];
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
                data.activeWaypoint[2] = true;
            } else {
                const error = Atsu.InputValidation.validateScratchpadTime(value);

                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.activeWaypoint[1] = value;
                    data.activeWaypoint[2] = true;
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
        mcdu.page.Current = mcdu.page.ATCPositionReport2;

        const wind = data.wind[0] ? data.wind[0].split("/") : ["[  ]", "[  ]"];
        const sat = data.sat[0] ? data.sat[0] : "[  ]";
        const turbulence = data.turbulence[0] ? data.turbulence[0] : "[  ]";
        const icing = data.icing[0] ? data.icing[0] : "[  ]";
        const eta = data.eta[0] ? data.eta[0] : "[   ]";
        const endurance = data.endurance[0] ? data.endurance[0] : "[   ]";

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcPositionReport.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcPositionReport.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "2", "3"],
            ["\xa0WIND", "SAT\xa0"],
            [`{cyan}${wind[0]}{end}{white}°{end}{cyan}/${wind[1]}{end}`, `{cyan}${sat}{end}`],
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
                data.wind = [null, true];
            } else if (Atsu.InputValidation.validateScratchpadWind(value)) {
                data.wind = [Atsu.InputValidation.formatScratchpadWind(value), true];
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
                data.icing = [null, true];
            } else if (value === "T" || value === "L" || value === "M" || value === "S") {
                data.icing = [value, true];
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
                data.eta = [null, true];
            } else if (Atsu.InputValidation.validateScratchpadTime(value)) {
                data.eta = [value, true];
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
                data.sat = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadTemperature(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.sat = [Atsu.InputValidation.formatScratchpadTemperature(value), true];
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
                data.turbulence = [null, true];
            } else if (value === "L" || value === "M" || value === "S") {
                data.turbulence = [value, true];
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
                data.endurance = [null, true];
            } else if (Atsu.InputValidation.validateScratchpadEndurance(value)) {
                data.endurance = [Atsu.InputValidation.formatScratchpadEndurance(value), true];
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
        mcdu.page.Current = mcdu.page.ATCPositionReport3;

        const indicatedAirspeed = data.indicatedAirspeed[0] ? data.indicatedAirspeed[0] : "[  ]";
        const groundSpeed = data.groundSpeed[0] ? data.groundSpeed[0] : "[  ]";
        const verticalSpeed = data.verticalSpeed[0] ? data.verticalSpeed[0] : "[  ]";
        const deviating = data.deviating[0] ? data.deviating[0] : "[  ]";
        const heading = data.heading[0] ? data.heading[0] : "[  ]";
        const track = data.track[0] ? data.track[0] : "[  ]";
        const descending = ["\xa0DSCENDING TO", "[   ]"];
        const climbing = ["CLBING TO\xa0", "[   ]"];

        const current = mcdu.atsu.currentFlightState();
        const target = mcdu.atsu.targetFlightState();
        if (target.apActive && target.altitude === current.altitude) {
            descending[0] = descending[1] = "";
            climbing[0] = climbing[1] = "";
        } else if (data.climbing[0]) {
            descending[0] = descending[1] = "";
            climbing[1] = data.climbing[0];
        } else if (data.descending[0]) {
            climbing[0] = climbing[1] = "";
            descending = data.descending[0];
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcPositionReport.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcPositionReport.CanEraseData(data)) {
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
