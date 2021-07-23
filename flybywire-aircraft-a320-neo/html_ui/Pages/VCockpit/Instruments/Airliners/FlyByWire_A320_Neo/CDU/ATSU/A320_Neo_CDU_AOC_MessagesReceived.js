class CDUAocMessagesReceived {
    static ShowPage(fmc, mcdu, messages = null, page = 0) {
        mcdu.setCurrentPage(() => {
            this.ShowPage(fmc, mcdu, null, page);
        }, "ATSU");

        if (!messages) {
            messages = fmc.getMessages();
        }

        page = Math.min(Math.floor((Math.max(0, messages.length - 1)) / 5), page);

        const offset = 5 + page * 5;

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 6;
        for (let i = 5; i > 0; i--) {
            let header = "";
            if (messages[offset - i]) {
                header += messages[offset - i]["time"];
                if (messages[offset - i]["opened"]) {
                    header += " - VIEWED[color]green";
                } else {
                    header += " - NEW[color]green";
                }
            }
            msgTimeHeaders[i] = header;
        }

        mcdu.setTemplate([
            ["AOC RCVD MSGS"],
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

        let left = false, right = false;
        if (messages.length > ((page + 1) * 5)) {
            mcdu.onNextPage = () => {
                CDUAocMessagesReceived.ShowPage(fmc, mcdu, messages, page + 1);
            };
            right = true;
        }
        if (page > 0) {
            mcdu.onPrevPage = () => {
                CDUAocMessagesReceived.ShowPage(fmc, mcdu, messages, page - 1);
            };
            left = true;
        }
        mcdu.setArrows(false, false, left, right);

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = (value) => {
                if (messages[offset - 5 + i]) {
                    if (value === FMCMainDisplay.clrValue) {
                        fmc.deleteMessage(offset - 5 + i);
                        mcdu.requestUpdate();
                    } else {
                        CDUAocRequestsMessage.ShowPage(fmc, mcdu, messages[offset - 5 + i]);
                    }
                }
            };
        }

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(fmc, mcdu);
        };
    }
}
