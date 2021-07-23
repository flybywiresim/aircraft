class CDUAocFreeText {
    static ShowPage(fmc, mcdu, store = { "msg_to": "", "msg_line1": "", "msg_line2": "", "msg_line3": "", "msg_line4": "", "sendStatus": ""}) {
        mcdu.setCurrentPage(); // note: no refresh

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC FREE TEXT"],
                ["TO:"],
                [`${store["msg_to"] != "" ? store["msg_to"] : "________"}[color]cyan`],
                [""],
                [`${store["msg_line1"] != "" ? store["msg_line1"] : "["}[color]cyan`, `${store["msg_line1"] != "" ? "" : "]"}[color]cyan`],
                [""],
                [`${store["msg_line2"] != "" ? store["msg_line2"] : "["}[color]cyan`, `${store["msg_line2"] != "" ? "" : "]"}[color]cyan`],
                [""],
                [`${store["msg_line3"] != "" ? store["msg_line3"] : "["}[color]cyan`, `${store["msg_line3"] != "" ? "" : "]"}[color]cyan`],
                [""],
                [`${store["msg_line4"] != "" ? store["msg_line4"] : "["}[color]cyan`, `${store["msg_line4"] != "" ? "" : "]"}[color]cyan`],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]cyan"]
            ]);
        };
        updateView();

        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_to"] = "";
            } else {
                store["msg_to"] = value;
            }
            CDUAocFreeText.ShowPage(fmc, mcdu, store);
        };

        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line1"] = "";
            } else {
                store["msg_line1"] = value;
            }
            CDUAocFreeText.ShowPage(fmc, mcdu, store);
        };

        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line2"] = "";
            } else {
                store["msg_line2"] = value;
            }
            CDUAocFreeText.ShowPage(fmc, mcdu, store);
        };

        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line3"] = "";
            } else {
                store["msg_line3"] = value;
            }
            CDUAocFreeText.ShowPage(fmc, mcdu, store);
        };

        mcdu.onLeftInput[4] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line4"] = "";
            } else {
                store["msg_line4"] = value;
            }
            CDUAocFreeText.ShowPage(fmc, mcdu, store);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = async () => {
            const storedTelexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");

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
                                        mcdu.addNewMessage(NXFictionalMessages.recipientNotFound);
                                        break;
                                    case 401:
                                    case 403:
                                        mcdu.addNewMessage(NXFictionalMessages.authErr);
                                        break;
                                    case 400:
                                        mcdu.addNewMessage(NXFictionalMessages.invalidMsg);
                                        break;
                                    default:
                                        mcdu.addNewMessage(NXFictionalMessages.unknownDownlinkErr);
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
                        fMsgLines.unshift("TO " + store["msg_to"] + "[color]cyan");
                        fMsgLines.push("---------------------------[color]white");

                        const sentMessage = { "id": Date.now(), "type": "FREE TEXT", "time": '00:00', "content": fMsgLines, };
                        sentMessage["time"] = fetchTimeValue();
                        fmc.addSentMessage(sentMessage);
                        store["sendStatus"] = "";
                        updateView();
                    }, 1000);
                });
            } else {
                mcdu.addNewMessage(NXFictionalMessages.telexNotEnabled);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(fmc, mcdu);
        };
    }
}
