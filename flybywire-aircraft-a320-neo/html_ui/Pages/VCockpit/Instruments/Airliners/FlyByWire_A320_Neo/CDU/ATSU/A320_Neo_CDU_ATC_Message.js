class CDUAtcMessage {
    static TranslateCpdlcResponse(message) {
        let retval;

        switch (message.ResponseType) {
            case Atsu.CpdlcMessageResponse.Standby:
                retval = "STBY";
                break;
            case Atsu.CpdlcMessageResponse.Wilco:
                retval = "WILC";
                break;
            case Atsu.CpdlcMessageResponse.Roger:
                retval = "ROGR";
                break;
            case Atsu.CpdlcMessageResponse.Negative:
                retval = "NEG";
                break;
            case Atsu.CpdlcMessageResponse.Unable:
                retval = "UNBL";
                break;
            case Atsu.CpdlcMessageResponse.Acknowledge:
                retval = "ACK";
                break;
            case Atsu.CpdlcMessageResponse.Affirm:
                retval = "AFRM";
                break;
            case Atsu.CpdlcMessageResponse.Refuse:
                retval = "REF";
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

    static ShowPage(mcdu, messages, messageIndex, offset = 0) {
        mcdu.clearDisplay();
        const message = messages[messageIndex];
        const lines = message.serialize(Atsu.AtsuMessageSerializationFormat.MCDU).split("\n");

        // mark message as read
        mcdu.atsuManager.messageRead(message.UniqueMessageID);

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
            ["RETURN TO"],
            ["<RCVD MSGS", "PRINT*[color]cyan"]
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
            mcdu.atsuManager.printMessage(message);
        };

    }
}
