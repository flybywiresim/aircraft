class CDUAocRequestsWeather {
    static ShowPage(mcdu, setArpts = true, store = {"reqID": 0, "depIcao": "", "arrIcao": "", "arpt1": "", "arpt2": "", "arpt3": "", "arpt4": "", "sendStatus": ""}) {
        mcdu.clearDisplay();
        let labelTimeout;

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            if (setArpts) {
                store.arpt1 = mcdu.flightPlanManager.getOrigin().ident;
                store.arpt2 = mcdu.flightPlanManager.getDestination().ident;
            }
        }

        const reqTypes = [
            'METAR',
            'TAF'
        ];

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC WEATHER REQUEST"],
                [`WX TYPE`, "AIRPORTS"],
                [`↓${reqTypes[store.reqID]}[color]cyan`, `${store.arpt1 != "" ? store.arpt1 : "[ ]"}[color]cyan`],
                [""],
                ["", `${store["arpt2"] != "" ? store["arpt2"] : "[ ]"}[color]cyan`],
                [""],
                ["", `${store["arpt3"] != "" ? store["arpt3"] : "[ ]"}[color]cyan`],
                [""],
                ["", `${store["arpt4"] != "" ? store["arpt4"] : "[ ]"}[color]cyan`],
                [""],
                [""],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]cyan"]
            ]);
        };
        updateView();

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["arpt1"] = "";
            } else {
                store["arpt1"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, false, store);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["arpt2"] = "";
            } else {
                store["arpt2"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, false, store);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["arpt3"] = "";
            } else {
                store["arpt3"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, false, store);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["arpt4"] = "";
            } else {
                store["arpt4"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, false, store);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = async () => {
            const icaos = [store["arpt1"], store["arpt2"], store["arpt3"], store["arpt4"]];
            if (icaos.every((current) => current === "")) {
                mcdu.addNewMessage(NXFictionalMessages.noAirportSpecified);
                return;
            }
            store["sendStatus"] = "QUEUED";
            updateView();
            const lines = [];
            const newMessage = { "id": Date.now(), "type": reqTypes[store.reqID], "time": '00:00', "opened": null, "content": lines, };
            mcdu.clearUserInput();

            const getInfo = async () => {
                if (store.reqID == 0) {
                    getMETAR(icaos, lines, store, updateView);
                } else {
                    getTAF(icaos, lines, store, updateView);
                }
            };

            getInfo().then(() => {
                store["sendStatus"] = "SENT";
                setTimeout(() => {
                    newMessage["time"] = fetchTimeValue();
                    mcdu.addMessage(newMessage);
                }, Math.floor(Math.random() * 10000) + 10000);
                labelTimeout = setTimeout(() => {
                    store["sendStatus"] = "";
                    updateView();
                }, 3000);
            });
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            store["reqID"] = (store.reqID + 1) % 2;
            CDUAocRequestsWeather.ShowPage(mcdu, false, store);
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
