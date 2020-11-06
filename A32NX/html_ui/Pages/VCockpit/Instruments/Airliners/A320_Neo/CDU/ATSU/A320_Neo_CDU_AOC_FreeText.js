class CDUAocFreeText {
    static ShowPage(mcdu, store = { "msg_to": "", "msg_line1": "", "msg_line2": "", "msg_line3": "", "msg_line4": "", "sendStatus": ""}) {
        mcdu.clearDisplay();

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC FREE TEXT"],
                ["TO:"],
                [`${store["msg_to"] != "" ? store["msg_to"] : "________"}[color]blue`],
                [""],
                [`${store["msg_line1"] != "" ? store["msg_line1"] : "["}[color]blue`, `${store["msg_line1"] != "" ? "" : "]"}[color]blue`],
                [""],
                [`${store["msg_line2"] != "" ? store["msg_line2"] : "["}[color]blue`, `${store["msg_line2"] != "" ? "" : "]"}[color]blue`],
                [""],
                [`${store["msg_line3"] != "" ? store["msg_line3"] : "["}[color]blue`, `${store["msg_line3"] != "" ? "" : "]"}[color]blue`],
                [""],
                [`${store["msg_line4"] != "" ? store["msg_line4"] : "["}[color]blue`, `${store["msg_line4"] != "" ? "" : "]"}[color]blue`],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]blue"]
            ]);
        };
        updateView();

        mcdu.onLeftInput[0] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["msg_to"] = "";
            } else {
                store["msg_to"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[1] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line1"] = "";
            } else {
                store["msg_line1"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[2] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line2"] = "";
            } else {
                store["msg_line2"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[3] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line3"] = "";
            } else {
                store["msg_line3"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[4] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line4"] = "";
            } else {
                store["msg_line4"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onRightInput[5] = async () => {
            const storedTelexStatus = NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED");

            if (NXApi.hasTelexConnection() && storedTelexStatus === "ENABLED") {
                store["sendStatus"] = "QUEUED";
                updateView();
                const recipient = store["msg_to"];
                const msgLines = [store["msg_line1"], store["msg_line2"], store["msg_line3"], store["msg_line4"]].join(";");
                mcdu.clearUserInput();
                let errors = 0;

                const getData = async () => {
                    if (recipient !== "" && msgLines !== ";;;") {
                        await NXApi.sendTelexMessage(recipient, msgLines)
                            .catch(err => {
                                errors += 1;
                                switch (err.status) {
                                    case 404:
                                        mcdu.showErrorMessage("RECIPIENT NOT FOUND");
                                        break;
                                    case 401:
                                    case 403:
                                        mcdu.showErrorMessage("AUTH ERR");
                                        break;
                                    case 400:
                                        mcdu.showErrorMessage("INVALID MSG");
                                        break;
                                    default:
                                        mcdu.showErrorMessage("UNKNOWN DOWNLINK ERR");
                                }
                            });
                    }

                    if (errors === 0) {
                        store["sendStatus"] = "SENT";
                    } else {
                        store["sendStatus"] = "FAILED";
                    }
                    store["msg_to"] = "";
                    store["msg_line1"] = "";
                    store["msg_line2"] = "";
                    store["msg_line3"] = "";
                    store["msg_line4"] = "";
                    updateView();
                };

                getData().then(() => {
                    setTimeout(() => {
                        const fMsgLines = msgLines.split(";");
                        fMsgLines.forEach((line) => {
                            line += "[color]green";
                        });
                        fMsgLines.unshift("TO " + store["msg_to"] + "[color]blue");
                        fMsgLines.push("---------------------------[color]white");

                        const sentMessage = { "id": Date.now(), "type": "FREE TEXT", "time": '00:00', "content": fMsgLines, };
                        sentMessage["time"] = fetchTimeValue();
                        mcdu.addSentMessage(sentMessage);
                        store["sendStatus"] = "";
                        updateView();
                    }, 1000);
                });
            } else {
                mcdu.showErrorMessage("TELEX NOT ENABLED");
            }
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}