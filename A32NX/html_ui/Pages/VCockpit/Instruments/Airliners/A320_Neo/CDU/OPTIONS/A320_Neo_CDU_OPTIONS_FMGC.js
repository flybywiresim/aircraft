class CDU_OPTIONS_FMGC {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedAccelAlt = parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        const storedInitBaroUnit = NXDataStore.get("CONFIG_INIT_BARO_UNIT", "IN HG");

        mcdu.setTemplate([
            ["A32NX OPTIONS FMGC"],
            ["\xa0INIT BARO", "ACCEL ALT\xa0"],
            [`*${storedInitBaroUnit}[color]cyan`, `{small}[FT]{end}{cyan}[${storedAccelAlt}]*{end}`],
            ["\xa0WEIGHT UNIT", "THR RED ALT\xa0"],
            ["*KG[color]inop", "{small}[FT]{end}{inop}[1500]*{end}"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_ACCEL_ALT", "1500");
            } else if (isNaN(value) || parseInt(value) < 1000 || parseInt(value) > 5000) {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_ACCEL_ALT", value);
            }
            CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[0] = (value) => {
            if (value !== "") {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                // We'll go from AUTO -> HPA -> IN HG -> AUTO.
                const newInitBaroUnit = storedInitBaroUnit === "AUTO" ? "HPA" :
                    storedInitBaroUnit === "HPA" ? "IN HG" : "AUTO";
                NXDataStore.set("CONFIG_INIT_BARO_UNIT", newInitBaroUnit);
            }
            CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
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
