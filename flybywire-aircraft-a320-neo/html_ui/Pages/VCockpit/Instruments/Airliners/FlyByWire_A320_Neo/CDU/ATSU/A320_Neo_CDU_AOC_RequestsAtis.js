class CDUAocRequestsAtis {
    static ShowPage(mcdu, store = {"reqID": 0, "formatID": 1, "arrIcao": "", "arpt1": "", "sendStatus": ""}) {
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

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store["depIcao"] = mcdu.flightPlanManager.getOrigin().ident;
            store["arrIcao"] = mcdu.flightPlanManager.getDestination().ident;
        }

        if (store.reqID === 0) {
            arrivalText = "ARRIVAL[color]cyan";
        } else if (store.reqID === 1) {
            departureText = "DEPARTURE[color]cyan";
        } else {
            enrouteText = "ENROUTE[color]cyan";
        }

        let sendMessage = "SEND*[color]cyan";
        const icao = store["arpt1"] !== "" ? store["arpt1"] : store["arrIcao"];
        if (icao.length !== 4 || /^[A-Z()]*$/.test(icao) === false) {
            sendMessage = "SEND\xa0[color]cyan";
        }

        let arrText;
        if (store.arpt1 !== "") {
            arrText = store.arpt1;
        } else if (store.arrIcao !== "") {
            arrText = store.arrIcao + "[s-text]";
        } else {
            arrText = "[ ]";
        }
        const updateView = () => {
            if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
                mcdu.setTemplate([
                    ["AOC ATIS REQUEST"],
                    ["AIRPORT", "↓FORMAT FOR"],
                    [`${arrText}[color]cyan`, formatString],
                    ["", "", "-------SELECT ONE-------"],
                    [arrivalText, enrouteText],
                    [""],
                    [departureText],
                    [""],
                    ["{ARRIVAL/AUTO UPDATE[color]inop"],
                    [""],
                    ["{TERMINATE AUTO UPDATE[color]inop"],
                    ["RETURN TO", `${store["sendStatus"]}`],
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
                store["arpt1"] = "";
            } else {
                store["arpt1"] = value;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (store.reqID !== 0) {
                store["arpt1"] = store["arrIcao"];
                store["reqID"] = 0;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (store.reqID !== 1) {
                store["arpt1"] = store["depIcao"];
                store["reqID"] = 1;
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
            store["formatID"] = (store.formatID + 1) % 2;
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (store.reqID !== 2) {
                store["reqID"] = 2;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = async () => {
            const icao = store["arpt1"] !== "" ? store["arpt1"] : store["arrIcao"];
            if (icao.length !== 4 || /^[A-Z()]*$/.test(icao) === false) {
                mcdu.addNewMessage(NXFictionalMessages.noAirportSpecified);
                return;
            }
            store["sendStatus"] = "SENDING";
            updateView();

            setTimeout(() => {
                store["sendStatus"] = "SENT";
                updateView();
            }, 1000);

            mcdu.atsuManager.aoc().receiveAtis(icao).then((retval) => {
                if (retval[0] === Atsu.AtsuStatusCodes.Ok) {
                    mcdu.atsuManager.registerMessage(retval[1]);
                    store["sendStatus"] = "";
                    updateView();

                    // print the message
                    if (store.formatID === 0) {
                        mcdu.atsuManager.messageRead(retval[1].UniqueMessageID);
                        mcdu.atsuManager.printMessage(retval[1]);
                    }
                } else {
                    mcdu.addNewAtsuMessage(retval[0]);
                }
            });
        };

    }
}
