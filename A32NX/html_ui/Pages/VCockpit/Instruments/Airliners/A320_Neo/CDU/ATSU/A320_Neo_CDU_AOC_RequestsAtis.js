class CDUAocRequestsAtis {
    static ShowPage(mcdu, store = {"reqID": 0, "formatID": 0, "arrIcao": "", "arpt1": "", "sendStatus": ""}) {
        mcdu.clearDisplay();
        let labelTimeout;
        let formatString;

        const reqTypes = [
            'ARRIVAL',
            'DEPARTURE',
            'ENROUTE'
        ];

        const formatTypes = [
            'MCDU',
            'PRINTER'
        ];

        if (store.formatID == 0) {
            formatString = "PRINTER*[color]blue";
        } else {
            formatString = "MCDU*[color]blue";
        }

        let arrivalText = "{ARRIVAL[color]blue";
        let departureText = "{DEPARTURE[color]blue";
        let enrouteText = "ENROUTE}[color]blue";

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store['arrIcao'] = mcdu.flightPlanManager.getDestination().ident;
        }

        if (store.reqID == 0) {
            arrivalText = "~ARRIVAL[color]blue";
        } else if (store.reqID == 1) {
            departureText = "~DEPARTURE[color]blue";
        } else {
            enrouteText = "ENROUTE~[color]blue";
        }

        let arrText;
        if (store.arpt1 != "") {
            arrText = store.arpt1;
        } else if (store.arrIcao != "") {
            arrText = store.arrIcao + "[s-text]";
        } else {
            arrText = "[ ]";
        }
        const updateView = () => {
            mcdu.setTemplate([
                ["AOC ATIS REQUEST"],
                ["AIRPORT", "↓FORMAT FOR"],
                [`${arrText}[color]blue`, formatString],
                ["", "", "-------SELECT ONE-------"],
                [arrivalText, enrouteText],
                [""],
                [departureText],
                [""],
                ["{ARRIVAL/AUTO UPDATE[color]inop"],
                [""],
                ["{TERMINATE AUTO UPDATE[color]inop"],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]blue"]
            ]);
        };
        updateView();

        mcdu.onLeftInput[0] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt1"] = "";
            } else {
                store["arpt1"] = value;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.onLeftInput[1] = () => {
            if (store.reqID != 0) {
                store["reqID"] = 0;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.onLeftInput[2] = () => {
            if (store.reqID != 1) {
                store["reqID"] = 1;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.onLeftInput[5] = () => {
            clearTimeout(labelTimeout);
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onRightInput[0] = () => {
            store["formatID"] = (store.formatID + 1) % 2;
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.onRightInput[1] = () => {
            if (store.reqID != 2) {
                store["reqID"] = 2;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.onRightInput[5] = async () => {
            store["sendStatus"] = "QUEUED";
            updateView();
            const icao = store["arpt1"] || store["arrIcao"];
            const lines = [];
            const newMessage = { "id": Date.now(), "type": "ATIS", "time": '00:00', "opened": null, "content": lines, };
            mcdu.clearUserInput();

            getATIS(icao, lines, store.reqID, store, updateView).then(() => {
                store["sendStatus"] = "SENT";
                setTimeout(() => {
                    newMessage["time"] = fetchTimeValue();
                    mcdu.addMessage(newMessage);
                }, Math.floor(Math.random() * 10000) + 10000);
                labelTimeout = setTimeout(() => {
                    store["sendStatus"] = "";
                    store["arpt1"] = "";
                    CDUAocRequestsAtis.ShowPage(mcdu, store);
                }, 3000);
            });
        };

    }
}