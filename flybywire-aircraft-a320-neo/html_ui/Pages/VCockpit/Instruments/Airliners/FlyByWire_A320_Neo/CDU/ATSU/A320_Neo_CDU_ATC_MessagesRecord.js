class CDUAtcMessagesRecord {
    static TranslateCpdlcResponse(response) {
        switch (response) {
            case Atsu.CpdlcMessageResponse.Standby:
                return "STBY";
            case Atsu.CpdlcMessageResponse.Wilco:
                return "WILC";
            case Atsu.CpdlcMessageResponse.Roger:
                return "ROGR";
            case Atsu.CpdlcMessageResponse.Negative:
                return "NEG";
            case Atsu.CpdlcMessageResponse.Unable:
                return "UNBL";
            case Atsu.CpdlcMessageResponse.Acknowledge:
                return "ACK";
            case Atsu.CpdlcMessageResponse.Affirm:
                return "AFRM";
            case Atsu.CpdlcMessageResponse.Refuse:
                return "REF";
            default:
                return "";
        }
    }

    static ShowPage(mcdu, messages = null, offset = 0, confirmErase = false) {
        if (!messages) {
            messages = mcdu.atsuManager.atc().messages();
        }
        mcdu.clearDisplay();

        let eraseRecordTitle = "MSG RECORD";
        let eraseRecordButton = "*ERASE";
        if (confirmErase) {
            eraseRecordTitle = "ERASE MSG RECORD";
            eraseRecordButton = "*CONFIRM";
        }

        mcdu.refreshPageCallback = () => {
            this.ShowPage(mcdu, null, offset, false);
        };

        const msgHeadersLeft = [], msgHeadersRight = [], msgStart = [];
        msgHeadersLeft.length = msgHeadersRight.length = msgStart.length = 4;
        for (let i = 0; i < 5; ++i) {
            let headerLeft = "", headerRight = "", contentStart = "";

            if (messages.length > (offset + i) && messages[offset + i]) {
                headerLeft = `${messages[offset + i].Timestamp.dcduTimestamp()} ${messages[offset + i].Direction === Atsu.AtsuMessageDirection.Input ? "FROM" : "TO"} `;
                headerLeft += messages[offset + i].Station;
                headerRight = CDUAtcMessagesRecord.TranslateCpdlcResponse(messages[offset + i].ResponseType);

                const serialized = messages[offset + i].serialize(Atsu.AtsuMessageSerializationFormat.Printer).split("\n")[0];
                if (serialized.length <= 24) {
                    contentStart = serialized;
                } else {
                    serialized.split(" ").forEach((word) => {
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
            ["MSG RECORD"],
            [msgHeadersLeft[0], msgHeadersRight[0]],
            [`${messages.length !== 0 ? msgStart[0] : "NO MESSAGES"}`],
            [msgHeadersLeft[1], msgHeadersRight[1]],
            [msgStart[1]],
            [msgHeadersLeft[2], msgHeadersRight[2]],
            [msgStart[2]],
            [msgHeadersLeft[3], msgHeadersRight[3]],
            [msgStart[3]],
            [eraseRecordTitle],
            [eraseRecordButton],
            ["ATC MENU", "MSG RECORD[color]inop"],
            ["<RETURN", "PRINT*[color]inop"]
        ]);

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = (value) => {
                if (messages[offset + i]) {
                    if (value === FMCMainDisplay.clrValue) {
                        mcdu.atsuManager.removeMessage(messages[offset + i].UniqueMessageID);
                        CDUAtcMessagesRecord.ShowPage(mcdu, null, offset, false);
                    } else {
                        CDUAtcMessage.ShowPage(mcdu, messages, offset + i);
                    }
                }
            };
        }

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            if (!confirmErase) {
                CDUAtcMessagesRecord.ShowPage(mcdu, messages, offset, true);
            } else {
                mcdu.atsuManager.atc().cleanupMessages();
                CDUAtcMessagesRecord.ShowPage(mcdu, null, 0, false);
            }
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
