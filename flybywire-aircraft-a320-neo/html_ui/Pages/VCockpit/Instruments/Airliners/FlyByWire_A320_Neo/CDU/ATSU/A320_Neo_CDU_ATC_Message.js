class CDUAtcMessage {
    static TranslateCpdlcResponse(message) {
        let retval;

        switch (message.Content[0].TypeId) {
            case "DM0":
                retval = "WILC";
                break;
            case "UM0":
            case "DM1":
                retval = "UNBL";
                break;
            case "UM1":
            case "DM2":
                retval = "STBY";
                break;
            case "UM3":
            case "DM3":
                retval = "ROGR";
                break;
            case "UM4":
            case "DM4":
                retval = "AFRM";
                break;
            case "UM5":
            case "DM5":
                retval = "NEG";
                break;
            default:
                return "";
        }

        let color = '{cyan}';
        if (message.ComStatus === Atsu.AtsuMessageComStatus.Failed) {
            color = '{red}';
        }
        retval = `${color}{small}${retval}{end}{end}`;

        return retval;
    }

    static ShowPage(mcdu, messages, messageIndex, messageList, offset = 0) {
        mcdu.clearDisplay();
        const message = messages[messageIndex];
        const lines = message.serialize(Atsu.AtsuMessageSerializationFormat.MCDU).split("\n");

        // mark message as read
        mcdu.atsu.messageRead(message.UniqueMessageID);

        const msgArrows = messages.length > 1 ? " {}" : "";

        if (lines.length > 8) {
            let up = false;
            let down = false;
            if (lines[offset + 1]) {
                mcdu.onUp = () => {
                    offset += 1;
                    CDUAtcMessage.ShowPage(mcdu, messages, messageIndex, messageList, offset);
                };
                up = true;
            }
            if (lines[offset - 1]) {
                mcdu.onDown = () => {
                    offset -= 1;
                    CDUAtcMessage.ShowPage(mcdu, messages, messageIndex, messageList, offset);
                };
                down = true;
            }
            mcdu.setArrows(up, down, false, false);
        }

        mcdu.setTemplate([
            ["ATC MSG DISPLAY"],
            ["", `${messageIndex + 1}/${messages.length}${msgArrows}`],
            [`{small}${lines[offset] ? lines[offset] : ""}{end}`, `${offset === 0 ? CDUAtcMessage.TranslateCpdlcResponse(message) : ""}`],
            [`${lines[offset + 1] ? lines[offset + 1] : ""}`],
            [`{small}${lines[offset + 2] ? lines[offset + 2] : ""}{end}`],
            [`${lines[offset + 3] ? lines[offset + 3] : ""}`],
            [`{small}${lines[offset + 4] ? lines[offset + 4] : ""}{end}`],
            [`${lines[offset + 5] ? lines[offset + 5] : ""}`],
            [`{small}${lines[offset + 6] ? lines[offset + 6] : ""}{end}`],
            [`${lines[offset + 7] ? lines[offset + 7] : ""}`],
            [`{small}${lines[offset + 8] ? lines[offset + 8] : ""}{end}`],
            [`\xa0${messageList ? "MSG RECORD" : "MONITORED MSG"}`],
            ["<RETURN", "PRINT*[color]cyan"]
        ]);

        mcdu.onNextPage = () => {
            const nextMesssageIndex = messageIndex + 1;
            if (nextMesssageIndex < messages.length) {
                CDUAtcMessage.ShowPage(mcdu, messages, messageList, nextMesssageIndex);
            }
        };

        mcdu.onPrevPage = () => {
            const previousMesssageIndex = messageIndex - 1;
            if (previousMesssageIndex >= 0) {
                CDUAtcMessage.ShowPage(mcdu, messages, messageList, previousMesssageIndex);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (messageList) {
                CDUAtcMessagesRecord.ShowPage(mcdu);
            } else {
                CDUAtcMessageMonitoring.ShowPage(mcdu);
            }
        };

        mcdu.onRightInput[5] = () => {
            mcdu.atsu.printMessage(message);
        };

    }
}
