class CDUAocFreeText {
    static ShowPage(mcdu, store = { "msg_to": "", "reqID": 0, "msg_line1": "", "msg_line2": "", "msg_line3": "", "msg_line4": "", "sendStatus": ""}) {
        mcdu.clearDisplay();
        const networkTypes = [
            'HOPPIE',
            'FBW'
        ];

        const updateView = () => {
            let oneLineFilled = false;
            if (store["msg_line1"] !== "" || store["msg_line2"] !== "" || store["msg_line3"] !== "" || store["msg_line4"] !== "") {
                oneLineFilled = true;
            }
            let sendValid = oneLineFilled === true && store["msg_to"] !== "";
            if (store["sendStatus"] === "SENDING" || store["sendStatus"] === "SENT") {
                sendValid = false;
            }

            mcdu.setTemplate([
                ["AOC FREE TEXT"],
                ["TO", "NETWORK"],
                [`${store["msg_to"] !== "" ? store["msg_to"] + "[color]cyan" : "________[color]amber"}`, `↓${networkTypes[store["reqID"]]}[color]cyan`],
                [""],
                [`${store["msg_line1"] !== "" ? store["msg_line1"] : "["}[color]cyan`, `${store["msg_line1"] != "" ? "" : "]"}[color]cyan`],
                [""],
                [`${store["msg_line2"] !== "" ? store["msg_line2"] : "["}[color]cyan`, `${store["msg_line2"] != "" ? "" : "]"}[color]cyan`],
                [""],
                [`${store["msg_line3"] !== "" ? store["msg_line3"] : "["}[color]cyan`, `${store["msg_line3"] != "" ? "" : "]"}[color]cyan`],
                [""],
                [`${store["msg_line4"] !== "" ? store["msg_line4"] : "["}[color]cyan`, `${store["msg_line4"] != "" ? "" : "]"}[color]cyan`],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", (sendValid === true ? "SEND*" : "SEND") + "[color]cyan"]
            ]);
        };
        updateView();

        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_to"] = "";
            } else {
                store["msg_to"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line1"] = "";
            } else {
                store["msg_line1"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line2"] = "";
            } else {
                store["msg_line2"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line3"] = "";
            } else {
                store["msg_line3"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[4] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["msg_line4"] = "";
            } else {
                store["msg_line4"] = value;
            }
            CDUAocFreeText.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            store["reqID"] = (store["reqID"] + 1) % 2;
            updateView();
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = async () => {
            // do not send two times
            if (store["sendStatus"] === "SENDING" || store["sendStatus"] === "SENT") {
                return;
            }

            let oneLineFilled = false;
            if (store["msg_line1"] !== "" || store["msg_line2"] !== "" || store["msg_line3"] !== "" || store["msg_line4"] !== "") {
                oneLineFilled = true;
            }
            const sendValid = oneLineFilled === true && store["msg_to"] !== "";

            if (sendValid === false) {
                mcdu.addNewMessage(NXSystemMessages.mandatoryFields);
                return;
            }

            store["sendStatus"] = "SENDING";
            updateView();

            // create the message
            const message = new Atsu.FreetextMessage();
            if (store["reqID"] === 0) {
                message.Network = Atsu.AtsuMessageNetwork.Hoppie;
            } else {
                message.Network = Atsu.AtsuMessageNetwork.FBW;
            }
            message.Station = store["msg_to"];
            if (store["msg_line1"] !== "") {
                message.Message += store["msg_line1"] + '\n';
            }
            if (store["msg_line2"] !== "") {
                message.Message += store["msg_line2"] + '\n';
            }
            if (store["msg_line3"] !== "") {
                message.Message += store["msg_line3"] + '\n';
            }
            if (store["msg_line4"] !== "") {
                message.Message += store["msg_line4"] + '\n';
            }
            message.Message = message.Message.substring(0, message.Message.length - 1);

            // send the message
            mcdu.atsuManager.sendMessage(message).then((code) => {
                if (code === Atsu.AtsuStatusCodes.Ok) {
                    store["sendStatus"] = "SENT";
                    store["msg_line1"] = "";
                    store["msg_line2"] = "";
                    store["msg_line3"] = "";
                    store["msg_line4"] = "";

                    setTimeout(() => {
                        store["sendStatus"] = "";
                        if (mcdu.page.Current === mcdu.page.AOCDepartRequest) {
                            CDUAocDepartReq.ShowPage1(mcdu, store);
                        }
                    }, 5000);
                } else {
                    store["sendStatus"] = "FAILED";
                    mcdu.atsuStatusCodeToMessage(code);
                }
                updateView();
            });
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}
