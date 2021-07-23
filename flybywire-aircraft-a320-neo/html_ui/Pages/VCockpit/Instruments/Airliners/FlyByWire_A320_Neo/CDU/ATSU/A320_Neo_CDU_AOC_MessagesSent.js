class CDUAocMessagesSent {
    static ShowPage(fmc, mcdu, messages = null, offset = 5) {
        mcdu.setCurrentPage(() => {
            CDUAocMessagesSent.ShowPage(fmc, mcdu, null, offset);
        }, "ATSU");

        if (!messages) {
            messages = fmc.getSentMessages();
        }

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
                CDUAocMessagesSent.ShowPage(fmc, mcdu, messages, offset);
            };
            mcdu.onPrevPage = () => {
                if (messages[offset - 1]) {
                    offset /= 2;
                }
                CDUAocMessagesSent.ShowPage(fmc, mcdu, messages, offset);
            };
        }

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[0] = (value) => {
            if (messages[offset - 5]) {
                if (value === FMCMainDisplay.clrValue) {
                    fmc.deleteSentMessage(offset - 5);
                    mcdu.requestUpdate();
                } else {
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, messages[offset - 5]);
                }
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[1] = (value) => {
            if (messages[offset - 4]) {
                if (value === FMCMainDisplay.clrValue) {
                    fmc.deleteSentMessage(offset - 4);
                    mcdu.requestUpdate();
                } else {
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, messages[offset - 4]);
                }
            }
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[2] = (value) => {
            if (messages[offset - 3]) {
                if (value === FMCMainDisplay.clrValue) {
                    fmc.deleteSentMessage(offset - 3);
                    mcdu.requestUpdate();
                } else {
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, messages[offset - 3]);
                }
            }
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[3] = (value) => {
            if (messages[offset - 2]) {
                if (value === FMCMainDisplay.clrValue) {
                    fmc.deleteSentMessage(offset - 2);
                    mcdu.requestUpdate();
                } else {
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, messages[offset - 2]);
                }
            }
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[4] = (value) => {
            if (messages[offset - 1]) {
                if (value === FMCMainDisplay.clrValue) {
                    fmc.deleteSentMessage(offset - 1);
                    mcdu.requestUpdate();
                } else {
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, messages[offset - 1]);
                }
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(fmc, mcdu);
        };
    }
}
