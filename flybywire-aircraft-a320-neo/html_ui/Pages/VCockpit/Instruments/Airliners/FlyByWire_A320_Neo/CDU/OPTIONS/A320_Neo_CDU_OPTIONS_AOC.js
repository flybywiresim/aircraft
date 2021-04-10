class CDU_OPTIONS_AOC {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const telexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED") === "ENABLED" ? "DISABLE>" : "ENABLE>";

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["\xa0SOURCE", "FREE TEXT\xa0"],
            ["<ATIS", telexStatus],
            ["\xa0SOURCE"],
            ["<METAR"],
            ["\xa0SOURCE"],
            ["<SIGMET[color]inop"],
            ["\xa0SOURCE"],
            ["<TAF"],
            [""],
            ["<SIMBRIEF"],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_ATIS.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_METAR.ShowPage(mcdu);
        };
        mcdu.onLeftInput[3] = () => {
            CDU_OPTIONS_TAF.ShowPage(mcdu);
        };
        mcdu.onLeftInput[4] = () => {
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };
        mcdu.onRightInput[0] = () => {
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
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
