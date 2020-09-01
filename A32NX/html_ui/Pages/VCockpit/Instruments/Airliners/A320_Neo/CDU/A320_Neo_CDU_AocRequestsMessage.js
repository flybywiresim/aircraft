class CDUAocRequestsMessage {
    static ShowPage(mcdu, lines, offset = 0) {
        mcdu.clearDisplay();

        mcdu.setTemplate([
            ["AOC RA-1"],
            ["00:00 VIEWED[color]green", "01/01"],
            ["RA-1"],
            [""],
            [lines[offset]],
            [""],
            [lines[offset + 1]],
            [""],
            [lines[offset + 2]],
            [""],
            ["*PRINT[color]blue"],
            [""],
            ["<RETURN"]
        ]);

        if (lines.length > 3) {
            mcdu.onUp = () => {
                if (lines[offset + 1]) offset += 1;
                CDUAocRequestsMessage.ShowPage(mcdu, lines, offset);
            }
            mcdu.onDown = () => {
                if (lines[offset - 1]) offset -= 1;
                CDUAocRequestsMessage.ShowPage(mcdu, lines, offset);
            }
        }

        mcdu.onLeftInput[5] = () => {
            CDUAocRequests.ShowPage(mcdu);
        }

    }
}