class CDU_OPTIONS_SIMBRIEF {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "").replace(/_/g, ' ');

        const simbriefUsernameString = simbriefUsername ? `{green}[${simbriefUsername}]{end}` : "{cyan}*[\xa0\xa0\xa0\xa0\xa0]{end}";

        const simbriefUserId = NXDataStore.get("CONFIG_SIMBRIEF_USERID", "");

        const simbriefUserIdString = simbriefUserId ? `{green}[${simbriefUserId}]{end}` : "{cyan}*[\xa0\xa0\xa0\xa0\xa0]{end}";

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["", "", "SIMBRIEF PROFILE"],
            [""],
            ["\xa0USERNAME"],
            [simbriefUsernameString],
            ["\xa0USER ID"],
            [simbriefUserIdString],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
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
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
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
            CDU_OPTIONS_AOC.ShowPage(mcdu);
        };
    }
}
