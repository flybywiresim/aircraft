class CDU_OPTIONS_SIMBRIEF {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "").replace(/_/g, ' ');

        const simbriefUsernameString = simbriefUsername ? simbriefUsername : "[ ]";

        const simbriefUserId = NXDataStore.get("CONFIG_SIMBRIEF_USERID", "");

        const simbriefUserIdString = simbriefUserId ? simbriefUserId : "[ ]";

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "SIMBRIEF PROFILE"],
            [""],
            ["USERNAME"],
            [`${simbriefUsernameString}[color]blue`],
            ["USER ID"],
            [`${simbriefUserIdString}[color]blue`],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", "");
            } else {
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", value.replace(/ /g, '_'));
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", "");
            }
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };

        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", "");
            } else if (!/^\d+$/.test(value)) {
                mcdu.showErrorMessage("NOT ALLOWED");
            } else {
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", value);
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", "");
            }
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
