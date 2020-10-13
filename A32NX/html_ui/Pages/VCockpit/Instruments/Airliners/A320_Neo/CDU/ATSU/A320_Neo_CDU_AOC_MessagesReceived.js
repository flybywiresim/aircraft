class CDUAocMessagesReceived {
    static ShowPage(mcdu, messages = null, offset = 5) {
        if (!messages) {
            messages = mcdu.getMessages();
        }
        mcdu.clearDisplay();

        mcdu.setTemplate([
            ["AOC RECEIVED MESSAGES"],
            [`${messages[offset - 5] ? messages[offset - 5]["time"] : ""}`],
            [`${messages[offset - 5] ? "<" + messages[offset - 5]["type"] : "NO MESSAGES"}`],
            [`${messages[offset - 4] ? messages[offset - 4]["time"] : ""}`],
            [`${messages[offset - 4] ? "<" + messages[offset - 4]["type"] : ""}`],
            [`${messages[offset - 3] ? messages[offset - 3]["time"] : ""}`],
            [`${messages[offset - 3] ? "<" + messages[offset - 3]["type"] : ""}`],
            [`${messages[offset - 2] ? messages[offset - 2]["time"] : ""}`],
            [`${messages[offset - 2] ? "<" + messages[offset - 2]["type"] : ""}`],
            [`${messages[offset - 1] ? messages[offset - 4]["time"] : ""}`],
            [`${messages[offset - 1] ? "<" + messages[offset - 4]["type"] : ""}`],
            [""],
            ["<RETURN"]
        ]);

        if (messages.length > 4) {
            mcdu.onNextPage = () => {
                if (messages[offset - 1]) offset *= 2;
                CDUAocMessagesReceived.ShowPage(mcdu, messages, offset);
            }
            mcdu.onPrevPage = () => {
                if (messages[offset - 1]) offset /= 2;
                CDUAocMessagesReceived.ShowPage(mcdu, messages, offset);
            }
        }

        mcdu.onLeftInput[0] = () => {
            if (messages[offset - 5]) {
                CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 5]);
            }
        }

        mcdu.onLeftInput[1] = () => {
            if (messages[offset - 4]) {
                CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 4]);
            }
        }

        mcdu.onLeftInput[2] = () => {
            if (messages[offset - 3]) {
                CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 3]);
            }
        }

        mcdu.onLeftInput[3] = () => {
            if (messages[offset - 2]) {
                CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 2]);
            }
        }

        mcdu.onLeftInput[4] = () => {
            if (messages[offset - 1]) {
                CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 1]);
            }
        }

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        }
    }
}