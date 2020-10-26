class CDUAocMessagesSent {
    static ShowPage(mcdu, messages = null, offset = 5) {
        if (!messages) {
            messages = mcdu.getSentMessages();
        }
        mcdu.clearDisplay();

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 6;
        for (let i = 5; i > 0; i--) {
            let header = "";
            if (messages[offset - i]) {
                header += messages[offset - i]["time"] + " - SENT[color]green";
            }
            msgTimeHeaders[i] = header;
        }

        mcdu.setTemplate([
            ["AOC SENT MSGS"],
            [msgTimeHeaders[5]],
            [`${messages[offset - 5] ? "<" + messages[offset - 5]["type"] : "NO MESSAGES"}`],
            [msgTimeHeaders[4]],
            [`${messages[offset - 4] ? "<" + messages[offset - 4]["type"] : ""}`],
            [msgTimeHeaders[3]],
            [`${messages[offset - 3] ? "<" + messages[offset - 3]["type"] : ""}`],
            [msgTimeHeaders[2]],
            [`${messages[offset - 2] ? "<" + messages[offset - 2]["type"] : ""}`],
            [msgTimeHeaders[1]],
            [`${messages[offset - 1] ? "<" + messages[offset - 1]["type"] : ""}`],
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

        mcdu.onLeftInput[0] = () => {
            if (messages[offset - 5]) {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 5);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 5]);
                }
            }
        };

        mcdu.onLeftInput[1] = () => {
            if (messages[offset - 4]) {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 4);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 4]);
                }
            }
        };

        mcdu.onLeftInput[2] = () => {
            if (messages[offset - 3]) {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 3);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 3]);
                }
            }
        };

        mcdu.onLeftInput[3] = () => {
            if (messages[offset - 2]) {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 2);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 2]);
                }
            }
        };

        mcdu.onLeftInput[4] = () => {
            if (messages[offset - 1]) {
                const value = mcdu.inOut;
                mcdu.clearUserInput();
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.deleteSentMessage(offset - 1);
                    CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                } else {
                    CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset - 1]);
                }
            }
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}