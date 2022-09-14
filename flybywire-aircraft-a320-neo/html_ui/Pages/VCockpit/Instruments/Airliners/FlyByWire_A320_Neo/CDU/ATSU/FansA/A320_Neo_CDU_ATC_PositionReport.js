class CDUAtcPositionReport {
    static SecondsToString(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
    }

    static AltitudeToString(altitude) {
        if (Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === "STD") {
            return Atsu.InputValidation.formatScratchpadAltitude(`FL${Math.round(altitude / 100)}`);
        }
        return Atsu.InputValidation.formatScratchpadAltitude(`${altitude}FT`);
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
            data.passedWaypoint[2] = CDUAtcPositionReport.AltitudeToString(lastWp.altitude);
        }

        // will be abreviated during the rendering
        if (!data.currentPosition[2]) {
            mcdu.setScratchpadMessage(NXSystemMessages.latLonAbreviated);
        }
        data.currentPosition = !data.currentPosition[2] ? [current.lat, current.lon, false] : data.currentPosition;
        data.currentUtc[0] = !data.currentUtc[1] ? CDUAtcPositionReport.SecondsToString(SimVar.GetSimVarValue('E:ZULU TIME', 'seconds')) : data.currentUtc[0];
        data.currentAltitude[0] = !data.currentAltitude[1] ? CDUAtcPositionReport.AltitudeToString(current.altitude) : data.currentAltitude[0];

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
            const windDirection = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_IR_1_WIND_DIRECTION", 500);
            const windVelocity = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_IR_1_WIND_VELOCITY", 500);

            const wind = `${Math.round(windDirection.value)}/${Math.round(windVelocity.value)}`;
            if (Atsu.InputValidation.validateScratchpadWind(wind) === Atsu.AtsuStatusCodes.Ok) {
                data.wind[0] = Atsu.InputValidation.formatScratchpadWind(wind);
            }
        }
        if (!data.sat[1]) {
            const sat = Arinc429Word.fromSimVarValue("L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE", 500);
            if (Atsu.InputValidation.validateScratchpadTemperature(sat.value) === Atsu.AtsuStatusCodes.Ok) {
                data.sat[0] = Math.round(Atsu.InputValidation.formatScratchpadTemperature(`${sat.value}`));
            }
        }

        data.indicatedAirspeed[0] = !data.indicatedAirspeed[1] ? Atsu.InputValidation.formatScratchpadSpeed(`${current.indicatedAirspeed}`) : data.indicatedAirspeed[0];
        data.groundSpeed[0] = !data.groundSpeed[1] ? Atsu.InputValidation.formatScratchpadSpeed(`${current.groundSpeed}`) : data.groundSpeed[0];
        data.verticalSpeed[0] = !data.verticalSpeed[1] ? Atsu.InputValidation.formatScratchpadVerticalSpeed(`${current.verticalSpeed}`) : data.verticalSpeed[0];
        // TODO add deviating
        data.heading[0] = !data.heading[1] ? current.heading : data.heading[0];
        data.track[0] = !data.track[1] ? current.track : data.track[0];
        if (target.apActive && current.altitude > target.altitude) {
            data.descending = CDUAtcPositionReport.AltitudeToString(target.altitude);
        } else if (target.apActive && current.altitude < target.altitude) {
            data.climbing = CDUAtcPositionReport.AltitudeToString(target.altitude);
        }
    }

    static CreateDataBlock(mcdu, requestMessage, autoFill) {
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
                    CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, retval);
                } else if (mcdu.page.Current === mcdu.page.ATCPositionReport2) {
                    CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, retval);
                } else if (mcdu.page.Current === mcdu.page.ATCPositionReport3) {
                    CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, retval);
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
        return data.passedWaypoint[0] && data.passedWaypoint[1] && data.passedWaypoint[2] && data.activeWaypoint[0] && data.activeWaypoint[1] && data.nextWaypoint[0] &&
            data.currentPosition[0] && data.currentUtc[0] && data.currentAltitude[0];
    }

    static CreateReport(mcdu, data) {
        const retval = new Atsu.CpdlcMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content.push(Atsu.CpdlcMessagesDownlink['DM48'][1].deepCopy());

        // define the overhead
        let extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
        extension.Content[0].Value = `OVHD: ${data.passedWaypoint[0]}`;
        retval.Content.push(extension);
        extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
        extension.Content[0].Value = `AT ${data.passedWaypoint[1]}Z/${data.passedWaypoint[2]}`;
        retval.Content.push(extension);
        // define the present position
        extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
        extension.Content[0].Value = `PPOS: ${Atsu.coordinateToString({ lat: data.currentPosition[0][0], lon: data.currentPosition[0][1] }, false)}`;
        retval.Content.push(extension);
        extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
        extension.Content[0].Value = `AT ${data.currentUtc[0]}Z/${data.currentAltitude[0]}`;
        retval.Content.push(extension);
        // define the active position
        extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
        extension.Content[0].Value = `TO :${data.activeWaypoint[0]} AT ${data.activeWaypoint[1]}Z`;
        retval.Content.push(extension);
        // define the next position
        extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
        extension.Content[0].Value = `NEXT: ${data.nextWaypoint[0]}`;
        retval.Content.push(extension);

        // create wind and temperature data
        if (data.wind[0] && data.sat[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `WIND: ${data.wind[0]} SAT: ${data.sat[0]}`;
            retval.Content.push(extension);
        } else if (data.wind[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `WIND: ${data.wind[0]}`;
            retval.Content.push(extension);
        } else if (data.sat[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `SAT: ${data.sat[0]}`;
            retval.Content.push(extension);
        }

        // create the initial data
        if (data.eta[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `DEST ETA: ${data.eta[0]}Z`;
            retval.Content.push(extension);
        }
        if (data.descending[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `DESCENDING TO ${data.descending[0]}`;
            retval.Content.push(extension);
        } else if (data.climbing[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `CLIMBING TO ${data.climbing[0]}`;
            retval.Content.push(extension);
        }
        if (data.endurance[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `ENDURANCE: ${data.endurance[0]}`;
            retval.Content.push(extension);
        }
        if (data.icing[0] && data.turbulence[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `ICING: ${data.icing[0]} TURBULENCE: ${data.turbulence[0]}`;
            retval.Content.push(extension);
        } else if (data.icing[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `ICING: ${data.icing[0]}`;
            retval.Content.push(extension);
        } else if (data.turbulence[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `TURBULENCE: ${data.turbulence[0]}`;
            retval.Content.push(extension);
        }
        if (data.indicatedAirspeed[0] && data.groundSpeed[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `SPD: ${data.indicatedAirspeed[0]} GS: ${data.groundSpeed[0]}`;
            retval.Content.push(extension);
        } else if (data.indicatedAirspeed[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `SPD: ${data.indicatedAirspeed[0]}`;
            retval.Content.push(extension);
        } else if (data.groundSpeed[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `GS: ${data.groundSpeed[0]}`;
            retval.Content.push(extension);
        }
        if (data.verticalSpeed[0] && data.verticalSpeed[0] !== "0FTM") {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `VS: ${data.verticalSpeed[0]}`;
            retval.Content.push(extension);
        }
        if (data.heading[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `HDG: ${data.heading[0]}°TRUE`;
            retval.Content.push(extension);
        }
        if (data.track[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `TRK: ${data.track[0]}°`;
            retval.Content.push(extension);
        }

        if (data.deviating[0]) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = `DEVIATING ${Atsu.InputValidation.expandLateralOffset(data.deviating[0])}`;
            retval.Content.push(extension);
        }

        return retval;
    }

    static ShowPage1(mcdu, requestMessage = null, data = CDUAtcPositionReport.CreateDataBlock(mcdu, requestMessage, true)) {
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
        if (data.passedWaypoint[3] === false) {
            if (data.passedWaypoint[0]) {
                overhead[0] = `{small}${overhead[0]}{end}`;
            }
            if (data.passedWaypoint[1] && data.passedWaypoint[2]) {
                overhead[1] = `{small}${overhead[1]}{end}`;
                overhead[2] = `{small}${overhead[2]}{end}`;
            }
        }

        const ppos = ["_______[color]amber", "____/______[color]amber"];
        if (data.currentPosition[0]) {
            ppos[0] = `{cyan}${Atsu.coordinateToString({ lat: data.currentPosition[0][0], lon: data.currentPosition[0][1] }, true)}{end}`;
            if (data.currentPosition[1] === false) {
                ppos[0] = `{small}${ppos[0]}{end}`;
            }
        }
        if (data.currentUtc[0] && data.currentAltitude[0]) {
            ppos[1] = `{cyan}${data.currentUtc[0]}/${data.currentAltitude[0]}{end}`;
            if (data.currentUtc[1] === false) {
                ppos[1] = `{small}${ppos[1]}{end}`;
            }
        }

        const to = ["[    ]", "[  ]"];
        if (data.activeWaypoint[0]) {
            to[0] = data.activeWaypoint[0];
            if (data.activeWaypoint[2] === false) {
                to[0] = `{small}${to[0]}{end}`;
            }
        }
        if (data.activeWaypoint[1]) {
            to[1] = data.activeWaypoint[1];
            if (data.activeWaypoint[2] === false) {
                to[1] = `{small}${to[1]}{end}`;
            }
        }

        let next = "[    ]";
        if (data.nextWaypoint[0]) {
            next = data.nextWaypoint[0];
            if (data.nextWaypoint[1] === false) {
                next = `{small}${next}{end}`;
            }
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
            [`${requestMessage ? "\xa0ATC MENU" : "\xa0ATC REPORTS"}`, "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.passedWaypoint[0] = null;
                data.passedWaypoint[3] = true;
            } else if (value) {
                if (mcdu.isLatLonFormat(value)) {
                    // format: DDMM.MB/EEEMM.MC
                    try {
                        mcdu.parseLatLon(value);
                        data.passedWaypoint[0] = value;
                        data.passedWaypoint[3] = true;
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
                            data.passedWaypoint[0] = value;
                            data.passedWaypoint[3] = true;
                        }

                        CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
                    });
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
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

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
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

                        CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
                    });
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
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

                        CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
                    });
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, CDUAtcPositionReport.CreateDataBlock(mcdu, requestMessage, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (requestMessage) {
                CDUAtcMenu.ShowPage(mcdu);
            } else {
                CDUAtcReports.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.passedWaypoint[1] = null;
                data.passedWaypoint[2] = null;
                data.passedWaypoint[3] = true;
            } else {
                const elements = value.split("/");
                if (elements.length === 2) {
                    const timeError = Atsu.InputValidation.validateScratchpadTime(elements[0], false);
                    const altError = Atsu.InputValidation.validateScratchpadAltitude(elements[1]);

                    if (timeError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(timeError);
                    } else if (altError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(altError);
                    } else {
                        data.passedWaypoint[1] = elements[0].length === 5 ? elements[0].substring(0, 4) : elements[0];
                        data.passedWaypoint[2] = Atsu.InputValidation.formatScratchpadAltitude(elements[1]);
                        data.passedWaypoint[3] = true;
                    }
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
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
                    const timeError = Atsu.InputValidation.validateScratchpadTime(elements[0], false);
                    const altError = Atsu.InputValidation.validateScratchpadAltitude(elements[1]);

                    if (timeError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(timeError);
                    } else if (altError !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(altError);
                    } else {
                        data.currentUtc = [elements[0].length === 5 ? elements[0].substring(0, 4) : elements[0], true];
                        data.currentAltitude = [elements[1], true];
                    }
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.activeWaypoint[1] = null;
                data.activeWaypoint[2] = true;
            } else {
                const error = Atsu.InputValidation.validateScratchpadTime(value, false);

                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.activeWaypoint[1] = value.length === 5 ? value.substring(0, 4) : value;
                    data.activeWaypoint[2] = true;
                }
            }

            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                if (requestMessage) {
                    requestMessage.Response = report;
                    CDUAtcTextFansA.ShowPage1(mcdu, [requestMessage]);
                } else {
                    CDUAtcTextFansA.ShowPage1(mcdu, [report]);
                }
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
                    if (requestMessage) {
                        requestMessage.Response = report;
                        mcdu.atsu.atc.updateMessage(requestMessage);
                    } else {
                        mcdu.atsu.registerMessages([report]);
                    }
                    CDUAtcPositionReport.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };
    }

    static ShowPage2(mcdu, requestMessage = null, data = CDUAtcPositionReport.CreateDataBlock(mcdu, requestMessage, true)) {
        mcdu.page.Current = mcdu.page.ATCPositionReport2;

        const wind = data.wind[0] ? data.wind[0].split("/") : ["[  ]", "[  ]"];
        const sat = data.sat[0] ? data.sat[0] : "[  ]";
        const turbulence = data.turbulence[0] ? data.turbulence[0] : "[  ]";
        const icing = data.icing[0] ? data.icing[0] : "[  ]";
        let eta = data.eta[0] ? data.eta[0] : "[   ]";
        if (data.eta[1] === false && data.eta[0]) {
            eta = `{small}${eta}{end}`;
        }
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
            [`{cyan}${data.wind[1] === false && data.wind[0] ? '{small}' : ''}${wind[0]}/${wind[1]}${data.wind[1] === false && data.wind[0] ? '{end}' : ''}{end}`, `{cyan}${data.sat[1] === false && data.sat[0] ? '{small}' : ''}${sat}${data.sat[1] === false && data.sat[0] ? '{end}' : ''}{end}`],
            ["\xa0ICING(TLMS)", "TURB(LMS)\xa0"],
            [`{cyan}${icing}{end}`, `{cyan}${turbulence}{end}`],
            ["\xa0ETA", "ENDURANCE\xa0"],
            [`{cyan}${eta}{end}`, `{cyan}${endurance}{end}`],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            [`${requestMessage ? "\xa0ATC MENU" : "\xa0ATC REPORTS"}`, "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.wind = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadWind(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.wind = [Atsu.InputValidation.formatScratchpadWind(value), true];
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            }
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.icing = [null, true];
            } else if (value === "T" || value === "L" || value === "M" || value === "S") {
                data.icing = [value, true];
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.eta = [null, true];
            } else if (Atsu.InputValidation.validateScratchpadTime(value)) {
                data.eta = [value, true];
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, CDUAtcPositionReport.CreateDataBlock(mcdu, requestMessage, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (requestMessage) {
                CDUAtcMenu.ShowPage(mcdu);
            } else {
                CDUAtcReports.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.sat = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadTemperature(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.sat = [Atsu.InputValidation.formatScratchpadTemperature(value), true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.turbulence = [null, true];
            } else if (value === "L" || value === "M" || value === "S") {
                data.turbulence = [value, true];
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.endurance = [null, true];
            } else if (Atsu.InputValidation.validateScratchpadEndurance(value)) {
                data.endurance = [Atsu.InputValidation.formatScratchpadEndurance(value), true];
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            }
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                if (requestMessage) {
                    requestMessage.Response = report;
                    CDUAtcTextFansA.ShowPage1(mcdu, [requestMessage]);
                } else {
                    CDUAtcTextFansA.ShowPage1(mcdu, [report]);
                }
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
                    if (requestMessage) {
                        requestMessage.Response = report;
                        mcdu.atsu.atc.updateMessage(requestMessage);
                    } else {
                        mcdu.atsu.registerMessages([report]);
                    }
                    CDUAtcPositionReport.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };
    }

    static ShowPage3(mcdu, requestMessage = null, data = CDUAtcPositionReport.CreateDataBlock(mcdu, requestMessage, true)) {
        mcdu.page.Current = mcdu.page.ATCPositionReport3;

        let indicatedAirspeed = data.indicatedAirspeed[0] ? data.indicatedAirspeed[0] : "[  ]";
        if (data.indicatedAirspeed[0] && data.indicatedAirspeed[1] === false) {
            indicatedAirspeed = `{small}${indicatedAirspeed}{end}`;
        }
        let groundSpeed = data.groundSpeed[0] ? data.groundSpeed[0] : "[  ]";
        if (data.groundSpeed[0] && data.groundSpeed[1] === false) {
            groundSpeed = `{small}${groundSpeed}{end}`;
        }
        let verticalSpeed = data.verticalSpeed[0] ? data.verticalSpeed[0] : "[  ]";
        if (data.verticalSpeed[0] && data.verticalSpeed[1] === false) {
            verticalSpeed = `{small}${verticalSpeed}{end}`;
        }
        const deviating = data.deviating[0] ? data.deviating[0] : "[  ]";
        let heading = data.heading[0] ? `${data.heading[0]}°TRUE` : "[  ]";
        if (data.heading[0] && data.heading[1] === false) {
            heading = `{small}${heading}{end}`;
        }
        let track = data.track[0] ? `${data.track[0]}{white}°{end}` : "[  ]";
        if (data.track[0] && data.track[1] === false) {
            track = `{small}${track}{end}`;
        }
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
            [`{cyan}${heading}{end}`, `{cyan}${track}{end}`],
            [descending[0], climbing[0]],
            [`{cyan}${descending[1]}{end}`, `{cyan}${climbing[1]}{end}`],
            ["\xa0ALL FIELDS"],
            [erase, text],
            [`${requestMessage ? "\xa0ATC MENU" : "\xa0ATC REPORTS"}`, "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.indicatedAirspeed = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.indicatedAirspeed = [Atsu.InputValidation.formatScratchpadSpeed(value), true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.verticalSpeed = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadVerticalSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.verticalSpeed = [Atsu.InputValidation.formatScratchpadVerticalSpeed(value), true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.heading = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadDegree(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.heading = [value, true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            const current = mcdu.atsu.currentFlightState();
            const target = mcdu.atsu.targetFlightState();

            if (!target.apActive || (target.apActive && target.altitude !== current.altitude)) {
                if (value === FMCMainDisplay.clrValue) {
                    data.descending = [null, true];
                } else {
                    const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        data.descending = [Atsu.InputValidation.formatScratchpadAltitude(value), true];
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, CDUAtcPositionReport.CreateDataBlock(mcdu, requestMessage, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (requestMessage) {
                CDUAtcMenu.ShowPage(mcdu);
            } else {
                CDUAtcReports.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.groundSpeed = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.groundSpeed = [Atsu.InputValidation.formatScratchpadSpeed(value), true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.deviating = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.deviating = [Atsu.InputValidation.formatScratchpadOffset(value), true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.track = [null, true];
            } else {
                const error = Atsu.InputValidation.validateScratchpadDegree(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.track = [value, true];
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            const current = mcdu.atsu.currentFlightState();
            const target = mcdu.atsu.targetFlightState();

            if (!target.apActive || (target.apActive && target.altitude !== current.altitude)) {
                if (value === FMCMainDisplay.clrValue) {
                    data.climbing = [null, true];
                } else {
                    const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        data.climbing = [Atsu.InputValidation.formatScratchpadAltitude(value), true];
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                }
            }

            CDUAtcPositionReport.ShowPage3(mcdu, requestMessage, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                if (requestMessage) {
                    requestMessage.Response = report;
                    CDUAtcTextFansA.ShowPage1(mcdu, [requestMessage]);
                } else {
                    CDUAtcTextFansA.ShowPage1(mcdu, [report]);
                }
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
                    if (requestMessage) {
                        requestMessage.Response = report;
                        mcdu.atsu.atc.updateMessage(requestMessage);
                    } else {
                        mcdu.atsu.registerMessages([report]);
                    }
                    CDUAtcPositionReport.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, requestMessage, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, requestMessage, data);
        };
    }
}
