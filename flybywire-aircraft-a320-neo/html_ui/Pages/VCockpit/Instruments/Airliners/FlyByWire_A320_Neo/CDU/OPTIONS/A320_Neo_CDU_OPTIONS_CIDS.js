class CDU_OPTIONS_CIDS {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedUsingNPD = parseInt(NXDataStore.get("CONFIG_USING_PORTABLE_DEVICES", "0"));
        const displayCurrentOption = storedUsingNPD ? "NO PORT DEVC" : "NO SMOKING";

        mcdu.setTemplate([
            ["A32NX OPTIONS CIDS"],
            ["\xa0PAX SIGNS"],
            [`*${displayCurrentOption}[color]cyan`],
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

        mcdu.onLeftInput[0] = (value) => {
            if (value !== "") {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                const newNPDOption = storedUsingNPD ? "0" : "1";
                NXDataStore.set("CONFIG_USING_PORTABLE_DEVICES", newNPDOption);
            }
            CDU_OPTIONS_CIDS.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
    }
}
