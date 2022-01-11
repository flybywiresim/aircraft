class CDUAocMessagesReceived {
    static ShowPage(mcdu, messages = null, page = 0) {
        if (!messages) {
            messages = mcdu.atsuManager.aoc().inputMessages();
        }
        mcdu.clearDisplay();

        page = Math.min(Math.floor((messages.length - 1) / 5), page);

        mcdu.refreshPageCallback = () => {
            this.ShowPage(mcdu, null, page);
        };

        const offset = 5 + page * 5;

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 6;
        for (let i = 5; i > 0; i--) {
            let header = "";
            if (messages[offset - i]) {
                header += messages[offset - i].Timestamp.mcduTimestamp();
                if (messages[offset - i].Confirmed === true) {
                    header += " - VIEWED[color]green";
                } else {
                    header += " - NEW[color]green";
                }
            }
            msgTimeHeaders[i] = header;
        }

        let left = false, right = false;
        if (messages.length > ((page + 1) * 5)) {
            mcdu.onNextPage = () => {
                CDUAocMessagesReceived.ShowPage(mcdu, messages, page + 1);
            };
            right = true;
        }
        if (page > 0) {
            mcdu.onPrevPage = () => {
                CDUAocMessagesReceived.ShowPage(mcdu, messages, page - 1);
            };
            left = true;
        }
        mcdu.setArrows(false, false, left, right);

        mcdu.setTemplate([
            ["AOC RCVD MSGS"],
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

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = (value) => {
                if (messages[offset - 5 + i]) {
                    if (value === FMCMainDisplay.clrValue) {
                        mcdu.deleteMessage(offset - 5 + i);
                        CDUAocMessagesReceived.ShowPage(mcdu, messages, page);
                    } else {
                        CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 5 + i]);
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
