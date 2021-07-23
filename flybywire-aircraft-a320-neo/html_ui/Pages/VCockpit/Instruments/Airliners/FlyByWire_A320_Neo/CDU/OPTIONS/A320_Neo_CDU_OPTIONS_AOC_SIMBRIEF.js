class CDU_OPTIONS_SIMBRIEF {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDU_OPTIONS_SIMBRIEF.ShowPage(fmc, mcdu);
        });

        const simbriefUser = NXDataStore.get("CONFIG_SIMBRIEF_USERID", "");

        const simbriefUserString = simbriefUser ? `{cyan}\xa0${simbriefUser}{end}` : "{cyan}[\xa0\xa0\xa0\xa0\xa0\xa0]{end}";

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["", "", "SIMBRIEF PROFILE"],
            [""],
            ["\xa0USERNAME/PILOT ID"],
            [simbriefUserString],
            [""],
            [""],
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
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", "");
                mcdu.requestUpdate();
            } else if (value === "") {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                getSimBriefUser(value, mcdu, () => mcdu.requestUpdate());
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_AOC.ShowPage(fmc, mcdu);
        };
    }
}
