class CDUAocRequestsAtis {
    static CreateDataBlock(mcdu) {
        const retval = {
            requestId: mcdu.flightPhaseManager.phase === FmgcFlightPhases.PREFLIGHT ? Atsu.AtisType.Departure : Atsu.AtisType.Arrival,
            departure: "",
            arrival: "",
            selected: "",
            manual: false,
            formatID: 1,
            sendStatus: ""
        };

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            retval.departure = mcdu.flightPlanManager.getOrigin().ident;
            if (mcdu.flightPhaseManager.phase === FmgcFlightPhases.PREFLIGHT) {
                retval.selected = retval.departure;
            }
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            retval.arrival = mcdu.flightPlanManager.getDestination().ident;
            if (mcdu.flightPhaseManager.phase !== FmgcFlightPhases.PREFLIGHT) {
                retval.selected = retval.arrival;
            }
        }

        return retval;
    }

    static ShowPage(mcdu, store = CDUAocRequestsAtis.CreateDataBlock(mcdu)) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCRequestAtis;
        let labelTimeout;
        let formatString;

        if (store.formatID === 0) {
            formatString = "PRINTER*[color]cyan";
        } else {
            formatString = "MCDU*[color]cyan";
        }

        let arrivalText = "{ARRIVAL[color]cyan";
        let departureText = "{DEPARTURE[color]cyan";
        let enrouteText = "ENROUTE}[color]cyan";

        if (store.requestId === Atsu.AtisType.Arrival) {
            arrivalText = "ARRIVAL[color]cyan";
        } else if (store.requestId === Atsu.AtisType.Departure) {
            departureText = "DEPARTURE[color]cyan";
        } else {
            enrouteText = "ENROUTE[color]cyan";
        }

        let arrText = "[ ]";
        if (store.selected !== "") {
            arrText = store.selected;
            if (!store.manual) {
                arrText += "[s-text]";
            }
        }

        const updateView = () => {
            if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
                let sendMessage = "SEND*[color]cyan";
                if (store.selected === "" || store.sendStatus === "SENDING") {
                    sendMessage = "SEND\xa0[color]cyan";
                }

                mcdu.setTemplate([
                    ["AOC ATIS REQUEST"],
                    ["\xa0AIRPORT", "↓FORMAT FOR\xa0"],
                    [`${arrText}[color]cyan`, formatString],
                    ["", "", "-------SELECT ONE-------"],
                    [arrivalText, enrouteText],
                    [""],
                    [departureText],
                    [""],
                    [""],
                    [""],
                    [""],
                    ["\xa0RETURN TO", `${store.sendStatus}\xa0`],
                    ["<AOC MENU", sendMessage]
                ]);
            }
        };
        updateView();

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store.selected = "";
                CDUAocRequestsAtis.ShowPage(mcdu, store);
            } else if (value) {
                mcdu.dataManager.GetAirportByIdent(value).then((airport) => {
                    if (airport) {
                        store.selected = value;
                        store.manual = true;

                        if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
                            CDUAocRequestsAtis.ShowPage(mcdu, store);
                        }
                    } else {
                        mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                    }
                });
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (store.reqID !== Atsu.AtisType.Arrival) {
                if (!store.manual) {
                    store.selected = store.arrival;
                }
                store.requestId = Atsu.AtisType.Arrival;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (store.reqID !== Atsu.AtisType.Departure) {
                if (!store.manual) {
                    store.selected = store.departure;
                }
                store.requestId = Atsu.AtisType.Departure;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            clearTimeout(labelTimeout);
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            store.formatID = (store.formatID + 1) % 2;
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (store.reqID !== Atsu.AtisType.Enroute) {
                store.requestId = Atsu.AtisType.Enroute;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = async () => {
            store.sendStatus = "SENDING";
            updateView();

            const onRequestSent = () => {
                store.sendStatus = "SENT";
                if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
                    updateView();
                }
            };

            mcdu.atsu.aoc.receiveAtis(store.selected, store.requestId, onRequestSent).then((retval) => {
                if (retval[0] === Atsu.AtsuStatusCodes.Ok) {
                    mcdu.atsu.registerMessages([retval[1]]);
                    store.sendStatus = "";
                    if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
                        CDUAocRequestsAtis.ShowPage(mcdu, store);
                    }

                    // print the message
                    if (store.formatID === 0) {
                        mcdu.atsu.messageRead(retval[1].UniqueMessageID);
                        mcdu.atsu.printMessage(retval[1]);
                    }
                } else {
                    mcdu.addNewAtsuMessage(retval[0]);

                    if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
                        store.sendStatus = "FAILED";
                        CDUAocRequestsAtis.ShowPage(mcdu, store);
                    }
                }
            });
        };

    }
}
