class CDUAocRequestsWeather {
    static ShowPage(mcdu, store = {"reqID": 0, "depIcao": "", "arrIcao": "", "arpt1": "", "arpt2": "", "arpt3": "", "arpt4": "", "sendStatus": ""}) {
        mcdu.clearDisplay();
        let labelTimeout;

        let fplanArptColor = "[color]blue";
        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store.arpt1 = mcdu.flightPlanManager.getOrigin().ident;
            store.arpt2 = mcdu.flightPlanManager.getDestination().ident;
            fplanArptColor = "[color]green";
        }

        const reqTypes = [
            'METAR',
            'TAF'
        ];

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC WEATHER REQUEST"],
                [`WX TYPE`, "AIRPORTS"],
                [`↓${reqTypes[store.reqID]}[color]blue`, `${store.arpt1 != "" ? store.arpt1 : "[ ]"}${fplanArptColor}`],
                [""],
                ["", `${store["arpt2"] != "" ? store["arpt2"] : "[ ]"}${fplanArptColor}`],
                [""],
                ["", `${store["arpt3"] != "" ? store["arpt3"] : "[ ]"}[color]blue`],
                [""],
                ["", `${store["arpt4"] != "" ? store["arpt4"] : "[ ]"}[color]blue`],
                [""],
                [""],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]blue"]
            ]);
        };
        updateView();

        mcdu.onRightInput[0] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt1"] = "";
            } else {
                store["arpt1"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        };

        mcdu.onRightInput[1] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt2"] = "";
            } else {
                store["arpt2"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        };

        mcdu.onRightInput[2] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt3"] = "";
            } else {
                store["arpt3"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        };

        mcdu.onRightInput[3] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt4"] = "";
            } else {
                store["arpt4"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        };

        mcdu.onRightInput[5] = async () => {
            store["sendStatus"] = "QUEUED";
            updateView();
            const icaos = [store["arpt1"], store["arpt2"], store["arpt3"], store["arpt4"]];
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

        mcdu.onLeftInput[0] = () => {
            store["reqID"] = (store.reqID + 1) % 2;
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        };
        mcdu.onLeftInput[5] = () => {
            clearTimeout(labelTimeout);
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}