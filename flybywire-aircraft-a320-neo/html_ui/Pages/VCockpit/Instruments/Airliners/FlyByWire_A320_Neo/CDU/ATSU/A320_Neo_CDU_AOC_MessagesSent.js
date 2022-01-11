class CDUAocMessagesSent {
    static ShowPage(mcdu, messages = null, offset = 5) {
        if (!messages) {
            messages = mcdu.atsuManager.aoc().outputMessages();
        }
        mcdu.clearDisplay();

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 6;
        for (let i = 5; i > 0; i--) {
            let header = "";
            if (messages[offset - i]) {
                header += messages[offset - i].Timestamp.mcduTimestamp() + " - SENT[color]green";
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

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[0] = (value) => {
            if (messages[offset - 5]) {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 5);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 5]);
                }
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[1] = (value) => {
            if (messages[offset - 4]) {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 4);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 4]);
                }
            }
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[2] = (value) => {
            if (messages[offset - 3]) {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 3);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 3]);
                }
            }
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[3] = (value) => {
            if (messages[offset - 2]) {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 2);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 2]);
                }
            }
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[4] = (value) => {
            if (messages[offset - 1]) {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 1);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 1]);
                }
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}
