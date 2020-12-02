class CDUAtcMessagesRecord {
    static ShowPage(mcdu, messages = null, offset = 5) {
        mcdu.clearDisplay();

        mcdu.setTemplate([
            ["MSG RECORD"],
            ["NO MESSAGES"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
