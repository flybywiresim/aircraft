class CDUAtcReportAtis {
    static ConvertAtisInformation(info) {
        switch (info) {
            case "A":
                return "ALPHA";
            case "B":
                return "BRAVO";
            case "C":
                return "CHARLIE";
            case "D":
                return "DELTA";
            case "E":
                return "ECHO";
            case "F":
                return "FOXTROT";
            case "G":
                return "GOLF";
            case "H":
                return "HOTEL";
            case "I":
                return "INDIA";
            case "J":
                return "JULIETT";
            case "K":
                return "KILO";
            case "L":
                return "LIMA";
            case "M":
                return "MIKE";
            case "N":
                return "NOVEMBER";
            case "O":
                return "OSCAR";
            case "P":
                return "PAPA";
            case "Q":
                return "QUEBEC";
            case "R":
                return "ROMEO";
            case "S":
                return "SIERRA";
            case "T":
                return "TANGO";
            case "U":
                return "UNIFORM";
            case "V":
                return "VICTOR";
            case "W":
                return "WHISKEY";
            case "X":
                return "XRAY";
            case "Y":
                return "YANKEE";
            case "Z":
                return "ZULU";
            default:
                return "";
        }
    }

    static ShowPage(mcdu, title, messages, messageIndex, offset = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCAtisView;

        const message = messages[messageIndex];
        let serialized = message.serialize(Atsu.AtsuMessageSerializationFormat.MCDU);
        serialized = serialized.replace(/{green}|{amber}|{white}|{end}/gi, "");
        const lines = serialized.split("\n");
        lines.shift();
        lines.pop();

        if (lines.length > 8) {
            let up = false;
            let down = false;
            if (lines[offset - 8]) {
                mcdu.onUp = () => {
                    offset -= 8;
                    CDUAtcReportAtis.ShowPage(mcdu, title, messages, messageIndex, offset);
                };
                up = true;
            }
            if (lines[offset + 8]) {
                mcdu.onDown = () => {
                    offset += 8;
                    CDUAtcReportAtis.ShowPage(mcdu, title, messages, messageIndex, offset);
                };
                down = true;
            }
            mcdu.setArrows(up, down, false, false);
        }

        const pageCount = Math.round(lines.length / 8 + 0.5);
        const currentPage = Math.floor(offset / 8) + 1;

        let prevAtis = "\xa0PREV ATIS";
        if (messages.length > messageIndex + 1) {
            prevAtis = "<PREV ATIS";
        }

        mcdu.setTemplate([
            [`${title} ATIS`, `${pageCount !== 1 ? currentPage : ""}`, `${pageCount !== 1 ? pageCount : ""}`],
            [`[b-text]${title.replace("/", " ")}[color]white`, `[b-text]${CDUAtcReportAtis.ConvertAtisInformation(messages[messageIndex].Information)} ${messages[messageIndex].Timestamp.dcduTimestamp()}`],
            [`[s-text]${lines[offset] ? lines[offset] : ""}`],
            [`[b-text]${lines[offset + 1] ? lines[offset + 1] : ""}`],
            [`[s-text]${lines[offset + 2] ? lines[offset + 2] : ""}`],
            [`[b-text]${lines[offset + 3] ? lines[offset + 3] : ""}`],
            [`[s-text]${lines[offset + 4] ? lines[offset + 4] : ""}`],
            [`[b-text]${lines[offset + 5] ? lines[offset + 5] : ""}`],
            [`[s-text]${lines[offset + 6] ? lines[offset + 6] : ""}`],
            [`[b-text]${lines[offset + 7] ? lines[offset + 7] : ""}`],
            [prevAtis],
            ["\xa0ATIS MENU"],
            ["<RETURN", "PRINT*[color]cyan"]
        ]);

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            if (messages.length > (messageIndex + 1)) {
                CDUAtcReportAtis.ShowPage(mcdu, title, messages, messageIndex + 1, offset);
            } else {
                mcdu.addNewMessage(NXSystemMessages.noPreviousAtis);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcAtisMenu.ShowPage(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            mcdu.atsuManager.printMessage(message);
        };

    }
}
