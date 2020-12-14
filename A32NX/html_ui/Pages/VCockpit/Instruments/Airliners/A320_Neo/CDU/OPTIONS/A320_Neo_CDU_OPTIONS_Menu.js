class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

        const storedTelexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
        const storedAccelAlt = parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        const storedDMCTestTime = parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15"));
        const storedInitBaroUnit = NXDataStore.get("CONFIG_INIT_BARO_UNIT", "IN HG");
        const storedUsingMetric = NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1");

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
            ["<METAR SRC", `${storedAccelAlt} FT.>[color]cyan`],
            ["AOC[color]green", "DMC SELF-TEST[color]green"],
            ["<SIGMET SRC[color]inop", `${storedDMCTestTime} SEC.>[color]cyan`],
            ["AOC[color]green", "INIT BARO[color]green"],
            ["<TAF SRC", `${storedInitBaroUnit}>[color]cyan`],
            ["FREE TEXT[color]green", "UNIT SYSTEM[color]green"],
            [telexStatus, `${parseInt(storedUsingMetric) === 1 ? "METRIC" : "IMPERIAL"}>[color]cyan`],
            [""],
            ["<RETURN[color]cyan"]
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
        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value != "") {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                // We'll go from AUTO -> HPA -> IN HG -> AUTO.
                const newInitBaroUnit = storedInitBaroUnit === "AUTO" ? "HPA" :
                    storedInitBaroUnit === "HPA" ? "IN HG" : "AUTO";
                NXDataStore.set("CONFIG_INIT_BARO_UNIT", newInitBaroUnit);
            }
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = (value) => {
            if (value !== "") {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_USING_METRIC_UNIT", parseInt(storedUsingMetric) === 1 ? "2.20462" : "1");
            }
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
