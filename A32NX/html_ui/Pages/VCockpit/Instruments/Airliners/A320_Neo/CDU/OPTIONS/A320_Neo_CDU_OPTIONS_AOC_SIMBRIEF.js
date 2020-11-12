class CDU_OPTIONS_SIMBRIEF {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "");

        const simbriefUsernameString = simbriefUsername != "" ? simbriefUsername : "[ ]";

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "SIMBRIEF PROFILE"],
            [""],
            ["USERNAME"],
            [`${simbriefUsernameString}[color]blue`],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[1] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", "");
            } else {
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", value);
            }
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
