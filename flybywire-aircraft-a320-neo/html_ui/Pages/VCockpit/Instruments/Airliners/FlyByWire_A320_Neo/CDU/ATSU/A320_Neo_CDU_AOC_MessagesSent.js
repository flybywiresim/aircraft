class CDUAocMessagesSent {
    static ShowPage(mcdu, messages = null, offset = 5) {
        if (!messages) {
            messages = mcdu.atsuManager.aoc.outputMessages();
        }
        mcdu.clearDisplay();

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 6;
        for (let i = 5; i > 0; i--) {
            let header = "";
            if (messages.length > (offset - i) && messages[offset - i]) {
                header += `${messages[offset - i].Timestamp.mcduTimestamp()} TO ${messages[offset - i].Station}[color]green`;
            }
            msgTimeHeaders[i] = header;
        }

        mcdu.setTemplate([
            ["AOC SENT MSGS"],
            [msgTimeHeaders[5]],
            [`${messages[offset - 5] ? "<" + translateAtsuMessageType(messages[offset - 5].Type) : "NO MESSAGES"}`],
            [msgTimeHeaders[4]],
            [`${messages[offset - 4] ? "<" + translateAtsuMessageType(messages[offset - 4].Type) : ""}`],
            [msgTimeHeaders[3]],
            [`${messages[offset - 3] ? "<" + translateAtsuMessageType(messages[offset - 3].Type) : ""}`],
            [msgTimeHeaders[2]],
            [`${messages[offset - 2] ? "<" + translateAtsuMessageType(messages[offset - 2].Type) : ""}`],
            [msgTimeHeaders[1]],
            [`${messages[offset - 1] ? "<" + translateAtsuMessageType(messages[offset - 1].Type) : ""}`],
            [""],
            ["<RETURN"]
        ]);

        if (messages.length > 4) {
            mcdu.onNextPage = () => {
                if (messages[offset - 1]) {
                    offset *= 2;
                }
                CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
            };
            mcdu.onPrevPage = () => {
                if (messages[offset - 1]) {
                    offset /= 2;
                }
                CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
            };
        }

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = (value) => {
                if (messages[offset - 5 + i]) {
                    if (value === FMCMainDisplay.clrValue) {
                        mcdu.atsuManager.removeMessage(messages[offset - 5 + i].UniqueMessageID);
                        CDUAocMessagesSent.ShowPage(mcdu, null, page);
                    } else {
                        CDUAocMessageSentDetail.ShowPage(mcdu, messages, offset - 5 + i);
                    }
                }
            };
        }

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}
