class CDUWindPage {

    static Return() {}

    static ShowPage(mcdu) {
        CDUWindPage.ShowCLBPage(mcdu);
    }

    static ShowCLBPage(mcdu, offset = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ClimbWind;

        let requestButton = "REQUEST*[color]amber";
        let requestEnable = true;
        if (mcdu.simbrief.sendStatus === "REQUESTING") {
            requestEnable = false;
            requestButton = "REQUEST [color]amber";
        }

        const template = ([
            ["CLIMB WIND"],
            ["TRU WIND/ALT", "HISTORY[color]inop"],
            ["", "WIND>[color]inop"],
            ["", ""],
            ["", ""],
            ["", "WIND{sp}[color]amber"],
            ["", requestButton],
            ["", ""],
            ["", ""],
            ["", "NEXT{sp}"],
            ["", "PHASE>"],
            ["", ""],
            ["<RETURN", ""],
        ]);

        mcdu.setTemplate(CDUWindPage.ShowWinds(template, mcdu, CDUWindPage.ShowCLBPage, mcdu.winds.climb, offset, 5));

        mcdu.onRightInput[4] = () => {
            CDUWindPage.ShowCRZPage(mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            CDUWindPage.Return();
        };

        mcdu.onRightInput[2] = () => {
            if (requestEnable) {
                CDUWindPage.WindRequest(mcdu, "CLB", CDUWindPage.ShowCLBPage);
            }
        };
    }

    static ShowCRZPage(mcdu, offset = 0) {

        //TODO: allow wind to be set for each waypoint

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.CruiseWind;

        let requestButton = "REQUEST*[color]amber";
        let requestEnable = true;
        if (mcdu.simbrief.sendStatus === "REQUESTING") {
            requestEnable = false;
            requestButton = "REQUEST [color]amber";
        }

        const template = ([
            //["CRZ WIND {small}AT{end} {green}WAYPOINT{end}"],
            ["CRZ WIND"],
            ["TRU WIND/ALT", ""],
            ["", ""],
            ["", ""],
            ["", ""],
            ["", "WIND{sp}[color]amber"],
            ["", requestButton],
            ["", "PREV{sp}"],
            ["", "PHASE>"],
            ["{small}SAT / ALT{end}[color]inop", "NEXT{sp}"],
            ["[ ]°/[{sp}{sp}{sp}][color]inop", "PHASE>"],
            ["", ""],
            ["<RETURN", ""],
        ]);

        mcdu.setTemplate(CDUWindPage.ShowWinds(template, mcdu, CDUWindPage.ShowCRZPage, mcdu.winds.cruise, offset, 4));

        mcdu.onRightInput[3] = () => {
            CDUWindPage.ShowCLBPage(mcdu);
        };
        mcdu.onRightInput[4] = () => {
            CDUWindPage.ShowDESPage(mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            CDUWindPage.Return();
        };

        mcdu.onRightInput[2] = () => {
            if (requestEnable) {
                CDUWindPage.WindRequest(mcdu, "CRZ", CDUWindPage.ShowCRZPage);
            }
        };
    }

    static ShowDESPage(mcdu, offset = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DescentWind;

        let requestButton = "REQUEST*[color]amber";
        let requestEnable = true;
        if (mcdu.simbrief.sendStatus === "REQUESTING") {
            requestEnable = false;
            requestButton = "REQUEST [color]amber";
        }

        let alternateCell = "[ ]°/[ ][color]cyan";

        if (mcdu.winds.alternate != null) {
            alternateCell = `${CDUWindPage.FormatNumber(mcdu.winds.alternate.direction)}°/${CDUWindPage.FormatNumber(mcdu.winds.alternate.speed)}[color]cyan`;
        }

        const template = [
            ["DESCENT WIND"],
            ["TRU WIND/ALT", "ALTN WIND"],
            ["", alternateCell],
            ["", "{green}{small}FL100{end}{end}"],
            ["", ""],
            ["", "WIND{sp}[color]amber"],
            ["", requestButton],
            ["", "PREV{sp}"],
            ["", "PHASE>"],
            ["", ""],
            ["", ""],
            ["", ""],
            ["<RETURN", ""],
        ];

        mcdu.setTemplate(CDUWindPage.ShowWinds(template, mcdu, CDUWindPage.ShowDESPage, mcdu.winds.des, offset, 5));

        mcdu.onRightInput[0] = (value, scratchpadCallback) => {
            if (value == FMCMainDisplay.clrValue) {
                mcdu.winds.alternate = null;
                CDUWindPage.ShowDESPage(mcdu, offset);
                return;
            }
            const wind = CDUWindPage.ParseWind(value);
            if (wind == null) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
            } else {
                mcdu.winds.alternate = wind;
                CDUWindPage.ShowDESPage(mcdu, offset);
            }
        };

        mcdu.onRightInput[3] = () => {
            CDUWindPage.ShowCRZPage(mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            CDUWindPage.Return();
        };

        mcdu.onRightInput[2] = () => {
            if (requestEnable) {
                CDUWindPage.WindRequest(mcdu, "DSC", CDUWindPage.ShowDESPage);
            }
        };
    }

    static FormatNumber(n, leadingZeroes) {
        let output = `${n.toFixed(0)}`;
        for (let i = 0; i < leadingZeroes; i++) {
            if (n < (10 ** (leadingZeroes - i))) {
                output = `0${output}`;
            }
        }
        return output;
    }

    static ShowWinds(rows, mcdu, _showPage, _winds, _offset, _max = 3) {
        let entries = 0;
        for (let i = 0; i < (_winds.length - _offset); i++) {
            if (i < _max) {
                const wind = _winds[i + _offset];
                rows[(i * 2) + 2][0] = `${CDUWindPage.FormatNumber(wind.direction, 2)}°/${CDUWindPage.FormatNumber(wind.speed, 2)}/FL${CDUWindPage.FormatNumber(wind.altitude, 2)}[color]cyan`;
                entries = i + 1;
                mcdu.onLeftInput[i] = (value) => {
                    if (value == FMCMainDisplay.clrValue) {
                        _winds.splice(i + _offset, 1);
                        _showPage(mcdu, _offset);
                    }
                };
            }
        }
        if (entries < _max) {
            rows[(entries * 2) + 2][0] = "{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}";
            mcdu.onLeftInput[entries] = (value, scratchpadCallback) => {
                CDUWindPage.TryAddWind(mcdu, _winds, value, () => _showPage(mcdu, _offset), scratchpadCallback);
            };
        }

        let up = false;
        let down = false;

        if (_winds.length > (_max - 1) && _offset > 0) {
            mcdu.onDown = () => {
                _showPage(mcdu, _offset - 1);
            };
            down = true;
        }

        if (_offset < (_winds.length - (_max - 1))) {
            mcdu.onUp = () => {
                _showPage(mcdu, _offset + 1);
            };
            up = true;
        }

        mcdu.setArrows(up, down, false, false);

        return rows;
    }

    static ParseTrueWindAlt(_input) {
        const elements = _input.split('/');
        if (elements.length != 3) {
            return null;
        }

        let direction = parseInt(elements[0]);
        if (direction == 360) {
            direction = 0;
        }
        if (!isFinite(direction) || direction < 0 || direction > 359) {
            return null;
        }

        const speed = parseInt(elements[1]);
        if (!isFinite(speed) || speed < 0 || speed > 999) {
            return null;
        }

        const altitude = parseInt(elements[2]);
        if (!isFinite(altitude) || altitude < 0 || altitude > 450) {
            return null;
        }

        return {
            direction: direction,
            speed: speed,
            altitude: altitude
        };
    }

    static TryAddWind(mcdu, _windArray, _input, _showPage, scratchpadCallback) {
        const data = CDUWindPage.ParseTrueWindAlt(_input);
        if (data == null) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback(_input);
        } else {
            _windArray.push(data);
            _showPage();
        }
    }

    static ParseWind(_input) {
        const elements = _input.split('/');
        if (elements.length != 2) {
            return null;
        }

        let direction = parseInt(elements[0]);
        if (direction == 360) {
            direction = 0;
        }
        if (!isFinite(direction) || direction < 0 || direction > 359) {
            return null;
        }

        const speed = parseInt(elements[1]);
        if (!isFinite(speed) || speed < 0 || speed > 999) {
            return null;
        }

        return {
            direction: direction,
            speed: speed
        };
    }

    static WindRequest(mcdu, stage, _showPage) {
        getSimBriefOfp(mcdu, () => {}, () => {
            let windData = [];
            let lastAltitude = 0;
            switch (stage) {
                case "CLB":
                    const clbWpts = mcdu.simbrief.navlog.filter((val) => val.stage === stage);

                    // iterate through each clbWpt grabbing the wind data
                    clbWpts.forEach((clbWpt, wptIdx) => {
                        if (wptIdx == 0) {
                            let altIdx = 0;
                            // we need to backfill from altitude 0 to below clbWpt.altitude_feet in windData
                            while (lastAltitude < clbWpt.altitude_feet) {
                                const altitude = parseInt(clbWpt.wind_data.level[altIdx].altitude);
                                const speed = parseInt(clbWpt.wind_data.level[altIdx].wind_spd);
                                const direction = parseInt(clbWpt.wind_data.level[altIdx].wind_dir);

                                windData.push({
                                    direction,
                                    speed,
                                    altitude: altitude / 100,
                                });
                                lastAltitude = altitude;
                                altIdx++;
                            }
                        }
                        // Now we add the closest wind data to the altitude of the clbWpt
                        clbWpt.wind_data.level.forEach((wind, levelIdx) => {
                            const altitude = parseInt(wind.altitude);

                            let deltaPrevLevel = 0;
                            let deltaThisLevel = 0;
                            // Look backwards for the closest level
                            if (levelIdx > 0 && levelIdx < clbWpt.wind_data.level.length - 1) {
                                deltaPrevLevel = Math.abs(clbWpt.altitude_feet - parseInt(clbWpt.wind_data.level[levelIdx - 1].altitude));
                                deltaThisLevel = Math.abs(clbWpt.altitude_feet - altitude);
                            }

                            // Check that altitude isn't backtracking
                            if (altitude > lastAltitude && lastAltitude <= clbWpt.altitude_feet) {
                                const idx = (deltaPrevLevel > deltaThisLevel) ? levelIdx : levelIdx - 1;

                                const idxAltitude = parseInt(clbWpt.wind_data.level[idx].altitude);
                                const direction = parseInt(clbWpt.wind_data.level[idx].wind_dir);
                                const speed = parseInt(clbWpt.wind_data.level[idx].wind_spd);

                                // Check again that we didn't backtrack
                                if (idxAltitude > lastAltitude) {
                                    windData.push({
                                        direction,
                                        speed,
                                        altitude: idxAltitude / 100,
                                    });
                                    lastAltitude = idxAltitude;
                                }
                            }
                        });
                    });
                    mcdu.winds.climb = windData;
                    break;
                case "CRZ":
                    const toc = mcdu.simbrief.navlog.find((val) => val.ident === "TOC");
                    mcdu.winds.cruise = [];
                    toc.wind_data.level.forEach((val) => {
                        const direction = parseInt(val.wind_dir);
                        const speed = parseInt(val.wind_spd);
                        const altitude = parseInt(val.altitude / 100);
                        mcdu.winds.cruise.push({
                            direction,
                            speed,
                            altitude,
                        });
                        lastAltitude = altitude;
                    });
                    break;
                case "DSC":
                    // TOD is marked as cruise stage, but we want it's topmost wind data
                    const tod = mcdu.simbrief.navlog.find((val) => val.ident === "TOD");
                    const desWpts = [tod, ...mcdu.simbrief.navlog.filter((val) => val.stage === stage)];

                    mcdu.winds.alternate = {
                        direction: mcdu.simbrief.alternateAvgWindDir,
                        speed: mcdu.simbrief.alternateAvgWindSpd,
                    };

                    // iterate through each clbWpt grabbing the wind data
                    windData = [];
                    lastAltitude = 45000;
                    desWpts.forEach((desWpt, wptIdx) => {
                        if (wptIdx == 0) {
                            let altIdx = desWpt.wind_data.level.length - 1;
                            // we need to backfill from crz altitude to above next clbWpt.altitude_feet in windData
                            while (lastAltitude > desWpt.altitude_feet) {
                                const altitude = parseInt(desWpt.wind_data.level[altIdx].altitude);
                                const speed = parseInt(desWpt.wind_data.level[altIdx].wind_spd);
                                const direction = parseInt(desWpt.wind_data.level[altIdx].wind_dir);

                                windData.push({
                                    direction,
                                    speed,
                                    altitude: altitude / 100,
                                });
                                lastAltitude = altitude;
                                altIdx--;
                            }
                        }
                        // Now we add the closest wind data to the altitude of the desWpt
                        desWpt.wind_data.level.reverse().forEach((wind, levelIdx) => {
                            const altitude = parseInt(wind.altitude);

                            let deltaNextLevel = 0;
                            let deltaThisLevel = 0;
                            // Look forwards for the closest level
                            if (levelIdx < desWpt.wind_data.level.length - 2) {
                                deltaNextLevel = Math.abs(desWpt.altitude_feet - parseInt(desWpt.wind_data.level[levelIdx + 1].altitude));
                                deltaThisLevel = Math.abs(desWpt.altitude_feet - altitude);
                            }

                            // Check that altitude isn't backtracking
                            if (altitude >= lastAltitude && lastAltitude > desWpt.altitude_feet) {
                                const idx = (deltaNextLevel > deltaThisLevel) ? levelIdx : levelIdx + 1;

                                const idxAltitude = parseInt(desWpt.wind_data.level[idx].altitude);
                                const direction = parseInt(desWpt.wind_data.level[idx].wind_dir);
                                const speed = parseInt(desWpt.wind_data.level[idx].wind_spd);

                                // Check again that we didn't backtrack
                                if (idxAltitude < lastAltitude) {
                                    windData.push({
                                        direction,
                                        speed,
                                        altitude: idxAltitude / 100,
                                    });
                                    lastAltitude = idxAltitude;
                                }
                            }
                        });
                    });
                    mcdu.winds.des = windData;
                    break;
            }
            _showPage(mcdu);
        });
    }
}
