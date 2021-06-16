class CDUAocRequestsWeather {
    static ShowPage(mcdu, reqID = 0, _sendStatus = "") {
        mcdu.clearDisplay();
        let labelTimeout;
        let sendStatus = _sendStatus;

        // if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
        //     if (setArpts) {
        //         store.arpt1 = mcdu.flightPlanManager.getOrigin().ident;
        //         store.arpt2 = mcdu.flightPlanManager.getDestination().ident;
        //     }
        // }

        const reqTypes = [
            'METAR',
            'TAF'
        ];

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC WEATHER REQUEST"],
                [`WX TYPE`, "AIRPORTS"],
                [`↓${reqTypes[reqID]}[color]cyan`, mcdu.aocAirportList.rows[0].outPut],
                [""],
                ["", mcdu.aocAirportList.rows[1].outPut],
                [""],
                ["", mcdu.aocAirportList.rows[2].outPut],
                [""],
                ["", mcdu.aocAirportList.rows[3].outPut],
                [""],
                [""],
                ["RETURN TO", `${sendStatus}`],
                ["<AOC MENU", "SEND*[color]cyan"]
            ]);
        };
        updateView();

        mcdu.onRightInput[0] = (value) => {
            mcdu.aocAirportList.set(0, value);
            CDUAocRequestsWeather.ShowPage(mcdu, reqID, sendStatus);
        };

        mcdu.onRightInput[1] = (value) => {
            mcdu.aocAirportList.set(1, value);
            CDUAocRequestsWeather.ShowPage(mcdu, reqID, sendStatus);
        };

        mcdu.onRightInput[2] = (value) => {
            mcdu.aocAirportList.set(2, value);
            CDUAocRequestsWeather.ShowPage(mcdu, reqID, sendStatus);
        };

        mcdu.onRightInput[3] = (value) => {
            mcdu.aocAirportList.set(3, value);
            CDUAocRequestsWeather.ShowPage(mcdu, reqID, sendStatus);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = async () => {
            const icaos = mcdu.aocAirportList.icaos;
            if (icaos.length === 0) {
                mcdu.addNewMessage(NXFictionalMessages.noAirportSpecified);
                return;
            }
            sendStatus = "QUEUED";
            updateView();
            const lines = [];
            const newMessage = { "id": Date.now(), "type": reqTypes[reqID], "time": '00:00', "opened": null, "content": lines, };
            mcdu.clearUserInput();

            const getInfo = async () => {
                if (reqID === 0) {
                    getMETAR(icaos, lines, sendStatus, updateView);
                } else {
                    getTAF(icaos, lines, sendStatus, updateView);
                }
            };

            getInfo().then(() => {
                sendStatus = "SENT";
                setTimeout(() => {
                    newMessage["time"] = fetchTimeValue();
                    mcdu.addMessage(newMessage);
                }, Math.floor(Math.random() * 10000) + 10000);
                labelTimeout = setTimeout(() => {
                    sendStatus = "";
                    updateView();
                }, 3000);
            });
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUAocRequestsWeather.ShowPage(mcdu, (reqID + 1) % 2, sendStatus);
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
