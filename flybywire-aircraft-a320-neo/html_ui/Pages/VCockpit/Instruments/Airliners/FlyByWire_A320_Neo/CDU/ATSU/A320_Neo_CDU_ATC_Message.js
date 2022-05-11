class CDUAtcMessage {
    static TranslateCpdlcResponse(message) {
        let retval;

        if (message.Content[0].TypeId === "DM0") {
            retval = "WILC";
        } else if (message.Content[0].TypeId === "UM0" || message.Content[0].TypeId === "DM1") {
            retval = "UNBL";
        } else if (message.Content[0].TypeId === "UM1" || message.Content[0].TypeId === "DM2") {
            retval = "STBY";
        } else if (message.Content[0].TypeId === "UM3" || message.Content[0].TypeId === "DM3") {
            retval = "ROGR";
        } else if (message.Content[0].TypeId === "UM4" || message.Content[0].TypeId === "DM4") {
            retval = "AFRM";
        } else if (message.Content[0].TypeId === "UM5" || message.Content[0].TypeId === "DM5") {
            retval = "NEG";
        } else {
            return "";
        }

        let color = '{cyan}';
        if (message.ComStatus === Atsu.AtsuMessageComStatus.Failed) {
            color = '{red}';
        }
        retval = `${color}{small}${retval}{end}{end}`;

        return retval;
    }

    static ShowPage(mcdu, messages, messageIndex, offset = 0) {
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
                    CDUAtcMessage.ShowPage(mcdu, messages, messageIndex, offset);
                };
                up = true;
            }
            if (lines[offset - 1]) {
                mcdu.onDown = () => {
                    offset -= 1;
                    CDUAtcMessage.ShowPage(mcdu, messages, messageIndex, offset);
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
            ["\xa0MSG RECORD"],
            ["<RETURN", "PRINT*[color]cyan"]
        ]);

        mcdu.onNextPage = () => {
            const nextMesssageIndex = messageIndex + 1;
            if (nextMesssageIndex < messages.length) {
                CDUAtcMessage.ShowPage(mcdu, messages, nextMesssageIndex);
            }
        };

        mcdu.onPrevPage = () => {
            const previousMesssageIndex = messageIndex - 1;
            if (previousMesssageIndex >= 0) {
                CDUAtcMessage.ShowPage(mcdu, messages, previousMesssageIndex);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMessagesRecord.ShowPage(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            mcdu.atsu.printMessage(message);
        };

    }
}
