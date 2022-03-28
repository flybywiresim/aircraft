class CDUAtcRequest {
    static CreateDataBlock(store = null) {
        return {
            directTo: null,
            altitude: null,
            speed: null,
            dueToWeather: store ? store.dueToWeather : false,
            dueToPerformance: store ? store.dueToPerformance : false
        };
    }

    static CanBeSent(data) {
        return data.directTo || data.altitude || data.speed;
    }

    static AddExtension(data, request) {
        if (data.dueToWeather) {
            request.Extensions.push(Atsu.CpdlcMessagesDownlink["DM65"][1]);
        } else if (data.dueToPerformance) {
            request.Extensions.push(Atsu.CpdlcMessagesDownlink["DM66"][1]);
        }
    }

    static CreateRequest(mcdu, type, value) {
        const retval = new Atsu.RequestMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content = Atsu.CpdlcMessagesDownlink[type][1].deepCopy();
        retval.Content.Content[0].Value = value;
        return retval;
    }

    static CreateDirectToRequest(mcdu, data) {
        const retval = CDUAtcRequest.CreateRequest(mcdu, "DM22", data.directTo);
        CDUAtcRequest.AddExtension(data, retval);
        return retval;
    }

    static CreateAltitudeRequest(mcdu, data) {
        const retval = CDUAtcRequest.CreateRequest(mcdu, "DM6", data.altitude);
        retval.Content.Content[0].Value = data.altitude;
        CDUAtcRequest.AddExtension(data, retval);
        return retval;
    }

    static CreateSpeedRequest(mcdu, data) {
        const retval = CDUAtcRequest.CreateRequest(mcdu, "DM18", data.speed);
        CDUAtcRequest.AddExtension(data, retval);
        return retval;
    }

    static CreateRequests(mcdu, data) {
        const requests = [];

        if (data.directTo) {
            requests.push(CDUAtcRequest.CreateDirectToRequest(mcdu, data));
        }
        if (data.altitude) {
            requests.push(CDUAtcRequest.CreateAltitudeRequest(mcdu, data));
        }
        if (data.speed) {
            requests.push(CDUAtcRequest.CreateSpeedRequest(mcdu, data));
        }

        return requests;
    }

    static ShowPage(mcdu, store = CDUAtcRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let directTo = "[\xa0\xa0\xa0\xa0][color]cyan";
        if (store.directTo) {
            directTo = `${store.directTo}[color]cyan`;
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
            [directTo, altitude],
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
                store.directTo = null;
                CDUAtcRequest.ShowPage(mcdu, store);
            } else if (value) {
                Atsu.InputValidation.classifyScratchpadWaypointType(mcdu, value, false).then((retval) => {
                    if (retval[1] !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(retval[1]);
                    } else {
                        store.directTo = value;
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
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const requests = CDUAtcRequest.CreateRequests(mcdu, store);
                    if (requests) {
                        mcdu.atsu.registerMessages(requests);
                    }
                    CDUAtcRequest.ShowPage(mcdu);
                }
            }
        };
    }
}
