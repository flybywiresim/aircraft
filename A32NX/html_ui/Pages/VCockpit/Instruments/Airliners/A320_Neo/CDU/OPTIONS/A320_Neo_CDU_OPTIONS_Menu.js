class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

        const storedTelexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
        const storedAccelAlt = parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        const storedDMCTestTime = parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15"));

        let telexStatus;
        if (storedTelexStatus == "ENABLED") {
            telexStatus = "<DISABLE";
        } else {
            telexStatus = "<ENABLE";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["AOC[color]green", "ADIRS[color]green"],
            ["<ATIS SRC", "ALIGN TIME>"],
            ["AOC[color]green", "ACCEL ALT[color]green"],
            ["<METAR SRC", `${storedAccelAlt} FT.>[color]blue`],
            ["AOC[color]green", "DMC SELF-TEST[color]green"],
            ["<SIGMET SRC[color]inop", `${storedDMCTestTime} SEC.>[color]blue`],
            ["AOC[color]green"],
            ["<TAF SRC"],
            ["FREE TEXT[color]green"],
            [telexStatus],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_ATIS.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_METAR.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDU_OPTIONS_TAF.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUMenuPage.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDU_OPTIONS_ADIRS.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_ACCEL_ALT", "1500");
            } else if (isNaN(value) || parseInt(value) < 1000 || parseInt(value) > 5000) {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_ACCEL_ALT", value);
            }
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", "15");
            } else if (isNaN(value) || parseInt(value) < 5 || parseInt(value) > 40) {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", value);
            }
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
