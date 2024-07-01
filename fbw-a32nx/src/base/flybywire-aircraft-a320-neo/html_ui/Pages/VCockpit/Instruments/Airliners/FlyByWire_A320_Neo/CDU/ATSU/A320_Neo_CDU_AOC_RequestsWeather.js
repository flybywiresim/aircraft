// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class CDUAocRequestsWeather {
    static CreateDataBlock(mcdu) {
        const retval = {
            airports: ["", "", "", ""],
            managed: [true, true, true, true],
            sendStatus: "",
            requestId: 0
        };

        const activePlan = mcdu.flightPlanService.active;

        if (activePlan.originAirport) {
            retval.airports[0] = activePlan.originAirport.ident;
        }

        if (activePlan.destinationAirport) {
            retval.airports[1] = activePlan.destinationAirport.ident;
        }

        if (activePlan.alternateDestinationAirport) {
            retval.airports[2] = activePlan.alternateDestinationAirport.ident;
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAocRequestsWeather.CreateDataBlock(mcdu)) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCRequestWeather;
        let labelTimeout;
        const reqTypes = [
            'METAR',
            'TAF'
        ];

        // get the airports
        const airports = ["[ ][color]green", "[ ][color]green", "[ ][color]green", "[ ][color]green"];
        for (let i = 0; i < 4; ++i) {
            if (data.airports[i] !== "") {
                airports[i] = data.airports[i];

                if (data.managed[i]) {
                    airports[i] += "[color]cyan";
                } else {
                    airports[i] += "[color]green";
                }
            }
        }

        const updateView = () => {
            if (mcdu.page.Current === mcdu.page.AOCRequestWeather) {
                let sendMessage = "SEND\xa0[color]cyan";
                if (data.airports.filter((n) => n).length !== 0 && data.sendStatus !== "SENDING") {
                    sendMessage = "SEND*[color]cyan";
                }

                mcdu.setTemplate([
                    ["AOC WEATHER REQUEST"],
                    ["\xa0WX TYPE", "AIRPORTS\xa0"],
                    [`↓${reqTypes[data.requestId]}[color]cyan`, airports[0]],
                    [""],
                    ["", airports[1]],
                    [""],
                    ["", airports[2]],
                    [""],
                    ["", airports[3]],
                    [""],
                    [""],
                    ["AOC MENU", `${data.sendStatus}\xa0`],
                    ["<RETURN", sendMessage]
                ]);
            }
        };
        updateView();

        for (let i = 0; i < 4; i++) {
            mcdu.onRightInput[i] = (value) => {
                if (value === FMCMainDisplay.clrValue) {
                    data.airports[i] = "";
                    CDUAocRequestsWeather.ShowPage(mcdu, data);
                } else {
                    if (!/^[A-Z0-9]{4}$/.test(value)) {
                        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    } else {
                        mcdu.navigationDatabaseService.activeDatabase.searchAirport(value).then((airport) => {
                            if (airport) {
                                data.airports[i] = value;
                                data.managed[i] = false;

                                if (mcdu.page.Current === mcdu.page.AOCRequestWeather) {
                                    CDUAocRequestsWeather.ShowPage(mcdu, data);
                                }
                            } else {
                                mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                            }
                        });
                    }
                }
            };
        }

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = async () => {
            const icaos = data.airports.filter((n) => n);
            if (icaos.length === 0) {
                mcdu.setScratchpadMessage(NXFictionalMessages.noAirportSpecified);
                return;
            }
            data.sendStatus = "SENDING";
            updateView();

            const sentRequest = () => {
                data.sendStatus = "SENT";
                if (mcdu.page.Current === mcdu.page.AOCRequestWeather) {
                    updateView();
                }
            };

            mcdu.atsu.receiveWeather(data.requestId === 0, icaos, sentRequest).then((retval) => {
                if (retval[0] === AtsuCommon.AtsuStatusCodes.Ok) {
                    mcdu.atsu.registerMessages([retval[1]]);
                    data.sendStatus = "";

                    if (mcdu.page.Current === mcdu.page.AOCRequestWeather) {
                        updateView();
                    }
                } else {
                    mcdu.addNewAtsuMessage(retval[0]);

                    if (mcdu.page.Current === mcdu.page.AOCRequestWeather) {
                        data.sendStatus = "FAILED";
                        updateView();
                    }
                }
            });
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            data.requestId = (data.requestId + 1) % 2;
            CDUAocRequestsWeather.ShowPage(mcdu, data);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            clearTimeout(labelTimeout);
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}
