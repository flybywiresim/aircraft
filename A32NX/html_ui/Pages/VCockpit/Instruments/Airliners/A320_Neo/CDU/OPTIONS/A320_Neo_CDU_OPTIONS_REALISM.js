class CDU_OPTIONS_REALISM {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedAccelAlt = parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        const storedDMCTestTime = parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15"));
        const storedInitBaroUnit = NXDataStore.get("CONFIG_INIT_BARO_UNIT", "IN HG");

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["ADIRS", "ACCEL ALT"],
            ["<ALIGN TIME", `${storedAccelAlt} FT.>[color]cyan`],
            ["DMC SELF-TEST", "INIT BARO"],
            [`<${storedDMCTestTime} SEC.[color]cyan`, `${storedInitBaroUnit}>[color]cyan`],
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
            CDU_OPTIONS_ADIRS.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", "15");
            } else if (isNaN(value) || parseInt(value) < 5 || parseInt(value) > 40) {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", value);
            }
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_ACCEL_ALT", "1500");
            } else if (isNaN(value) || parseInt(value) < 1000 || parseInt(value) > 5000) {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_ACCEL_ALT", value);
            }
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };
        mcdu.onRightInput[1] = (value) => {
            if (value !== "") {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                // We'll go from AUTO -> HPA -> IN HG -> AUTO.
                const newInitBaroUnit = storedInitBaroUnit === "AUTO" ? "HPA" :
                    storedInitBaroUnit === "HPA" ? "IN HG" : "AUTO";
                NXDataStore.set("CONFIG_INIT_BARO_UNIT", newInitBaroUnit);
            }
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.rightInputDelay[1] = () => {
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
