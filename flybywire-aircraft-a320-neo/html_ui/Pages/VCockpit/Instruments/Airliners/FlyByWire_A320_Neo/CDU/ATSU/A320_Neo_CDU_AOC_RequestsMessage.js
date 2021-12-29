class CDUAocRequestsMessage {
    static ShowPage(mcdu, message, offset = 0) {
        mcdu.clearDisplay();
        const lines = [];
        message["content"].forEach(element => lines.push(element.replace(/,/g, "")));
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

        if (lines.length > 8) {
            let up = false;
            let down = false;
            if (lines[offset + 1]) {
                mcdu.onUp = () => {
                    offset += 1;
                    CDUAocRequestsMessage.ShowPage(mcdu, message, offset);
                };
                up = true;
            }
            if (lines[offset - 1]) {
                mcdu.onDown = () => {
                    offset -= 1;
                    CDUAocRequestsMessage.ShowPage(mcdu, message, offset);
                };
                down = true;
            }
            mcdu.setArrows(up, down, false, false);
        }

        mcdu.setTemplate([
            ["AOC MSG DISPLAY"],
            [`${message["opened"]} VIEWED[color]green`, `${currentMesssageCount}/${mcdu.messages.length}${msgArrows}`],
            [`{small}${lines[offset] ? lines[offset] : ""}{end}`],
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

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMessagesReceived.ShowPage(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            mcdu.printPage([lines.join(' ')]);
        };

    }
}
