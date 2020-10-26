class CDUAocMessageSentDetail {
    static ShowPage(mcdu, message, offset = 0) {
        mcdu.clearDisplay();
        const lines = message["content"];

        const currentMesssageIndex = mcdu.getSentMessageIndex(message["id"]);
        const currentMesssageCount = currentMesssageIndex + 1;
        const msgArrows = mcdu.sentMessages.length > 1 ? " {}" : "";

        mcdu.setTemplate([
            ["AOC SENT MSG"],
            [`[b-text]${message["time"]} SENT[color]green`, `${currentMesssageCount}/${mcdu.sentMessages.length}${msgArrows}`],
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
            ["<SENT MSGS", "PRINT*[color]blue"]
        ]);

        if (lines.length > 8) {
            mcdu.onUp = () => {
                if (lines[offset + 1]) {
                    offset += 1;
                }
                CDUAocMessageSentDetail.ShowPage(mcdu, message, offset);
            };
            mcdu.onDown = () => {
                if (lines[offset - 1]) {
                    offset -= 1;
                }
                CDUAocMessageSentDetail.ShowPage(mcdu, message, offset);
            };
        }

        mcdu.onNextPage = () => {
            const nextMessage = mcdu.getSentMessage(message["id"], 'next');
            if (nextMessage) {
                CDUAocMessageSentDetail.ShowPage(mcdu, nextMessage);
            }
        };

        mcdu.onPrevPage = () => {
            const previousMessage = mcdu.getSentMessage(message["id"], 'previous');
            if (previousMessage) {
                CDUAocMessageSentDetail.ShowPage(mcdu, previousMessage);
            }
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMessagesSent.ShowPage(mcdu);
        };

    }
}