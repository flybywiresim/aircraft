class CDUWindPage {
    static ShowPage(fmc, mcdu) {
        CDUWindPage.ShowCLBPage(fmc, mcdu);
    }

    static ShowCLBPage(fmc, mcdu, offset = 0) {
        mcdu.setCurrentPage(() => {
            CDUWindPage.ShowCLBPage(fmc, mcdu, offset);
        });

        const template = ([
            ["CLIMB WIND"],
            ["TRU WIND/ALT", "HISTORY[color]inop"],
            ["", "WIND>[color]inop"],
            ["", ""],
            ["", ""],
            ["", "WIND{sp}[color]inop"],
            ["", "REQUEST*[color]inop"],
            ["", ""],
            ["", ""],
            ["", "NEXT{sp}"],
            ["", "PHASE>"],
            ["", ""],
            ["<RETURN", ""],
        ]);

        mcdu.setTemplate(CDUWindPage.ShowWinds(template, fmc, mcdu, CDUWindPage.ShowCLBPage, fmc.winds.climb, offset, 5));

        mcdu.onRightInput[4] = () => {
            CDUWindPage.ShowCRZPage(fmc, mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            mcdu.returnPageCallback();
        };
    }

    static ShowCRZPage(fmc, mcdu, offset = 0) {
        //TODO: allow wind to be set for each waypoint

        mcdu.setCurrentPage(() => {
            CDUWindPage.ShowCRZPage(fmc, mcdu, offset);
        });

        const template = ([
            //["CRZ WIND {small}AT{end} {green}WAYPOINT{end}"],
            ["CRZ WIND"],
            ["TRU WIND/ALT", ""],
            ["", ""],
            ["", ""],
            ["", ""],
            ["", "WIND{sp}[color]inop"],
            ["", "REQUEST*[color]inop"],
            ["", "PREV{sp}"],
            ["", "PHASE>"],
            ["{small}SAT / ALT{end}[color]inop", "NEXT{sp}"],
            ["[ ]°/[{sp}{sp}{sp}][color]inop", "PHASE>"],
            ["", ""],
            ["<RETURN", ""],
        ]);

        mcdu.setTemplate(CDUWindPage.ShowWinds(template, fmc, mcdu, CDUWindPage.ShowCRZPage, fmc.winds.cruise, offset, 4));

        mcdu.onRightInput[3] = () => {
            CDUWindPage.ShowCLBPage(fmc, mcdu);
        };
        mcdu.onRightInput[4] = () => {
            CDUWindPage.ShowDESPage(fmc, mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            mcdu.returnPageCallback();
        };
    }

    static ShowDESPage(fmc, mcdu, offset = 0) {
        mcdu.setCurrentPage(() => {
            CDUWindPage.ShowDESPage(fmc, mcdu, offset);
        });

        let alternateCell = "[ ]°/[ ][color]cyan";

        if (fmc.winds.alternate != null) {
            alternateCell = `${CDUWindPage.FormatNumber(fmc.winds.alternate.direction)}°/${CDUWindPage.FormatNumber(fmc.winds.alternate.speed)}[color]cyan`;
        }

        const template = [
            ["DESCENT WIND"],
            ["TRU WIND/ALT", "ALTN WIND"],
            ["", alternateCell],
            ["", "{green}{small}FL100{end}{end}"],
            ["", ""],
            ["", "WIND{sp}[color]inop"],
            ["", "REQUEST*[color]inop"],
            ["", "PREV{sp}"],
            ["", "PHASE>"],
            ["", ""],
            ["", ""],
            ["", ""],
            ["<RETURN", ""],
        ];

        mcdu.setTemplate(CDUWindPage.ShowWinds(template, fmc, mcdu, CDUWindPage.ShowDESPage, fmc.winds.des, offset, 5));

        mcdu.onRightInput[0] = (value) => {
            if (value == FMCMainDisplay.clrValue) {
                fmc.winds.alternate = null;
                mcdu.requestUpdate();
                return;
            }
            const wind = CDUWindPage.ParseWind(value);
            if (wind == null) {
                mcdu.addNewMessage(NXSystemMessages.formatError);
            } else {
                fmc.winds.alternate = wind;
                mcdu.requestUpdate();
            }
        };

        mcdu.onRightInput[3] = () => {
            CDUWindPage.ShowCRZPage(fmc, mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            mcdu.returnPageCallback();
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

    static ShowWinds(rows, fmc, mcdu, _showPage, _winds, _offset, _max = 3) {
        let entries = 0;
        for (let i = 0; i < (_winds.length - _offset); i++) {
            if (i < _max) {
                const wind = _winds[i + _offset];
                rows[(i * 2) + 2][0] = `${CDUWindPage.FormatNumber(wind.direction, 2)}°/${CDUWindPage.FormatNumber(wind.speed, 2)}/FL${CDUWindPage.FormatNumber(wind.altitude, 2)}[color]cyan`;
                entries = i + 1;
                mcdu.onLeftInput[i] = (value) => {
                    if (value == FMCMainDisplay.clrValue) {
                        _winds.splice(i + _offset, 1);
                        mcdu.requestUpdate();
                    }
                };
            }
        }
        if (entries < _max) {
            rows[(entries * 2) + 2][0] = "{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}";
            mcdu.onLeftInput[entries] = (value) => {
                CDUWindPage.TryAddWind(mcdu, _winds, value, () => {
                    mcdu.requestUpdate();
                });
            };
        }

        let up = false;
        let down = false;

        if (_winds.length > (_max - 1) && _offset > 0) {
            mcdu.onDown = () => {
                _showPage(fmc, mcdu, _offset - 1);
            };
            down = true;
        }

        if (_offset < (_winds.length - (_max - 1))) {
            mcdu.onUp = () => {
                _showPage(fmc, mcdu, _offset + 1);
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
        if (!isFinite(altitude) || altitude < 0 || altitude > 390) {
            return null;
        }

        return {
            direction: direction,
            speed: speed,
            altitude: altitude
        };
    }

    static TryAddWind(mcdu, _windArray, _input, _showPage) {
        const data = CDUWindPage.ParseTrueWindAlt(_input);
        if (data == null) {
            mcdu.addNewMessage(NXSystemMessages.formatError);
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
}
