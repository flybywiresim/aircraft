class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

        const storedUsingMetric = parseInt(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));
          
        // `${storedUsingMetric === 1 ? "KG" : "LBS"}>[color]cyan`

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            [""],
            ["<AOC", "REALISM>"],
            [""],
            ["<FMGC"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_AOC.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = () => {
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUMenuPage.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = (value) => {
            if (value !== "") {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_USING_METRIC_UNIT", storedUsingMetric === 1 ? "2.20462" : "1");
            }
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
