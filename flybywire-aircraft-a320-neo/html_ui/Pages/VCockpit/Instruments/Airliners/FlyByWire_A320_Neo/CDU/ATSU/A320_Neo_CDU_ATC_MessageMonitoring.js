class CDUAtcMessageMonitoring {
    static TranslateCpdlcResponse(response) {
        if (response !== undefined) {
            if (response.Content[0].TypeId === "DM0") {
                return "WILC";
            }
            if (response.Content[0].TypeId === "UM0" || response.Content[0].TypeId === "DM1") {
                return "UNBL";
            }
            if (response.Content[0].TypeId === "UM1" || response.Content[0].TypeId === "DM2") {
                return "STBY";
            }
            if (response.Content[0].TypeId === "UM3" || response.Content[0].TypeId === "DM3") {
                return "ROGR";
            }
            if (response.Content[0].TypeId === "UM4" || response.Content[0].TypeId === "DM4") {
                return "AFRM";
            }
            if (response.Content[0].TypeId === "UM5" || response.Content[0].TypeId === "DM5") {
                return "NEG";
            }
        }

        return "";
    }

    static ShowPage(mcdu, messages = null, offset = 0, cancelIndex = -1) {
        if (!messages) {
            messages = mcdu.atsu.atc.monitoredMessages();
        }
        mcdu.clearDisplay();

        mcdu.refreshPageCallback = () => {
            this.ShowPage(mcdu, null, offset, false);
        };

        let cancelHeader = "";
        let cancelMessage = "";
        if (cancelIndex > -1) {
            cancelHeader = "{yellow}CONFIRM CANCEL\xa0{end}";
            cancelMessage = "{yellow}MONITORING*{end}";
        }

        const msgHeadersLeft = [], msgHeadersRight = [], msgStart = [];
        msgHeadersLeft.length = msgHeadersRight.length = msgStart.length = 4;
        for (let i = 0; i < 5; ++i) {
            let headerLeft = "", headerRight = "", contentStart = "";

            if (messages.length > (offset + i) && messages[offset + i]) {
                headerLeft = `${messages[offset + i].Timestamp.dcduTimestamp()} ${messages[offset + i].Direction === Atsu.AtsuMessageDirection.Input ? "FROM" : "TO"} `;
                headerLeft += messages[offset + i].Station;
                headerRight = CDUAtcMessagesRecord.TranslateCpdlcResponse(messages[offset + i].Response);

                // ignore the headline with the station and the timestamp
                const lines = messages[offset + i].serialize(Atsu.AtsuMessageSerializationFormat.Printer).split("\n");
                let firstLine = "CPDLC";
                if (lines.length >= 2) {
                    firstLine = messages[offset + i].serialize(Atsu.AtsuMessageSerializationFormat.Printer).split("\n")[1];
                }
                if (firstLine.length <= 24) {
                    contentStart = firstLine;
                } else {
                    firstLine.split(" ").forEach((word) => {
                        if (contentStart.length + word.length + 1 < 24) {
                            contentStart += `${word}\xa0`;
                        }
                    });
                }
            }

            msgHeadersLeft[i] = headerLeft;
            msgHeadersRight[i] = headerRight;
            msgStart[i] = `${contentStart.length !== 0 ? "<" : ""}${contentStart}`;
        }

        let left = false, right = false;
        if (messages.length > offset + 4) {
            mcdu.onNextPage = () => {
                CDUAtcMessagesRecord.ShowPage(mcdu, messages, offset + 4, false);
            };
            right = true;
        }
        if (offset > 0) {
            mcdu.onPrevPage = () => {
                CDUAtcMessagesRecord.ShowPage(mcdu, messages, offset - 4, false);
            };
            left = true;
        }
        mcdu.setArrows(false, false, left, right);

        mcdu.setTemplate([
            ["MONITORED MSG"],
            [msgHeadersLeft[0], msgHeadersRight[0]],
            [`${messages.length !== 0 ? msgStart[0] : "NO MESSAGES"}`, `${msgStart[0] !== "" ? "{cyan}CANCEL*{end}" : ""}`],
            [msgHeadersLeft[1], msgHeadersRight[1]],
            [msgStart[1], `${msgStart[1] !== "" ? "{cyan}CANCEL*{end}" : ""}`],
            [msgHeadersLeft[2], msgHeadersRight[2]],
            [msgStart[2], `${msgStart[1] !== "" ? "{cyan}CANCEL*{end}" : ""}`],
            [msgHeadersLeft[3], msgHeadersRight[3]],
            [msgStart[3], `${msgStart[1] !== "" ? "{cyan}CANCEL*{end}" : ""}`],
            [""],
            [""],
            ["\xa0ATC MENU", cancelHeader],
            ["<RETURN", cancelMessage]
        ]);

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = () => {
                if (messages[offset + i]) {
                    CDUAtcMessage.ShowPage(mcdu, messages, offset + i);
                }
            };

            mcdu.rightInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onRightInput[i] = () => {
                if (messages[offset + i]) {
                    CDUAtcMessageMonitoring.ShowPage(mcdu, messages, offset, offset + i);
                }
            };
        }

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (cancelIndex > -1) {
                Atsu.UplinkMessageStateMachine.update(mcdu.atsu, messages[offset + i], false);
                mcdu.atsu.atc.updateMessage(messages[offset + i]);
                CDUAtcMessageMonitoring.ShowPage(mcdu);
            }
        };
    }
}
