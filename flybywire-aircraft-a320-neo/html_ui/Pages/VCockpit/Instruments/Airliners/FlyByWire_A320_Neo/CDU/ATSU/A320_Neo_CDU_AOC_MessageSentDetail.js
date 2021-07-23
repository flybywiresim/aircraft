class CDUAocMessageSentDetail {
    static ShowPage(fmc, mcdu, message, offset = 0) {
        mcdu.setCurrentPage(null, "ATSU");

        const lines = message["content"];

        const currentMesssageIndex = fmc.getSentMessageIndex(message["id"]);
        const currentMesssageCount = currentMesssageIndex + 1;
        const msgArrows = fmc.sentMessages.length > 1 ? " {}" : "";

        mcdu.setTemplate([
            ["AOC SENT MSG"],
            [`[b-text]${message["time"]} SENT[color]green`, `${currentMesssageCount}/${fmc.sentMessages.length}${msgArrows}`],
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
            ["<SENT MSGS", "PRINT*[color]cyan"]
        ]);

        if (lines.length > 8) {
            let up = false;
            let down = false;
            if (lines[offset + 1]) {
                mcdu.onUp = () => {
                    offset += 1;
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, message, offset);
                };
                up = true;
            }
            if (lines[offset - 1]) {
                mcdu.onDown = () => {
                    offset -= 1;
                    CDUAocMessageSentDetail.ShowPage(fmc, mcdu, message, offset);
                };
                down = true;
            }
            mcdu.setArrows(up, down, false, false);
        }

        mcdu.onNextPage = () => {
            const nextMessage = fmc.getSentMessage(message["id"], 'next');
            if (nextMessage) {
                CDUAocMessageSentDetail.ShowPage(fmc, mcdu, nextMessage);
            }
        };

        mcdu.onPrevPage = () => {
            const previousMessage = fmc.getSentMessage(message["id"], 'previous');
            if (previousMessage) {
                CDUAocMessageSentDetail.ShowPage(fmc, mcdu, previousMessage);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMessagesSent.ShowPage(fmc, mcdu);
        };

        mcdu.onRightInput[5] = () => {
            fmc.printPage(lines);
        };

    }
}
