class CDUAocRequestsMessage {
    static ShowPage(mcdu, message, offset = 0) {
        mcdu.clearDisplay();
        const lines = message["content"];
        if (!message["opened"]) {
            let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
            if (timeValue) {
                const seconds = Number.parseInt(timeValue);
                const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
                timeValue = displayTime.toString();
            }
            message["opened"] = timeValue.substring(0, 5);
            const cMsgCnt = SimVar.GetSimVarValue("L:A32NX_COMPANY_MSG_COUNT", "Number");
            SimVar.SetSimVarValue("L:A32NX_COMPANY_MSG_COUNT", "Number", cMsgCnt <= 1 ? 0 : cMsgCnt - 1);
        }

        const currentMesssageIndex = mcdu.getMessageIndex(message["id"]);
        const currentMesssageCount = currentMesssageIndex + 1;
        const msgArrows = mcdu.messages.length > 1 ? " {}" : "";

        mcdu.setTemplate([
            ["AOC MSG DISPLAY"],
            [`[b-text]${message["opened"]} VIEWED[color]green`, `${currentMesssageCount}/${mcdu.messages.length}${msgArrows}`],
            [`[s-text]${lines[offset] ? lines[offset] : ""}`],
            [`[b-text]${lines[offset + 1] ? lines[offset + 1] : ""}`],
            [`[s-text]${lines[offset + 2] ? lines[offset + 2] : ""}`],
            [`[b-text]${lines[offset + 3] ? lines[offset + 3] : ""}`],
            [`[s-text]${lines[offset + 4] ? lines[offset + 4] : ""}`],
            [`[b-text]${lines[offset + 5] ? lines[offset + 5] : ""}`],
            [`[s-text]${lines[offset + 6] ? lines[offset + 6] : ""}`],
            [`[b-text]${lines[offset + 7] ? lines[offset + 7] : ""}`],
            [`[s-text]${lines[offset + 8] ? lines[offset + 8] : ""}`],
            ["RETURN TO"],
            ["<RCVD MSGS", "PRINT*[color]blue"]
        ]);

        if (lines.length > 8) {
            mcdu.onUp = () => {
                if (lines[offset + 1]) {
                    offset += 1;
                }
                CDUAocRequestsMessage.ShowPage(mcdu, message, offset);
            };
            mcdu.onDown = () => {
                if (lines[offset - 1]) {
                    offset -= 1;
                }
                CDUAocRequestsMessage.ShowPage(mcdu, message, offset);
            };
        }

        mcdu.onNextPage = () => {
            const nextMessage = mcdu.getMessage(message["id"], 'next');
            if (nextMessage) {
                CDUAocRequestsMessage.ShowPage(mcdu, nextMessage);
            }
        };

        mcdu.onPrevPage = () => {
            const previousMessage = mcdu.getMessage(message["id"], 'previous');
            if (previousMessage) {
                CDUAocRequestsMessage.ShowPage(mcdu, previousMessage);
            }
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        };

    }
}