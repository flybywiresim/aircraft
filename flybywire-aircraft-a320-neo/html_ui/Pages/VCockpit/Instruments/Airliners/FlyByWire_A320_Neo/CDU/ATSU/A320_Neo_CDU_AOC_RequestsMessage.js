class CDUAocRequestsMessage {
    static ShowPage(fmc, mcdu, message, offset = 0) {
        mcdu.setCurrentPage(); // no refresh

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

        const currentMesssageIndex = fmc.getMessageIndex(message["id"]);
        const currentMesssageCount = currentMesssageIndex + 1;
        const msgArrows = fmc.messages.length > 1 ? " {}" : "";

        mcdu.setTemplate([
            ["AOC MSG DISPLAY"],
            [`[b-text]${message["opened"]} VIEWED[color]green`, `${currentMesssageCount}/${fmc.messages.length}${msgArrows}`],
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
            ["<RCVD MSGS", "PRINT*[color]cyan"]
        ]);

        if (lines.length > 8) {
            let up = false;
            let down = false;
            if (lines[offset + 1]) {
                mcdu.onUp = () => {
                    offset += 1;
                    CDUAocRequestsMessage.ShowPage(fmc, mcdu, message, offset);
                };
                up = true;
            }
            if (lines[offset - 1]) {
                mcdu.onDown = () => {
                    offset -= 1;
                    CDUAocRequestsMessage.ShowPage(fmc, mcdu, message, offset);
                };
                down = true;
            }
            mcdu.setArrows(up, down, false, false);
        }

        mcdu.onNextPage = () => {
            const nextMessage = fmc.getMessage(message["id"], 'next');
            if (nextMessage) {
                CDUAocRequestsMessage.ShowPage(fmc, mcdu, nextMessage);
            }
        };

        mcdu.onPrevPage = () => {
            const previousMessage = fmc.getMessage(message["id"], 'previous');
            if (previousMessage) {
                CDUAocRequestsMessage.ShowPage(fmc, mcdu, previousMessage);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMessagesReceived.ShowPage(fmc, mcdu);
        };

        mcdu.onRightInput[5] = () => {
            fmc.printPage([lines.join(' ')]);
        };

    }
}
