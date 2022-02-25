class CDUAtcRequest {
    static CreateDataBlock(store = null) {
        return {
            dirTo: null,
            altitude: null,
            speed: null,
            dueToWeather: store ? store.dueToWeather : false,
            dueToPerformance: store ? store.dueToPerformance : false
        };
    }

    static CanBeSent(data) {
        return data.dirTo || data.altitude || data.speed;
    }

    static CreateMessage(data) {
        const retval = new Atsu.RequestMessage();

        if (data.dirTo) {
            retval.Request = `REQUEST DIRECT TO ${data.dirTo}`;
        } else if (data.altitude) {
            if (data.altitude.startsWith("FL")) {
                retval.Request = `REQUEST ${data.altitude}`;
            } else {
                retval.Request = `REQUEST ALTITUDE ${data.altitude}`;
            }
        } else if (data.speed) {
            retval.Request = `REQUEST SPEED ${data.speed}`;
        } else {
            return null;
        }

        if (data.dueToWeather) {
            retval.Reason = "DUE TO WEATHER";
        } else if (data.dueToPerformance) {
            retval.Reason = "DUE TO A/C PERFORMANCE";
        }

        return retval;
    }

    static ShowPage(mcdu, store = CDUAtcRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let dirTo = "[\xa0\xa0\xa0\xa0][color]cyan";
        if (store.dirTo) {
            dirTo = `${store.dirTo}[color]cyan`;
        }

        let altitude = "[\xa0\xa0\xa0\xa0][color]cyan";
        if (store.altitude) {
            altitude = `${store.altitude}[color]cyan`;
        }

        let speed = "[\xa0\xa0][color]cyan";
        if (store.speed) {
            speed = `${store.speed}[color]cyan`;
        }

        const weather = [ "\xa0DUE TO", "{cyan}{{end}WEATHER" ];
        if (store.dueToWeather) {
            weather[0] += "[color]cyan";
            weather[1] = "\xa0WEATHER[color]cyan";
        }

        const performance = [ "DUE TO\xa0", "A/C PERF{cyan}}{end}" ];
        if (store.dueToPerformance) {
            performance[0] += "[color]cyan";
            performance[1] = "A/C PERF\xa0[color]cyan";
        }

        let sendDcdu = "DCDU\xa0[color]cyan";
        if (CDUAtcRequest.CanBeSent(store)) {
            sendDcdu = "DCDU*[color]cyan";
        }

        mcdu.setTemplate([
            ["REQUEST"],
            ["\xa0DIR TO", "FL/ALT\xa0"],
            [dirTo, altitude],
            ["", "SPD/MACH\xa0"],
            ["", speed],
            [""],
            [""],
            [weather[0], performance[0]],
            [weather[1], performance[1]],
            [""],
            [""],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", sendDcdu]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store.dirTo = null;
                CDUAtcRequest.ShowPage(mcdu, store);
            } else if (value) {
                Atsu.InputValidation.classifyScratchpadWaypointType(mcdu, value, false).then((retval) => {
                    if (retval[1] !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(retval[1]);
                    } else {
                        store = CDUAtcRequest.CreateDataBlock(store);
                        store.dirTo = value;
                        CDUAtcRequest.ShowPage(mcdu, store);
                    }
                });
            }
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store.altitude = null;
                CDUAtcRequest.ShowPage(mcdu, store);
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    store = CDUAtcRequest.CreateDataBlock(store);
                    store.altitude = Atsu.InputValidation.formatScratchpadAltitude(value);
                    CDUAtcRequest.ShowPage(mcdu, store);
                }
            }
        };

        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store.speed = null;
                CDUAtcRequest.ShowPage(mcdu, store);
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    store = CDUAtcRequest.CreateDataBlock(store);
                    store.speed = Atsu.InputValidation.formatScratchpadSpeed(value);
                    CDUAtcRequest.ShowPage(mcdu, store);
                }
            }
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            store.dueToWeather = !store.dueToWeather;
            if (store.dueToWeather) {
                store.dueToPerformance = false;
            }
            CDUAtcRequest.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            store.dueToPerformance = !store.dueToPerformance;
            if (store.dueToPerformance) {
                store.dueToWeather = false;
            }
            CDUAtcRequest.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcRequest.CanBeSent(store)) {
                if (mcdu.atsuManager.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXFictionalMessages.noAtc);
                } else {
                    const message = CDUAtcRequest.CreateMessage(store);
                    if (message) {
                        mcdu.atsuManager.registerMessage(message);
                    }
                    CDUAtcRequest.ShowPage(mcdu);
                }
            }
        };
    }
}
