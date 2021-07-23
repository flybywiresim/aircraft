class CDUAtcMessagesRecord {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAtcMessagesRecord.ShowPage(fmc, mcdu);
        });

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
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };
    }
}
