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
        }

        const currentMesssageIndex = mcdu.getMessageIndex(message["id"]);
        const currentMesssageCount = currentMesssageIndex + 1;

        mcdu.setTemplate([
            ["AOC MSG DISPLAY"],
            [`${message["opened"]} VIEWED[color]green`, `${currentMesssageCount}/${mcdu.messages.length}`],
            [`${lines[offset] ? lines[offset] : ""}`],
            [""],
            [`${lines[offset + 1] ? lines[offset + 1] : ""}`],
            [""],
            [`${lines[offset + 2] ? lines[offset + 2] : ""}`],
            [""],
            [`${lines[offset + 3] ? lines[offset + 3] : ""}`],
            [""],
            ["*PRINT[color]blue"],
            [""],
            ["<RETURN"]
        ]);

        if (lines.length > 3) {
            mcdu.onUp = () => {
                if (lines[offset + 1]) offset += 1;
                CDUAocRequestsMessage.ShowPage(mcdu, message, offset);
            }
            mcdu.onDown = () => {
                if (lines[offset - 1]) offset -= 1;
                CDUAocRequestsMessage.ShowPage(mcdu, message, offset);
            }
        }


        mcdu.onNextPage = () => {
            const nextMessage = mcdu.getMessage(message["id"], 'next')
            if (nextMessage) CDUAocRequestsMessage.ShowPage(mcdu, nextMessage);
        }

        mcdu.onPrevPage = () => {
            const previousMessage = mcdu.getMessage(message["id"], 'previous')
            if (previousMessage) CDUAocRequestsMessage.ShowPage(mcdu, previousMessage);
        }


        mcdu.onLeftInput[5] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        }

    }
}