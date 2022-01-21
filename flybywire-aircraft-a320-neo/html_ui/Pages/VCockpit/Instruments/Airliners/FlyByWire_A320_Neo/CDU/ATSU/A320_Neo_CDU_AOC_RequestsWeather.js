class CDUAocRequestsWeather {
    static ShowPage(mcdu, reqID = 0, _sendStatus = "") {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCRequestWeather;
        let labelTimeout;
        let sendStatus = _sendStatus;
        const reqTypes = [
            'METAR',
            'TAF'
        ];

        let sendMessage = "SEND\xa0[color]cyan";
        if (mcdu.aocAirportList.icaos.length !== 0) {
            sendMessage = "SEND*[color]cyan";
        }

        const updateView = () => {
            if (mcdu.page.Current === mcdu.page.AOCRequestWeather) {
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
                    ["<AOC MENU", sendMessage]
                ]);
            }
        };
        updateView();

        for (let i = 0; i < 4; i++) {
            mcdu.onRightInput[i] = (value) => {
                if (value.length !== 4 || /^[A-Z()]*$/.test(value) === false) {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                } else {
                    mcdu.aocAirportList.set(i, value);
                }
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
            sendStatus = "SENDING";
            updateView();

            mcdu.atsuManager.aoc().receiveWeather(reqID === 0, icaos).then((message) => {
                if (message !== undefined) {
                    sendStatus = "SENT";
                    updateView();

                    setTimeout(() => {
                        mcdu.atsuManager.registerMessage(message);
                    }, Math.floor(Math.random() * 10000) + 10000);
                    labelTimeout = setTimeout(() => {
                        sendStatus = "";
                        updateView();
                    }, 3000);
                } else {
                    sendStatus = "FAILED";
                    updateView();
                }
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
