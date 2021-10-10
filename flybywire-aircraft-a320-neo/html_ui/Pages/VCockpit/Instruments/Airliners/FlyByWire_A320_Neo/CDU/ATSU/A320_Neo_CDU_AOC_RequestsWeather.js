class CDUAocRequestsWeather {
    static ShowPage(mcdu, reqID = 0, _sendStatus = "") {
        mcdu.clearDisplay();
        let labelTimeout;
        let sendStatus = _sendStatus;
        const reqTypes = [
            'METAR',
            'TAF'
        ];

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC WEATHER REQUEST"],
                [`WX TYPE`, "AIRPORTS"],
                [`↓${reqTypes[reqID]}[color]cyan`, mcdu.aocAirportList.rows[0].output],
                [""],
                ["", mcdu.aocAirportList.rows[1].output],
                [""],
                ["", mcdu.aocAirportList.rows[2].output],
                [""],
                ["", mcdu.aocAirportList.rows[3].output],
                [""],
                [""],
                ["RETURN TO", `${sendStatus}`],
                ["<AOC MENU", "SEND*[color]cyan"]
            ]);
        };
        updateView();

        for (let i = 0; i < 4; i++) {
            mcdu.onRightInput[i] = (value) => {
                mcdu.aocAirportList.set(i, value);
                CDUAocRequestsWeather.ShowPage(mcdu, reqID, sendStatus);
            };
        }

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
            mcdu.clearScratchpadAndWriteToLastUserInputAndReturnLastUserInput();

            const getInfo = async () => {
                if (reqID === 0) {
                    getMETAR(icaos, lines, updateView);
                } else {
                    getTAF(icaos, lines, updateView);
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
