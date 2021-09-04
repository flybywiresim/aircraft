class CDU_OPTIONS_AOC {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const telexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED") === "ENABLED" ? "DISABLE>" : "ENABLE>";

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["", "FREE TEXT\xa0"],
            ["", telexStatus],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<SIMBRIEF"],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[4] = () => {
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };
        mcdu.onRightInput[0] = () => {
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
